# Lumina Nails – Tienda Web Skill

## Descripción del Proyecto

Lumina Nails es una **Single Page Application (SPA)** de tienda online para un negocio de manicura profesional. Está construida con **HTML, CSS y JavaScript vanilla** (sin frameworks ni build tools). Incluye integración simulada con **Mercado Pago** lista para conectar con un backend real.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| HTML | `index.html` (único archivo, todas las secciones) |
| CSS  | `styles.css` (1773 líneas, mobile-first) |
| JS   | `script.js` (847 líneas, modular, 21 secciones) |
| Iconos | Font Awesome 6 |
| Fuentes | Google Fonts (Montserrat + Playfair Display) |
| Pagos | Mercado Pago SDK v2 (modo simulación) |
| Imágenes | Unsplash (URLs externas) |

## Arquitectura

### index.html
Una sola página con 11 secciones:

| Sección | ID | Descripción |
|---------|----|-------------|
| Header | `#header` | Fixed nav + carrito + menú móvil |
| Hero | `#inicio` | Banner principal con CTA |
| Productos | `#productos` | Grid de 8 productos (render vía JS) |
| Servicios | `#servicios` | 4 servicios con reserva y seña online |
| Ofertas | `#ofertas` | Productos con descuento (render vía JS) |
| Promociones | `#promociones` | Membresías, Gift Cards, Packs |
| Beneficios | — | 4 cards informativas |
| Testimonios | — | 3 reseñas de clientes |
| Contacto | `#contacto` | Newsletter + medios de pago |
| Footer | — | Links, redes, contacto |
| Carrito lateral | `#cartSidebar` | Slide-in panel del carrito |
| Modal de pago | `#paymentModal` | Modal de confirmación y pago MP |

### script.js
Organizado en 21 módulos numerados:

1. **CONFIG** – Configuración central (MP public key, endpoint backend)
2. **products** – Array de 8 productos con precio, imagen, badge
3. **Cart state** – `cart` object, localStorage, `addToCart`, `removeFromCart`, `updateCartQuantity`, `clearCart`
4. **Cart UI** – `updateCartUI`, `renderCartBadge`, `renderCartItems`, `renderCartFooter`
5. **Product rendering** – `createProductCard`, `renderProducts`
6. **MercadoPago** – `init`, `crearPago` (simulado, preparado para fetch a backend)
7. **PaymentModal** – Modal de pago con `abrir`, `cerrar`, `_render`, `_procesarPago`
8. **Cart checkout** – Botón "Pagar con Mercado Pago" + "Vaciar Carrito"
9. **Reservations** – Click en botones `[data-action="reserve"]` → abre modal con seña
10. **Promo checkout** – Click en botones `[data-action="promo-checkout"]`
11. **Event delegation** – Click en `[data-action]` para add-to-cart, increase, decrease, remove
12. **Cart sidebar** – `setupCartSidebar` (open/close con overlay y Escape key)
13. **Mobile menu** – `setupMobileMenu` (burger toggle)
14. **Header scroll** – `setupHeaderScroll` (sombra al scrollear)
15. **Active nav** – `setupActiveNavHighlight` (IntersectionObserver-like)
16. **Scroll to top** – `setupScrollTopButton`
17. **Scroll reveal** – `setupScrollReveal` (IntersectionObserver)
18. **Newsletter** – `setupNewsletterForm` (simulado, muestra toast)
19. **Toast** – `showToast` (notificaciones flotantes)
20. **Utilities** – `formatPrice`, `escapeHTML`
21. **Init** – `init()` (punto de entrada, llama a todo)

### styles.css
1773 líneas, mobile-first, 20 secciones:

- Custom Properties (paleta nude/rosa/negro, vars MP)
- Reset & Base
- Utilidades (.btn, .section, .container)
- Header (fixed, backdrop-filter, menú móvil)
- Carrito lateral (slide-in, overlay)
- Modal de pago (centrado, animación)
- Hero (full-screen, overlay gradiente)
- Productos (grid responsive, hover scale)
- Servicios (cards con precio de seña)
- Promociones (cards con border destacado)
- Beneficios (iconos circulares)
- Testimonios (estrellas, avatar)
- Contacto (formulario, grid)
- Footer (grid oscuro)
- Scroll top button
- Toast
- Animaciones (fadeInUp, fadeIn, reveal)
- Responsive (640px, 1024px, max-639px)

## Flujo de Pago (Mercado Pago)

1. Usuario agrega productos al carrito / selecciona servicio / promo
2. Hace clic en "Pagar con Mercado Pago"
3. Se abre el `PaymentModal` con resumen de compra
4. Usuario confirma → se simula `crearPago()` con 800ms de delay
5. Se muestra toast de "Redirigiendo a Mercado Pago..."
6. A los 1.5s se simula pago exitoso
7. Si es carrito, se vacía automáticamente

**Para producción**: Reemplazar la simulación en `MercadoPago.crearPago()` con un `fetch` al backend que genere un `preferenceId` real y use `mp.checkout()`.

## Convenciones de Código

- **Nomenclatura**: BEM para CSS (`bloque__elemento--modificador`), camelCase para JS
- **Comentarios**: En español, con separadores de sección (`----`)
- **ES6+**: `const/let`, arrow functions, template literals, `async/await`
- **Sin dependencias**: No hay package.json, build tools, ni bundlers
- **Español**: Nombres de funciones, variables y textos en español argentino
- **Mercado Pago**: La `publicKey` actual es `TEST-0000...` (placeholder). Reemplazar antes de producción.

## Tareas Comunes

### Agregar un producto nuevo
1. Agregar objeto al array `products` en script.js (seguir la misma estructura)
2. El producto aparece automáticamente en la grid de productos y ofertas (si tiene `oldPrice`)

### Agregar un servicio nuevo
1. Agregar `<article class="service-card reveal">` en `#servicesGrid` en index.html
2. Seguir el mismo patrón de `data-*` attributes (`data-action="reserve"`, `data-service-id`, etc.)

### Conectar Mercado Pago real
1. Crear un backend con endpoint `POST /api/mercadopago/create-preference`
2. Reemplazar `CONFIG.mercadoPago.publicKey` con la Public Key real
3. En `MercadoPago.crearPago()`, descomentar el `fetch` y reemplazar la simulación
4. Usar `mp.checkout({ preference: { id: preferenceId } })` en vez de simular

### Agregar promoción
1. Agregar `<article class="promo-card reveal">` en `#promosGrid` en index.html
2. Usar `data-action="promo-checkout"` para activar el modal de pago

## Buenas Prácticas

- Los datos de productos ya están preparados para migrar a una API REST
- El carrito persiste en `localStorage` con key `lumina_cart`
- El código maneja graceful degradation (localStorage puede fallar en navegación privada)
- La animación scroll-reveal usa `IntersectionObserver` (no librerías externas)
- Los precios se formatean con `toLocaleString("es-AR")`
- Se usa `escapeHTML()` para prevenir XSS en datos dinámicos
