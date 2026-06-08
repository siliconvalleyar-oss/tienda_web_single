import { escapeHTML, formatPrice } from './config.js';
import { showToast } from './ui.js';
import { getProducts } from './products.js';

let cart = {};

export function getCart() {
  return cart;
}

export function getCartCount() {
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartItems() {
  return Object.values(cart);
}

export function loadCart() {
  try {
    const stored = localStorage.getItem('lumina_cart');
    if (stored) cart = JSON.parse(stored);
  } catch (e) {
    cart = {};
  }
}

function saveCart() {
  try {
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
  } catch (e) { /* ignore */ }
}

export function addToCart(product) {
  if (cart[product.id]) {
    cart[product.id].quantity += 1;
  } else {
    cart[product.id] = { ...product, quantity: 1 };
  }
  saveCart();
  updateCartUI();
  showToast(`"${product.name}" agregado al carrito`);
}

export function removeFromCart(productId) {
  delete cart[productId];
  saveCart();
  updateCartUI();
}

export function updateCartQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].quantity += delta;
  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  saveCart();
  updateCartUI();
}

export function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
  showToast('Carrito vaciado');
}

function renderCartBadge() {
  const badge = document.getElementById('cartBadge');
  const count = getCartCount();
  badge.textContent = count;
  badge.classList.add('header__cart-badge--bump');
  badge.addEventListener('animationend', () => badge.classList.remove('header__cart-badge--bump'), { once: true });
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const items = Object.values(cart);

  if (items.length === 0) {
    container.innerHTML = '<p class="cart-sidebar__empty">Tu carrito está vacío.</p>';
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="cart-item__img" loading="lazy">
      <div class="cart-item__info">
        <p class="cart-item__name">${escapeHTML(item.name)}</p>
        <p class="cart-item__price">$${formatPrice(item.price)}</p>
        <div class="cart-item__actions">
          <button class="cart-item__qty-btn" data-action="decrease" data-id="${item.id}">−</button>
          <span class="cart-item__qty">${item.quantity}</span>
          <button class="cart-item__qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button class="cart-item__remove" data-action="remove" data-id="${item.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </div>`
    )
    .join('');
}

function renderCartFooter() {
  const footer = document.getElementById('cartFooter');
  const total = document.getElementById('cartTotal');
  const count = getCartCount();

  if (count === 0) {
    footer.style.display = 'none';
  } else {
    footer.style.display = 'flex';
    total.textContent = `$${formatPrice(getCartTotal())}`;
  }
}

export function updateCartUI() {
  renderCartBadge();
  renderCartItems();
  renderCartFooter();
}

export function setupCartSidebar() {
  const sidebar = document.getElementById('cartSidebar');
  const toggleBtn = document.getElementById('cartToggle');
  const closeBtn = document.getElementById('cartClose');
  const overlay = document.getElementById('cartOverlay');

  function openCart() {
    sidebar.classList.add('is-open');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    sidebar.classList.remove('is-open');
    sidebar.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeCart();
    }
  });
}
