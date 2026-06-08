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
// 21. INICIALIZACIÓN
// ------------------------------------------------------------------
function init() {
  MercadoPago.init();
  PaymentModal.init();

  loadCart();
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