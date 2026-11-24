# Anexo A4 · Uso de la biblioteca de Skills DevOps/DevSecOps

La biblioteca `skills/` (17 skills, README, INDEX, ANALYSIS_REPORT, IMPLEMENTATION_GUIDE, PROJECT_ADAPTATION_GUIDE y PROGRESS) es la ingeniería inversa del proyecto de referencia de la profesora, `lab-devsecops-killercoda`: un microservicio Node/Express con frontend Nginx, CI en GitHub Actions, CD en Jenkins, SonarQube, Trivy, kind, Prometheus y Grafana.
Se usó como **metodología**. Se siguió la skill orquestadora 16 (8 pasos) y se adaptó cada plantilla a esta aplicación; no se copiaron configuraciones incompatibles.

## 1. Matriz de aplicabilidad

| Skill | Aplicabilidad | Componente del proyecto | Acción realizada |
|---|---|---|---|
| 00 project-discovery | Aplica | Todo el proyecto | Inventario y línea base en una copia (Anexo A3) |
| 01 devops-architecture | Aplica | Diseño del pipeline | Matriz de etapas, herramientas y gates (`PIPELINE_DEVOPS.md`) |
| 02 git-version-control | Aplica | Repositorio | `.gitignore`, `.gitattributes`, Dependabot, trunk-based con PR. Protección de rama: instrucciones al propietario |
| 03 ci-pipeline | Aplica (núcleo) | `.github/workflows/ci.yml` | Plantilla adaptada: permisos por job, SHA pinning, `concurrency`, `timeout-minutes`, `needs`, caché npm, matriz Node 22/24 |
| 04 automated-testing | Aplica (núcleo) | `test/` | `node:test` sin dependencias, como la referencia; servidor importable; 43 pruebas; LCOV; umbral 70 % |
| 05 code-quality | Aplica parcialmente | ESLint + SonarCloud | ESLint bloqueante. SonarCloud preparado con el patrón condicional correcto (sin la errata `SONAR_TOKE`); pendiente del token |
| 06 devsecops-security | Aplica | Jobs `security` y `docker`, stage Trivy | Trivy fs (secret, vuln, misconfig) + gates, Trivy image + gate, SBOM CycloneDX, SARIF. DAST (ZAP): no aplica sin entorno desplegado |
| 07 docker-containerization | Aplica (núcleo) | `Dockerfile`, `compose.yaml`, `.dockerignore` | Multi-stage (test/runtime), runtime sin npm, no root, solo lectura, HEALTHCHECK, labels OCI |
| 08 artifact-management | Aplica | Stage «Publicar» | Tag `<commit>-b<build>`, digest registrado, labels OCI, SBOM archivado |
| 09 cd-deployment | Aplica (núcleo) | `Jenkinsfile` | Plantilla del Jenkinsfile **corregido**: rollback condicionado (`DEPLOY_STARTED`), overlay con la imagen exacta, gate en toda imagen. `cd.yml` de Actions: no aplica (la guía exige Jenkins) |
| 10 infrastructure-as-code | Aplica parcialmente | `k8s/base/` | Kustomize, PSA `restricted`, `securityContext` endurecido, NetworkPolicy, PVC. kind/Terraform: no aplican en esta fase |
| 11 secrets-configuration | Aplica | `.env.example`, Secret k8s, credenciales Jenkins | Ningún valor en el repositorio; `jenkins/.env` ignorado; credenciales por ID |
| 12 monitoring-observability | No aplica en esta fase | — | La guía la anuncia como fase posterior. Se dejó health y probes como base |
| 13 rollback-recovery | Aplica parcialmente | `post.failure` del Jenkinsfile | Rollback solo si el despliegue empezó (probado: build #3 no revirtió). Prueba de rollback en un clúster: pendiente de la fase k8s |
| 14 devops-documentation | Aplica | README + `entrega-actividad-3/` | Diagramas Mermaid, matrices, evidencias |
| 15 pipeline-validation | Aplica | Validación | Validación estática (actionlint, hadolint, kubeconform, Trivy config), dinámica (Docker, Jenkins) y negativa (gate rojo; fallo sin rollback) |
| 16 project-adaptation | Aplica (orquestadora) | Proceso completo | 8 pasos seguidos; esta carpeta es el reporte de adaptación |

## 2. Buenas prácticas de la referencia que se conservaron

- `node:test` nativo, sin dependencias de prueba.
- Pruebas como puerta de entrada (`needs: build-test`).
- Trivy como herramienta única para dependencias, IaC e imagen.
- Gate con `ignore-unfixed`.
- Acción de Trivy fijada por SHA (`ed142fd…`, v0.36.0).
- Contenedores no root.
- Probes sobre el endpoint de health.
- Jenkins con `withCredentials` y `--password-stdin`.

## 3. Defectos de la referencia que se evitaron

| Defecto documentado en `ANALYSIS_REPORT.md` | Cómo se evitó aquí | Evidencia |
|---|---|---|
| El CI nunca terminó en verde (4/4 ejecuciones rojas) | CI verde en la primera ejecución | Run 45504468140 |
| CRITICAL heredado del npm de la imagen base | Runtime sin npm/npx/corepack/yarn; base `node:24-alpine` vigente | Trivy imagen: 0 HIGH/CRITICAL |
| Sonar nunca se ejecutó (secreto ausente; errata `SONAR_TOKE`) | Mismo nombre en `env` e `if`, aviso explícito en el log, Quality Gate con `wait=true` | Anotación de advertencia en el run |
| `post.failure` revertía aunque fallara una prueba | `DEPLOY_STARTED` asignada en el stage | Build #3: «Fallo previo al despliegue: no se hace rollback» |
| `kubectl apply` pisaba la imagen con `1.0.0` | Overlay de kustomize con `images:` | Overlay de prueba renderizado con la imagen exacta |
| Versión `1.0.${BUILD_NUMBER}` sin vínculo al commit | `<sha12>-b<build>` + label `org.opencontainers.image.revision` | `imagen-publicada.txt` |
| Sin `.gitignore` (token filtrado en un PR) | `.gitignore` en dos niveles + gate de secretos en cada push | Trivy secret: 0 |
| Gate solo del backend | Una sola imagen, siempre escaneada (CI y Jenkins) | Jobs `docker` y stage Trivy |
| Permisos globales; acciones por tag; sin `concurrency` ni timeouts | `permissions: {}` + permisos por job; todas las acciones por SHA; `concurrency` y `timeout-minutes` | `ci.yml`; actionlint sin hallazgos |
| `curl \| sh` de Trivy desde `main` | Imagen `aquasec/trivy:0.76.2` fijada | Jenkinsfile, `ci.yml` (`version: v0.76.2`) |

## 4. Tecnologías de la referencia que no se usaron (y por qué)

| Tecnología | Motivo |
|---|---|
| Nginx como frontend + proxy | La aplicación ya sirve el sitio y la API desde un solo proceso Node; una segunda imagen no aporta nada |
| Express / prom-client / lodash | La aplicación no tiene dependencias de ejecución; añadirlas aumentaría la superficie de ataque sin necesidad funcional |
| kind + Prometheus/Grafana | Fases posteriores anunciadas por la guía (k8s real y monitoreo) |
| Docker Hub como único registro | Se parametriza: registro local compatible con Docker Hub en el laboratorio; Docker Hub o GHCR con una credencial |
