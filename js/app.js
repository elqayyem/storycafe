// =============================================
// StoryCafe — Main Application
// =============================================

let allProducts    = [];
let allCategories  = [];
let activeCategory = 'all';
let searchQuery    = '';
let searchTimer    = null;

// ---- Boot (scripts are at bottom of body, DOM is already ready) ----
(function boot() {
  try { localStorage.removeItem('storycafe_menu_cache'); } catch(e) {}

  // 1. Load local data immediately — always works, no network needed
  allCategories = [...CATEGORIES_LOCAL];
  allProducts   = [...PRODUCTS_LOCAL];

  // 1b. Apply edits made in the admin panel (shared via localStorage, same origin)
  applyAdminOverlays();

  // 2. Render everything synchronously
  renderCategoriesSection();
  renderProducts();
  updateCartUI();

  // 3. UI setup
  initLoadingScreen();
  initNavbar();
  initScrollReveal();
  initHeroParallax();

  // 4. Try Supabase in background (won't block rendering)
  if (typeof supabase !== 'undefined' && supabase) {
    loadFromSupabase();
  }
})();

// ---- Apply admin edits (saved by the admin panel in localStorage) ----
// The admin panel (hadi.html) and this page share localStorage because they are
// served from the same origin. The admin writes added/edited/deleted items to
// these keys; we replay them here so changes appear on the public site.
function applyAdminOverlays() {
  try {
    const added       = JSON.parse(localStorage.getItem('sc_admin_products')     || '[]');
    const edited      = JSON.parse(localStorage.getItem('sc_admin_edits')        || '{}');
    const deleted     = JSON.parse(localStorage.getItem('sc_admin_deleted')      || '[]');
    const addedCats   = JSON.parse(localStorage.getItem('sc_admin_cats')         || '[]');
    const deletedCats = JSON.parse(localStorage.getItem('sc_admin_cats_deleted') || '[]');

    // Products: drop deleted, apply edits, append new
    allProducts = allProducts
      .filter(p => !deleted.includes(p.id))
      .map(p => edited[p.id] ? { ...p, ...edited[p.id] } : p);
    added.forEach(p => { if (!allProducts.find(x => x.id === p.id)) allProducts.push(p); });

    // Categories: drop deleted, append new
    allCategories = allCategories.filter(c => !deletedCats.includes(c.id));
    addedCats.forEach(c => { if (!allCategories.find(x => x.id === c.id)) allCategories.push(c); });

    // Hide products the admin marked unavailable (متاح ✗)
    allProducts = allProducts.filter(p => p.available !== false);

    // Recompute each category's product count
    allCategories.forEach(c => { c.count = allProducts.filter(p => p.categoryId === c.id).length; });
  } catch (e) {
    console.warn('[StoryCafe] admin overlay merge failed:', e.message);
  }
}

// ---- Loading Screen ----
function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;
  setTimeout(() => screen.classList.add('hidden'), 1800);
}

// ---- Supabase (background refresh) ----
async function loadFromSupabase() {
  try {
    const [{ data: cats, error: e1 }, { data: prods, error: e2 }] = await Promise.all([
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('products').select('*').eq('is_available', true).order('display_order'),
    ]);
    if (e1 || e2 || !cats || !prods || cats.length === 0) return;

    allCategories = cats.map(c => ({
      id: c.id, name: c.name_ar, nameEn: c.name_en,
      icon: c.icon, image: c.image_url,
      count: prods.filter(p => p.category_id === c.id).length,
    }));
    allProducts = prods.map(p => ({
      id: p.id, categoryId: p.category_id,
      name: p.name_en || p.name_ar,
      price: p.price, image: p.image_url,
      available: p.is_available,
    }));

    // Re-render with Supabase data
    renderCategoriesSection();
    renderProducts();
    updateCartUI();
  } catch (e) {
    console.warn('[StoryCafe] Supabase load failed, keeping local data');
  }
}

// ---- Navbar ----
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
    highlightNavLink(sections);
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('nav-links')?.classList.remove('open');
      document.getElementById('hamburger')?.classList.remove('open');
    });
  });
}

function highlightNavLink(sections) {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

function toggleMobileMenu() {
  document.getElementById('nav-links')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('open');
}

// ---- Hero Parallax ----
function initHeroParallax() {
  const el = document.getElementById('hero-parallax');
  if (!el) return;
  window.addEventListener('scroll', () => {
    el.style.transform = `translateY(${window.scrollY * 0.35}px)`;
  }, { passive: true });
}

// ---- Scroll Reveal ----
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-up,.reveal-left,.reveal-right').forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal-up,.reveal-left,.reveal-right').forEach(el => observer.observe(el));
}

// ---- Render Categories Section ----
function renderCategoriesSection() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = allCategories.map(cat => `
    <div class="category-card reveal-up" data-catid="${cat.id}" onclick="selectCategory(${cat.id})">
      <img src="${cat.image}" alt="${cat.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'">
      <div class="category-overlay">
        <div class="category-icon">${cat.icon}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count} منتج</div>
      </div>
    </div>`).join('');
  setTimeout(() => initScrollReveal(), 50);
}


// ---- Filter ----
function selectCategory(catId) {
  // Toggle: click the active category again to show all
  activeCategory = (activeCategory === catId) ? 'all' : catId;
  // Highlight the selected card
  document.querySelectorAll('.category-card').forEach(card => {
    const id = parseInt(card.dataset.catid);
    card.classList.toggle('cat-selected', id === activeCategory);
  });
  renderProducts();
  // Scroll to products grid
  const grid = document.getElementById('menu-grid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Keep filterByCategory as alias used by footer links
function filterByCategory(catId) {
  selectCategory(catId);
}

function debounceSearch(val) {
  clearTimeout(searchTimer);
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
  searchTimer = setTimeout(() => {
    searchQuery = val.trim().toLowerCase();
    renderProducts();
  }, 300);
}

function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = 'none';
  renderProducts();
}

// ---- Render Products ----
function renderProducts() {
  const grid  = document.getElementById('menu-grid');
  const empty = document.getElementById('menu-empty');
  if (!grid) return;

  let filtered = allProducts;
  if (activeCategory !== 'all') filtered = filtered.filter(p => p.categoryId == activeCategory);
  if (searchQuery)              filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = filtered.map(p => {
    const cat = allCategories.find(c => c.id === p.categoryId);
    const qty = getItemQty(p.id);
    const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80';
    return `<div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap" onclick="openLightbox(this.querySelector('img').src)">
        <img src="${p.image || fallback}" alt="${p.name}" loading="lazy" onerror="this.src='${fallback}'">
        ${cat ? `<span class="product-cat-badge">${cat.icon} ${cat.name}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-controls">
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQtyOnCard(${p.id},-1)">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="changeQtyOnCard(${p.id},1)">+</button>
          </div>
          <button class="add-btn ${qty > 0 ? 'in-cart' : ''}" onclick="addToCartById(${p.id})">
            ${qty > 0 ? '<i class="fas fa-check"></i> Added' : '<i class="fas fa-plus"></i> Add'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function addToCartById(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (product) addToCart(product);
}

function changeQtyOnCard(productId, delta) {
  if (cart.find(i => i.id === productId)) {
    updateQty(productId, delta);
  } else if (delta > 0) {
    addToCartById(productId);
  }
}

// ---- Lightbox ----
function openLightbox(src) {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ---- Toast ----
function showToast(html, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = html;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2800);
}

// ---- Contact Form ----
function sendContactWA(e) {
  e.preventDefault();
  const name  = document.getElementById('cf-name')?.value.trim();
  const phone = document.getElementById('cf-phone')?.value.trim();
  const msg   = document.getElementById('cf-msg')?.value.trim();
  if (!name || !msg) return;
  const text = `📩 رسالة جديدة من ${CONFIG.storeName}%0A%0A👤 الاسم: ${name}%0A${phone ? `📱 الهاتف: ${phone}%0A` : ''}%0A💬 الرسالة:%0A${msg}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${text}`, '_blank');
}
