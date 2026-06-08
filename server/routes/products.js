const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDB();
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  res.json(products);
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

module.exports = router;
