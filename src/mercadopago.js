import { CONFIG } from './config.js';
import { getCartCount, getCartTotal, getCartItems, clearCart } from './cart.js';
import { showToast } from './ui.js';

const MercadoPago = {
  async crearPago(paymentData) {
    console.log('[MP] Creando preferencia de pago...', paymentData);
    try {
      const res = await fetch(CONFIG.mercadoPago.backendEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (res.ok) return await res.json();
    } catch (e) { /* fallback a simulación */ }

    await new Promise((r) => setTimeout(r, 800));
    const preferenceId = `PREF-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return {
      success: true,
      preferenceId,
      paymentLink: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
    };
  },
};

const PaymentModal = {
  elements: {},
  _currentData: null,

  init() {
    this.elements.modal = document.getElementById('paymentModal');
    this.elements.overlay = document.getElementById('paymentModalOverlay');
    this.elements.close = document.getElementById('paymentModalClose');
    this.elements.body = document.getElementById('paymentModalBody');

    this.elements.close.addEventListener('click', () => this.cerrar());
    this.elements.overlay.addEventListener('click', () => this.cerrar());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.modal.classList.contains('is-open')) {
        this.cerrar();
      }
    });
  },

  abrir(data) {
    this._currentData = data;
    this._render(data);
    this.elements.modal.classList.add('is-open');
    this.elements.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  cerrar() {
    this.elements.modal.classList.remove('is-open');
    this.elements.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this._currentData = null;
  },

  _render(data) {
    const { type, title, items, total, metadata } = data;

    let itemsHTML = '';
    if (Array.isArray(items)) {
      itemsHTML = items
        .map(
          (item) => `
        <div class="payment-modal__detail-row">
          <span>${item.name} x${item.quantity || 1}</span>
          <span>$${(item.price * (item.quantity || 1)).toLocaleString('es-AR')}</span>
        </div>`
        )
        .join('');
    }

    const typeLabel =
      type === 'cart' ? 'Pedido de productos'
        : type === 'reserve' ? 'Seña de reserva'
        : type === 'promo' ? 'Promoción'
        : 'Compra';

    this.elements.body.innerHTML = `
      <h2 class="payment-modal__title">Confirmar ${typeLabel}</h2>
      <div class="payment-modal__detail">
        <div class="payment-modal__detail-row">
          <span>Concepto</span>
          <span>${title}</span>
        </div>
        ${itemsHTML}
        <div class="payment-modal__detail-row payment-modal__detail-row--total">
          <span>Total a pagar</span>
          <strong>$${total.toLocaleString('es-AR')}</strong>
        </div>
      </div>
      ${type === 'reserve' && metadata?.totalService ? `
        <div class="payment-modal__info">
          <p><i class="fa-solid fa-circle-info"></i> Abonás la seña ahora. Saldo restante en local: <strong>$${(metadata.totalService - total).toLocaleString('es-AR')}</strong></p>
        </div>` : ''}
      <div class="payment-modal__mp-badge">
        <i class="fa-solid fa-lock"></i>
        <span>Pago seguro procesado por <strong>Mercado Pago</strong></span>
      </div>
      <div class="payment-modal__actions">
        <button class="btn btn--mp btn--block" id="btnMercadoPago">
          <i class="fa-solid fa-credit-card"></i> Pagar con Mercado Pago
        </button>
        <button class="btn btn--outline btn--block" id="btnCancelPayment">Cancelar</button>
      </div>
      <p class="payment-modal__note">Hasta 12 cuotas sin interés · Débito · Crédito · Efectivo</p>
    `;

    document.getElementById('btnMercadoPago').addEventListener('click', () => this._procesarPago(data));
    document.getElementById('btnCancelPayment').addEventListener('click', () => this.cerrar());
  },

  async _procesarPago(data) {
    const btn = document.getElementById('btnMercadoPago');
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
        showToast('🔗 Redirigiendo a Mercado Pago...', 4000);
        setTimeout(() => {
          showToast(`✅ Pago simulado exitoso. Preference: ${result.preferenceId?.slice(0, 16)}...`, 5000);
          if (data.type === 'cart') clearCart();
        }, 1500);
      } else {
        showToast('❌ Error al procesar el pago.');
      }
    } catch (err) {
      console.error('[MP] Error:', err);
      showToast('❌ Error de conexión.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-credit-card"></i> Pagar con Mercado Pago';
    }
  },
};

export function setupCartCheckout() {
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (getCartCount() === 0) {
      showToast('Tu carrito está vacío');
      return;
    }
    PaymentModal.abrir({
      type: 'cart',
      title: 'Compra de productos',
      items: getCartItems().map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
      total: getCartTotal(),
      metadata: { cartItems: getCartItems().length },
    });
  });

  document.getElementById('clearCartBtn').addEventListener('click', () => {
    if (getCartCount() === 0) return;
    if (confirm('¿Querés vaciar el carrito?')) clearCart();
  });
}

export function setupReservations() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest("[data-action='reserve']");
    if (!btn) return;
    PaymentModal.abrir({
      type: 'reserve',
      title: btn.dataset.serviceName,
      items: [{ name: `Seña online – ${btn.dataset.serviceName}`, price: parseInt(btn.dataset.servicePrice), quantity: 1 }],
      total: parseInt(btn.dataset.servicePrice),
      metadata: { serviceId: btn.dataset.serviceId, totalService: parseInt(btn.dataset.serviceTotal), duration: btn.dataset.serviceDuration },
    });
  });
}

export function setupPromoCheckout() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest("[data-action='promo-checkout']");
    if (!btn) return;
    PaymentModal.abrir({
      type: 'promo',
      title: btn.dataset.promoName,
      items: [{ name: btn.dataset.promoName, price: parseInt(btn.dataset.promoPrice), quantity: 1 }],
      total: parseInt(btn.dataset.promoPrice),
      metadata: { promoId: btn.dataset.promoId },
    });
  });
}

export { PaymentModal };
