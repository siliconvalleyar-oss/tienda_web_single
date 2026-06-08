const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

// Products CRUD
router.get('/products', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM products ORDER BY id').all());
});

router.post('/products', (req, res) => {
  const db = getDB();
  const { name, price, oldPrice, image, category, badge } = req.body;
  if (!name || !price || !image) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  const result = db.prepare(
    'INSERT INTO products (name, price, oldPrice, image, category, badge) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, price, oldPrice || null, image, category || '', badge || null);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

router.put('/products/:id', (req, res) => {
  const db = getDB();
  const { name, price, oldPrice, image, category, badge } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  db.prepare(
    'UPDATE products SET name=?, price=?, oldPrice=?, image=?, category=?, badge=? WHERE id=?'
  ).run(name, price, oldPrice || null, image, category || '', badge || null, req.params.id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

router.delete('/products/:id', (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Site config
router.get('/config', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM config').all();
  const config = {};
  for (const row of rows) config[row.key] = row.value;
  res.json(config);
});

router.put('/config', (req, res) => {
  const db = getDB();
  const setConfig = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
  const update = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) setConfig.run(k, String(v));
  });
  update(req.body);
  const rows = db.prepare('SELECT * FROM config').all();
  const config = {};
  for (const row of rows) config[row.key] = row.value;
  res.json(config);
});

// Services CRUD
router.get('/services', (req, res) => {
  const db = getDB();
  const services = db.prepare('SELECT * FROM services ORDER BY id').all();
  res.json(services.map(s => ({ ...s, features: JSON.parse(s.features || '[]') })));
});

router.post('/services', (req, res) => {
  const db = getDB();
  const { name, description, price, total, duration, image, badge, features } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Faltan campos requeridos' });
  const result = db.prepare(
    'INSERT INTO services (name, description, price, total, duration, image, badge, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, description || '', price, total || price, duration || '60 min', image || '', badge || null, JSON.stringify(features || []));
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
  service.features = JSON.parse(service.features || '[]');
  res.status(201).json(service);
});

router.put('/services/:id', (req, res) => {
  const db = getDB();
  const { name, description, price, total, duration, image, badge, features } = req.body;
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  db.prepare(
    'UPDATE services SET name=?, description=?, price=?, total=?, duration=?, image=?, badge=?, features=? WHERE id=?'
  ).run(name, description || '', price, total || price, duration || '60 min', image || '', badge || null, JSON.stringify(features || []), req.params.id);
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  service.features = JSON.parse(service.features || '[]');
  res.json(service);
});

router.delete('/services/:id', (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Orders
router.get('/orders', (req, res) => {
  const db = getDB();
  res.json(db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all());
});

module.exports = router;
