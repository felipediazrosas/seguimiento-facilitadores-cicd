# Anexo A6 · Validación y pruebas

Escala de estados: **EXITOSO** · **FALLIDO** · **BLOQUEADO POR DEPENDENCIAS** · **PENDIENTE DE CREDENCIALES** · **NO EJECUTADO** · **NO APLICA**.
«EXITOSO» se asigna solo cuando el componente **se ejecutó** y hay una salida que lo demuestra. Que un archivo exista no cuenta como validación.

## 1. Validación por componente

| # | Componente | Tipo | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V01 | Línea base: el servidor original arranca y responde | Dinámica | health OK, login 200, datos cifrados | EXITOSO | Anexo A3 §3 |
| V02 | Instalación de dependencias (`npm ci`) | Dinámica | 80 paquetes (solo desarrollo); 0 vulnerabilidades | EXITOSO | `reportes/04-npm-audit.txt`, `09` |
| V03 | Compilación / sintaxis (`check:syntax`) | Estática | 6/6 módulos | EXITOSO | `reportes/02-sintaxis.txt` |
| V04 | Análisis estático (ESLint 10.15) | Estática | 0 errores, 0 advertencias | EXITOSO | `reportes/01-eslint.txt` |
| V05 | Pruebas unitarias y de integración | Dinámica | 43/43 (9 suites) en Node 22.14 local, Node 22 y 24 en CI, y Node 24 en el contenedor de Jenkins | EXITOSO | `reportes/03`, `09`, `12`, `14` |
| V06 | Cobertura con umbral (≥ 70 % de líneas) | Dinámica | 82,11 % líneas · 68,78 % ramas · 95,24 % funciones de `server.js` | EXITOSO | `reportes/03-pruebas-cobertura.txt` |
| V07 | Regresión: `node server/server.js` tras el refactor | Dinámica | Misma salida, health OK | EXITOSO | Registro de avances (A7) |
| V08 | Workflow de CI (actionlint 1.7.12) | Estática | 0 hallazgos (después de corregir un aviso SC2034) | EXITOSO | `reportes/08-validacion-estatica.txt` |
| V09 | **CI en GitHub Actions (push a main)** | Plataforma | 5/5 jobs en verde, 48 s | EXITOSO | Run [45504468140](https://github.com/felipediazrosas/seguimiento-facilitadores-cicd/actions/runs/45504468140), captura 01 |
| V10 | CI disparado por **pull request** | Plataforma | Evento `pull_request` en verde | EXITOSO | Run [45506031730](https://github.com/felipediazrosas/seguimiento-facilitadores-cicd/actions/runs/45506031730), captura 03 |
| V11 | **Prueba negativa del gate de pruebas** | Plataforma | Aserción alterada → `build-test` rojo en Node 22 y 24; `docker` y `sonar` *skipped* | EXITOSO (el gate bloqueó) | Run [45504969995](https://github.com/felipediazrosas/seguimiento-facilitadores-cicd/actions/runs/45504969995), captura 02, `reportes/10` |
| V12 | Dockerfile (hadolint 2.14) | Estática | 0 hallazgos (aplicación y Jenkins) | EXITOSO | `reportes/08` |
| V13 | Build de la imagen (etapas `test` y `runtime`) | Dinámica | Build local, en CI y en Jenkins | EXITOSO | `reportes/09`, `12` |
| V14 | Endurecimiento del contenedor | Dinámica | uid 1000; npm ausente; `touch /app/x` → Read-only file system; `healthy` | EXITOSO | Registro de avances (A7) |
| V15 | Docker Compose (`config -q`) | Estática | Válido (aplicación y Jenkins) | EXITOSO | `reportes/08` |
| V16 | Trivy fs: secretos, SCA y misconfig HIGH/CRITICAL | Dinámica | 0 en 5 objetivos (lockfile, 2 Dockerfiles, 2 manifiestos) | EXITOSO | `reportes/05` |
| V17 | Trivy imagen HIGH/CRITICAL | Dinámica | 0 (Alpine 3.24.4) | EXITOSO | `reportes/06`, artefacto Jenkins `trivy-imagen.txt` |
| V18 | SARIF en GitHub Code Scanning | Plataforma | Publicado; 3 alertas **LOW** (KSV-0020, KSV-0021, DS-0026) | EXITOSO | Code scanning del repositorio; ver §2 |
| V19 | SBOM CycloneDX | Dinámica | Generado en CI (artefacto `sbom`) y en Jenkins (CycloneDX 1.7) | EXITOSO | `jenkins-artefactos/sbom-plataforma-guia.json` |
| V20 | Manifiestos k8s (kustomize, kubeconform -strict, Trivy config) | Estática | 5/5 válidos; 0 MEDIUM/HIGH/CRITICAL; 2 LOW aceptados | EXITOSO | `reportes/07`, `08` |
| V21 | Sustitución de la imagen por overlay | Estática | `image: localhost:5000/plataforma-guia:abc123-b7` | EXITOSO | Registro de avances (A7) |
| V22 | Jenkins como código (JCasC) | Dinámica | Job creado automáticamente; seguridad aplicada | EXITOSO | Log de Jenkins, capturas 05 y 11 |
| V23 | **CD en Jenkins: build #2 (manual)** | Dinámica | 7 stages; imagen `9b1ea5698736-b2` publicada | EXITOSO | `reportes/12`, captura 05 |
| V24 | **CD en Jenkins: build #4 (pollSCM tras fusionar el PR #1)** | Dinámica | «Started by an SCM change»; imagen `62fdfcce921e-b4` publicada | EXITOSO | `reportes/14`, capturas 06, 07 y 11 |
| V25 | Publicación en el registro y descarga | Dinámica | `tags: [62fdfcce921e-b4, 9b1ea5698736-b2]`; label de revisión = commit | EXITOSO | Captura 10, `jenkins-artefactos/imagen-publicada*.txt` |
| V26 | Ejecución de la imagen publicada | Dinámica | health OK; pantalla de acceso | EXITOSO | Captura 09 |
| V27 | **Rollback condicionado** (fallo previo al despliegue) | Dinámica negativa | Build #3 contra un registro inexistente → falla en «Publicar»; «no se hace rollback» | EXITOSO (comportamiento esperado) | `reportes/13`, capturas 05 y 08 |
| V28 | Build #1 de Jenkins | Dinámica | Falló: pollSCM consultó antes de que existiera `main` en GitHub | FALLIDO (causa externa, documentada) | `reportes/11` |
| V29 | SonarCloud + Quality Gate | Plataforma | Job omitido con advertencia | PENDIENTE DE CREDENCIALES | Anotación en el run 45504468140 |
| V30 | Publicación en Docker Hub | Dinámica | No ejecutada (registro local compatible en su lugar) | PENDIENTE DE CREDENCIALES | — |
| V31 | Despliegue real en Kubernetes + prueba de rollback | Dinámica | No ejecutado: la guía lo anuncia para la siguiente fase y no hay clúster autorizado | NO EJECUTADO | Stage definido y manifiestos validados |
| V32 | DAST (OWASP ZAP) | Dinámica | Requiere un entorno desplegado | NO APLICA en esta fase | — |
| V33 | Monitoreo (Prometheus/Grafana) | — | Fase posterior de la guía | NO APLICA en esta fase | — |

## 2. Hallazgos aceptados (riesgo residual)

| Hallazgo | Severidad | Motivo de aceptación | Revisión |
|---|---|---|---|
| KSV-0020 / KSV-0021: UID/GID ≤ 10000 | LOW | El usuario `node` de la imagen oficial es 1000. Cambiarlo obligaría a reconstruir los permisos de la base sin un beneficio práctico (ya es no root y PSA `restricted`) | Fase k8s |
| DS-0026: Jenkins sin HEALTHCHECK | LOW | **Corregido** en `jenkins/Dockerfile` (verificado con hadolint y Trivy). La alerta se cierra en el próximo análisis | — |
| SheetJS 0.18.5 (CVE-2023-30533, CVE-2024-22363) | HIGH (no lo detecta Trivy) | Mitigación: solo Coordinación importa un Excel institucional de confianza. Actualizar a 0.20.3 requiere validarlo con el Excel real | Antes de producción |

## 3. Problemas durante la implementación y su solución

| # | Problema | Causa | Solución | Verificación |
|---|---|---|---|---|
| I1 | ESLint reportó 19 errores en el código original | Variables globales compartidas entre scripts del navegador, `catch {}` intencionales, regex de caracteres de control intencional | Configurar ESLint según el diseño (globales compartidas, `allowEmptyCatch`, excepción documentada) **sin tocar el código** | 0 errores |
| I2 | Dos pruebas fallaban con valores idénticos | Los arreglos creados en `vm` pertenecen a otro *realm* | `Array.from(...)` antes de comparar | 43/43 |
| I3 | `test:coverage` fallaba con ENOENT | La carpeta `coverage/` no existía | Script `pretest:coverage` multiplataforma | LCOV generado |
| I4 | La etapa `test` de Docker falló | El gate de ESLint detectó una asignación inútil en una prueba nueva | Corregir la prueba | Build en verde |
| I5 | `docker run --tmpfs /tmp` falló en Git Bash | Git Bash convierte las rutas POSIX en rutas de Windows | `MSYS_NO_PATHCONV=1` | Contenedor operativo |
| I6 | El push fue rechazado | El token de GitHub CLI no tenía el scope `workflow` | El propietario ejecutó `gh auth refresh -s workflow` | Push OK |
| I7 | El usuario `jenkins` no podía usar Docker | Socket `root:root 660` | `group_add: ["0"]` en lugar de ejecutar Jenkins como root | Builds #2–#4 |
| I8 | **El log del build #2 mostró la clave efímera de la prueba de humo** | `sh` de Jenkins usa `set -x` | `set +x` en ese bloque y variables pasadas por nombre (PR #1); se redactaron los logs exportados | Build #4: 0 coincidencias |
| I9 | El SARIF mostró 3 alertas a pesar del filtro HIGH/CRITICAL | trivy-action incluye todas las severidades en el SARIF | Documentado. Las 3 son LOW; los gates (que sí filtran) están limpios | Code scanning |
