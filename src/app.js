import { loadProducts, renderProducts, getProducts } from './products.js';
import { loadCart, updateCartUI, addToCart, updateCartQuantity, removeFromCart, setupCartSidebar } from './cart.js';
import { PaymentModal, setupCartCheckout, setupReservations, setupPromoCheckout } from './mercadopago.js';
import { AdminPanel, PaletteManager, ConfigManager } from './admin.js';
import { setupMobileMenu, setupHeaderScroll, setupActiveNavHighlight, setupScrollTopButton, setupScrollReveal, setupNewsletterForm, showToast } from './ui.js';

function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10);

    switch (action) {
      case 'add-to-cart': {
        const product = getProducts().find((p) => p.id === id);
        if (product) {
          addToCart(product);
          btn.classList.add('product-card__btn--added');
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado ✓';
          setTimeout(() => {
            btn.classList.remove('product-card__btn--added');
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar al carrito';
          }, 1800);
        }
        break;
      }
      case 'increase': updateCartQuantity(id, 1); break;
      case 'decrease': updateCartQuantity(id, -1); break;
      case 'remove': removeFromCart(id); break;
    }
  });
}

async function init() {
  PaletteManager.init();
  await ConfigManager.init();

  loadCart();
  await loadProducts();
  renderProducts();
  updateCartUI();

  PaymentModal.init();
  AdminPanel.init();

  setupEventDelegation();
  setupCartSidebar();
  setupCartCheckout();
  setupReservations();
  setupPromoCheckout();
  setupMobileMenu();
  setupHeaderScroll();
  setupActiveNavHighlight();
  setupScrollTopButton();
  setupScrollReveal();
  setupNewsletterForm();

  console.log('[Lumina Nails] Tienda inicializada.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
