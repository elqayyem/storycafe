// =============================================
// StoryCafe — Main Application
// =============================================

let allProducts = [];
let allCategories = [];
let activeCategory = 'all';
let searchQuery = '';
let searchTimer = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  initLoadingScreen();
  initNavbar();
  initScrollReveal();
  initHeroParallax();

  const data = await loadMenuData();
  allCategories = data.categories;
  allProducts = data.products;

  renderCategoryFilters();
  renderCategoriesSection();
  renderProducts();
  updateCartUI();
});

// ---- Loading Screen ----
function initLoadingScreen() {
  setTimeout(() => {
    const screen = document.getElementById('loading-screen');
    if (screen) screen.classList.add('hidden');
  }, 2200);
}

// ---- Data Loading ----
async function loadMenuData() {
  const cached = getCachedData();
  if (cached) return cached;

  if (supabase) {
    try {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('products').select('*').eq('is_available', true).order('display_order'),
      ]);
      if (cats && prods && cats.length > 0) {
        const result = {
          categories: cats.map(c => ({
            id: c.id, name: c.name_ar, nameEn: c.name_en,
            icon: c.icon, image: c.image_url,
            count: prods.filter(p => p.category_id === c.id).length,
          })),
          products: prods.map(p => ({
            id: p.id, categoryId: p.category_id,
            name: p.name_en || p.name_ar,
            price: p.price, image: p.image_url,
            available: p.is_available,
          })),
        };
        setCachedData(result);
        return result;
      }
    } catch (e) {
      console.warn('[StoryCafe] Supabase load failed, using local data');
    }
  }

  const local = { categories: CATEGORIES_LOCAL, products: PRODUCTS_LOCAL };
  setCachedData(local);
  return local;
}

function getCachedData() {
  try {
    const raw = localStorage.getItem(CONFIG.cacheKey);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.cacheTTL) return null;
    return data;
  } catch { return null; }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CONFIG.cacheKey, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ---- Navbar ----
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    highlightNavLink(sections);
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // close mobile menu
      document.getElementById('nav-links')?.classList.remove('open');
      document.getElementById('hamburger')?.classList.remove('open');
    });
  });
}

function highlightNavLink(sections) {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
}

function toggleMobileMenu() {
  const links = document.getElementById('nav-links');
  const btn = document.getElementById('hamburger');
  links?.classList.toggle('open');
  btn?.classList.toggle('open');
}

// ---- Hero Parallax ----
function initHeroParallax() {
  const el = document.getElementById('hero-parallax');
  if (!el) return;
  window.addEventListener('scroll', () => {
    el.style.transform = `translateY(${window.scrollY * 0.4}px)`;
  }, { passive: true });
}

// ---- Scroll Reveal ----
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

// ---- Render Categories Section ----
function renderCategoriesSection() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = allCategories.map(cat => `
    <div class="category-card reveal-up" onclick="filterByCategory(${cat.id}); document.getElementById('menu').scrollIntoView({behavior:'smooth'})">
      <img src="${cat.image}" alt="${cat.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'">
      <div class="category-overlay">
        <div class="category-icon">${cat.icon}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count} منتج</div>
      </div>
    </div>
  `).join('');
  // re-observe new elements
  setTimeout(() => initScrollReveal(), 50);
}

// ---- Render Category Filters ----
function renderCategoryFilters() {
  const container = document.getElementById('menu-filters');
  if (!container) return;
  const existing = container.querySelector('[data-cat="all"]');
  allCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span>${cat.icon} ${cat.name}</span>`;
    btn.onclick = () => filterByCategory(cat.id, btn);
    container.appendChild(btn);
  });
}

// ---- Filter Products ----
function filterByCategory(catId, btnEl) {
  activeCategory = catId;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) {
    btnEl.classList.add('active');
  } else {
    const b = document.querySelector(`[data-cat="${catId}"]`);
    if (b) b.classList.add('active');
  }
  renderProducts();
}

function debounceSearch(val) {
  clearTimeout(searchTimer);
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';
  searchTimer = setTimeout(() => {
    searchQuery = val.trim().toLowerCase();
    renderProducts();
  }, CONFIG.searchDebounce);
}

function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  document.getElementById('search-clear').style.display = 'none';
  renderProducts();
}

// ---- Render Products ----
function renderProducts() {
  const grid = document.getElementById('menu-grid');
  const empty = document.getElementById('menu-empty');
  if (!grid) return;

  let filtered = allProducts;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.categoryId == activeCategory);
  }
  if (searchQuery) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = filtered.map(p => {
    const cat = allCategories.find(c => c.id === p.categoryId);
    const qty = getItemQty(p.id);
    return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap" onclick="openLightbox('${p.image}')">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'">
        ${cat ? `<span class="product-cat-badge">${cat.icon} ${cat.name}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${formatPrice(p.price)}</div>
        <div class="product-controls">
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQtyOnCard(${p.id}, -1)" aria-label="تقليل">−</button>
            <span class="qty-num">${qty}</span>
            <button class="qty-btn" onclick="changeQtyOnCard(${p.id}, 1)" aria-label="زيادة">+</button>
          </div>
          <button class="add-btn ${qty > 0 ? 'in-cart' : ''}" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            ${qty > 0 ? '<i class="fas fa-check"></i> في السلة' : '<i class="fas fa-plus"></i> أضف للسلة'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function changeQtyOnCard(productId, delta) {
  const inCart = cart.find(i => i.id === productId);
  if (inCart) {
    updateQty(productId, delta);
  } else if (delta > 0) {
    const product = allProducts.find(p => p.id === productId);
    if (product) addToCart(product);
  }
}

// ---- Lightbox ----
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLightbox(); }
});

// ---- Toast ----
function showToast(html, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = html;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// ---- Contact Form ----
function sendContactWA(e) {
  e.preventDefault();
  const name = document.getElementById('cf-name')?.value.trim();
  const phone = document.getElementById('cf-phone')?.value.trim();
  const msg = document.getElementById('cf-msg')?.value.trim();
  if (!name || !msg) return;
  const text = `📩 رسالة جديدة من ${CONFIG.storeName}%0A%0A👤 الاسم: ${name}%0A${phone ? `📱 الهاتف: ${phone}%0A` : ''}%0A💬 الرسالة:%0A${msg}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${text}`, '_blank');
}
