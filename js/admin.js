// =============================================
// StoryCafe — Admin Dashboard
// =============================================

let adminProducts = [];
let adminCategories = [];
let adminOrders = [];
let filteredAdminProducts = [];
let adminCatFilter = '';
let adminSearchQ = '';

// ---- Auth ----
function adminLogin(e) {
  e.preventDefault();
  const pw = document.getElementById('login-pw').value;
  const errEl = document.getElementById('login-error');
  if (pw === CONFIG.adminPassword) {
    sessionStorage.setItem('sc_admin', '1');
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    initAdminDashboard();
  } else {
    if (errEl) errEl.style.display = 'block';
    setTimeout(() => errEl && (errEl.style.display = 'none'), 3000);
  }
}

function adminLogout() {
  sessionStorage.removeItem('sc_admin');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function togglePwVis() {
  const input = document.getElementById('login-pw');
  const eye = document.getElementById('pw-eye');
  if (input.type === 'password') {
    input.type = 'text';
    eye.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    eye.className = 'fas fa-eye';
  }
}

// Auto-login check
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('sc_admin') === '1') {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    initAdminDashboard();
  } else {
    document.getElementById('login-page').style.display = 'flex';
  }
});

// ---- Init ----
async function initAdminDashboard() {
  await loadAdminData();
  renderOverview();
  populateCategorySelects();

  const notice = document.getElementById('supabase-notice');
  if (!supabase && notice) notice.style.display = 'flex';
}

async function loadAdminData() {
  if (supabase) {
    try {
      const [{ data: cats }, { data: prods }, { data: orders }] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('products').select('*').order('display_order'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      if (cats) adminCategories = cats.map(c => ({ id: c.id, name: c.name_ar, nameEn: c.name_en, icon: c.icon, image: c.image_url, count: prods ? prods.filter(p => p.category_id === c.id).length : 0 }));
      if (prods) adminProducts = prods.map(p => ({ id: p.id, categoryId: p.category_id, name: p.name_en || p.name_ar, price: p.price, image: p.image_url, available: p.is_available }));
      if (orders) adminOrders = orders;
    } catch (e) {
      console.warn('Admin data load error, using local', e);
      adminCategories = CATEGORIES_LOCAL;
      adminProducts = PRODUCTS_LOCAL;
    }
  } else {
    adminCategories = CATEGORIES_LOCAL;
    adminProducts = PRODUCTS_LOCAL;
    adminOrders = [];
  }
  filteredAdminProducts = [...adminProducts];
}

// ---- Pages ----
const PAGE_TITLES = {
  overview: 'نظرة عامة',
  products: 'إدارة المنتجات',
  categories: 'إدارة التصنيفات',
  orders: 'إدارة الطلبات',
};

function showPage(pageId, btnEl) {
  document.querySelectorAll('.page').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) { page.style.display = 'block'; page.classList.add('active'); }
  if (btnEl) btnEl.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[pageId] || pageId;

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar')?.classList.remove('open');
  }

  if (pageId === 'products')   renderProductsTable();
  if (pageId === 'categories') renderCategoriesAdmin();
  if (pageId === 'orders')     renderOrdersTable();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (window.innerWidth <= 900) {
    sb?.classList.toggle('open');
  } else {
    sb?.classList.toggle('closed');
    document.querySelector('.main-content').style.marginRight =
      sb?.classList.contains('closed') ? '0' : 'var(--sidebar-w)';
  }
}

// ---- Overview ----
function renderOverview() {
  setText('stat-products', adminProducts.length);
  setText('stat-cats', adminCategories.length);
  setText('stat-orders', adminOrders.length);

  const recentList = document.getElementById('recent-products-list');
  if (recentList) {
    const recents = adminProducts.slice(-6).reverse();
    if (recents.length === 0) {
      recentList.innerHTML = '<p style="padding:16px;color:#888;font-size:13px;">لا توجد منتجات</p>';
    } else {
      recentList.innerHTML = recents.map(p => {
        const cat = adminCategories.find(c => c.id === p.categoryId);
        return `
        <div class="recent-item">
          <img src="${p.image || ''}" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=50'" loading="lazy" alt="">
          <div class="recent-item-info">
            <div class="recent-item-name">${p.name}</div>
            <div class="recent-item-cat">${cat ? cat.icon + ' ' + cat.name : ''}</div>
          </div>
          <div class="recent-item-price">${formatPrice(p.price)}</div>
        </div>`;
      }).join('');
    }
  }

  const ordersEl = document.getElementById('recent-orders-list');
  if (ordersEl) {
    if (adminOrders.length === 0) {
      ordersEl.innerHTML = '<p style="padding:16px;color:#888;font-size:13px;">لا توجد طلبات بعد</p>';
    } else {
      ordersEl.innerHTML = adminOrders.slice(0, 5).map(o => `
        <div class="recent-item">
          <div style="width:44px;height:44px;border-radius:8px;background:rgba(198,156,109,0.1);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🧾</div>
          <div class="recent-item-info">
            <div class="recent-item-name">#${o.order_number || o.id}</div>
            <div class="recent-item-cat">${formatDate(o.created_at)}</div>
          </div>
          <span class="status-badge status-${o.status || 'pending'}">${statusLabel(o.status)}</span>
        </div>`).join('');
    }
  }
}

// ---- Products ----
function renderProductsTable() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const list = filteredAdminProducts;
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">لا توجد منتجات</td></tr>';
    return;
  }
  tbody.innerHTML = list.map((p, i) => {
    const cat = adminCategories.find(c => c.id === p.categoryId);
    return `
    <tr>
      <td>${i + 1}</td>
      <td><img class="prod-thumb" src="${p.image || ''}" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=50'" loading="lazy" alt=""></td>
      <td><strong>${p.name}</strong></td>
      <td>${cat ? cat.icon + ' ' + cat.name : '—'}</td>
      <td><strong style="color:var(--accent)">${formatPrice(p.price)}</strong></td>
      <td><span class="status-badge ${p.available !== false ? 'status-available' : 'status-unavailable'}">${p.available !== false ? 'متاح' : 'غير متاح'}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-btn tbl-btn-edit" onclick="openProductModal(${p.id})" title="تعديل"><i class="fas fa-edit"></i></button>
          <button class="tbl-btn tbl-btn-del" onclick="deleteProduct(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function searchAdminProducts(val) {
  adminSearchQ = val.toLowerCase();
  applyAdminFilter();
}
function filterAdminByCategory(val) {
  adminCatFilter = val;
  applyAdminFilter();
}
function applyAdminFilter() {
  filteredAdminProducts = adminProducts.filter(p => {
    const matchSearch = !adminSearchQ || p.name.toLowerCase().includes(adminSearchQ);
    const matchCat = !adminCatFilter || p.categoryId == adminCatFilter;
    return matchSearch && matchCat;
  });
  renderProductsTable();
}

function openProductModal(productId) {
  const modal = document.getElementById('product-modal');
  const titleEl = document.getElementById('product-modal-title');
  if (!modal) return;
  if (productId) {
    const p = adminProducts.find(x => x.id === productId);
    if (!p) return;
    titleEl.textContent = 'تعديل المنتج';
    setValue('pm-id', p.id);
    setValue('pm-name', p.name);
    setValue('pm-price', p.price);
    setValue('pm-cat', p.categoryId);
    setValue('pm-status', p.available !== false ? 'true' : 'false');
    setValue('pm-image', p.image || '');
  } else {
    titleEl.textContent = 'منتج جديد';
    ['pm-id','pm-name','pm-price','pm-image'].forEach(id => setValue(id, ''));
    setValue('pm-cat', '');
    setValue('pm-status', 'true');
  }
  modal.style.display = 'flex';
}

function closeProductModal(e) {
  if (e && e.target !== document.getElementById('product-modal')) return;
  document.getElementById('product-modal').style.display = 'none';
}

async function saveProduct(e) {
  e.preventDefault();
  const id = parseInt(getValue('pm-id')) || null;
  const payload = {
    name: getValue('pm-name'),
    price: parseInt(getValue('pm-price')),
    categoryId: parseInt(getValue('pm-cat')),
    available: getValue('pm-status') === 'true',
    image: getValue('pm-image') || null,
  };

  if (supabase) {
    try {
      const dbPayload = {
        name_en: payload.name,
        price: payload.price,
        category_id: payload.categoryId,
        is_available: payload.available,
        image_url: payload.image,
      };
      if (id) {
        const { error } = await supabase.from('products').update(dbPayload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([dbPayload]);
        if (error) throw error;
      }
      // Invalidate cache
      localStorage.removeItem(CONFIG.cacheKey);
      await loadAdminData();
      adminToast('<i class="fas fa-check"></i> تم الحفظ بنجاح', 'success');
    } catch (err) {
      adminToast('<i class="fas fa-exclamation-triangle"></i> خطأ: ' + err.message, 'error');
      return;
    }
  } else {
    // Local only mode
    if (id) {
      const idx = adminProducts.findIndex(p => p.id === id);
      if (idx >= 0) adminProducts[idx] = { ...adminProducts[idx], ...payload };
    } else {
      const newId = Math.max(...adminProducts.map(p => p.id), 0) + 1;
      adminProducts.push({ id: newId, ...payload });
    }
    filteredAdminProducts = [...adminProducts];
    adminToast('<i class="fas fa-check"></i> تم الحفظ (محلياً)', 'success');
  }

  document.getElementById('product-modal').style.display = 'none';
  renderProductsTable();
  renderOverview();
}

async function deleteProduct(productId) {
  if (!confirm('هل تريد حذف هذا المنتج؟')) return;
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      localStorage.removeItem(CONFIG.cacheKey);
      await loadAdminData();
      adminToast('<i class="fas fa-trash"></i> تم الحذف', 'success');
    } catch (err) {
      adminToast('<i class="fas fa-times"></i> خطأ في الحذف', 'error');
      return;
    }
  } else {
    adminProducts = adminProducts.filter(p => p.id !== productId);
    filteredAdminProducts = filteredAdminProducts.filter(p => p.id !== productId);
    adminToast('<i class="fas fa-trash"></i> تم الحذف (محلياً)', 'success');
  }
  renderProductsTable();
  renderOverview();
}

// ---- Categories ----
function renderCategoriesAdmin() {
  const grid = document.getElementById('cats-admin-grid');
  if (!grid) return;
  if (adminCategories.length === 0) {
    grid.innerHTML = '<p style="color:#888">لا توجد تصنيفات</p>';
    return;
  }
  grid.innerHTML = adminCategories.map(cat => `
    <div class="cat-admin-card">
      <img class="cat-admin-img" src="${cat.image || ''}" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=60'" loading="lazy" alt="${cat.name}">
      <div class="cat-admin-info">
        <div class="cat-admin-name">${cat.icon || ''} ${cat.name}</div>
        <div class="cat-admin-count">${cat.count || 0} منتج</div>
        <div class="cat-admin-actions">
          <button class="tbl-btn tbl-btn-edit" onclick="openCatModal(${cat.id})" title="تعديل"><i class="fas fa-edit"></i></button>
          <button class="tbl-btn tbl-btn-del" onclick="deleteCat(${cat.id})" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function openCatModal(catId) {
  const modal = document.getElementById('cat-modal');
  const titleEl = document.getElementById('cat-modal-title');
  if (!modal) return;
  if (catId) {
    const cat = adminCategories.find(c => c.id === catId);
    if (!cat) return;
    titleEl.textContent = 'تعديل التصنيف';
    setValue('cm-id', cat.id);
    setValue('cm-name-ar', cat.name);
    setValue('cm-name-en', cat.nameEn || '');
    setValue('cm-icon', cat.icon || '');
    setValue('cm-image', cat.image || '');
    setValue('cm-order', '');
  } else {
    titleEl.textContent = 'تصنيف جديد';
    ['cm-id','cm-name-ar','cm-name-en','cm-icon','cm-image','cm-order'].forEach(id => setValue(id, ''));
  }
  modal.style.display = 'flex';
}

function closeCatModal(e) {
  if (e && e.target !== document.getElementById('cat-modal')) return;
  document.getElementById('cat-modal').style.display = 'none';
}

async function saveCat(e) {
  e.preventDefault();
  const id = parseInt(getValue('cm-id')) || null;
  const payload = {
    name: getValue('cm-name-ar'),
    nameEn: getValue('cm-name-en'),
    icon: getValue('cm-icon'),
    image: getValue('cm-image'),
  };

  if (supabase) {
    try {
      const dbPayload = {
        name_ar: payload.name,
        name_en: payload.nameEn,
        icon: payload.icon,
        image_url: payload.image,
        display_order: parseInt(getValue('cm-order')) || null,
      };
      if (id) {
        const { error } = await supabase.from('categories').update(dbPayload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([dbPayload]);
        if (error) throw error;
      }
      localStorage.removeItem(CONFIG.cacheKey);
      await loadAdminData();
      adminToast('<i class="fas fa-check"></i> تم حفظ التصنيف', 'success');
    } catch (err) {
      adminToast('<i class="fas fa-times"></i> خطأ: ' + err.message, 'error');
      return;
    }
  } else {
    if (id) {
      const idx = adminCategories.findIndex(c => c.id === id);
      if (idx >= 0) adminCategories[idx] = { ...adminCategories[idx], ...payload };
    } else {
      const newId = Math.max(...adminCategories.map(c => c.id), 0) + 1;
      adminCategories.push({ id: newId, count: 0, ...payload });
    }
    adminToast('<i class="fas fa-check"></i> تم الحفظ (محلياً)', 'success');
  }
  document.getElementById('cat-modal').style.display = 'none';
  renderCategoriesAdmin();
  populateCategorySelects();
}

async function deleteCat(catId) {
  if (!confirm('هل تريد حذف هذا التصنيف؟ سيتم حذف جميع منتجاته أيضاً.')) return;
  if (supabase) {
    try {
      await supabase.from('products').delete().eq('category_id', catId);
      const { error } = await supabase.from('categories').delete().eq('id', catId);
      if (error) throw error;
      localStorage.removeItem(CONFIG.cacheKey);
      await loadAdminData();
      adminToast('<i class="fas fa-trash"></i> تم حذف التصنيف', 'success');
    } catch (err) {
      adminToast('<i class="fas fa-times"></i> خطأ', 'error');
      return;
    }
  } else {
    adminCategories = adminCategories.filter(c => c.id !== catId);
    adminProducts = adminProducts.filter(p => p.categoryId !== catId);
    filteredAdminProducts = filteredAdminProducts.filter(p => p.categoryId !== catId);
    adminToast('<i class="fas fa-trash"></i> تم الحذف (محلياً)', 'success');
  }
  renderCategoriesAdmin();
}

// ---- Orders ----
function renderOrdersTable(statusFilter) {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  let list = adminOrders;
  if (statusFilter) list = list.filter(o => o.status === statusFilter);
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">لا توجد طلبات</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    const summary = items.slice(0, 2).map(i => i.name).join('، ') + (items.length > 2 ? '...' : '');
    return `
    <tr>
      <td><strong>#${o.order_number || o.id}</strong></td>
      <td>${formatDate(o.created_at)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${summary || '—'}</td>
      <td><strong style="color:var(--accent)">${formatPrice(o.total_price || 0)}</strong></td>
      <td><span class="status-badge status-${o.status || 'pending'}">${statusLabel(o.status)}</span></td>
      <td>
        <div class="tbl-actions">
          <button class="tbl-btn tbl-btn-view" onclick="viewOrder('${o.id}')" title="عرض"><i class="fas fa-eye"></i></button>
          <button class="tbl-btn tbl-btn-del" onclick="deleteOrder('${o.id}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterOrdersByStatus(status) {
  renderOrdersTable(status || null);
}

async function viewOrder(orderId) {
  const o = adminOrders.find(x => String(x.id) === String(orderId));
  if (!o) return;
  const items = Array.isArray(o.items) ? o.items : [];
  const itemLines = items.map(i => `• ${i.name} × ${i.qty} = ${formatPrice(i.price * i.qty)}`).join('\n');
  alert(`طلب #${o.order_number || o.id}\n\n${itemLines}\n\nالمجموع: ${formatPrice(o.total_price || 0)}\nالحالة: ${statusLabel(o.status)}`);
}

async function deleteOrder(orderId) {
  if (!confirm('هل تريد حذف هذا الطلب؟')) return;
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      adminOrders = adminOrders.filter(o => String(o.id) !== String(orderId));
      adminToast('<i class="fas fa-trash"></i> تم حذف الطلب', 'success');
    } catch (err) {
      adminToast('<i class="fas fa-times"></i> خطأ', 'error');
      return;
    }
  } else {
    adminOrders = adminOrders.filter(o => String(o.id) !== String(orderId));
    adminToast('<i class="fas fa-trash"></i> تم الحذف', 'success');
  }
  renderOrdersTable();
  renderOverview();
}

// ---- Helpers ----
function populateCategorySelects() {
  ['pm-cat', 'prod-cat-filter'].forEach(selectId => {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const prev = sel.value;
    const isFilter = selectId === 'prod-cat-filter';
    sel.innerHTML = isFilter
      ? '<option value="">كل التصنيفات</option>'
      : '<option value="">اختر تصنيفاً</option>';
    adminCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon || ''} ${cat.name}`;
      sel.appendChild(opt);
    });
    sel.value = prev || '';
  });
}

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return str; }
}

function statusLabel(s) {
  const map = { pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التحضير', ready: 'جاهز', delivered: 'تم التسليم', cancelled: 'ملغي' };
  return map[s] || 'جديد';
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}
function getValue(id) {
  return document.getElementById(id)?.value ?? '';
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function adminToast(html, type = '') {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = html;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// formatPrice is defined in data.js
