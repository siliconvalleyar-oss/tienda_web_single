const { Router } = require('express');
const { getDB } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const db = getDB();
  const services = db.prepare('SELECT * FROM services ORDER BY id').all();
  res.json(services.map(s => ({ ...s, features: JSON.parse(s.features || '[]') })));
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
  service.features = JSON.parse(service.features || '[]');
  res.json(service);
});

module.exports = router;
