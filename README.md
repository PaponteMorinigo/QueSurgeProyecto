# Qué Surge

Aplicación para descubrir eventos en Paraguay, desarrollada con Ionic, Angular y TypeScript.

## Funcionalidades

- Registro de usuarios y empresas.
- Búsqueda de eventos, calendario y favoritos.
- Preferencias por intereses y ciudad.
- Gestión de eventos, entradas y ventas.
- Compra de entradas y validación mediante QR.
- Actualización de la agenda desde fuentes externas.

## Instalación

Requiere Node.js, npm e Ionic CLI.

```bash
npm ci
ionic serve --port 4200
```

La aplicación estará disponible en [localhost:4200](http://localhost:4200).

## Servicio de eventos

Ejecutar en otra terminal para actualizar la agenda.

```bash
npm run eventos:serve
```

## Compilación

```bash
npm run build
```

## Estructura del proyecto

| Archivo | Contenido |
| --- | --- |
| `src/main.ts` | Rutas, navegación por tipo de cuenta y logo común. |
| `src/index.html` | Página base de la aplicación. |
| `src/styles.css` | Colores, tipografía y estilos compartidos. |
| `src/app/access.ts` | Pantallas de inicio de sesión y registro. |
| `src/app/auth.ts` | Cuentas, sesiones, roles y preferencias guardadas. |
| `src/app/preferences.ts` | Selección de intereses y ciudad. |
| `src/app/profile.ts` | Perfil de la cuenta personal. |
| `src/app/discovery.ts` | Pantallas de Inicio, Explorar y Favoritos. |
| `src/app/calendar.ts` | Calendario con vistas de mes, semana y lista. |
| `src/app/home-card.ts` | Tarjetas destacadas y recomendaciones de Inicio. |
| `src/app/event-card.ts` | Tarjetas de eventos y botón de favoritos. |
| `src/app/event-detail.ts` | Detalle del evento y acceso a las entradas. |
| `src/app/event-types.ts` | Categorías disponibles para los eventos. |
| `src/app/events.ts` | Catálogo, favoritos y filtrado por preferencias. |
| `src/app/paraguay-events.ts` | Eventos iniciales del catálogo. |
| `src/app/external-events.ts` | Consulta y caché de la agenda externa. |
| `src/app/company-pages.ts` | Panel empresarial, listado de eventos, vista previa, ventas y perfil. |
| `src/app/company-editor.ts` | Formulario para crear y editar eventos, portadas y tipos de entrada. |
| `src/app/company-store.ts` | Almacenamiento y publicación de los eventos de cada empresa. |
| `src/app/cover-library.ts` | Carga y almacenamiento de las portadas del comercio. |
| `src/app/purchase.ts` | Selección de entradas, cantidad y medio de pago de prueba. |
| `src/app/commerce.ts` | Compras, cupos, entradas y registro de validaciones. |
| `src/app/tickets.ts` | Entradas del comprador y generación de sus códigos QR. |
| `src/app/validators.ts` | Creación de validadores y asignación de eventos. |
| `src/app/scanner.ts` | Lectura y validación de entradas desde cámara, imagen o código. |
| `src/app/demo-fixtures.ts` | Datos iniciales de las cuentas, eventos y compras de ejemplo. |
| `src/app/demo-seed.ts` | Carga de los ejemplos y conservación de sus registros. |
| `src/app/demo-page.ts` | Pantalla interna para revisar las cuentas de ejemplo. |
| `server/events-server.mjs` | Importación periódica de eventos y servicio de agenda. |
| `server/proxy.conf.json` | Conexión del servidor de desarrollo con la agenda externa. |
| `public/` | Fotografías, iconos, fuentes y copia inicial de la agenda. |

## Estado del proyecto

Versión de desarrollo con datos de ejemplo, almacenamiento local y pagos simulados. El uso compartido de cuentas y validaciones entre dispositivos requiere un backend.
