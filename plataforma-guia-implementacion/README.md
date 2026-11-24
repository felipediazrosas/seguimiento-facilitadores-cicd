# Guía de estandarización y seguimiento de facilitadores

Plataforma web del Área de Implementación de Unisabana e-Learning. Integra el proceso estándar de
implementación de programas académicos virtuales con el seguimiento diario de cada facilitador, a partir
del Excel de programación, y devuelve al mismo Excel la información registrada.

Versión 1.2.0 · Práctica en Estrategias de Mejora · Sebastián Castellanos Escárraga y André Leonard Duque Aricapa

## Estructura

```
plataforma-guia-implementacion/
├── index.html          Interfaz: vistas, formularios, panel lateral y acceso
├── css/styles.css      Estilos (modo claro y oscuro)
├── js/
│   ├── config.js       Configuración y selección de la fuente de datos
│   ├── store.js        Adaptadores de datos y autenticación (API REST y local)
│   ├── estandar.js     Proceso estándar: etapas, checklists, plantillas y criterios
│   ├── excel.js        Importación y exportación del Excel de programación
│   └── app.js          Interfaz y reglas de negocio
├── server/server.js    Servidor Node.js: sitio, API REST, usuarios y permisos
├── db/
│   ├── esquema.sql     Modelo relacional (PostgreSQL)
│   └── contrato-api.md Contrato de la API REST y reglas de autorización
├── docs/modelo-datos.md Colecciones, campos y columnas del Excel requeridas
└── vendor/             Librerías SheetJS y JSZip con sus licencias
```

## Ejecución

**Servidor (equipo completo, con usuarios y permisos).** Requiere Node.js 18 o superior; no tiene dependencias.

```bash
DATA_KEY="clave-de-cifrado" ADMIN_USER="coordinacion" ADMIN_PASS="contraseña-inicial" node server/server.js
```

Abrir `http://localhost:8080`, entrar con el usuario de coordinación y crear las cuentas de los
facilitadores en la pestaña **Usuarios**.

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP (8080 por defecto) |
| `DATA_DIR` | Carpeta de datos (`data/` por defecto) |
| `DATA_KEY` | Cifrado AES-256-GCM de datos y usuarios en disco |
| `ADMIN_USER`, `ADMIN_PASS` | Primer coordinador. Si no se definen, se crea `coordinador` con una contraseña aleatoria que se muestra en la consola |
| `COOKIE_SECURE` | `1` cuando se sirve con HTTPS |
| `SESSION_HOURS` | Duración de la sesión (12 por defecto) |

**Local (un solo equipo, sin servidor).** Abrir `index.html` en el navegador y elegir el rol al entrar.
Los datos quedan en ese navegador y no hay control de acceso.

## Fuente de datos

La conexión a la base de datos es configurable en `js/config.js`:

```js
DATA_SOURCE: 'auto'   // 'auto' | 'rest' | 'local'
```

`auto` usa la API REST si el servidor responde y, si no, el almacenamiento local. Para usar otra base de
datos institucional se implementa el contrato de `db/contrato-api.md` en el backend y se ajusta
`REST.BASE_URL`, o se agrega un adaptador en `js/store.js` con la interfaz `sub / set / upd / del / add`.

## Roles y permisos

| Rol | Ve | Puede cambiar |
|---|---|---|
| Coordinador | Todo el equipo, todos los cursos y los usuarios | Excel (importar y exportar), indicaciones, novedades, checklists y cierres de todos, usuarios |
| Facilitador | Su panel y sus cursos | Su checklist diario, checklist y cierres de sus cursos, sus novedades, estado y respuesta de sus indicaciones |

En modo servidor los permisos los aplica el servidor: un facilitador solo recibe sus datos y cualquier
escritura que no le corresponda es rechazada.

## Base de datos

Seis colecciones de datos (`excel`, `asig`, `nov`, `seg`, `cierre`, `rutina`) y la tabla de usuarios.
Detalle en `docs/modelo-datos.md` y equivalente relacional en `db/esquema.sql`.

## Manejo de la información

- El Excel se lee y se escribe en el navegador; el archivo no se envía a ningún servidor.
- Solo se cargan datos operativos: no se importan cédulas, celulares, direcciones ni correos personales.
- En modo servidor los datos y los usuarios se guardan cifrados con `DATA_KEY`; las contraseñas, con scrypt.

## Licencias de terceros

SheetJS Community Edition (Apache 2.0) y JSZip (MIT / GPLv3), incluidas en `vendor/`.
Fuentes IBM Plex (SIL Open Font License).
