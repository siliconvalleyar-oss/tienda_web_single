export const CONFIG = {
  mercadoPago: {
    publicKey: 'TEST-00000000-0000-0000-0000-000000000000',
    backendEndpoint: '/api/mercadopago/create-preference',
  },
  store: {
    name: 'Lumina Nails',
    currency: 'ARS',
  },
};

export const PALETTES = {
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

export function formatPrice(price) {
  return price.toLocaleString('es-AR');
}

export function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
