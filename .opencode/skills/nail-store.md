# Lumina Nails – Tienda Web Skill

## Descripción del Proyecto

Lumina Nails es una **Single Page Application (SPA)** de tienda online para manicura profesional. Construida con **HTML, CSS y JavaScript vanilla** (ES modules). Incluye panel de administración visual, sistema de paletas de color, carrito de compras, integración simulada con **Mercado Pago**, y servidor backend con **Express + SQLite**.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JS (ES modules) |
| Backend  | Node.js + Express |
| DB       | SQLite (better-sqlite3) |
| Iconos   | Font Awesome 6 |
| Fuentes  | Google Fonts (Montserrat + Playfair Display) |
| Pagos    | Mercado Pago SDK v2 (simulado, listo para producción) |
| Imágenes | Unsplash (URLs externas) |

## Estructura del Proyecto

```
nail-store/
├── index.html              # Página principal
├── styles.css               # Todos los estilos
├── package.json             # Dependencias del servidor
├── .gitignore
├── opencode.json
├── .opencode/skills/
│   └── nail-store.md
├── src/                     # Módulos JS frontend
│   ├── app.js               # Entry point, init()
│   ├── config.js            # CONFIG, PALETTES, formatPrice, escapeHTML
│   ├── products.js          # Productos (fetch API + fallback localStorage)
│   ├── cart.js              # Carrito, UI, sidebar
│   ├── mercadopago.js       # PaymentModal, checkout, reservas, promos
│   ├── admin.js             # AdminPanel, PaletteManager, ConfigManager
│   └── ui.js                # Toast, scroll reveal, menú móvil, utilidades
├── server/                  # Backend Express
│   ├── index.js             # Servidor Express
│   ├── db.js                # SQLite (init + seed)
│   ├── store.db             # Base de datos SQLite (auto-generada)
│   └── routes/
│       ├── products.js      # GET /api/products
│       └── admin.js         # CRUD productos + config + orders
└── script.js                # (legacy, ya no se usa)
```

## Cómo ejecutar

```bash
npm install        # Instalar dependencias
npm start          # Iniciar servidor en http://localhost:3000
npm run seed       # Resetear datos a valores iniciales
```

## Arquitectura

### Frontend (src/)
Módulos ES6 con imports/exports:

| Módulo | Responsabilidad |
|--------|----------------|
| `config.js` | Constantes: CONFIG (MP keys), PALETTES (6 paletas), utilidades |
| `products.js` | Fetch productos desde API, render, CRUD, fallback localStorage |
| `cart.js` | Estado del carrito, UI, sidebar, persistencia localStorage |
| `mercadopago.js` | PaymentModal, integración MP, checkout carrito/reserva/promo |
| `admin.js` | AdminPanel (tabs), PaletteManager, ConfigManager |
| `ui.js` | Toast, scroll reveal, menú móvil, header scroll, nav active, newsletter |
| `app.js` | Importa todo, event delegation, init() |

### Backend (server/)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/products` | GET | Listar productos |
| `/api/products/:id` | GET | Producto por ID |
| `/api/admin/products` | GET/POST | CRUD productos (admin) |
| `/api/admin/products/:id` | PUT/DELETE | CRUD productos (admin) |
| `/api/admin/config` | GET/PUT | Configuración del sitio |
| `/api/admin/orders` | GET | Listar órdenes |
| `/api/mercadopago/create-preference` | POST | Crear preferencia de pago MP |

### index.html
12 secciones: Header, Hero, Productos, Servicios, Ofertas, Promociones, Beneficios, Testimonios, Contacto, Footer, Carrito lateral, Admin Panel.

## Sistema de Administración

Botón flotante 🎨 (abajo a la izquierda) → panel con 4 tabs:

| Tab | Funcionalidad |
|-----|---------------|
| **General** | Editar nombre, tagline, textos, email, teléfono, dirección, horarios |
| **Paleta** | 6 paletas visuales (Nude Rose, Lavanda, Menta, Coral, Oro Rosa, Noche) |
| **Productos** | CRUD completo: agregar, editar, eliminar (persiste en API + localStorage) |
| **Servicios** | Vista informativa (edición vía HTML) |

Los datos de configuración se persisten en el backend (SQLite) y como fallback en localStorage.

## Sistema de Paletas

6 paletas de color definidas en `PALETTES` (config.js). Se aplican sobrescribiendo variables CSS en `:root` mediante `PaletteManager.apply()`. Transición suave vía clase `palette-transitioning`.

Para agregar una paleta: agregar entrada en `PALETTES` con `id`, `name`, `desc`, `colors` (pares var:valor) y `swatches` (array de hex para previsualización).

## Personalización vía data-config

Elementos con `data-config` se actualizan automáticamente al guardar en General tab:

| Atributo | Elemento |
|----------|----------|
| `name` | Nombre del negocio (header, footer, title) |
| `tagline` | Frase del Hero |
| `heroText` | Texto del Hero |
| `email` | Email en footer |
| `phone` | Teléfono en footer |
| `address` | Dirección en footer |
| `hours` | Horarios en footer |
| `footerText` | Descripción del footer |

## Rutas de Escalabilidad

1. **Autenticación admin** → JWT + login en `/admin`
2. **Editor de servicios** → Mover servicios del HTML al config + API
3. **Subida de imágenes** → multer/cloudinary en reemplazo de URLs
4. **Órdenes completas** → Guardar carrito como orden pagada en DB
5. **Dashboard** → Chart.js con analytics de ventas
6. **Multi-tienda** → namespace de config por tienda en la misma DB

## Buenas Prácticas

- ES modules nativos (sin bundler), servidos por Express como estáticos
- La API es el source of truth; localStorage es fallback offline
- Todas las transiciones de color usan variables CSS + `palette-transitioning`
- `escapeHTML()` previene XSS en datos dinámicos
- El carrito persiste en localStorage (`lumina_cart`)
- Servidor con Express, SQLite con WAL mode para performance
- Seed automático al primer inicio (DB vacía → datos iniciales)
