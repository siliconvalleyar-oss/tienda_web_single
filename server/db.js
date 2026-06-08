const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'store.db');
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      oldPrice INTEGER,
      image TEXT NOT NULL,
      category TEXT DEFAULT '',
      badge TEXT
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL,
      total INTEGER NOT NULL,
      duration TEXT DEFAULT '60 min',
      image TEXT DEFAULT '',
      badge TEXT,
      features TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      mp_preference_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return db;
}

function seedDB() {
  const db = getDB();
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (count.c > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (name, price, oldPrice, image, category, badge)
    VALUES (@name, @price, @oldPrice, @image, @category, @badge)
  `);

  const products = [
    { name: 'Esmalte Semi-Permanente Nude Dreams', price: 1850, oldPrice: 2200, image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80', category: 'esmalte', badge: null },
    { name: 'Kit Completo de Uñas de Gel', price: 4200, oldPrice: null, image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&q=80', category: 'kit', badge: 'Más vendido' },
    { name: 'Lámpara LED UV 48W Profesional', price: 5600, oldPrice: 7200, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80', category: 'herramienta', badge: 'Oferta' },
    { name: 'Base Coat Fortalecedora con Calcio', price: 1350, oldPrice: null, image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836a?w=500&q=80', category: 'tratamiento', badge: null },
    { name: 'Top Coat Brillo Extremo Efecto Gel', price: 1580, oldPrice: 1900, image: 'https://images.unsplash.com/photo-1619393999197-9c0ea9a7b21c?w=500&q=80', category: 'esmalte', badge: null },
    { name: 'Set de 12 Esmaltes Pastel Collection', price: 6400, oldPrice: 8900, image: 'https://images.unsplash.com/photo-1485965373059-f07657e9f841?w=500&q=80', category: 'set', badge: 'Oferta' },
    { name: 'Removedor de Cutículas Profesional', price: 980, oldPrice: null, image: 'https://images.unsplash.com/photo-1610992015732-2449bc5ccd51?w=500&q=80', category: 'tratamiento', badge: null },
    { name: 'Lima Eléctrica Recargable 5 Velocidades', price: 3200, oldPrice: 4100, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80', category: 'herramienta', badge: null },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) insertProduct.run(item);
  });

  insertMany(products);

  // Default services
  const insertService = db.prepare(`
    INSERT INTO services (name, description, price, total, duration, image, badge, features)
    VALUES (@name, @description, @price, @total, @duration, @image, @badge, @features)
  `);

  const services = [
    { name: 'Manicure Clásica Premium', description: 'Limpieza, cutículas, limado, esmaltado tradicional y masaje relajante.', price: 1500, total: 4500, duration: '45 min', image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=500&q=80', badge: 'Más elegido', features: JSON.stringify(['45 min', 'Hidratación profunda']) },
    { name: 'Esmaltado Semi-Permanente', description: 'Aplicación de base, color semipermanente y top coat con lámpara LED. Dura hasta 21 días.', price: 2000, total: 5800, duration: '60 min', image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&q=80', badge: null, features: JSON.stringify(['60 min', '40 colores a elección']) },
    { name: 'Uñas Esculpidas en Gel', description: 'Extensión con tips o molde, construcción en gel y diseño personalizado a elección.', price: 3500, total: 9800, duration: '90 min', image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&q=80', badge: 'Premium', features: JSON.stringify(['90 min', 'Diseño incluido']) },
    { name: 'Nail Art + Decoración', description: 'Diseño artístico personalizado con cristales, foil, glitter y técnicas avanzadas.', price: 2800, total: 7500, duration: '75 min', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80', badge: null, features: JSON.stringify(['75 min', 'Materiales premium']) },
  ];

  const insertServices = db.transaction((items) => {
    for (const item of items) insertService.run(item);
  });
  insertServices(services);

  // Default config
  const setConfig = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
  const defaultConfig = {
    siteName: 'Lumina Nails',
    tagline: 'Brilla con Estilo Propio',
    heroText: 'Descubrí nuestra colección premium de esmaltes, geles y herramientas profesionales. Reservá tu turno y pagá de forma segura con Mercado Pago.',
    email: 'hola@luminanails.com',
    phone: '+54 11 5555-1234',
    address: 'Av. Santa Fe 1234, CABA, Argentina',
    hours: 'Lun–Vie 9:00–18:00 hs',
    footerText: 'Tienda online especializada en productos profesionales de manicura. Calidad, estilo y confianza en cada pedido.',
  };

  const insertConfig = db.transaction((cfg) => {
    for (const [k, v] of Object.entries(cfg)) setConfig.run(k, v);
  });
  insertConfig(defaultConfig);
}

module.exports = { getDB, initDB, seedDB };
