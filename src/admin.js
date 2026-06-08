import { PALETTES, escapeHTML, formatPrice } from './config.js';
import { showToast } from './ui.js';
import { getProducts, updateLocalProducts, renderProducts, saveProducts } from './products.js';

const PaletteManager = {
  current: 'nude-rose',

  init() {
    const saved = localStorage.getItem('lumina_palette');
    if (saved && PALETTES[saved]) this.current = saved;
    this.apply(this.current, false);
  },

  apply(id, animate = true) {
    const palette = PALETTES[id];
    if (!palette) return;
    if (animate) document.documentElement.classList.add('palette-transitioning');

    const allVars = { ...palette.colors };
    const defaultColors = ['--color-cream', '--color-nude-light', '--color-nude', '--color-rose-light', '--color-rose', '--color-rose-dark', '--color-brown', '--color-accent', '--color-gold', '--color-success', '--color-danger', '--color-mp-bg', '--white-rgb', '--black-rgb'];
    defaultColors.forEach((key) => { if (!(key in allVars)) document.documentElement.style.removeProperty(key); });
    Object.entries(allVars).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));

    this.current = id;
    localStorage.setItem('lumina_palette', id);
    if (animate) setTimeout(() => document.documentElement.classList.remove('palette-transitioning'), 500);
  },
};

const ConfigManager = {
  config: {
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
  },

  async init() {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        this.config.site = {
          name: data.siteName || 'Lumina Nails',
          tagline: data.tagline || 'Brilla con Estilo Propio',
          heroText: data.heroText || '',
          email: data.email || 'hola@luminanails.com',
          phone: data.phone || '+54 11 5555-1234',
          address: data.address || 'Av. Santa Fe 1234',
          hours: data.hours || 'Lun–Vie 9:00–18:00',
          footerText: data.footerText || '',
        };
        this.applyToDOM();
        return;
      }
    } catch (e) { /* fallback */ }

    try {
      const stored = localStorage.getItem('lumina_config');
      if (stored) this.config = JSON.parse(stored);
    } catch (e) { /* ignore */ }
    this.applyToDOM();
  },

  async save() {
    try {
      await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: this.config.site.name,
          tagline: this.config.site.tagline,
          heroText: this.config.site.heroText,
          email: this.config.site.email,
          phone: this.config.site.phone,
          address: this.config.site.address,
          hours: this.config.site.hours,
          footerText: this.config.site.footerText,
        }),
      });
    } catch (e) { /* fallback */ }

    try {
      localStorage.setItem('lumina_config', JSON.stringify(this.config));
    } catch (e) { /* ignore */ }
    this.applyToDOM();
  },

  applyToDOM() {
    const s = this.config.site;
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = `${s.name} | Productos Profesionales de Manicura`;
    const metaEl = document.getElementById('metaDescription');
    if (metaEl) metaEl.setAttribute('content', `${s.name} – Tienda online de productos profesionales para manicura.`);
    document.querySelectorAll('[data-config]').forEach((el) => {
      const key = el.getAttribute('data-config');
      if (s[key] !== undefined) el.textContent = s[key];
    });
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
  },
};

const AdminPanel = {
  elements: {},
  isOpen: false,
  currentTab: 'general',
  editingProductId: null,
  _toastTimer: null,

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
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });
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
    this.elements.tabs.querySelectorAll('.admin__tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tabId));
    this.renderTab(tabId);
  },

  renderTab(tabId) {
    if (tabId === 'general') this.renderGeneralTab();
    else if (tabId === 'palette') this.renderPaletteTab();
    else if (tabId === 'products') this.renderProductsTab();
    else if (tabId === 'services') this.renderServicesTab();
  },

  renderGeneralTab() {
    const s = ConfigManager.config.site;
    this.elements.body.innerHTML = `
      <div class="admin__field"><label>Nombre del negocio</label><input type="text" id="cfg_name" value="${escapeHTML(s.name)}"></div>
      <div class="admin__field"><label>Frase principal (Hero)</label><input type="text" id="cfg_tagline" value="${escapeHTML(s.tagline)}"></div>
      <div class="admin__field"><label>Texto del Hero</label><textarea id="cfg_heroText">${escapeHTML(s.heroText)}</textarea></div>
      <div class="admin__field"><label>Email</label><input type="text" id="cfg_email" value="${escapeHTML(s.email)}"></div>
      <div class="admin__field"><label>Teléfono</label><input type="text" id="cfg_phone" value="${escapeHTML(s.phone)}"></div>
      <div class="admin__field"><label>Dirección</label><input type="text" id="cfg_address" value="${escapeHTML(s.address)}"></div>
      <div class="admin__field"><label>Horarios</label><input type="text" id="cfg_hours" value="${escapeHTML(s.hours)}"></div>
      <div class="admin__field"><label>Texto del Footer</label><textarea id="cfg_footerText">${escapeHTML(s.footerText)}</textarea></div>
      <button class="admin__save" id="adminSaveGeneral"><i class="fa-solid fa-floppy-disk"></i> Guardar cambios</button>
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
      <p style="font-size:0.9rem;color:var(--color-gray);margin-bottom:1.25rem;">Seleccioná una paleta de colores para personalizar la apariencia de la tienda.</p>
      <div class="admin__palettes">
        ${Object.entries(PALETTES).map(([id, p]) => `
          <div class="admin__palette-option ${id === current ? 'is-active' : ''}" data-palette-id="${id}">
            <div class="admin__palette-swatches">${p.swatches.map(c => `<span class="admin__palette-swatch" style="background-color:${c}"></span>`).join('')}</div>
            <div class="admin__palette-info">
              <div class="admin__palette-name">${escapeHTML(p.name)}</div>
              <div class="admin__palette-desc">${escapeHTML(p.desc)}</div>
            </div>
            <i class="fa-solid fa-circle-check admin__palette-check"></i>
          </div>`).join('')}
      </div>`;
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
    const prods = getProducts();
    this.elements.body.innerHTML = `
      <div class="admin__products-header">
        <h3>Productos (${prods.length})</h3>
        <button class="admin__btn-add" id="adminAddProduct" aria-label="Agregar producto"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="admin__product-form" id="adminProductForm">
        <div class="admin__field"><label>Nombre</label><input type="text" id="pf_name" placeholder="Ej: Esmalte Premium"></div>
        <div class="admin__field"><label>Precio</label><input type="number" id="pf_price" placeholder="1850"></div>
        <div class="admin__field"><label>Precio anterior (opcional)</label><input type="number" id="pf_oldPrice" placeholder="2200"></div>
        <div class="admin__field"><label>URL de imagen</label><input type="text" id="pf_image" placeholder="https://images.unsplash.com/..."></div>
        <div class="admin__field"><label>Categoría</label><input type="text" id="pf_category" placeholder="esmalte / kit / herramienta"></div>
        <div class="admin__field"><label>Badge (opcional)</label><input type="text" id="pf_badge" placeholder="Oferta / Más vendido"></div>
        <div class="admin__form-actions">
          <button class="btn btn--primary" id="pf_save">Guardar</button>
          <button class="btn btn--outline" id="pf_cancel">Cancelar</button>
        </div>
      </div>
      <div id="adminProductsList">
        ${prods.map((p) => `
          <div class="admin__product-item" data-id="${p.id}">
            <img src="${escapeHTML(p.image)}" alt="" class="admin__product-img" loading="lazy">
            <div class="admin__product-info">
              <div class="admin__product-name">${escapeHTML(p.name)}</div>
              <div class="admin__product-meta">$${formatPrice(p.price)} ${p.oldPrice ? '(en oferta)' : ''} · ${escapeHTML(p.category)}</div>
            </div>
            <div class="admin__product-actions">
              <button class="admin__product-btn" data-action="edit-product" data-id="${p.id}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="admin__product-btn admin__product-btn--delete" data-action="delete-product" data-id="${p.id}" aria-label="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>`).join('')}
      </div>`;

    document.getElementById('adminAddProduct').addEventListener('click', () => {
      this.editingProductId = null;
      document.getElementById('adminProductForm').classList.add('is-open');
      ['pf_name', 'pf_price', 'pf_oldPrice', 'pf_image', 'pf_category', 'pf_badge'].forEach(id => document.getElementById(id).value = '');
    });

    document.getElementById('pf_save').addEventListener('click', () => this._saveProduct());
    document.getElementById('pf_cancel').addEventListener('click', () => {
      document.getElementById('adminProductForm').classList.remove('is-open');
      this.editingProductId = null;
    });

    document.getElementById('adminProductsList').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = parseInt(btn.dataset.id, 10);
      const prods = getProducts();

      if (btn.dataset.action === 'edit-product') {
        const p = prods.find((prod) => prod.id === id);
        if (!p) return;
        this.editingProductId = id;
        document.getElementById('adminProductForm').classList.add('is-open');
        document.getElementById('pf_name').value = p.name;
        document.getElementById('pf_price').value = p.price;
        document.getElementById('pf_oldPrice').value = p.oldPrice || '';
        document.getElementById('pf_image').value = p.image;
        document.getElementById('pf_category').value = p.category;
        document.getElementById('pf_badge').value = p.badge || '';
      }

      if (btn.dataset.action === 'delete-product') {
        if (!confirm('¿Eliminar este producto?')) return;
        const idx = prods.findIndex((p) => p.id === id);
        if (idx !== -1) {
          prods.splice(idx, 1);
          updateLocalProducts(prods);
          this._saveProductsToAPI(prods);
          renderProducts();
          this.renderProductsTab();
          this._showToast('🗑️ Producto eliminado');
        }
      }
    });
  },

  async _saveProduct() {
    const name = document.getElementById('pf_name').value.trim();
    const price = parseInt(document.getElementById('pf_price').value, 10);
    const oldPrice = document.getElementById('pf_oldPrice').value ? parseInt(document.getElementById('pf_oldPrice').value, 10) : null;
    const image = document.getElementById('pf_image').value.trim();
    const category = document.getElementById('pf_category').value.trim();
    const badge = document.getElementById('pf_badge').value.trim() || null;
    if (!name || !price || !image) { this._showToast('⚠️ Completá nombre, precio e imagen'); return; }

    const prods = getProducts();
    if (this.editingProductId) {
      const idx = prods.findIndex((p) => p.id === this.editingProductId);
      if (idx !== -1) {
        prods[idx] = { ...prods[idx], name, price, oldPrice, image, category, badge };
        try { await fetch(`/api/admin/products/${this.editingProductId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prods[idx]) }); } catch (e) { /* ignore */ }
      }
      this._showToast('✅ Producto actualizado');
    } else {
      const newProduct = { id: Date.now(), name, price, oldPrice, image, category, badge };
      prods.push(newProduct);
      try { await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) }); } catch (e) { /* ignore */ }
      this._showToast('✅ Producto agregado');
    }

    updateLocalProducts(prods);
    document.getElementById('adminProductForm').classList.remove('is-open');
    this.editingProductId = null;
    renderProducts();
    this.renderProductsTab();
  },

  async _saveProductsToAPI(prods) {
    // For delete operations, sync with API
    for (const p of prods) {
      try {
        if (p.id > 100000) { // Local-only ID, create on server
          await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
        }
      } catch (e) { /* ignore */ }
    }
  },

  renderServicesTab() {
    const services = [
      { name: 'Manicure Clásica Premium', price: 1500, total: 4500, duration: '45 min' },
      { name: 'Esmaltado Semi-Permanente', price: 2000, total: 5800, duration: '60 min' },
      { name: 'Uñas Esculpidas en Gel', price: 3500, total: 9800, duration: '90 min' },
      { name: 'Nail Art + Decoración', price: 2800, total: 7500, duration: '75 min' },
    ];
    this.elements.body.innerHTML = `
      <p style="font-size:0.9rem;color:var(--color-gray);margin-bottom:1.25rem;">Servicios disponibles para reserva con seña online. Editá sus valores desde el HTML por ahora.</p>
      ${services.map((s) => `
        <div class="admin__service-item">
          <div class="admin__service-header"><span class="admin__service-name">${escapeHTML(s.name)}</span></div>
          <div class="admin__service-meta">
            <span><i class="fa-solid fa-tag"></i> Seña: $${formatPrice(s.price)}</span>
            <span><i class="fa-solid fa-coins"></i> Total: $${formatPrice(s.total)}</span>
            <span><i class="fa-regular fa-clock"></i> ${s.duration}</span>
          </div>
        </div>`).join('')}
      <p style="font-size:0.82rem;color:var(--color-gray);margin-top:1rem;text-align:center;"><i class="fa-solid fa-code"></i> Para editar servicios, modificá el archivo <code>index.html</code></p>`;
  },

  _showToast(msg) {
    let t = document.querySelector('.admin__toast');
    if (!t) { t = document.createElement('div'); t.className = 'admin__toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.remove('is-visible');
    void t.offsetWidth;
    t.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2500);
  },
};

export { PaletteManager, ConfigManager, AdminPanel };
