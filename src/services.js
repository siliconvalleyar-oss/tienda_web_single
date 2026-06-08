import { escapeHTML, formatPrice } from './config.js';

let services = [];

export function getServices() {
  return services;
}

export async function loadServices() {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      services = await res.json();
      return;
    }
  } catch (e) { /* fallback */ }

  try {
    const stored = localStorage.getItem('lumina_services');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        services = parsed;
        return;
      }
    }
  } catch (e) { /* ignore */ }
}

export function updateLocalServices(newServices) {
  services = newServices;
  try {
    localStorage.setItem('lumina_services', JSON.stringify(services));
  } catch (e) { /* ignore */ }
}

function createServiceCard(s) {
  const feats = Array.isArray(s.features) ? s.features : [];
  return `
    <article class="service-card reveal">
      <div class="service-card__img-wrap">
        <img src="${escapeHTML(s.image)}" alt="${escapeHTML(s.name)}" class="service-card__img" loading="lazy">
        ${s.badge ? `<span class="service-card__badge ${s.badge === 'Premium' ? 'service-card__badge--accent' : ''}">${escapeHTML(s.badge)}</span>` : ''}
      </div>
      <div class="service-card__body">
        <h3 class="service-card__name">${escapeHTML(s.name)}</h3>
        <p class="service-card__desc">${escapeHTML(s.description)}</p>
        <ul class="service-card__features">
          ${feats.map(f => `<li><i class="${f.includes('min') ? 'fa-regular fa-clock' : 'fa-solid fa-check'}"></i> ${escapeHTML(f)}</li>`).join('')}
        </ul>
        <div class="service-card__price">
          <span class="service-card__price-label">Seña online</span>
          <span class="service-card__price-value">$${formatPrice(s.price)}</span>
        </div>
        <p class="service-card__price-total">Total del servicio: $${formatPrice(s.total)}</p>
        <button class="btn btn--primary btn--block service-card__btn"
          data-action="reserve"
          data-service-id="svc_${s.id}"
          data-service-name="${escapeHTML(s.name)}"
          data-service-price="${s.price}"
          data-service-total="${s.total}"
          data-service-duration="${escapeHTML(s.duration)}">
          <i class="fa-solid fa-calendar-plus"></i> Reservar con Seña
        </button>
      </div>
    </article>`;
}

export function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  if (services.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--color-gray);padding:2rem;">No hay servicios disponibles.</p>';
    return;
  }
  grid.innerHTML = services.map(createServiceCard).join('');
}
