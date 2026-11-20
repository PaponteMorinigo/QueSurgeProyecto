# Qué Surge

Aplicación Ionic 8 + Angular 20 en TypeScript con cuentas de Persona, Empresa y Validador.

## Ejecutar

Usá Node.js 20.19+, 22.12+ o 24 e Ionic CLI instalado. Desde la carpeta del proyecto:

```bash
npm ci
ionic serve --port 4200
```

Abrí http://localhost:4200. Para mantener actualizada la agenda externa, abrí otra terminal en esta carpeta y ejecutá:

```bash
npm run eventos:serve
```

El servicio escucha en 127.0.0.1:4300 y Angular reenvía /api mediante server/proxy.conf.json. Para una actualización manual del archivo de agenda, ejecutá `npm run eventos:sync`. El servicio debe permanecer abierto para las actualizaciones automáticas, que se ejecutan cada seis horas. Se puede configurar EVENTS_PORT y EVENTS_REFRESH_HOURS. Si cambiás el puerto del servicio, actualizá también el proxy.

`npm run build` genera la versión web en dist/que-surge/browser. En producción se debe configurar /api/events hacia el servicio de agenda y reenviar las rutas web a index.html.

## Recorridos disponibles

- Persona registra una cuenta, elige gustos y ciudad una sola vez y ve Inicio. Los próximos accesos reutilizan sus preferencias. Se pueden editar desde Perfil o Mis preferencias.
- Inicio, Explorar y Calendario filtran por cualquiera de las categorías elegidas y por la ciudad. Todo Paraguay incluye todas las ciudades. Favoritos conserva los eventos guardados aunque cambien los gustos.
- Empresa crea eventos, configura tipos de entrada, precios y cupos, elige una portada y publica o vuelve a borrador.
- Portada permite cargar varias imágenes JPG, PNG o WebP, hasta 10 MB y 40 megapíxeles. Se adaptan a un máximo de 1600 píxeles por lado y quedan disponibles en la galería de esa empresa.
- Cada pantalla tiene el logo de Qué Surge para volver al inicio de su módulo. Sin sesión, vuelve al acceso.
- La empresa ve las entradas vendidas, el importe total, las entradas utilizadas y el detalle de compras desde Panel y Ventas.
- En Validadores QR la empresa crea credenciales individuales, asigna eventos y puede cambiar permisos o desactivar el acceso.
- La persona compra entradas de eventos publicados por empresas locales, elige tipo, cantidad y medio de pago de demostración. Mis tickets muestra un QR único por entrada.
- El Validador ingresa con su correo y contraseña, elige un evento autorizado y lee el QR mediante cámara, imagen o código. La lectura aceptada registra fecha y usuario. Las siguientes lecturas de esa entrada se rechazan, incluso después de recargar. Una transacción IndexedDB evita aceptar dos lecturas simultáneas en el mismo origen.

## Agenda externa

server/events-server.mjs importa la agenda pública de Ticketea y sus fichas /events/ usando los datos estructurados Event. Conserva nombre, fecha, horario, sede, ciudad, imagen, precio publicado y enlace a la fuente. La categoría se estima mediante palabras clave y puede requerir revisión editorial.

Los identificadores son estables por URL. Las actualizaciones reemplazan fechas y precios, quitan eventos retirados o cancelados y conservan la última ficha cuando falla temporalmente una página. La agenda se guarda de forma atómica en server/data/events.json y se consulta mediante GET /api/events. El navegador conserva una última copia para cuando el servicio está desconectado.

El conector consulta páginas públicas del listado y de eventos. No accede a cuentas, carritos ni pagos. Usa fetch y, si el entorno de red lo requiere, curl. En Windows utiliza los certificados del sistema mediante curl sin desactivar la verificación TLS.

## Alcance de la demostración

Las cuentas y las sesiones se guardan en el navegador. Las contraseñas se derivan con PBKDF2, SHA-256 y sal individual. Las portadas se guardan como Blob en IndexedDB. Las compras y tickets también usan IndexedDB con operaciones de emisión y validación atómicas.

Los pagos son simulados. Los importes del panel corresponden a esas compras de demostración. Los eventos externos remiten a su plataforma de origen para comprar.

Para operar ventas y validar entradas desde distintos teléfonos se necesita conectar autenticación, cuentas, inventario, compras y el registro de validaciones con un backend compartido, junto con un proveedor real de pagos y almacenamiento de imágenes. El bloqueo actual se comparte entre pestañas del mismo navegador y origen. Cambiar de dispositivo, navegador o puerto crea un almacenamiento diferente.

La cámara necesita permiso del navegador y localhost o HTTPS. La lectura desde imagen y código permite probar el recorrido sin cámara.

## Archivos

- src/main.ts contiene rutas, logo común y navegación por rol.
- src/app/auth.ts contiene cuentas, preferencias y credenciales de validadores.
- src/app/discovery.ts y calendar.ts contienen el catálogo y calendario personalizados.
- src/app/company-store.ts, company-pages.ts y company-editor.ts contienen eventos y panel empresarial.
- src/app/cover-library.ts gestiona las portadas en IndexedDB.
- src/app/commerce.ts gestiona cupos, compras, tickets y validación única.
- src/app/purchase.ts, tickets.ts, validators.ts y scanner.ts contienen los recorridos de compra y acceso.
- src/app/external-events.ts consulta la agenda importada.
- server/events-server.mjs contiene el importador y su servicio HTTP.

## Referencia visual

Inicio sigue Home (1:1267) del archivo Proyecto que surge en Figma, con sus recursos locales, carrusel y barra flotante. El acceso adapta el tratamiento del Onboarding (1:1243), porque el archivo compartido no contiene un formulario específico de acceso. Lexend se incluye con licencia OFL como alternativa a Lufga. Las fotografías de los eventos son datos dinámicos del catálogo.


## Empresas y compras precargadas

Al abrir la app se agregan escenarios de demostración con tres empresas, seis eventos publicados, tres compradores, tres validadores y 18 entradas distribuidas en seis compras. Tres entradas ya están utilizadas y quince están disponibles inicialmente.

La ruta /demostracion permite revisar los paneles de las empresas, sus ventas, validadores y las entradas de los compradores. Se accede escribiendo la ruta en el navegador. La contraseña de todas estas cuentas ficticias es SurgeDemo2026!. Los correos de acceso se muestran en la pantalla de demostración.

La carga agrega los registros de ejemplo faltantes. Reabrir la app conserva las validaciones y los cambios realizados. Las cuentas de ejemplo viven en el mismo navegador y origen que el resto del prototipo. Las entradas y los importes son ficticios y sirven para recorrer las pantallas.


## Publicar y clonar desde GitHub

El repositorio incluye las empresas, eventos, cuentas, compras y estados iniciales de los tickets de ejemplo en src/app/demo-fixtures.ts. Los escenarios se cargan al abrir la app, por lo que también aparecen en una instalación nueva.

public/agenda-inicial.json conserva la agenda externa de la versión entregada para que el catálogo inicial se pueda reproducir aunque el importador todavía no esté abierto. El servicio de eventos actualiza esa agenda durante la ejecución.

Para levantar una copia nueva:

```
git clone https://github.com/PaponteMorinigo/QueSurgeProyecto.git
cd QueSurgeProyecto
npm ci
ionic serve --port 4200
```

En una segunda terminal de esa carpeta, ejecutá npm run eventos:serve para actualizar las fuentes externas.

Los registros que se cargan o modifican posteriormente desde la interfaz se guardan en el almacenamiento local del navegador. El repositorio contiene el estado inicial de los ejemplos y la agenda incluida en esta entrega.
