const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, seedDB } = require('./db');
const productsRouter = require('./routes/products');
const servicesRouter = require('./routes/services');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

app.use('/api/products', productsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/admin', adminRouter);

app.post('/api/mercadopago/create-preference', (req, res) => {
  const { title, total, type, metadata } = req.body;
  const preferenceId = `PREF-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  res.json({
    success: true,
    preferenceId,
    paymentLink: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

initDB();
seedDB();

app.listen(PORT, () => {
  console.log(`[Lumina Nails] Servidor corriendo en http://localhost:${PORT}`);
});
