// =============================================
// StoryCafe — Admin Panel (Secured v2)
// =============================================
'use strict';

let adminProducts    = [];
let adminCategories  = [];
let adminOrders      = [];
let currentPage      = 'overview';
let filteredProducts = [];
let imgTabMode       = 'url';
let catImgTabMode    = 'url';
let pendingConfirmFn = null;
let _csrfToken       = null;

// ═══════════════════════════════════════
// BOOT
// ═══════════════════════════════════════
(async function adminBoot() {
  _csrfToken = Security.csrf.get();

  if (await Security.session.isValid()) {
    showDashboard();
    startSecurityWatchers();
  } else {
    showLoginPage();
  }
})();

function startSecurityWatchers() {
  // Auto-logout after 30 min inactivity
  Security.autoLogout.start(
    () => adminLogout('inactivity'),
    () => showAdminToast('سيتم تسجيل خروجك خلال دقيقتين بسبب عدم النشاط', 'warning')
  );
  // Re-validate session every 5 minutes
  setInterval(async () => {
    if (!(await Security.session.isValid())) adminLogout('session_expired');
  }, 5 * 60 * 1000);
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
async function adminLogin(e) {
  e.preventDefault();

  // CSRF check
  const formToken = document.getElementById('login-csrf')?.value;
  if (!Security.csrf.verify(formToken)) {
    showAdminToast('طلب غير صالح. أعد تحميل الصفحة.', 'error');
    return;
  }

  // Brute-force check
  const bf = Security.bruteForce.check();
  if (bf.locked) {
    showLoginError(`حسابك مقفل. حاول مرة أخرى بعد ${bf.remaining} دقيقة`);
    return;
  }

  const email    = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
  const password = document.getElementById('login-pw')?.value || '';
  const btn      = document.getElementById('login-submit');

  // Basic input validation
  if (!password || password.length < 6) {
    showLoginError('أدخل بيانات صحيحة');
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...'; }

  try {
    // ── Path A: Supabase Auth (production) ──────────────────
    if (typeof supabase !== 'undefined' && supabase &&
        typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co') {

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        await Security.bruteForce.increment();
        await Security.audit.log('LOGIN_FAILED', { email, reason: 'bad_credentials' });
        const remaining = Security.bruteForce.check().remaining;
        showLoginError(`بيانات غير صحيحة. متبقي ${remaining} محاولة`);
        return;
      }

      // Verify admin role in admin_profiles table
      const { data: profile, error: pe } = await supabase
        .from('admin_profiles')
        .select('role, is_active')
        .eq('id', data.user.id)
        .maybeSingle();

      if (pe || !profile || !profile.is_active) {
        await supabase.auth.signOut();
        await Security.audit.log('LOGIN_UNAUTHORIZED', { email });
        showLoginError('ليس لديك صلاحية الوصول');
        return;
      }

      sessionStorage.setItem('sc_admin_role', Security.sanitize(profile.role));
      await Security.audit.log('LOGIN_SUCCESS', { email, role: profile.role });

    // ── Path B: Local password fallback (dev / no Supabase) ─
    } else {
      const correct = (typeof CONFIG !== 'undefined' && CONFIG.adminPassword) || 'storycafe2024';
      if (password !== correct) {
        Security.bruteForce.increment();
        const remaining = Security.bruteForce.check().remaining;
        showLoginError(`كلمة المرور غير صحيحة. متبقي ${remaining} محاولة`);
        return;
      }
      sessionStorage.setItem('sc_admin', '1');
    }

    Security.bruteForce.reset();
    Security.csrf.rotate();
    document.getElementById('login-error').style.display = 'none';
    showDashboard();
    startSecurityWatchers();

  } catch (err) {
    console.error('[Admin] Login error:', err);
    showAdminToast('حدث خطأ. حاول مرة أخرى.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول'; }
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  const ms = document.getElementById('login-error-msg');
  if (el) el.style.display = 'flex';
  if (ms) ms.textContent = msg || 'بيانات غير صحيحة';
}

async function adminLogout(reason = 'manual') {
  Security.autoLogout.stop();
  await Security.audit.log('LOGOUT', { reason });
  sessionStorage.removeItem('sc_admin');
  sessionStorage.removeItem('sc_admin_role');
  if (typeof supabase !== 'undefined' && supabase) {
    try { await supabase.auth.signOut(); } catch {}
  }
  showLoginPage();
}

function togglePwVis() {
  const input = document.getElementById('login-pw');
  const icon  = document.getElementById('pw-eye');
  if (input.type === 'password') { input.type = 'text';     icon.className = 'fas fa-eye-slash'; }
  else                           { input.type = 'password'; icon.className = 'fas fa-eye'; }
}

function isLoggedIn() { return sessionStorage.getItem('sc_admin') === '1'; }

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('dashboard').style.display  = 'none';
  // Inject CSRF into login form
  const csrf = document.getElementById('login-csrf');
  if (csrf) csrf.value = Security.csrf.get();
}

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard').style.display  = 'flex';
  loadAdminData();
}

// ═══════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════
async function loadAdminData() {
  adminCategories = (typeof CATEGORIES_LOCAL !== 'undefined') ? [...CATEGORIES_LOCAL] : [];
  adminProducts   = (typeof PRODUCTS_LOCAL   !== 'undefined') ? [...PRODUCTS_LOCAL]   : [];
  adminOrders     = loadLocalOrders();
  mergeLocalAdminData();
  renderCurrentPage();

  if (typeof supabase !== 'undefined' && supabase) {
    try { await refreshFromSupabase(); }
    catch(e) { console.warn('[Admin] Supabase load failed:', e.message); }
  } else {
    const n = document.getElementById('supabase-notice');
    if (n) n.style.display = 'flex';
  }
}

function mergeLocalAdminData() {
  try {
    const added       = JSON.parse(localStorage.getItem('sc_admin_products')     || '[]');
    const edited      = JSON.parse(localStorage.getItem('sc_admin_edits')        || '{}');
    const deleted     = JSON.parse(localStorage.getItem('sc_admin_deleted')      || '[]');
    const addedCats   = JSON.parse(localStorage.getItem('sc_admin_cats')         || '[]');
    const deletedCats = JSON.parse(localStorage.getItem('sc_admin_cats_deleted') || '[]');

    adminProducts   = adminProducts.filter(p => !deleted.includes(p.id));
    adminCategories = adminCategories.filter(c => !deletedCats.includes(c.id));
    adminProducts   = adminProducts.map(p => edited[p.id] ? { ...p, ...edited[p.id] } : p);
    added.forEach(p   => { if (!adminProducts.find(x => x.id === p.id))   adminProducts.push(p); });
    addedCats.forEach(c => { if (!adminCategories.find(x => x.id === c.id)) adminCategories.push(c); });
  } catch(e) { console.warn('[Admin] merge error:', e.message); }
}

async function refreshFromSupabase() {
  const [{ data: cats, error: e1 }, { data: prods, error: e2 }] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('products').select('*').order('display_order'),
  ]);
  if (e1 || e2 || !cats || !prods) return;

  adminCategories = cats.map(c => ({
    id: c.id, name: c.name_ar, nameEn: c.name_en,
    icon: c.icon || '☕', image: c.image_url, displayOrder: c.display_order,
  }));
  adminProducts = prods.map(p => ({
    id: p.id, categoryId: p.category_id,
    name: p.name_en || p.name_ar, nameAr: p.name_ar,
    price: p.price, image: p.image_url, available: p.is_available,
  }));

  const { data: orders } = await supabase.from('orders')
    .select('*').order('created_at', { ascending: false }).limit(50);
  if (orders) adminOrders = orders;

  renderCurrentPage();
}

function loadLocalOrders() {
  try { return JSON.parse(localStorage.getItem('storycafe_orders') || '[]'); }
  catch { return []; }
}

// ═══════════════════════════════════════
// PAGE ROUTING
// ═══════════════════════════════════════
function showPage(name, btnEl) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const pg = document.getElementById('page-' + name);
  if (pg) pg.style.display = 'block';
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  currentPage = name;
  const titles = { overview:'نظرة عامة', products:'إدارة المنتجات', categories:'إدارة التصنيفات', orders:'الطلبات' };
  const t = document.getElementById('topbar-title');
  if (t) t.textContent = titles[name] || name;
  renderCurrentPage();
}

function renderCurrentPage() {
  filteredProducts = [...adminProducts];
  if      (currentPage === 'overview')   renderOverview();
  else if (currentPage === 'products')   renderProductsPage();
  else if (currentPage === 'categories') renderCategoriesPage();
  else if (currentPage === 'orders')     renderOrdersPage();
}

// ═══════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════
function renderOverview() {
  const sp = document.getElementById('stat-products');
  const sc = document.getElementById('stat-cats');
  const so = document.getElementById('stat-orders');
  if (sp) sp.textContent = adminProducts.length;
  if (sc) sc.textContent = adminCategories.length;
  if (so) so.textContent = adminOrders.length;

  const rpl = document.getElementById('recent-products-list');
  if (rpl) {
    const recent = [...adminProducts].slice(-8).reverse();
    const fb = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=80';
    rpl.innerHTML = recent.length === 0
      ? '<div class="list-empty">لا توجد منتجات بعد</div>'
      : recent.map(p => {
          const cat = adminCategories.find(c => c.id === p.categoryId);
          return `<div class="recent-item">
            <img src="${Security.sanitizeURL(p.image) || fb}" alt="" onerror="this.src='${fb}'">
            <div class="recent-info">
              <span class="ri-name">${Security.sanitize(p.name)}</span>
              <span class="ri-cat">${cat ? Security.sanitize(cat.name) : '—'}</span>
            </div>
            <span class="ri-price">${formatAdminPrice(p.price)}</span>
          </div>`;
        }).join('');
  }

  const rol = document.getElementById('recent-orders-list');
  if (rol) {
    rol.innerHTML = adminOrders.length === 0
      ? '<div class="list-empty">لا توجد طلبات بعد</div>'
      : adminOrders.slice(0, 5).map(o => `<div class="recent-item">
          <div class="recent-info">
            <span class="ri-name">طلب #${Security.sanitize(o.id || o.order_id || '—')}</span>
            <span class="ri-cat">${formatDate(o.created_at || o.date)}</span>
          </div>
          <span class="order-status-badge status-${Security.sanitizeAttr(o.status || 'pending')}">${Security.sanitize(getStatusLabel(o.status || 'pending'))}</span>
        </div>`).join('');
  }
}

// ═══════════════════════════════════════
// PRODUCTS PAGE
// ═══════════════════════════════════════
function renderProductsPage() {
  const catFilter = document.getElementById('prod-cat-filter');
  if (catFilter && catFilter.options.length <= 1) {
    adminCategories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icon || ''} ${c.name}`;
      catFilter.appendChild(opt);
    });
  }

  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (filteredProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">لا توجد منتجات</td></tr>';
    return;
  }

  const fb = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=80';
  tbody.innerHTML = filteredProducts.map((p, i) => {
    const cat = adminCategories.find(c => c.id === p.categoryId);
    return `<tr>
      <td>${i + 1}</td>
      <td><img src="${Security.sanitizeURL(p.image) || fb}" alt="" class="table-thumb" onerror="this.src='${fb}'"></td>
      <td class="td-name">${Security.sanitize(p.name)}</td>
      <td>${cat ? `<span class="cat-chip">${Security.sanitize(cat.icon || '')} ${Security.sanitize(cat.name)}</span>` : '<span class="cat-chip">—</span>'}</td>
      <td class="td-price">${formatAdminPrice(p.price)}</td>
      <td>
        <button class="avail-toggle ${p.available !== false ? 'avail-yes' : 'avail-no'}" onclick="toggleAvailability(${Number(p.id)})">
          ${p.available !== false ? '✓ متاح' : '✗ متوقف'}
        </button>
      </td>
      <td class="td-actions">
        <button class="btn-icon btn-edit" onclick="openProductModal(${Number(p.id)})" title="تعديل"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-del"  onclick="confirmDelete('product',${Number(p.id)},${JSON.stringify(Security.sanitize(p.name))})" title="حذف"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function searchAdminProducts(query) {
  const q = Security.sanitize(query).toLowerCase().trim();
  filteredProducts = q ? adminProducts.filter(p => p.name.toLowerCase().includes(q)) : [...adminProducts];
  renderProductsPage();
}

function filterAdminByCategory(catId) {
  filteredProducts = catId ? adminProducts.filter(p => p.categoryId == catId) : [...adminProducts];
  renderProductsPage();
}

// ═══════════════════════════════════════
// PRODUCT MODAL
// ═══════════════════════════════════════
function openProductModal(productId) {
  resetProductModal();

  const catSel = document.getElementById('pm-cat');
  catSel.innerHTML = '<option value="">اختر تصنيفاً</option>';
  adminCategories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon || ''} ${c.name}`;
    catSel.appendChild(opt);
  });

  if (productId) {
    const p = adminProducts.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('pm-title').textContent = 'تعديل المنتج';
    document.getElementById('pm-id').value          = p.id;
    document.getElementById('pm-name').value        = p.name;
    document.getElementById('pm-price').value       = p.price;
    document.getElementById('pm-status').value      = p.available !== false ? 'true' : 'false';
    catSel.value = p.categoryId || '';
    if (p.image) { document.getElementById('pm-image-url').value = p.image; previewFromUrl(p.image, 'pm-preview'); }
  } else {
    document.getElementById('pm-title').textContent = 'منتج جديد';
  }

  document.getElementById('product-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function resetProductModal() {
  ['pm-id','pm-name','pm-price','pm-image-url','pm-image-b64'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const fi = document.getElementById('pm-image-file');
  if (fi) fi.value = '';
  const st = document.getElementById('pm-status');
  if (st) st.value = 'true';
  switchImgTab('url');
  removeImgPreview('pm');
}

async function saveProduct(e) {
  e.preventDefault();

  const id    = document.getElementById('pm-id').value;
  const name  = document.getElementById('pm-name').value.trim();
  const price = parseInt(document.getElementById('pm-price').value);
  const catId = parseInt(document.getElementById('pm-cat').value);
  const avail = document.getElementById('pm-status').value === 'true';
  const b64   = document.getElementById('pm-image-b64').value;
  let   imgUrl= document.getElementById('pm-image-url').value.trim();

  // ── Validate inputs ───────────────────────
  const nameV  = Security.validateInput(name,  { required: true, maxLength: 200, noScript: true });
  const priceV = Security.validateInput(price, { required: true, numeric: true, min: 0, max: 100000000 });

  if (!nameV.valid)  { showAdminToast(nameV.errors[0], 'error');  return; }
  if (!priceV.valid) { showAdminToast(priceV.errors[0], 'error'); return; }
  if (!catId)        { showAdminToast('اختر تصنيفاً', 'error');   return; }

  // Sanitize URL
  imgUrl = Security.sanitizeURL(imgUrl);

  if (b64 && !imgUrl) {
    if (typeof supabase !== 'undefined' && supabase) {
      const up = await uploadImageToStorage(b64, name);
      if (up) imgUrl = up;
    }
    if (!imgUrl) imgUrl = b64;
  }

  const productData = { name: Security.sanitize(name), price, categoryId: catId, available: avail, image: imgUrl };

  if (id) await updateProduct(parseInt(id), productData);
  else    await addProduct(productData);

  closeModal('product-modal');
  renderCurrentPage();
}

async function addProduct(data) {
  const newId   = Date.now();
  const product = { id: newId, ...data };

  await Security.audit.log('PRODUCT_CREATED', { name: data.name, price: data.price, catId: data.categoryId });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('products').insert([{
        name_ar: data.name, name_en: data.name, price: data.price,
        category_id: data.categoryId, is_available: data.available, image_url: data.image,
      }]);
      if (error) throw error;
      showAdminToast(`تم إضافة "${data.name}" ✓`, 'success');
    } catch(err) {
      showAdminToast('Supabase فشل، حُفظ محلياً', 'warning');
      saveProductLocally(product);
    }
  } else {
    saveProductLocally(product);
    showAdminToast(`تم إضافة "${data.name}" محلياً ✓`, 'success');
  }
  adminProducts.push(product);
}

async function updateProduct(id, data) {
  const idx = adminProducts.findIndex(p => p.id === id);
  if (idx === -1) return;
  adminProducts[idx] = { ...adminProducts[idx], ...data };

  await Security.audit.log('PRODUCT_UPDATED', { id, name: data.name });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('products').update({
        name_ar: data.name, name_en: data.name, price: data.price,
        category_id: data.categoryId, is_available: data.available, image_url: data.image,
      }).eq('id', id);
      if (error) throw error;
      showAdminToast(`تم تحديث "${data.name}" ✓`, 'success');
    } catch(err) {
      showAdminToast('Supabase فشل، حُفظ محلياً', 'warning');
      saveEditLocally(id, data);
    }
  } else {
    saveEditLocally(id, data);
    showAdminToast(`تم تحديث "${data.name}" محلياً ✓`, 'success');
  }
}

async function toggleAvailability(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  await updateProduct(id, { ...p, available: p.available === false });
  renderProductsPage();
}

async function deleteProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  adminProducts = adminProducts.filter(x => x.id !== id);

  await Security.audit.log('PRODUCT_DELETED', { id, name: p?.name });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch { markDeletedLocally('sc_admin_deleted', id); }
  } else {
    markDeletedLocally('sc_admin_deleted', id);
    try {
      const arr = JSON.parse(localStorage.getItem('sc_admin_products') || '[]');
      localStorage.setItem('sc_admin_products', JSON.stringify(arr.filter(x => x.id !== id)));
    } catch {}
  }
  showAdminToast('تم حذف المنتج ✓', 'success');
  renderProductsPage();
}

function saveProductLocally(product) {
  try {
    const arr = JSON.parse(localStorage.getItem('sc_admin_products') || '[]');
    const idx = arr.findIndex(p => p.id === product.id);
    if (idx >= 0) arr[idx] = product; else arr.push(product);
    localStorage.setItem('sc_admin_products', JSON.stringify(arr));
  } catch {}
}

function saveEditLocally(id, data) {
  try {
    const edits = JSON.parse(localStorage.getItem('sc_admin_edits') || '{}');
    edits[id] = { ...edits[id], ...data };
    localStorage.setItem('sc_admin_edits', JSON.stringify(edits));
  } catch {}
}

function markDeletedLocally(key, id) {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

// ═══════════════════════════════════════
// IMAGE UPLOAD (Secured)
// ═══════════════════════════════════════
function switchImgTab(type) {
  imgTabMode = type;
  document.getElementById('tab-url').classList.toggle('active',  type === 'url');
  document.getElementById('tab-file').classList.toggle('active', type === 'file');
  document.getElementById('img-url-section').style.display  = type === 'url'  ? 'block' : 'none';
  document.getElementById('img-file-section').style.display = type === 'file' ? 'block' : 'none';
}

function switchImgTabCat(type) {
  catImgTabMode = type;
  document.getElementById('cm-tab-url').classList.toggle('active',  type === 'url');
  document.getElementById('cm-tab-file').classList.toggle('active', type === 'file');
  document.getElementById('cm-img-url-section').style.display  = type === 'url'  ? 'block' : 'none';
  document.getElementById('cm-img-file-section').style.display = type === 'file' ? 'block' : 'none';
}

function previewFromUrl(url, previewId) {
  const wrap    = document.getElementById(previewId + '-wrap');
  const preview = document.getElementById(previewId);
  const safeUrl = Security.sanitizeURL(url);
  if (!safeUrl || !preview) { if (wrap) wrap.style.display = 'none'; return; }
  preview.src = safeUrl;
  if (wrap) wrap.style.display = 'block';
  preview.onerror = () => { if (wrap) wrap.style.display = 'none'; };
}

async function handleFileUpload(input, previewId, b64InputId) {
  const file = input.files && input.files[0];
  if (!file) return;

  // ── Security validation ───────────────────
  const check = Security.validateFile(file);
  if (!check.valid) {
    showAdminToast(check.errors[0], 'error');
    input.value = '';
    return;
  }

  // Verify magic bytes (real file type)
  const magic = await Security.verifyMagicBytes(file);
  if (!magic.valid) {
    showAdminToast('الملف لا يبدو صورة حقيقية. الرجاء اختيار ملف JPG أو PNG أو WEBP', 'error');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = ev => {
    const b64     = ev.target.result;
    const preview = document.getElementById(previewId);
    const wrap    = document.getElementById(previewId + '-wrap');
    const b64In   = document.getElementById(b64InputId);
    if (preview) preview.src = b64;
    if (wrap)    wrap.style.display = 'block';
    if (b64In)   b64In.value = b64;
  };
  reader.readAsDataURL(file);
}

function removeImgPreview(prefix) {
  ['image-url','image-b64','image-file'].forEach(s => {
    const el = document.getElementById(prefix + '-' + s);
    if (el) el.value = '';
  });
  const wrap = document.getElementById(prefix + '-preview-wrap');
  const prev = document.getElementById(prefix + '-preview');
  if (wrap) wrap.style.display = 'none';
  if (prev) prev.src = '';
}

async function uploadImageToStorage(base64, name) {
  if (!supabase) return null;
  try {
    const blob  = base64ToBlob(base64);
    const ext   = blob.type.split('/')[1] || 'jpg';
    // Sanitize filename
    const safeName = name.replace(/[^a-zA-Z0-9؀-ۿ_-]/g, '_').substring(0, 50);
    const fname = `products/${Date.now()}-${safeName}.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(fname, blob, { contentType: blob.type, upsert: false });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return publicUrl;
  } catch { return null; }
}

function base64ToBlob(b64) {
  const [h, d] = b64.split(',');
  const mime   = h.match(/:(.*?);/)[1];
  const bytes  = atob(d);
  const arr    = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ═══════════════════════════════════════
// CATEGORIES PAGE
// ═══════════════════════════════════════
function renderCategoriesPage() {
  const grid = document.getElementById('cats-admin-grid');
  if (!grid) return;

  if (adminCategories.length === 0) {
    grid.innerHTML = '<div class="table-empty" style="grid-column:1/-1;padding:40px">لا توجد تصنيفات</div>';
    return;
  }

  const fb = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80';
  grid.innerHTML = adminCategories.map(c => {
    const count = adminProducts.filter(p => p.categoryId === c.id).length;
    return `<div class="cat-admin-card">
      <div class="cat-admin-img-wrap">
        <img src="${Security.sanitizeURL(c.image) || fb}" alt="" onerror="this.src='${fb}'">
        <div class="cat-admin-overlay">
          <button class="btn-icon btn-edit" onclick="openCatModal(${Number(c.id)})" title="تعديل"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-del"  onclick="confirmDelete('cat',${Number(c.id)},${JSON.stringify(Security.sanitize(c.name))})" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="cat-admin-info">
        <span class="cat-icon">${Security.sanitize(c.icon || '☕')}</span>
        <div>
          <div class="cat-name">${Security.sanitize(c.name)}</div>
          <div class="cat-count">${count} منتج</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// CATEGORY MODAL
// ═══════════════════════════════════════
function openCatModal(catId) {
  resetCatModal();
  if (catId) {
    const c = adminCategories.find(x => x.id === catId);
    if (!c) return;
    document.getElementById('cm-title').textContent = 'تعديل التصنيف';
    document.getElementById('cm-id').value          = c.id;
    document.getElementById('cm-name-ar').value     = c.name || '';
    document.getElementById('cm-name-en').value     = c.nameEn || '';
    document.getElementById('cm-icon').value        = c.icon || '';
    document.getElementById('cm-order').value       = c.displayOrder || '';
    if (c.image) { document.getElementById('cm-image-url').value = c.image; previewFromUrl(c.image, 'cm-preview'); }
  } else {
    document.getElementById('cm-title').textContent = 'تصنيف جديد';
  }
  document.getElementById('cat-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function resetCatModal() {
  ['cm-id','cm-name-ar','cm-name-en','cm-icon','cm-order','cm-image-url','cm-image-b64'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const fi = document.getElementById('cm-image-file');
  if (fi) fi.value = '';
  switchImgTabCat('url');
  removeImgPreview('cm');
}

async function saveCat(e) {
  e.preventDefault();

  const id     = document.getElementById('cm-id').value;
  const nameAr = document.getElementById('cm-name-ar').value.trim();
  const nameEn = document.getElementById('cm-name-en').value.trim();
  const icon   = document.getElementById('cm-icon').value.trim();
  const order  = parseInt(document.getElementById('cm-order').value) || 99;
  const b64    = document.getElementById('cm-image-b64').value;
  let   imgUrl = document.getElementById('cm-image-url').value.trim();

  const v = Security.validateInput(nameAr, { required: true, maxLength: 100, noScript: true });
  if (!v.valid) { showAdminToast(v.errors[0], 'error'); return; }

  imgUrl = Security.sanitizeURL(imgUrl);

  if (b64 && !imgUrl) {
    if (typeof supabase !== 'undefined' && supabase) {
      const up = await uploadImageToStorage(b64, nameAr);
      if (up) imgUrl = up;
    }
    if (!imgUrl) imgUrl = b64;
  }

  const catData = { name: Security.sanitize(nameAr), nameEn: Security.sanitize(nameEn), icon: Security.sanitize(icon), image: imgUrl, displayOrder: order };
  if (id) await updateCategory(parseInt(id), catData);
  else    await addCategory(catData);

  closeModal('cat-modal');
  renderCurrentPage();
}

async function addCategory(data) {
  const newId = Date.now();
  const cat   = { id: newId, ...data };

  await Security.audit.log('CATEGORY_CREATED', { name: data.name });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('categories').insert([{
        name_ar: data.name, name_en: data.nameEn, icon: data.icon, image_url: data.image, display_order: data.displayOrder,
      }]);
      if (error) throw error;
      showAdminToast(`تم إضافة "${data.name}" ✓`, 'success');
    } catch {
      showAdminToast('Supabase فشل، حُفظ محلياً', 'warning');
      saveCatLocally(cat);
    }
  } else {
    saveCatLocally(cat);
    showAdminToast(`تم إضافة "${data.name}" محلياً ✓`, 'success');
  }
  adminCategories.push(cat);
}

async function updateCategory(id, data) {
  const idx = adminCategories.findIndex(c => c.id === id);
  if (idx === -1) return;
  adminCategories[idx] = { ...adminCategories[idx], ...data };

  await Security.audit.log('CATEGORY_UPDATED', { id, name: data.name });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('categories').update({
        name_ar: data.name, name_en: data.nameEn, icon: data.icon, image_url: data.image, display_order: data.displayOrder,
      }).eq('id', id);
      if (error) throw error;
      showAdminToast(`تم تحديث "${data.name}" ✓`, 'success');
    } catch { saveCatEditLocally(id, data); }
  } else {
    saveCatEditLocally(id, data);
    showAdminToast(`تم تحديث "${data.name}" محلياً ✓`, 'success');
  }
}

async function deleteCategory(id) {
  const c = adminCategories.find(x => x.id === id);
  adminCategories = adminCategories.filter(x => x.id !== id);

  await Security.audit.log('CATEGORY_DELETED', { id, name: c?.name });

  if (typeof supabase !== 'undefined' && supabase) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch { markDeletedLocally('sc_admin_cats_deleted', id); }
  } else {
    markDeletedLocally('sc_admin_cats_deleted', id);
    try {
      const cats = JSON.parse(localStorage.getItem('sc_admin_cats') || '[]');
      localStorage.setItem('sc_admin_cats', JSON.stringify(cats.filter(x => x.id !== id)));
    } catch {}
  }
  showAdminToast('تم حذف التصنيف ✓', 'success');
  renderCategoriesPage();
}

function saveCatLocally(cat) {
  try {
    const arr = JSON.parse(localStorage.getItem('sc_admin_cats') || '[]');
    const idx = arr.findIndex(c => c.id === cat.id);
    if (idx >= 0) arr[idx] = cat; else arr.push(cat);
    localStorage.setItem('sc_admin_cats', JSON.stringify(arr));
  } catch {}
}

function saveCatEditLocally(id, data) {
  try {
    const cats = JSON.parse(localStorage.getItem('sc_admin_cats') || '[]');
    const idx  = cats.findIndex(c => c.id === id);
    if (idx >= 0) { cats[idx] = { ...cats[idx], ...data }; localStorage.setItem('sc_admin_cats', JSON.stringify(cats)); }
  } catch {}
}

// ═══════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════
function renderOrdersPage(statusFilter) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  let orders = statusFilter ? adminOrders.filter(o => (o.status || 'pending') === statusFilter) : adminOrders;
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">لا توجد طلبات</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => `<tr>
    <td>#${Security.sanitize(o.id || o.order_id || '—')}</td>
    <td>${formatDate(o.created_at || o.date)}</td>
    <td class="td-name">${Security.sanitize(formatOrderItems(o.items))}</td>
    <td>${formatAdminPrice(o.total || o.total_amount || 0)}</td>
    <td><span class="order-status-badge status-${Security.sanitizeAttr(o.status || 'pending')}">${Security.sanitize(getStatusLabel(o.status || 'pending'))}</span></td>
    <td class="td-actions">
      <select class="status-sel" onchange="updateOrderStatus(${Number(o.id || o.order_id || 0)}, this.value)">
        ${['pending','confirmed','preparing','ready','delivered','cancelled'].map(s =>
          `<option value="${s}" ${(o.status||'pending')===s?'selected':''}>${getStatusLabel(s)}</option>`
        ).join('')}
      </select>
    </td>
  </tr>`).join('');
}

function filterOrdersByStatus(val) { renderOrdersPage(val || undefined); }

function updateOrderStatus(id, status) {
  const VALID_STATUSES = ['pending','confirmed','preparing','ready','delivered','cancelled'];
  if (!VALID_STATUSES.includes(status)) return; // reject invalid values
  const o = adminOrders.find(x => (x.id || x.order_id) === id);
  if (o) o.status = status;
  if (typeof supabase !== 'undefined' && supabase)
    supabase.from('orders').update({ status }).eq('id', id).catch(() => {});
  Security.audit.log('ORDER_STATUS_CHANGED', { id, status });
  showAdminToast('تم تحديث حالة الطلب ✓', 'success');
}

function formatOrderItems(items) {
  if (!items) return '—';
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch { return Security.sanitize(items); } }
  if (Array.isArray(items)) return items.slice(0,2).map(i => `${Security.sanitize(i.name)} ×${Number(i.qty||i.quantity||1)}`).join('، ') + (items.length > 2 ? '...' : '');
  return '—';
}

// ═══════════════════════════════════════
// CONFIRM DELETE
// ═══════════════════════════════════════
function confirmDelete(type, id, name) {
  const modal = document.getElementById('confirm-modal');
  const msg   = document.getElementById('confirm-msg');
  const btn   = document.getElementById('confirm-ok-btn');
  if (!modal) return;
  // name is already sanitized before being passed here
  msg.textContent = `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع.`;
  pendingConfirmFn = async () => {
    closeModal('confirm-modal');
    if (type === 'product') await deleteProduct(Number(id));
    else if (type === 'cat') await deleteCategory(Number(id));
  };
  btn.onclick = () => pendingConfirmFn && pendingConfirmFn();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════
// MODALS & SIDEBAR
// ═══════════════════════════════════════
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
  document.body.style.overflow = '';
}
function closeModalOnBg(e, id) { if (e.target === e.currentTarget) closeModal(id); }
function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
function showAdminToast(msg, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;
  const icons = { success:'fas fa-check-circle', error:'fas fa-exclamation-circle', warning:'fas fa-exclamation-triangle' };
  const toast = document.createElement('div');
  toast.className = `admin-toast toast-${type}`;
  // msg from our code is safe; sanitize for defense
  toast.innerHTML = `<i class="${icons[type] || icons.success}"></i><span>${Security.sanitize(msg)}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3200);
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function formatAdminPrice(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('ar-LB') + ' ل.ل';
}
function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('ar-LB', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return '—'; }
}
function getStatusLabel(s) {
  const map = { pending:'قيد الانتظار', confirmed:'مؤكد', preparing:'قيد التحضير', ready:'جاهز', delivered:'تم التسليم', cancelled:'ملغي' };
  return map[s] || s;
}
function formatPrice(n) { return formatAdminPrice(n); }
