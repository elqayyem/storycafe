// =============================================
// StoryCafe — Admin Panel
// =============================================

let adminProducts    = [];
let adminCategories  = [];
let adminOrders      = [];
let currentPage      = 'overview';
let filteredProducts = [];
let imgTabMode       = 'url';
let catImgTabMode    = 'url';
let pendingConfirmFn = null;

// ═══════════════════════════════════════
// BOOT — synchronous (scripts at body bottom, DOM already ready)
// ═══════════════════════════════════════
(function adminBoot() {
  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLoginPage();
  }
})();

function isLoggedIn() {
  return sessionStorage.getItem('sc_admin') === '1';
}

function showLoginPage() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('dashboard').style.display  = 'none';
}

function showDashboard() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('dashboard').style.display  = 'flex';
  loadAdminData();
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
function adminLogin(e) {
  e.preventDefault();
  const pw = document.getElementById('login-pw').value;
  const correctPw = (typeof CONFIG !== 'undefined' && CONFIG.adminPassword)
    ? CONFIG.adminPassword : 'storycafe2024';
  if (pw === correctPw) {
    sessionStorage.setItem('sc_admin', '1');
    document.getElementById('login-error').style.display = 'none';
    showDashboard();
  } else {
    document.getElementById('login-error').style.display = 'flex';
    document.getElementById('login-pw').value = '';
    document.getElementById('login-pw').focus();
  }
}

function adminLogout() {
  sessionStorage.removeItem('sc_admin');
  showLoginPage();
}

function togglePwVis() {
  const input = document.getElementById('login-pw');
  const icon  = document.getElementById('pw-eye');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
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

  if (supabase) {
    try { await refreshFromSupabase(); }
    catch(e) { console.warn('[Admin] Supabase load failed:', e.message); }
  } else {
    const notice = document.getElementById('supabase-notice');
    if (notice) notice.style.display = 'flex';
  }
}

function mergeLocalAdminData() {
  try {
    const added      = JSON.parse(localStorage.getItem('sc_admin_products')     || '[]');
    const edited     = JSON.parse(localStorage.getItem('sc_admin_edits')        || '{}');
    const deleted    = JSON.parse(localStorage.getItem('sc_admin_deleted')      || '[]');
    const addedCats  = JSON.parse(localStorage.getItem('sc_admin_cats')         || '[]');
    const deletedCats= JSON.parse(localStorage.getItem('sc_admin_cats_deleted') || '[]');

    adminProducts   = adminProducts.filter(p => !deleted.includes(p.id));
    adminCategories = adminCategories.filter(c => !deletedCats.includes(c.id));
    adminProducts   = adminProducts.map(p => edited[p.id] ? { ...p, ...edited[p.id] } : p);
    added.forEach(p => { if (!adminProducts.find(x => x.id === p.id)) adminProducts.push(p); });
    addedCats.forEach(c => { if (!adminCategories.find(x => x.id === c.id)) adminCategories.push(c); });
  } catch(e) { console.warn('[Admin] mergeLocalAdminData:', e.message); }
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
  catch(e) { return []; }
}

// ═══════════════════════════════════════
// PAGE ROUTING
// ═══════════════════════════════════════
function showPage(name, btnEl) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const pageEl = document.getElementById('page-' + name);
  if (pageEl) pageEl.style.display = 'block';
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  currentPage = name;
  const titles = { overview:'نظرة عامة', products:'إدارة المنتجات', categories:'إدارة التصنيفات', orders:'الطلبات' };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[name] || name;
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
    rpl.innerHTML = recent.length === 0
      ? '<div class="list-empty">لا توجد منتجات بعد</div>'
      : recent.map(p => {
          const cat = adminCategories.find(c => c.id === p.categoryId);
          const fb  = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80&q=80';
          return `<div class="recent-item">
            <img src="${p.image || fb}" alt="${p.name}" onerror="this.src='${fb}'">
            <div class="recent-info">
              <span class="ri-name">${p.name}</span>
              <span class="ri-cat">${cat ? cat.name : '—'}</span>
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
            <span class="ri-name">طلب #${o.id || o.order_id || '—'}</span>
            <span class="ri-cat">${formatDate(o.created_at || o.date)}</span>
          </div>
          <span class="order-status-badge status-${o.status || 'pending'}">${getStatusLabel(o.status || 'pending')}</span>
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
    const nm  = (p.name || '').replace(/'/g, '&#39;');
    return `<tr>
      <td>${i + 1}</td>
      <td><img src="${p.image || fb}" alt="${p.name}" class="table-thumb" onerror="this.src='${fb}'"></td>
      <td class="td-name">${p.name}</td>
      <td>${cat ? `<span class="cat-chip">${cat.icon || ''} ${cat.name}</span>` : '<span class="cat-chip">—</span>'}</td>
      <td class="td-price">${formatAdminPrice(p.price)}</td>
      <td>
        <button class="avail-toggle ${p.available !== false ? 'avail-yes' : 'avail-no'}" onclick="toggleAvailability(${p.id})">
          ${p.available !== false ? '✓ متاح' : '✗ متوقف'}
        </button>
      </td>
      <td class="td-actions">
        <button class="btn-icon btn-edit" onclick="openProductModal(${p.id})" title="تعديل"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-del" onclick="confirmDelete('product',${p.id},'${nm}')" title="حذف"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function searchAdminProducts(query) {
  const q = query.toLowerCase().trim();
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
  const modal = document.getElementById('product-modal');
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
    document.getElementById('pm-title').textContent    = 'تعديل المنتج';
    document.getElementById('pm-id').value             = p.id;
    document.getElementById('pm-name').value           = p.name;
    document.getElementById('pm-price').value          = p.price;
    document.getElementById('pm-status').value         = p.available !== false ? 'true' : 'false';
    catSel.value = p.categoryId || '';
    if (p.image) {
      document.getElementById('pm-image-url').value = p.image;
      previewFromUrl(p.image, 'pm-preview');
    }
  } else {
    document.getElementById('pm-title').textContent = 'منتج جديد';
  }

  modal.style.display = 'flex';
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

  if (!name || !price || !catId) {
    showAdminToast('يرجى ملء جميع الحقول المطلوبة', 'error');
    return;
  }

  if (b64 && !imgUrl) {
    if (supabase) {
      const uploaded = await uploadImageToStorage(b64, name);
      if (uploaded) imgUrl = uploaded;
    }
    if (!imgUrl) imgUrl = b64;
  }

  const productData = { name, price, categoryId: catId, available: avail, image: imgUrl };
  if (id) await updateProduct(parseInt(id), productData);
  else    await addProduct(productData);

  closeModal('product-modal');
  renderCurrentPage();
}

async function addProduct(data) {
  const newId   = Date.now();
  const product = { id: newId, ...data };

  if (supabase) {
    try {
      const { error } = await supabase.from('products').insert([{
        name_ar: data.name, name_en: data.name,
        price: data.price, category_id: data.categoryId,
        is_available: data.available, image_url: data.image,
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

  if (supabase) {
    try {
      const { error } = await supabase.from('products').update({
        name_ar: data.name, name_en: data.name,
        price: data.price, category_id: data.categoryId,
        is_available: data.available, image_url: data.image,
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

function saveProductLocally(product) {
  try {
    const arr = JSON.parse(localStorage.getItem('sc_admin_products') || '[]');
    const idx = arr.findIndex(p => p.id === product.id);
    if (idx >= 0) arr[idx] = product; else arr.push(product);
    localStorage.setItem('sc_admin_products', JSON.stringify(arr));
  } catch(e) {}
}

function saveEditLocally(id, data) {
  try {
    const edits = JSON.parse(localStorage.getItem('sc_admin_edits') || '{}');
    edits[id] = { ...edits[id], ...data };
    localStorage.setItem('sc_admin_edits', JSON.stringify(edits));
  } catch(e) {}
}

async function deleteProduct(id) {
  adminProducts = adminProducts.filter(p => p.id !== id);
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch(err) { markDeletedLocally('sc_admin_deleted', id); }
  } else {
    markDeletedLocally('sc_admin_deleted', id);
    try {
      const arr = JSON.parse(localStorage.getItem('sc_admin_products') || '[]');
      localStorage.setItem('sc_admin_products', JSON.stringify(arr.filter(p => p.id !== id)));
    } catch(e) {}
  }
  showAdminToast('تم حذف المنتج ✓', 'success');
  renderProductsPage();
}

function markDeletedLocally(key, id) {
  try {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch(e) {}
}

// ═══════════════════════════════════════
// IMAGE UPLOAD
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
  if (!url || !preview) { if (wrap) wrap.style.display = 'none'; return; }
  preview.src = url;
  if (wrap) wrap.style.display = 'block';
  preview.onerror = () => { if (wrap) wrap.style.display = 'none'; };
}

function handleFileUpload(input, previewId, b64InputId) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showAdminToast('حجم الصورة يجب أن لا يتجاوز 5MB', 'error');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
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
  const wrap   = document.getElementById(prefix + '-preview-wrap');
  const preview= document.getElementById(prefix + '-preview');
  const urlIn  = document.getElementById(prefix + '-image-url');
  const b64In  = document.getElementById(prefix + '-image-b64');
  const fileIn = document.getElementById(prefix + '-image-file');
  if (wrap)    wrap.style.display = 'none';
  if (preview) preview.src = '';
  if (urlIn)   urlIn.value = '';
  if (b64In)   b64In.value = '';
  if (fileIn)  fileIn.value = '';
}

async function uploadImageToStorage(base64, name) {
  if (!supabase) return null;
  try {
    const blob  = base64ToBlob(base64);
    const ext   = blob.type.split('/')[1] || 'jpg';
    const fname = `products/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(fname, blob, { contentType: blob.type, upsert: false });
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);
    return publicUrl;
  } catch(e) { return null; }
}

function base64ToBlob(base64) {
  const [header, data] = base64.split(',');
  const mime  = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr   = new Uint8Array(bytes.length);
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
    const nm    = (c.name || '').replace(/'/g, '&#39;');
    return `<div class="cat-admin-card">
      <div class="cat-admin-img-wrap">
        <img src="${c.image || fb}" alt="${c.name}" onerror="this.src='${fb}'">
        <div class="cat-admin-overlay">
          <button class="btn-icon btn-edit" onclick="openCatModal(${c.id})" title="تعديل"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-del" onclick="confirmDelete('cat',${c.id},'${nm}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="cat-admin-info">
        <span class="cat-icon">${c.icon || '☕'}</span>
        <div>
          <div class="cat-name">${c.name}</div>
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
  const modal = document.getElementById('cat-modal');
  resetCatModal();

  if (catId) {
    const c = adminCategories.find(x => x.id === catId);
    if (!c) return;
    document.getElementById('cm-title').textContent    = 'تعديل التصنيف';
    document.getElementById('cm-id').value             = c.id;
    document.getElementById('cm-name-ar').value        = c.name || '';
    document.getElementById('cm-name-en').value        = c.nameEn || '';
    document.getElementById('cm-icon').value           = c.icon || '';
    document.getElementById('cm-order').value          = c.displayOrder || '';
    if (c.image) {
      document.getElementById('cm-image-url').value = c.image;
      previewFromUrl(c.image, 'cm-preview');
    }
  } else {
    document.getElementById('cm-title').textContent = 'تصنيف جديد';
  }

  modal.style.display = 'flex';
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

  if (!nameAr) { showAdminToast('يرجى إدخال اسم التصنيف', 'error'); return; }

  if (b64 && !imgUrl) {
    if (supabase) {
      const uploaded = await uploadImageToStorage(b64, nameAr);
      if (uploaded) imgUrl = uploaded;
    }
    if (!imgUrl) imgUrl = b64;
  }

  const catData = { name: nameAr, nameEn, icon, image: imgUrl, displayOrder: order };
  if (id) await updateCategory(parseInt(id), catData);
  else    await addCategory(catData);

  closeModal('cat-modal');
  renderCurrentPage();
}

async function addCategory(data) {
  const newId = Date.now();
  const cat   = { id: newId, ...data };

  if (supabase) {
    try {
      const { error } = await supabase.from('categories').insert([{
        name_ar: data.name, name_en: data.nameEn,
        icon: data.icon, image_url: data.image, display_order: data.displayOrder,
      }]);
      if (error) throw error;
      showAdminToast(`تم إضافة "${data.name}" ✓`, 'success');
    } catch(err) {
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

  if (supabase) {
    try {
      const { error } = await supabase.from('categories').update({
        name_ar: data.name, name_en: data.nameEn,
        icon: data.icon, image_url: data.image, display_order: data.displayOrder,
      }).eq('id', id);
      if (error) throw error;
      showAdminToast(`تم تحديث "${data.name}" ✓`, 'success');
    } catch(err) {
      showAdminToast('Supabase فشل، حُفظ محلياً', 'warning');
      saveCatEditLocally(id, data);
    }
  } else {
    saveCatEditLocally(id, data);
    showAdminToast(`تم تحديث "${data.name}" محلياً ✓`, 'success');
  }
}

async function deleteCategory(id) {
  adminCategories = adminCategories.filter(c => c.id !== id);
  if (supabase) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch(err) { markDeletedLocally('sc_admin_cats_deleted', id); }
  } else {
    markDeletedLocally('sc_admin_cats_deleted', id);
    try {
      const cats = JSON.parse(localStorage.getItem('sc_admin_cats') || '[]');
      localStorage.setItem('sc_admin_cats', JSON.stringify(cats.filter(c => c.id !== id)));
    } catch(e) {}
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
  } catch(e) {}
}

function saveCatEditLocally(id, data) {
  try {
    const cats = JSON.parse(localStorage.getItem('sc_admin_cats') || '[]');
    const idx  = cats.findIndex(c => c.id === id);
    if (idx >= 0) { cats[idx] = { ...cats[idx], ...data }; localStorage.setItem('sc_admin_cats', JSON.stringify(cats)); }
  } catch(e) {}
}

// ═══════════════════════════════════════
// ORDERS PAGE
// ═══════════════════════════════════════
function renderOrdersPage(statusFilter) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  let orders = adminOrders;
  if (statusFilter) orders = orders.filter(o => (o.status || 'pending') === statusFilter);

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">لا توجد طلبات</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `<tr>
    <td>#${o.id || o.order_id || '—'}</td>
    <td>${formatDate(o.created_at || o.date)}</td>
    <td class="td-name">${formatOrderItems(o.items)}</td>
    <td>${formatAdminPrice(o.total || o.total_amount || 0)}</td>
    <td><span class="order-status-badge status-${o.status || 'pending'}">${getStatusLabel(o.status || 'pending')}</span></td>
    <td class="td-actions">
      <select class="status-sel" onchange="updateOrderStatus(${o.id || o.order_id || 0}, this.value)">
        ${['pending','confirmed','preparing','ready','delivered','cancelled'].map(s =>
          `<option value="${s}" ${(o.status||'pending')===s?'selected':''}>${getStatusLabel(s)}</option>`
        ).join('')}
      </select>
    </td>
  </tr>`).join('');
}

function filterOrdersByStatus(val) { renderOrdersPage(val || undefined); }

function updateOrderStatus(id, status) {
  const o = adminOrders.find(x => (x.id || x.order_id) === id);
  if (o) o.status = status;
  if (supabase) supabase.from('orders').update({ status }).eq('id', id).catch(() => {});
  showAdminToast('تم تحديث حالة الطلب ✓', 'success');
}

function formatOrderItems(items) {
  if (!items) return '—';
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch(e) { return items; } }
  if (Array.isArray(items)) return items.slice(0,2).map(i => `${i.name} ×${i.qty||i.quantity||1}`).join('، ') + (items.length > 2 ? '...' : '');
  return '—';
}

// ═══════════════════════════════════════
// CONFIRM DELETE DIALOG
// ═══════════════════════════════════════
function confirmDelete(type, id, name) {
  const modal = document.getElementById('confirm-modal');
  const msg   = document.getElementById('confirm-msg');
  const btn   = document.getElementById('confirm-ok-btn');
  if (!modal) return;
  msg.textContent = `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`;
  pendingConfirmFn = async () => {
    closeModal('confirm-modal');
    if (type === 'product') await deleteProduct(id);
    else if (type === 'cat') await deleteCategory(id);
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

function closeModalOnBg(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ═══════════════════════════════════════
// TOAST
// ═══════════════════════════════════════
function showAdminToast(msg, type = 'success') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;
  const icons = { success:'fas fa-check-circle', error:'fas fa-exclamation-circle', warning:'fas fa-exclamation-triangle' };
  const toast = document.createElement('div');
  toast.className = `admin-toast toast-${type}`;
  toast.innerHTML = `<i class="${icons[type] || icons.success}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
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
  return new Date(d).toLocaleDateString('ar-LB', { year:'numeric', month:'short', day:'numeric' });
}

function getStatusLabel(s) {
  const map = { pending:'قيد الانتظار', confirmed:'مؤكد', preparing:'قيد التحضير', ready:'جاهز', delivered:'تم التسليم', cancelled:'ملغي' };
  return map[s] || s;
}

function formatPrice(n) { return formatAdminPrice(n); }
