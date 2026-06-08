import { escapeHTML, formatPrice } from './config.js';
import { showToast } from './ui.js';

let products = [];

export function getProducts() {
  return products;
}

export function getOfferProducts() {
  return products.filter((p) => p.oldPrice != null);
}

export async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      products = await res.json();
      return;
    }
  } catch (e) { /* server down, fallback */ }

  try {
    const stored = localStorage.getItem('lumina_products');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products = parsed;
        return;
      }
    }
  } catch (e) { /* ignore */ }
}

export function saveProducts() {
  try {
    localStorage.setItem('lumina_products', JSON.stringify(products));
  } catch (e) { /* ignore */ }
}

export function updateLocalProducts(newProducts) {
  products = newProducts;
  saveProducts();
}

function createProductCard(product) {
  const hasDiscount = product.oldPrice != null;
  return `
    <article class="product-card reveal">
      <div class="product-card__img-wrap">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" class="product-card__img" loading="lazy">
        ${product.badge ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>` : ''}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${escapeHTML(product.name)}</h3>
        <div class="product-card__price">
          <span class="product-card__price-current">$${formatPrice(product.price)}</span>
          ${hasDiscount ? `<span class="product-card__price-old">$${formatPrice(product.oldPrice)}</span>` : ''}
        </div>
        <button class="product-card__btn" data-action="add-to-cart" data-id="${product.id}">
          <i class="fa-solid fa-plus"></i> Agregar al carrito
        </button>
      </div>
    </article>`;
}

export function renderProducts() {
  const productsGrid = document.getElementById('productsGrid');
  const offersGrid = document.getElementById('offersGrid');
  if (productsGrid) productsGrid.innerHTML = products.map(createProductCard).join('');
  if (offersGrid) {
    const offers = getOfferProducts();
    offersGrid.innerHTML = offers.map(createProductCard).join('');
  }
}
