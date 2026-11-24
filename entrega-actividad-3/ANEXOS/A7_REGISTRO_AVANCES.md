# Anexo A7 · Registro de avances

Bitácora de la ejecución (24-nov-2026, hora UTC−5). Las salidas citadas son textuales.

| # | Fase | Actividad | Resultado observado |
|---|---|---|---|
| 1 | Estructura | Verificar el directorio y comparar el ZIP con la carpeta | 7 entradas esperadas presentes; ZIP = carpeta (17 MD5 idénticos) |
| 2 | Fase 1 | Leer la guía U2 (10 páginas, imágenes incluidas) | Requisitos de la Actividad 3 en pp. 7–10 → Anexo A1 |
| 3 | Fase 2 | Leer la Actividad 2 (PDF + PNG) y el docx de la plataforma | Arquitectura de 3 capas, CI en Actions, CD en Actions, Docker opcional → Anexo A2 |
| 4 | Fase 3 | Analizar el código y ejecutar la línea base en una copia | `{"ok":true,"auth":true,"encrypted":true}`, login 200, `server.js` 403 |
| 5 | Fase 4 | Leer las 17 skills y los 6 documentos raíz | Matriz → Anexo A4 |
| 6 | Fase 5–6 | Diagnóstico de brechas y diseño | Anexos A5 y `PIPELINE_DEVOPS.md` |
| 7 | F1 | `package.json`, ESLint, pruebas, refactor mínimo de `server.js` | 43/43; cobertura 82,11 %; lint 0 |
| 8 | F1 | Regresión de la ejecución directa | `Plataforma en http://localhost:18081 · datos en … (cifrados AES-256-GCM)` y health OK |
| 9 | F4 | Build de las imágenes `test` y `runtime` | `ℹ tests 43 · pass 43 · fail 0` dentro del build |
| 10 | F4 | Smoke del contenedor endurecido | `uid=1000(node)` · `touch: /app/x: Read-only file system` · `health=healthy` · npm ausente |
| 11 | F5 | Trivy fs/imagen/config, hadolint, compose | 0 HIGH/CRITICAL; hadolint 0; compose válido |
| 12 | F6 | k8s: kustomize, kubeconform y un overlay de prueba | `Valid: 5, Invalid: 0`; `image: localhost:5000/plataforma-guia:abc123-b7` |
| 13 | F2 | `ci.yml`, Jenkinsfile, Dependabot, Sonar | actionlint 0 hallazgos (tras corregir SC2034) |
| 14 | F0 | `git init`, escaneo de secretos antes del commit | Trivy secret/misconfig: 0 |
| 15 | Publicación (autorizada por el propietario) | Crear el repositorio público y hacer push | Primer push rechazado (falta el scope `workflow`); tras `gh auth refresh`, push OK |
| 16 | CI | Primera ejecución | Run 45504468140: **success** (5 jobs) |
| 17 | CD | Jenkins con JCasC + registro local | Job `plataforma-guia-cd` creado; build #1 FAILURE (repositorio aún vacío al hacer el poll) |
| 18 | CD | Build #2 manual | **SUCCESS**: `localhost:5000/plataforma-guia:9b1ea5698736-b2`, digest `sha256:c3734b01…` |
| 19 | Validación negativa | Rama `test/gate-pruebas-falla` | Run 45504969995 **failure** (`actual: 0.73, expected: 0.5`); rama eliminada |
| 20 | Validación negativa | Build #3 con `REGISTRY=localhost:5999` | FAILURE en «Publicar» → «Fallo previo al despliegue: no se hace rollback» |
| 21 | Corrección | Revisión de logs: clave efímera visible (set -x) | PR #1 → CI `pull_request` y `push` en verde → squash merge |
| 22 | CD | Build #4 automático (pollSCM) | **SUCCESS**, «Started by an SCM change», imagen `62fdfcce921e-b4`, sin claves en el log |
| 23 | Evidencias | 11 capturas con Chrome headless; 14 reportes de texto | `EVIDENCIAS/` |
| 24 | Seguridad | Revisar Code scanning | 3 alertas LOW; DS-0026 corregida en `jenkins/Dockerfile` |
