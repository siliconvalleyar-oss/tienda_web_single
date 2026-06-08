/* ================================================================
   LUMINA NAILS – SCRIPT.JS
   Funcionalidad: carrito, Mercado Pago, reservas, promociones
   Arquitectura: modular, escalable, preparada para backend/API
   ================================================================ */

// ------------------------------------------------------------------
// 1. CONFIGURACIÓN CENTRAL (preparada para backend)
// ------------------------------------------------------------------
const CONFIG = {
  // En producción, esto vendrá del backend vía API
  mercadoPago: {
    publicKey: "TEST-00000000-0000-0000-0000-000000000000", // ⚠️ Reemplazar con tu Public Key real de Mercado Pago
    // La verdadera integración requiere un backend que genere el preferenceId.
    // Este frontend simula el flujo completo y está listo para conectar al endpoint real.
    backendEndpoint: "/api/mercadopago/create-preference", // ← Conectar aquí cuando el backend esté listo
  },
  store: {
    name: "Lumina Nails",
    currency: "ARS",
  },
};

// ------------------------------------------------------------------
// 2. DATOS DE PRODUCTOS (simulando respuesta de API)
// ------------------------------------------------------------------
const products = [
  {
    id: 1,
    name: "Esmalte Semi-Permanente Nude Dreams",
    price: 1850,
    oldPrice: 2200,
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80",
    category: "esmalte",
    badge: null,
  },
  {
    id: 2,
    name: "Kit Completo de Uñas de Gel",
    price: 4200,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&q=80",
    category: "kit",
    badge: "Más vendido",
  },
  {
    id: 3,
    name: "Lámpara LED UV 48W Profesional",
    price: 5600,
    oldPrice: 7200,
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80",
    category: "herramienta",
    badge: "Oferta",
  },
  {
    id: 4,
    name: "Base Coat Fortalecedora con Calcio",
    price: 1350,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1587132137056-bfbf0166836a?w=500&q=80",
    category: "tratamiento",
    badge: null,
  },
  {
    id: 5,
    name: "Top Coat Brillo Extremo Efecto Gel",
    price: 1580,
    oldPrice: 1900,
    image: "https://images.unsplash.com/photo-1619393999197-9c0ea9a7b21c?w=500&q=80",
    category: "esmalte",
    badge: null,
  },
  {
    id: 6,
    name: "Set de 12 Esmaltes Pastel Collection",
    price: 6400,
    oldPrice: 8900,
    image: "https://images.unsplash.com/photo-1485965373059-f07657e9f841?w=500&q=80",
    category: "set",
    badge: "Oferta",
  },
  {
    id: 7,
    name: "Removedor de Cutículas Profesional",
    price: 980,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1610992015732-2449bc5ccd51?w=500&q=80",
    category: "tratamiento",
    badge: null,
  },
  {
    id: 8,
    name: "Lima Eléctrica Recargable 5 Velocidades",
    price: 3200,
    oldPrice: 4100,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80",
    category: "herramienta",
    badge: null,
  },
];

/**
 * Retorna los productos con descuento (oldPrice) para la sección Ofertas
 */
function getOfferProducts() {
  return products.filter((p) => p.oldPrice !== null);
}

function loadProductsFromStorage() {
  try {
    const stored = localStorage.getItem('lumina_products');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products.length = 0;
        products.push(...parsed);
      }
    }
  } catch (e) { /* ignore */ }
}

function saveProductsToStorage() {
  try {
    localStorage.setItem('lumina_products', JSON.stringify(products));
  } catch (e) { /* ignore */ }
}

// ------------------------------------------------------------------
// 3. ESTADO DEL CARRITO
// ------------------------------------------------------------------
let cart = {};

function loadCart() {
  try {
    const stored = localStorage.getItem("lumina_cart");
    if (stored) cart = JSON.parse(stored);
  } catch (e) {
    cart = {};
  }
}

function saveCart() {
  try {
    localStorage.setItem("lumina_cart", JSON.stringify(cart));
  } catch (e) {
    /* localStorage puede fallar en navegación privada */
  }
}

function getCartCount() {
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal() {
  return Object.values(cart).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

function addToCart(product) {
  if (cart[product.id]) {
    cart[product.id].quantity += 1;
  } else {
    cart[product.id] = { ...product, quantity: 1 };
  }
  saveCart();
  updateCartUI();
  showToast(`"${product.name}" agregado al carrito`);
}

function removeFromCart(productId) {
  delete cart[productId];
  saveCart();
  updateCartUI();
}

function updateCartQuantity(productId, delta) {
  if (!cart[productId]) return;
  cart[productId].quantity += delta;
  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
  showToast("Carrito vaciado");
}

// ------------------------------------------------------------------
// 4. RENDERIZADO DEL CARRITO
// ------------------------------------------------------------------
function updateCartUI() {
  renderCartBadge();
  renderCartItems();
  renderCartFooter();
}

function renderCartBadge() {
  const badge = document.getElementById("cartBadge");
  const count = getCartCount();
  badge.textContent = count;
  badge.classList.add("header__cart-badge--bump");
  badge.addEventListener(
    "animationend",
    () => badge.classList.remove("header__cart-badge--bump"),
    { once: true }
  );
}

function renderCartItems() {
  const container = document.getElementById("cartItems");
  const items = Object.values(cart);

  if (items.length === 0) {
    container.innerHTML =
      '<p class="cart-sidebar__empty">Tu carrito está vacío.</p>';
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
    .join("");
}

function renderCartFooter() {
  const footer = document.getElementById("cartFooter");
  const total = document.getElementById("cartTotal");
  const count = getCartCount();

  if (count === 0) {
    footer.style.display = "none";
  } else {
    footer.style.display = "flex";
    total.textContent = `$${formatPrice(getCartTotal())}`;
  }
}

// ------------------------------------------------------------------
// 5. RENDERIZADO DE PRODUCTOS
// ------------------------------------------------------------------
function createProductCard(product) {
  const hasDiscount = product.oldPrice !== null;
  return `
    <article class="product-card reveal">
      <div class="product-card__img-wrap">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" class="product-card__img" loading="lazy">
        ${product.badge ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>` : ""}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${escapeHTML(product.name)}</h3>
        <div class="product-card__price">
          <span class="product-card__price-current">$${formatPrice(product.price)}</span>
          ${hasDiscount ? `<span class="product-card__price-old">$${formatPrice(product.oldPrice)}</span>` : ""}
        </div>
        <button class="product-card__btn" data-action="add-to-cart" data-id="${product.id}">
          <i class="fa-solid fa-plus"></i> Agregar al carrito
        </button>
      </div>
    </article>`;
}

function renderProducts() {
  const productsGrid = document.getElementById("productsGrid");
  const offersGrid = document.getElementById("offersGrid");
  if (productsGrid) productsGrid.innerHTML = products.map((p) => createProductCard(p)).join("");
  if (offersGrid) {
    const offers = getOfferProducts();
    offersGrid.innerHTML = offers.map((p) => createProductCard(p)).join("");
  }
}

// ------------------------------------------------------------------
// 6. MÓDULO MERCADO PAGO (simulación profesional lista para backend)
// ------------------------------------------------------------------
const MercadoPago = {
  /**
   * Inicializa el SDK de Mercado Pago (si está disponible)
   */
  init() {
    // En producción, el backend devuelve el preferenceId y acá se abre el checkout
    // const mp = new window.MercadoPago(CONFIG.mercadoPago.publicKey);
    // mp.checkout({ preference: { id: preferenceId } });
    console.log("[MP] SDK listo. Esperando preferenceId del backend.");
  },

  /**
   * Crea un payment link simulado (en producción lo genera el backend)
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} - Resultado con paymentLink y metadata
   */
  async crearPago(paymentData) {
    // Simula una llamada al backend
    console.log("[MP] Creando preferencia de pago...", paymentData);

    // Simular latencia de red
    await this._delay(800);

    // En producción, esto sería un fetch al backend:
    // const res = await fetch(CONFIG.mercadoPago.backendEndpoint, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(paymentData),
    // });
    // const data = await res.json();

    // Simulación de respuesta exitosa
    const preferenceId = `PREF-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const paymentLink = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`;

    return {
      success: true,
      preferenceId,
      paymentLink,
      // En un entorno real, abrimos el checkout con el SDK:
      // mp.checkout({ preference: { id: preferenceId } });
    };
  },

  /**
   * Simula delay de red
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

// ------------------------------------------------------------------
// 7. MÓDULO DE PAGO / CHECKOUT (modal)
// ------------------------------------------------------------------
const PaymentModal = {
  elements: {},

  init() {
    this.elements.modal = document.getElementById("paymentModal");
    this.elements.overlay = document.getElementById("paymentModalOverlay");
    this.elements.close = document.getElementById("paymentModalClose");
    this.elements.body = document.getElementById("paymentModalBody");
    this._currentData = null;

    this.elements.close.addEventListener("click", () => this.cerrar());
    this.elements.overlay.addEventListener("click", () => this.cerrar());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.elements.modal.classList.contains("is-open")) {
        this.cerrar();
      }
    });
  },

  /**
   * Abre el modal con los detalles del pago
   * @param {Object} data - { type, title, items, total, metadata }
   */
  abrir(data) {
    this._currentData = data;
    this._render(data);
    this.elements.modal.classList.add("is-open");
    this.elements.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  },

  cerrar() {
    this.elements.modal.classList.remove("is-open");
    this.elements.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    this._currentData = null;
  },

  _render(data) {
    const { type, title, items, total, metadata } = data;

    let itemsHTML = "";
    if (Array.isArray(items)) {
      itemsHTML = items
        .map(
          (item) => `
        <div class="payment-modal__detail-row">
          <span>${escapeHTML(item.name)} x${item.quantity || 1}</span>
          <span>$${formatPrice(item.price * (item.quantity || 1))}</span>
        </div>`
        )
        .join("");
    }

    const typeLabel =
      type === "cart"
        ? "Pedido de productos"
        : type === "reserve"
        ? "Seña de reserva"
        : type === "promo"
        ? "Promoción"
        : "Compra";

    this.elements.body.innerHTML = `
      <h2 class="payment-modal__title">Confirmar ${typeLabel}</h2>

      <div class="payment-modal__detail">
        <div class="payment-modal__detail-row">
          <span>Concepto</span>
          <span>${escapeHTML(title)}</span>
        </div>
        ${itemsHTML}
        <div class="payment-modal__detail-row payment-modal__detail-row--total">
          <span>Total a pagar</span>
          <strong>$${formatPrice(total)}</strong>
        </div>
      </div>

      ${
        type === "reserve"
          ? `<div class="payment-modal__info">
              <p><i class="fa-solid fa-circle-info"></i> Abonás la seña ahora y el saldo restante se paga en el local el día de tu turno.</p>
              ${metadata?.totalService ? `<p>Saldo restante en local: <strong>$${formatPrice(metadata.totalService - total)}</strong></p>` : ""}
            </div>`
          : ""
      }

      <div class="payment-modal__mp-badge">
        <i class="fa-solid fa-lock"></i>
        <span>Pago seguro procesado por <strong>Mercado Pago</strong></span>
      </div>

      <div class="payment-modal__actions">
        <button class="btn btn--mp btn--block" id="btnMercadoPago">
          <i class="fa-solid fa-credit-card"></i> Pagar con Mercado Pago
        </button>
        <button class="btn btn--outline btn--block" id="btnCancelPayment">
          Cancelar
        </button>
      </div>

      <p class="payment-modal__note">
        Hasta 12 cuotas sin interés · Débito · Crédito · Efectivo
      </p>
    `;

    // Eventos del modal
    document.getElementById("btnMercadoPago").addEventListener("click", () => {
      this._procesarPago(data);
    });
    document.getElementById("btnCancelPayment").addEventListener("click", () => {
      this.cerrar();
    });
  },

  async _procesarPago(data) {
    const btn = document.getElementById("btnMercadoPago");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

    try {
      const result = await MercadoPago.crearPago({
        title: data.title,
        total: data.total,
        type: data.type,
        metadata: data.metadata,
      });

      if (result.success) {
        this.cerrar();
        // Nota: En producción, acá se abre el checkout real de MP
        showToast("🔗 Redirigiendo a Mercado Pago...", 4000);

        // Simular: abrir link de pago en nueva ventana (en producción, el SDK maneja el redirect)
        setTimeout(() => {
          showToast(
            `✅ Pago simulado exitoso. Preference: ${result.preferenceId.slice(0, 16)}...`,
            5000
          );

          // Si es carrito, vaciarlo después del pago exitoso
          if (data.type === "cart") {
            clearCart();
          }

          console.log("[MP] Payment Link:", result.paymentLink);
          // window.open(result.paymentLink, "_blank"); // Descomentar en producción
        }, 1500);
      } else {
        showToast("❌ Error al procesar el pago. Intentá nuevamente.");
      }
    } catch (err) {
      console.error("[MP] Error:", err);
      showToast("❌ Error de conexión. Reintentá en unos minutos.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-credit-card"></i> Pagar con Mercado Pago';
    }
  },
};

// ------------------------------------------------------------------
// 8. CHECKOUT DEL CARRITO
// ------------------------------------------------------------------
function setupCartCheckout() {
  const checkoutBtn = document.getElementById("checkoutBtn");
  const clearCartBtn = document.getElementById("clearCartBtn");

  checkoutBtn.addEventListener("click", () => {
    if (getCartCount() === 0) {
      showToast("Tu carrito está vacío");
      return;
    }
    const items = Object.values(cart).map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));
    PaymentModal.abrir({
      type: "cart",
      title: "Compra de productos",
      items,
      total: getCartTotal(),
      metadata: { cartItems: items.length },
    });
  });

  clearCartBtn.addEventListener("click", () => {
    if (getCartCount() === 0) return;
    if (confirm("¿Querés vaciar el carrito?")) {
      clearCart();
    }
  });
}

// ------------------------------------------------------------------
// 9. RESERVAS (Servicios con seña)
// ------------------------------------------------------------------
function setupReservations() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='reserve']");
    if (!btn) return;

    const serviceId = btn.dataset.serviceId;
    const serviceName = btn.dataset.serviceName;
    const servicePrice = parseInt(btn.dataset.servicePrice, 10);
    const serviceTotal = parseInt(btn.dataset.serviceTotal, 10);
    const serviceDuration = btn.dataset.serviceDuration;

    PaymentModal.abrir({
      type: "reserve",
      title: serviceName,
      items: [
        {
          name: `Seña online – ${serviceName}`,
          price: servicePrice,
          quantity: 1,
        },
      ],
      total: servicePrice,
      metadata: {
        serviceId,
        totalService: serviceTotal,
        duration: serviceDuration,
      },
    });
  });
}

// ------------------------------------------------------------------
// 10. PROMOCIONES PAGAS
// ------------------------------------------------------------------
function setupPromoCheckout() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='promo-checkout']");
    if (!btn) return;

    const promoId = btn.dataset.promoId;
    const promoName = btn.dataset.promoName;
    const promoPrice = parseInt(btn.dataset.promoPrice, 10);

    PaymentModal.abrir({
      type: "promo",
      title: promoName,
      items: [{ name: promoName, price: promoPrice, quantity: 1 }],
      total: promoPrice,
      metadata: { promoId },
    });
  });
}

// ------------------------------------------------------------------
// 11. EVENT DELEGATION (acciones de carrito + productos)
// ------------------------------------------------------------------
function setupEventDelegation() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10);

    switch (action) {
      case "add-to-cart": {
        const product = products.find((p) => p.id === id);
        if (product) {
          addToCart(product);
          btn.classList.add("product-card__btn--added");
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Agregado ✓';
          setTimeout(() => {
            btn.classList.remove("product-card__btn--added");
            btn.innerHTML = '<i class="fa-solid fa-plus"></i> Agregar al carrito';
          }, 1800);
        }
        break;
      }
      case "increase":
        updateCartQuantity(id, 1);
        break;
      case "decrease":
        updateCartQuantity(id, -1);
        break;
      case "remove":
        removeFromCart(id);
        break;
      default:
        break;
    }
  });
}

// ------------------------------------------------------------------
// 12. CARRITO SIDEBAR
// ------------------------------------------------------------------
function setupCartSidebar() {
  const sidebar = document.getElementById("cartSidebar");
  const toggleBtn = document.getElementById("cartToggle");
  const closeBtn = document.getElementById("cartClose");
  const overlay = document.getElementById("cartOverlay");

  function openCart() {
    sidebar.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    sidebar.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  toggleBtn.addEventListener("click", openCart);
  closeBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
      closeCart();
    }
  });
}

// ------------------------------------------------------------------
// 13. MENÚ MÓVIL
// ------------------------------------------------------------------
function setupMobileMenu() {
  const burgerBtn = document.getElementById("burgerBtn");
  const nav = document.getElementById("mainNav");
  const navLinks = nav.querySelectorAll(".header__link");

  function toggleMenu() {
    const isActive = burgerBtn.classList.toggle("is-active");
    nav.classList.toggle("is-open");
    burgerBtn.setAttribute("aria-expanded", isActive);
    document.body.style.overflow = isActive ? "hidden" : "";
  }
  function closeMenu() {
    burgerBtn.classList.remove("is-active");
    nav.classList.remove("is-open");
    burgerBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  burgerBtn.addEventListener("click", toggleMenu);
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) closeMenu();
    });
  });
}

// ------------------------------------------------------------------
// 14. HEADER SCROLL
// ------------------------------------------------------------------
function setupHeaderScroll() {
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("header--scrolled", window.scrollY > 20);
  });
}

// ------------------------------------------------------------------
// 15. ACTIVE NAV LINK
// ------------------------------------------------------------------
function setupActiveNavHighlight() {
  const navLinks = document.querySelectorAll(".header__link");
  const sections = [];

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      const section = document.querySelector(href);
      if (section) sections.push({ link, section });
    }
  });

  function highlightLink() {
    let currentId = "";
    sections.forEach(({ section }) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.4) {
        currentId = section.getAttribute("id");
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", highlightLink, { passive: true });
  highlightLink();
}

// ------------------------------------------------------------------
// 16. SCROLL TOP BUTTON
// ------------------------------------------------------------------
function setupScrollTopButton() {
  const btn = document.getElementById("scrollTopBtn");
  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ------------------------------------------------------------------
// 17. SCROLL REVEAL
// ------------------------------------------------------------------
function setupScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const mutationObserver = new MutationObserver(() => {
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
      observer.observe(el);
    });
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// ------------------------------------------------------------------
// 18. NEWSLETTER
// ------------------------------------------------------------------
function setupNewsletterForm() {
  const form = document.getElementById("newsletterForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (email) {
      showToast(`📧 ¡Gracias! Te enviamos el descuento a ${email}`);
      form.reset();
    }
  });
}

// ------------------------------------------------------------------
// 19. TOAST
// ------------------------------------------------------------------
let toastTimer = null;

function showToast(message, duration = 3000) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("is-visible");
  void toast.offsetWidth;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

// ------------------------------------------------------------------
// 20. UTILIDADES
// ------------------------------------------------------------------
function formatPrice(price) {
  return price.toLocaleString("es-AR");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ------------------------------------------------------------------
// 21. PALETAS DE COLOR
// ------------------------------------------------------------------
const PALETTES = {
  'nude-rose': {
    name: 'Nude Rose',
    desc: 'Clásico y elegante',
    colors: {
      '--color-cream': '#fdf8f4',
      '--color-nude-light': '#f5e6dc',
      '--color-nude': '#e8d5c8',
      '--color-rose-light': '#f2d7d9',
      '--color-rose': '#d4a5a9',
      '--color-rose-dark': '#b5838d',
      '--color-brown': '#8b6f6b',
      '--color-accent': '#c89666',
      '--color-gold': '#e6b422',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#e6f7ff',
    },
    swatches: ['#f5e6dc', '#e8d5c8', '#f2d7d9', '#d4a5a9', '#b5838d', '#8b6f6b'],
  },
  lavender: {
    name: 'Lavanda',
    desc: 'Suave y moderno',
    colors: {
      '--color-cream': '#f8f4fd',
      '--color-nude-light': '#ede4f5',
      '--color-nude': '#ddd0ec',
      '--color-rose-light': '#e8ddf2',
      '--color-rose': '#c4a8d4',
      '--color-rose-dark': '#9b72b0',
      '--color-brown': '#6b4f7a',
      '--color-accent': '#b088c9',
      '--color-gold': '#c49adb',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#f0e6ff',
    },
    swatches: ['#ede4f5', '#ddd0ec', '#e8ddf2', '#c4a8d4', '#9b72b0', '#6b4f7a'],
  },
  menta: {
    name: 'Menta',
    desc: 'Fresco y natural',
    colors: {
      '--color-cream': '#f0faf5',
      '--color-nude-light': '#d5ede3',
      '--color-nude': '#b8dfd0',
      '--color-rose-light': '#c8ece0',
      '--color-rose': '#6fb8a0',
      '--color-rose-dark': '#4a9a82',
      '--color-brown': '#3d7a67',
      '--color-accent': '#5cb8a8',
      '--color-gold': '#7fcdba',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#e6f7ff',
    },
    swatches: ['#d5ede3', '#b8dfd0', '#c8ece0', '#6fb8a0', '#4a9a82', '#3d7a67'],
  },
  coral: {
    name: 'Coral',
    desc: 'Cálido y vibrante',
    colors: {
      '--color-cream': '#fdf4f0',
      '--color-nude-light': '#f5e0d5',
      '--color-nude': '#eccfc0',
      '--color-rose-light': '#fad5c8',
      '--color-rose': '#f0a890',
      '--color-rose-dark': '#e07a5f',
      '--color-brown': '#c0654a',
      '--color-accent': '#f09070',
      '--color-gold': '#f0a060',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#fff0e6',
    },
    swatches: ['#f5e0d5', '#eccfc0', '#fad5c8', '#f0a890', '#e07a5f', '#c0654a'],
  },
  'rose-gold': {
    name: 'Oro Rosa',
    desc: 'Lujoso y glamoroso',
    colors: {
      '--color-cream': '#fdf4f6',
      '--color-nude-light': '#f5e0e6',
      '--color-nude': '#ecccd6',
      '--color-rose-light': '#fad5e0',
      '--color-rose': '#d48a9a',
      '--color-rose-dark': '#b86a7c',
      '--color-brown': '#8a5a66',
      '--color-accent': '#c89666',
      '--color-gold': '#d4a040',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#fce8f0',
    },
    swatches: ['#f5e0e6', '#ecccd6', '#fad5e0', '#d48a9a', '#b86a7c', '#8a5a66'],
  },
  noche: {
    name: 'Noche',
    desc: 'Rosas oscuros y elegantes',
    colors: {
      '--color-cream': '#f5f0ee',
      '--color-nude-light': '#e8ddd8',
      '--color-nude': '#d4c4bc',
      '--color-rose-light': '#d4a5a9',
      '--color-rose': '#b5838d',
      '--color-rose-dark': '#8b6565',
      '--color-brown': '#6b4f4f',
      '--color-accent': '#a57a7a',
      '--color-gold': '#c89666',
      '--color-success': '#27ae60',
      '--color-danger': '#c0392b',
      '--color-mp-bg': '#e6f7ff',
    },
    swatches: ['#f5f0ee', '#e8ddd8', '#d4c4bc', '#b5838d', '#8b6565', '#6b4f4f'],
  },
};

const PaletteManager = {
  current: 'nude-rose',

  init() {
    const saved = localStorage.getItem('lumina_palette');
    if (saved && PALETTES[saved]) {
      this.current = saved;
    }
    this.apply(this.current, false);
  },

  apply(id, animate = true) {
    const palette = PALETTES[id];
    if (!palette) return;

    if (animate) {
      document.documentElement.classList.add('palette-transitioning');
    }

    const allVars = { ...palette.colors };
    const defaultColors = ['--color-cream', '--color-nude-light', '--color-nude', '--color-rose-light', '--color-rose', '--color-rose-dark', '--color-brown', '--color-accent', '--color-gold', '--color-success', '--color-danger', '--color-mp-bg', '--white-rgb', '--black-rgb'];

    // Remover variables que no están en esta paleta para evitar contaminación
    defaultColors.forEach((key) => {
      if (!(key in allVars)) {
        document.documentElement.style.removeProperty(key);
      }
    });

    Object.entries(allVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    this.current = id;
    localStorage.setItem('lumina_palette', id);

    if (animate) {
      setTimeout(() => {
        document.documentElement.classList.remove('palette-transitioning');
      }, 500);
    }
  },
};

// ------------------------------------------------------------------
// 22. CONFIGURACIÓN DE LA TIENDA
// ------------------------------------------------------------------
const DEFAULT_CONFIG = {
  site: {
    name: 'Lumina Nails',
    tagline: 'Brilla con Estilo Propio',
    heroText: 'Descubrí nuestra colección premium de esmaltes, geles y herramientas profesionales. Reservá tu turno y pagá de forma segura con Mercado Pago.',
    email: 'hola@luminanails.com',
    phone: '+54 11 5555-1234',
    address: 'Av. Santa Fe 1234, CABA, Argentina',
    hours: 'Lun–Vie 9:00–18:00 hs',
    footerText: 'Tienda online especializada en productos profesionales de manicura. Calidad, estilo y confianza en cada pedido.',
  },
};

const ConfigManager = {
  config: null,

  init() {
    this.load();
  },

  load() {
    try {
      const stored = localStorage.getItem('lumina_config');
      if (stored) {
        this.config = JSON.parse(stored);
      } else {
        this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (e) {
      this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    this.applyToDOM();
  },

  save() {
    try {
      localStorage.setItem('lumina_config', JSON.stringify(this.config));
    } catch (e) { /* ignore */ }
    this.applyToDOM();
  },

  reset() {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.save();
  },

  applyToDOM() {
    const s = this.config.site;
    // Título de página
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = `${s.name} | Productos Profesionales de Manicura`;
    // Meta description
    const metaEl = document.getElementById('metaDescription');
    if (metaEl) metaEl.setAttribute('content', `${s.name} – Tienda online de productos profesionales para manicura. Reservas, promociones exclusivas y pago seguro con Mercado Pago.`);
    // Elementos con data-config
    document.querySelectorAll('[data-config]').forEach((el) => {
      const key = el.getAttribute('data-config');
      if (s[key] !== undefined) {
        el.textContent = s[key];
      }
    });
    // Año del copyright
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
  },
};

// ------------------------------------------------------------------
// 23. ADMIN PANEL
// ------------------------------------------------------------------
const AdminPanel = {
  elements: {},
  isOpen: false,
  currentTab: 'general',
  editingProductId: null,

  init() {
    this.elements.toggle = document.getElementById('adminToggle');
    this.elements.panel = document.getElementById('adminPanelContent');
    this.elements.overlay = document.getElementById('adminOverlay');
    this.elements.close = document.getElementById('adminClose');
    this.elements.tabs = document.getElementById('adminTabs');
    this.elements.body = document.getElementById('adminBody');

    this.elements.toggle.addEventListener('click', () => this.open());
    this.elements.close.addEventListener('click', () => this.close());
    this.elements.overlay.addEventListener('click', () => this.close());

    this.elements.tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.admin__tab');
      if (tab) this.switchTab(tab.dataset.tab);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  },

  open() {
    this.isOpen = true;
    this.elements.panel.classList.add('is-open');
    this.elements.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.renderTab(this.currentTab);
  },

  close() {
    this.isOpen = false;
    this.elements.panel.classList.remove('is-open');
    this.elements.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    this.elements.tabs.querySelectorAll('.admin__tab').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.tab === tabId);
    });
    this.renderTab(tabId);
  },

  renderTab(tabId) {
    switch (tabId) {
      case 'general': this.renderGeneralTab(); break;
      case 'palette': this.renderPaletteTab(); break;
      case 'products': this.renderProductsTab(); break;
      case 'services': this.renderServicesTab(); break;
    }
  },

  renderGeneralTab() {
    const s = ConfigManager.config.site;
    this.elements.body.innerHTML = `
      <div class="admin__field">
        <label>Nombre del negocio</label>
        <input type="text" id="cfg_name" value="${escapeHTML(s.name)}">
      </div>
      <div class="admin__field">
        <label>Frase principal (Hero)</label>
        <input type="text" id="cfg_tagline" value="${escapeHTML(s.tagline)}">
      </div>
      <div class="admin__field">
        <label>Texto del Hero</label>
        <textarea id="cfg_heroText">${escapeHTML(s.heroText)}</textarea>
      </div>
      <div class="admin__field">
        <label>Email</label>
        <input type="text" id="cfg_email" value="${escapeHTML(s.email)}">
      </div>
      <div class="admin__field">
        <label>Teléfono</label>
        <input type="text" id="cfg_phone" value="${escapeHTML(s.phone)}">
      </div>
      <div class="admin__field">
        <label>Dirección</label>
        <input type="text" id="cfg_address" value="${escapeHTML(s.address)}">
      </div>
      <div class="admin__field">
        <label>Horarios</label>
        <input type="text" id="cfg_hours" value="${escapeHTML(s.hours)}">
      </div>
      <div class="admin__field">
        <label>Texto del Footer</label>
        <textarea id="cfg_footerText">${escapeHTML(s.footerText)}</textarea>
      </div>
      <button class="admin__save" id="adminSaveGeneral">
        <i class="fa-solid fa-floppy-disk"></i> Guardar cambios
      </button>
    `;

    document.getElementById('adminSaveGeneral').addEventListener('click', () => {
      const cfg = ConfigManager.config;
      cfg.site.name = document.getElementById('cfg_name').value.trim();
      cfg.site.tagline = document.getElementById('cfg_tagline').value.trim();
      cfg.site.heroText = document.getElementById('cfg_heroText').value.trim();
      cfg.site.email = document.getElementById('cfg_email').value.trim();
      cfg.site.phone = document.getElementById('cfg_phone').value.trim();
      cfg.site.address = document.getElementById('cfg_address').value.trim();
      cfg.site.hours = document.getElementById('cfg_hours').value.trim();
      cfg.site.footerText = document.getElementById('cfg_footerText').value.trim();
      ConfigManager.save();
      this._showToast('✅ Cambios guardados');
    });
  },

  renderPaletteTab() {
    const current = PaletteManager.current;
    this.elements.body.innerHTML = `
      <p style="font-size:0.9rem;color:var(--color-gray);margin-bottom:1.25rem;">
        Seleccioná una paleta de colores para personalizar la apariencia de la tienda.
      </p>
      <div class="admin__palettes">
        ${Object.entries(PALETTES).map(([id, p]) => `
          <div class="admin__palette-option ${id === current ? 'is-active' : ''}" data-palette-id="${id}">
            <div class="admin__palette-swatches">
              ${p.swatches.map(c => `<span class="admin__palette-swatch" style="background-color:${c}"></span>`).join('')}
            </div>
            <div class="admin__palette-info">
              <div class="admin__palette-name">${escapeHTML(p.name)}</div>
              <div class="admin__palette-desc">${escapeHTML(p.desc)}</div>
            </div>
            <i class="fa-solid fa-circle-check admin__palette-check"></i>
          </div>
        `).join('')}
      </div>
    `;

    this.elements.body.querySelectorAll('.admin__palette-option').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.paletteId;
        PaletteManager.apply(id);
        this.elements.body.querySelectorAll('.admin__palette-option').forEach((o) => o.classList.remove('is-active'));
        el.classList.add('is-active');
        this._showToast(`🎨 Paleta "${PALETTES[id].name}" aplicada`);
      });
    });
  },

  renderProductsTab() {
    this.elements.body.innerHTML = `
      <div class="admin__products-header">
        <h3>Productos (${products.length})</h3>
        <button class="admin__btn-add" id="adminAddProduct" aria-label="Agregar producto">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
      <div class="admin__product-form" id="adminProductForm">
        <div class="admin__field">
          <label>Nombre</label>
          <input type="text" id="pf_name" placeholder="Ej: Esmalte Premium">
        </div>
        <div class="admin__field">
          <label>Precio</label>
          <input type="number" id="pf_price" placeholder="1850">
        </div>
        <div class="admin__field">
          <label>Precio anterior (opcional, si está en oferta)</label>
          <input type="number" id="pf_oldPrice" placeholder="2200">
        </div>
        <div class="admin__field">
          <label>URL de imagen</label>
          <input type="text" id="pf_image" placeholder="https://images.unsplash.com/...">
        </div>
        <div class="admin__field">
          <label>Categoría</label>
          <input type="text" id="pf_category" placeholder="esmalte / kit / herramienta / tratamiento / set">
        </div>
        <div class="admin__field">
          <label>Badge (opcional)</label>
          <input type="text" id="pf_badge" placeholder="Oferta / Más vendido">
        </div>
        <div class="admin__form-actions">
          <button class="btn btn--primary" id="pf_save">Guardar</button>
          <button class="btn btn--outline" id="pf_cancel">Cancelar</button>
        </div>
      </div>
      <div id="adminProductsList">
        ${products.map((p) => `
          <div class="admin__product-item" data-id="${p.id}">
            <img src="${escapeHTML(p.image)}" alt="" class="admin__product-img" loading="lazy">
            <div class="admin__product-info">
              <div class="admin__product-name">${escapeHTML(p.name)}</div>
              <div class="admin__product-meta">$${formatPrice(p.price)} ${p.oldPrice ? '(en oferta)' : ''} · ${escapeHTML(p.category)}</div>
            </div>
            <div class="admin__product-actions">
              <button class="admin__product-btn" data-action="edit-product" data-id="${p.id}" aria-label="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="admin__product-btn admin__product-btn--delete" data-action="delete-product" data-id="${p.id}" aria-label="Eliminar">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add product button
    document.getElementById('adminAddProduct').addEventListener('click', () => {
      this.editingProductId = null;
      document.getElementById('adminProductForm').classList.add('is-open');
      document.getElementById('pf_name').value = '';
      document.getElementById('pf_price').value = '';
      document.getElementById('pf_oldPrice').value = '';
      document.getElementById('pf_image').value = '';
      document.getElementById('pf_category').value = '';
      document.getElementById('pf_badge').value = '';
    });

    // Save product
    document.getElementById('pf_save').addEventListener('click', () => {
      const name = document.getElementById('pf_name').value.trim();
      const price = parseInt(document.getElementById('pf_price').value, 10);
      const oldPrice = document.getElementById('pf_oldPrice').value ? parseInt(document.getElementById('pf_oldPrice').value, 10) : null;
      const image = document.getElementById('pf_image').value.trim();
      const category = document.getElementById('pf_category').value.trim();
      const badge = document.getElementById('pf_badge').value.trim() || null;

      if (!name || !price || !image) {
        this._showToast('⚠️ Completá nombre, precio e imagen');
        return;
      }

      const product = { name, price, oldPrice, image, category, badge };

      if (this.editingProductId) {
        const idx = products.findIndex((p) => p.id === this.editingProductId);
        if (idx !== -1) {
          products[idx] = { ...products[idx], ...product };
        }
        saveProductsToStorage();
        this._showToast('✅ Producto actualizado');
      } else {
        product.id = Date.now();
        products.push(product);
        saveProductsToStorage();
        this._showToast('✅ Producto agregado');
      }

      document.getElementById('adminProductForm').classList.remove('is-open');
      this.editingProductId = null;
      renderProducts();
      this.renderProductsTab();
    });

    // Cancel product form
    document.getElementById('pf_cancel').addEventListener('click', () => {
      document.getElementById('adminProductForm').classList.remove('is-open');
      this.editingProductId = null;
    });

    // Edit/delete buttons
    document.getElementById('adminProductsList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = parseInt(btn.dataset.id, 10);
      const action = btn.dataset.action;

      if (action === 'edit-product') {
        const p = products.find((prod) => prod.id === id);
        if (!p) return;
        this.editingProductId = id;
        const form = document.getElementById('adminProductForm');
        form.classList.add('is-open');
        document.getElementById('pf_name').value = p.name;
        document.getElementById('pf_price').value = p.price;
        document.getElementById('pf_oldPrice').value = p.oldPrice || '';
        document.getElementById('pf_image').value = p.image;
        document.getElementById('pf_category').value = p.category;
        document.getElementById('pf_badge').value = p.badge || '';
      }

      if (action === 'delete-product') {
        if (!confirm('¿Eliminar este producto?')) return;
        const idx = products.findIndex((p) => p.id === id);
        if (idx !== -1) {
          products.splice(idx, 1);
          saveProductsToStorage();
          renderProducts();
          this.renderProductsTab();
          this._showToast('🗑️ Producto eliminado');
        }
      }
    });
  },

  renderServicesTab() {
    const services = [
      { name: 'Manicure Clásica Premium', price: 1500, total: 4500, duration: '45 min' },
      { name: 'Esmaltado Semi-Permanente', price: 2000, total: 5800, duration: '60 min' },
      { name: 'Uñas Esculpidas en Gel', price: 3500, total: 9800, duration: '90 min' },
      { name: 'Nail Art + Decoración', price: 2800, total: 7500, duration: '75 min' },
    ];

    this.elements.body.innerHTML = `
      <p style="font-size:0.9rem;color:var(--color-gray);margin-bottom:1.25rem;">
        Servicios disponibles para reserva con seña online. Editá sus valores desde el HTML por ahora.
      </p>
      ${services.map((s) => `
        <div class="admin__service-item">
          <div class="admin__service-header">
            <span class="admin__service-name">${escapeHTML(s.name)}</span>
          </div>
          <div class="admin__service-meta">
            <span><i class="fa-solid fa-tag"></i> Seña: $${formatPrice(s.price)}</span>
            <span><i class="fa-solid fa-coins"></i> Total: $${formatPrice(s.total)}</span>
            <span><i class="fa-regular fa-clock"></i> ${s.duration}</span>
          </div>
        </div>
      `).join('')}
      <p style="font-size:0.82rem;color:var(--color-gray);margin-top:1rem;text-align:center;">
        <i class="fa-solid fa-code"></i> Para editar servicios, modificá el archivo <code>index.html</code>
      </p>
    `;
  },

  _showToast(msg) {
    let t = document.querySelector('.admin__toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'admin__toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove('is-visible');
    void t.offsetWidth;
    t.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2500);
  },
};

// ------------------------------------------------------------------
// 24. INICIALIZACIÓN
// ------------------------------------------------------------------
function init() {
  MercadoPago.init();
  PaymentModal.init();

  // Config + paletas
  PaletteManager.init();
  ConfigManager.init();

  loadCart();
  loadProductsFromStorage();

  AdminPanel.init();
  renderProducts();
  updateCartUI();

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

  console.log(`[Lumina Nails] Tienda inicializada.`);
  console.log(`[Lumina Nails] Mercado Pago: modo simulación (conectar backend para producción).`);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}