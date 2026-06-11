// =============================================
// StoryCafe — Cart System
// =============================================

const CART_KEY = 'storycafe_cart';

let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  showToast(`<i class="fas fa-check-circle"></i> تمت الإضافة: ${product.name}`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) removeFromCart(productId);
  else saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
  showToast('<i class="fas fa-trash-alt"></i> تم مسح السلة', 'error');
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function getItemQty(productId) {
  const item = cart.find(i => i.id === productId);
  return item ? item.qty : 0;
}

// ---- Cart UI ----
function toggleCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  } else {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCartDrawer();
  }
}

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  // Update all product card buttons/qty displays
  document.querySelectorAll('.product-card[data-id]').forEach(card => {
    const pid = parseInt(card.dataset.id);
    const qty = getItemQty(pid);
    const addBtn = card.querySelector('.add-btn');
    const qtyNum = card.querySelector('.qty-num');
    if (addBtn) {
      addBtn.classList.toggle('in-cart', qty > 0);
      addBtn.innerHTML = qty > 0
        ? `<i class="fas fa-check"></i> في السلة`
        : `<i class="fas fa-plus"></i> أضف للسلة`;
    }
    if (qtyNum) qtyNum.textContent = qty;
  });
  // If drawer is open, re-render
  const drawer = document.getElementById('cart-drawer');
  if (drawer && drawer.classList.contains('open')) renderCartDrawer();
}

function renderCartDrawer() {
  const list = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const footer = document.getElementById('cart-footer');
  const totalEl = document.getElementById('cart-total-price');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (footer) footer.style.display = 'block';
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());

  // Sanitize all dynamic content before injecting into innerHTML
  const san = (v) => (typeof Security !== 'undefined') ? Security.sanitize(v) : String(v ?? '');
  const sanURL = (v) => (typeof Security !== 'undefined') ? Security.sanitizeURL(v) : String(v ?? '');
  const fb = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=60';

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${sanURL(item.image) || fb}" alt="" onerror="this.src='${fb}'" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-name">${san(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="ci-qty-btn" onclick="updateQty(${Number(item.id)}, -1)" aria-label="تقليل">−</button>
        <span class="ci-qty">${Number(item.qty)}</span>
        <button class="ci-qty-btn" onclick="updateQty(${Number(item.id)}, 1)" aria-label="زيادة">+</button>
        <button class="ci-remove" onclick="removeFromCart(${Number(item.id)})" aria-label="حذف"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

// ---- WhatsApp Order ----
function sendWhatsAppOrder() {
  if (cart.length === 0) {
    showToast('<i class="fas fa-exclamation-circle"></i> السلة فارغة!', 'error');
    return;
  }
  // Rate limit: max 3 orders per 5 minutes
  if (typeof Security !== 'undefined') {
    const rl = Security.rateLimit('whatsapp_order', 3, 5 * 60 * 1000);
    if (!rl.allowed) {
      showToast(`<i class="fas fa-clock"></i> يرجى الانتظار ${rl.retryAfter} ثانية قبل إرسال طلب جديد`, 'error');
      return;
    }
  }
  const lines = cart.map(i =>
    `• ${i.name} × ${i.qty} = ${formatPrice(i.price * i.qty)}`
  ).join('%0A');
  const total = formatPrice(getCartTotal());
  const msg = `🍽️ *طلب جديد من ${CONFIG.storeName}*%0A%0A${lines}%0A%0A💰 *المجموع: ${total}*`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');
}

function openWhatsApp() {
  window.open(`https://wa.me/${CONFIG.whatsappNumber}`, '_blank');
}
