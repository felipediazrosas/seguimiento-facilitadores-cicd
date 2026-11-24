# Matriz de cumplimiento · Actividad 3

Esta matriz relaciona cada requisito de la guía (pp. 7–10) con su implementación, el archivo y la evidencia **real**.
Los IDs coinciden con el [Anexo A1](ANEXOS/A1_MATRIZ_REQUISITOS_GUIA.md). Repositorio: https://github.com/felipediazrosas/seguimiento-facilitadores-cicd

## 1. Requisitos de la guía

| ID | Requisito de la guía | Implementación | Archivo relacionado | Evidencia | Estado |
|---|---|---|---|---|---|
| R01 | Dos pipelines: GitHub Actions y Jenkins | CI en Actions + CD en Jenkins | `.github/workflows/ci.yml`, `Jenkinsfile` | Capturas 01 y 05 | ✅ Cumplido |
| R02 | CI: compilar, testear y validar | `check:syntax`, ESLint, 43 pruebas con cobertura ≥ 70 % | `ci.yml` (job `build-test`), `package.json`, `test/` | Run 45504468140; `reportes/03`, `09` | ✅ Cumplido |
| R03 | CD para un entorno agnóstico | Agente solo con Docker; registro y destino por parámetro | `Jenkinsfile` | Builds #2 y #4 | ✅ Cumplido |
| R04 | Repositorio con el código fuente | Repositorio público | `plataforma-guia-implementacion/` | Enlace al repositorio | ✅ Cumplido |
| R05 | `.github/workflows/ci.yml` | Workflow en la ruta exacta | `.github/workflows/ci.yml` | actionlint sin hallazgos (`reportes/08`) | ✅ Cumplido |
| R06 | README que explique el flujo CI/CD | Diagrama Mermaid + tablas de jobs y stages | `README.md` (raíz) | El README se ve en GitHub | ✅ Cumplido |
| R07 | Ejecución automática en cada push o PR | `on.push` (todas las ramas, tags) + `on.pull_request` (main) | `ci.yml` | Runs con evento `push` (45504468140) y `pull_request` (45506031730) — captura 04 | ✅ Cumplido |
| R08 | Checkout del código | `actions/checkout` fijada por SHA | `ci.yml` | Log del run | ✅ Cumplido |
| R09 | Instalación de dependencias | `npm ci` con caché | `ci.yml`, `package-lock.json` | «added 80 packages» (`reportes/09`) | ✅ Cumplido |
| R10 | Ejecución de pruebas | `npm run test:coverage` | `ci.yml`, `test/*.test.js` | «tests 43 · pass 43 · fail 0» | ✅ Cumplido |
| R11 | (Opcional) Análisis estático | ESLint bloqueante; SonarCloud condicional | `eslint.config.js`, `ci.yml` (job `sonar`), `sonar-project.properties` | `reportes/01`; anotación de Sonar | ✅ ESLint · ⏳ SonarCloud pendiente de credenciales |
| R12 | Jenkinsfile con stages definidos | 7 stages + `post` | `Jenkinsfile` | Capturas 05, 11 | ✅ Cumplido |
| R13 | Stage: clonar el repositorio | «Clonar repositorio» (`checkout scm` + versión trazable) | `Jenkinsfile` | Captura 07 (clonado desde GitHub) | ✅ Cumplido |
| R14 | Stage: construir una imagen Docker | «Construir imagen Docker» (multi-stage, runtime endurecido) | `Jenkinsfile`, `Dockerfile` | `reportes/12`, `14` | ✅ Cumplido |
| R15 | Stage: publicar en un registro (Docker Hub o similar) | «Publicar imagen en el registro» (`docker push` + digest) | `Jenkinsfile`, `jenkins/compose.yaml` | Captura 10; `imagen-publicada*.txt` | ✅ Cumplido en un registro compatible · ⏳ Docker Hub pendiente de credenciales |
| R16 | (Se califica la definición; ejecutarlo no es indispensable) | Definido **y ejecutado** en un Jenkins real | `jenkins/` | Builds #2 y #4 en verde | ✅ Superado |
| R17 | Entrega a) enlace al repositorio | — | — | https://github.com/felipediazrosas/seguimiento-facilitadores-cicd | ✅ Cumplido |
| R18 | Entrega b) capturas de ambos pipelines en ejecución | 11 capturas reales | `EVIDENCIAS/capturas/` | 01–04 (Actions), 05–08 y 11 (Jenkins) | ✅ Cumplido |
| R19 | Entrega c) archivos de configuración en el repositorio | Workflow, Jenkinsfile, Dockerfile, compose, JCasC, k8s, Sonar, Dependabot | Raíz del repositorio | Árbol del repositorio | ✅ Cumplido |
| R20 | Entrega d) documentación técnica en PDF o Markdown | Informe, arquitectura, pipeline, matriz y 7 anexos | `entrega-actividad-3/` | Esta carpeta | ✅ Cumplido |

## 2. Rúbrica de la guía (pp. 9–10)

| Criterio (1.0 pt c/u) | Descriptor «Excelente» | Cómo se cumple | Evidencia |
|---|---|---|---|
| Automatiza el flujo de integración continua con etapas clave | Pipeline funcional, con etapas completas y ejecución automática | 4 jobs (build-test en matriz, security, docker, sonar); disparo por push y PR; ejecución verde; gate demostrado en rojo | Capturas 01–04; `PIPELINE_DEVOPS.md` §2 |
| Define correctamente los stages del despliegue | Jenkinsfile completo, con stages bien estructurados y justificados | 7 stages, cada uno justificado; parámetros, credenciales por ID, rollback condicionado; 4 ejecuciones reales | Capturas 05–08, 11; `PIPELINE_DEVOPS.md` §3 |
| Utiliza herramientas actuales y relevantes para CI/CD | Herramientas bien seleccionadas y justificadas según el contexto | Versiones vigentes y fijadas (Node 22/24, Jenkins 2.580.2, Trivy 0.76.2, ESLint 10, acciones v7/v8 por SHA); justificación por herramienta | `INFORME_ACTIVIDAD_3.md` §5; `ARQUITECTURA_IMPLEMENTADA.md` §3 |
| Documentación técnica | Clara, estructurada y con evidencias (capturas, código) | Informe de 15 secciones, diagramas, matrices, 11 capturas y 14 reportes de ejecución | `entrega-actividad-3/` |
| Repositorio organizado, funcional y accesible | Repositorio completo con código, configuraciones y enlaces | Público; README con badge, estructura, ejecución local y enlaces; CI en verde | Repositorio; captura 04 |

## 3. Pendientes y cómo completarlos

| Pendiente | Falta | Cómo terminarlo |
|---|---|---|
| SonarCloud | Cuenta y token del propietario | 1. sonarcloud.io → *Log in with GitHub* → importar el repositorio → desactivar *Automatic Analysis*. 2. En GitHub, *Settings → Secrets and variables → Actions*: secreto `SONAR_TOKEN` y variables `SONAR_ORGANIZATION` y `SONAR_PROJECT_KEY`. 3. Re-ejecutar el workflow: el job `sonar` deja de omitirse y espera el Quality Gate |
| Publicar en Docker Hub | Cuenta y access token de Docker Hub | 1. En Jenkins: *Manage Jenkins → Credentials* → «Username with password» con ID `registry-creds` (usar un access token). 2. *Build with Parameters*: `REGISTRY=docker.io/<usuario>`, `REGISTRY_CREDENTIALS_ID=registry-creds` |
| Despliegue en Kubernetes | Clúster autorizado (fase siguiente de la guía) | 1. Crear el Secret `plataforma-guia-secrets` (comando en `k8s/base/deployment.yaml`). 2. Credencial `kubeconfig` (Secret file) en Jenkins. 3. Agente con `kubectl`. 4. `DEPLOY_TARGET=kubernetes` |
| Protección de la rama `main` | Configuración del propietario | *Settings → Rules → New ruleset*: exigir PR y los checks `Build, lint y pruebas (Node 22)`, `Build, lint y pruebas (Node 24)`, `Seguridad del repositorio (Trivy + npm audit)` e `Imagen Docker (build, smoke test y Trivy)` |
| SheetJS 0.18.5 | Validación con el Excel real | Reemplazar `vendor/xlsx.full.min.js` por la 0.20.3 de `cdn.sheetjs.com` y probar «Actualizar desde Excel» y «Llevar al Excel» |
