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

## Estado del proyecto

Versión de desarrollo con datos de ejemplo, almacenamiento local y pagos simulados. El uso compartido de cuentas y validaciones entre dispositivos requiere un backend.
