# Anexo A3 · Diagnóstico técnico del proyecto

Análisis de `Codigo_fuente_plataforma_guia/plataforma-guia-implementacion/` antes de implementar el pipeline (línea base del 24-nov-2026).
Las afirmaciones llevan su evidencia: archivo, comando o resultado.

## 1. Integridad de las fuentes

| Verificación | Resultado |
|---|---|
| ZIP `Codigo_fuente_plataforma_guia.zip` frente a la carpeta | **Idénticos**: 17 archivos con el mismo MD5 |
| Versiones de los documentos | Una sola versión de cada uno (Actividad 2, docx v1.2.0, guía U2) |
| Repositorio Git | No existía (sin `.git`) |

## 2. Qué es y cómo funciona

| Aspecto | Hallazgo | Evidencia |
|---|---|---|
| Propósito | Unifica el proceso estándar de implementación (9 etapas) con el seguimiento diario de los facilitadores, a partir del Excel de programación | README, docx §1 |
| Tipo de arquitectura | SPA sin frameworks + servidor Node.js monolítico que sirve el sitio y la API REST | `index.html`, `server/server.js` |
| Lenguajes | JavaScript (navegador y Node.js), HTML, CSS, SQL (modelo de referencia) | árbol de archivos |
| Frameworks | Ninguno. Librerías de navegador incluidas: SheetJS 0.18.5 y JSZip 3.10.1 en `vendor/` | cabeceras de los `.min.js` |
| Dependencias de ejecución | **Ninguna** (solo módulos nativos: `http`, `fs`, `path`, `crypto`) | `server.js` líneas 25–28 |
| Módulos del navegador | `config.js` (fuente de datos), `store.js` (adaptadores REST/local), `estandar.js` (contenido del estándar), `excel.js` (importar/exportar), `app.js` (interfaz y reglas de negocio, 1.485 líneas) | `js/` |
| API REST | `/api/health`, `/login`, `/logout`, `/me`, `/password`, `/usuarios`, `/versions` y CRUD de 6 colecciones (`excel`, `asig`, `nov`, `seg`, `cierre`, `rutina`) | `db/contrato-api.md` |
| Autenticación | Usuario y contraseña (scrypt N=16384 con sal), cookie `sid` HttpOnly + SameSite=Strict, bloqueo de 15 min tras 5 fallos, encabezado anti-CSRF `X-Requested-With: guia` | `server.js` 103–171, 268 |
| Autorización | Por rol (coordinador / facilitador) **en el servidor**: filtrado de lectura (`canRead`) y escritura (`guardWrite`) | `server.js` 173–221 |
| Persistencia | Un archivo JSON por colección en `DATA_DIR`, cifrado AES-256-GCM si existe `DATA_KEY`; escritura atómica (tmp + rename) | `server.js` 38–73 |
| Modelo relacional | 10 tablas y 2 vistas en PostgreSQL (referencia para TI, no se usa en ejecución) | `db/esquema.sql` |
| Configuración | Variables `PORT`, `DATA_DIR`, `DATA_KEY`, `ADMIN_USER`, `ADMIN_PASS`, `COOKIE_SECURE`, `SESSION_HOURS` | README, `server.js` 14–23 |
| Servicios externos | Google Fonts (tipografías); CDN de cdnjs solo como respaldo si falta `vendor/` | `index.html`, `config.js` |
| Ejecución local | `node server/server.js` (Node ≥ 18) o abrir `index.html` (modo local sin servidor) | README |

## 3. Línea base verificada (antes de cualquier cambio)

Ejecutada en una copia en el scratchpad, sin tocar el proyecto:

| Prueba | Resultado |
|---|---|
| `node server/server.js` con `DATA_KEY`, `ADMIN_USER`, `ADMIN_PASS` | Arranca: «Plataforma en http://localhost:18080 · datos … (cifrados AES-256-GCM)» |
| `GET /api/health` | `{"ok":true,"auth":true,"encrypted":true}` |
| `GET /` · `GET /server/server.js` | 200 · 403 |
| `POST /api/login` | 200 con los datos del coordinador |
| Archivo de usuarios en disco | `usuarios.json.enc` (cifrado) |
| `node --check` sobre los 6 archivos JS | Sin errores de sintaxis |

## 4. Problemas técnicos y riesgos encontrados

| # | Hallazgo | Severidad | Tratamiento |
|---|---|---|---|
| P1 | No había pruebas automatizadas, linter, CI, CD ni contenedor | Alta (para DevOps) | Implementados en esta actividad |
| P2 | `server.js` llamaba a `listen()` al cargarse, lo que impedía importarlo desde las pruebas | Media | Refactor mínimo: `require.main === module` + `module.exports`. Ejecución directa idéntica (verificado) |
| P3 | **SheetJS 0.18.5** en `vendor/` tiene CVE publicadas: CVE-2023-30533 (prototype pollution, corregida en 0.19.3) y CVE-2024-22363 (ReDoS, corregida en 0.20.2) | Alta (riesgo residual) | **No detectable por Trivy** (archivo minificado sin metadatos de paquete). Mitigación actual: solo Coordinación importa, y el Excel es institucional y de confianza. Recomendación: actualizar a 0.20.3 desde `cdn.sheetjs.com` (no está en npm) y repetir las pruebas de importación con el Excel real. No se cambió por el riesgo funcional y porque requiere validar con datos reales |
| P4 | La documentación dice 63 controles; el código tiene 62 | Baja | Registrado (Anexo A2, D3) |
| P5 | Sesiones en memoria + datos en archivos: **no escala horizontalmente** | Media | Despliegue con 1 réplica y estrategia `Recreate`. Escalar requiere la base institucional |
| P6 | Si no se define `DATA_KEY`, los datos quedan en claro | Media | `compose.yaml` exige `DATA_KEY` (`${DATA_KEY:?…}`) y k8s la toma de un Secret |
| P7 | Si no se definen `ADMIN_USER`/`ADMIN_PASS`, la contraseña inicial se imprime en la consola | Baja | Documentado; `.env.example` y el Secret de k8s la definen siempre |
| P8 | No existían `.dockerignore`, `.env.example` ni `.gitattributes` | Baja | Creados |

## 5. Requisitos para integrarlo en un pipeline (y cómo se cumplieron)

| Requisito | Cómo se resolvió |
|---|---|
| Instalación reproducible | `package.json` + `package-lock.json`; `npm ci` (solo devDependencies: ESLint) |
| Comando de pruebas no interactivo | `npm test` / `npm run test:coverage` (`node:test`, sin dependencias) |
| Análisis estático | `npm run lint` (ESLint 10, configuración que respeta las variables globales compartidas entre scripts) |
| «Compilación» | No hay transpilación: se valida la sintaxis de todos los módulos con `npm run check:syntax` y se construye la imagen Docker |
| Configuración por entorno | Variables de entorno (12-Factor), `.env.example` sin valores |
| Artefacto desplegable | Imagen OCI multi-stage, no root, sin npm en el runtime |
