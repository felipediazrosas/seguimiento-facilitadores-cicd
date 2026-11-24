# Contrato de la API REST

Lo implementa `server/server.js` y lo consume el adaptador `rest` de `js/store.js`.
Cualquier backend institucional (Node, .NET, Java, Python, Power Automate, etc.) que
respete este contrato funciona con la plataforma sin cambiar el código del navegador.

Base: `CONFIG.REST.BASE_URL` (por defecto `/api`). Todas las respuestas son JSON.
## Autenticación y permisos

El servidor de referencia usa **usuario y contraseña** (contraseñas con scrypt y sal), sesión en cookie
`sid` (HttpOnly, SameSite=Strict, Secure con `COOKIE_SECURE=1`) y bloqueo de 15 minutos tras 5 intentos
fallidos. Toda escritura debe llevar el encabezado `X-Requested-With: guia`.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/login` | `{ "usuario", "clave" }` | datos del usuario y cookie de sesión · 401 si falla · 429 si está bloqueado |
| POST | `/logout` | — | 204 |
| GET | `/me` | — | `{ "usuario", "nombre", "rol": "coordinador"\|"facilitador", "fa", "canImport" }` · 401 sin sesión |
| POST | `/password` | `{ "actual", "nueva" }` | cambio de la propia contraseña (mínimo 8 caracteres) |
| GET / POST | `/usuarios` | `{ "usuario", "nombre", "rol", "fa", "clave" }` | solo coordinador: listar y crear |
| PATCH / DELETE | `/usuarios/{usuario}` | `{ "nombre", "rol", "fa", "activo", "clave" }` | solo coordinador: editar, restablecer clave, activar/desactivar, eliminar |

**Reglas de autorización** (las aplica el servidor, no el navegador):

| Colección | Coordinador | Facilitador |
|---|---|---|
| excel | leer todo · escribir | leer solo sus cursos y sus módulos |
| asig | todo | leer las suyas · PATCH solo `est`, `fh`, `resp` |
| nov | todo | leer las suyas · crear en sus cursos (el servidor fija `fa`) · PATCH solo `est`, `fe`, `acc` |
| seg, cierre | todo | leer y escribir solo de sus cursos |
| rutina | leer y eliminar | leer y escribir solo la suya (id `Nombre__AAAA-MM-DD`) |
| usuarios | gestionar | — |

Cualquier backend que reemplace al de referencia debe aplicar estas mismas reglas.

| Método | Ruta | Cuerpo | Respuesta | Uso |
|---|---|---|---|---|
| GET | `/health` | — | `{ "ok": true, "auth": true, "encrypted": true }` | Detectar el servidor (no requiere sesión) |
| GET | `/versions` | — | `{ "asig": 1731500000.12, "nov": … }` | Versión por colección para el tiempo casi real |
| GET | `/{coleccion}` | — | `[ { "id": "…", …campos } ]` | Leer la colección completa |
| POST | `/{coleccion}` | documento | `{ "id": "…" }` | Crear con id automático |
| GET | `/{coleccion}/{id}` | — | `{ "id": "…", …campos }` | Leer un documento |
| PUT | `/{coleccion}/{id}` | documento | `{ "id": "…" }` | Crear o reemplazar |
| PATCH | `/{coleccion}/{id}` | campos parciales | `{ "id": "…" }` | Actualizar (fusión profunda) |
| DELETE | `/{coleccion}/{id}` | — | 204 | Eliminar |

Colecciones válidas: `excel`, `asig`, `nov`, `seg`, `cierre`, `rutina`.

Reglas:
1. `/versions` debe cambiar el valor de una colección cada vez que se escribe en ella.
2. Ids permitidos: letras, números y `_ - ~ : @ + .` (máximo 200 caracteres).
3. Tamaño máximo recomendado por documento: 256 KB (los bloques del Excel se parten en ~190 KB).
4. 401 → la plataforma vuelve a la pantalla de acceso; 403 → muestra «No tienes permiso para guardar cambios».
5. `canImport` de `/me` decide si se muestra «Actualizar desde Excel».
