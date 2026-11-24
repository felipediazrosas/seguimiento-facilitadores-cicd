# Anexo A1 · Matriz de requisitos de la Actividad 3

**Fuente:** *Guía de actividades U2* (Universidad de La Sabana), páginas 7 a 10, sección «Actividad 3: Laboratorio técnico (Evaluativa)».
Solo se listan los requisitos escritos en la guía; no se agregaron requisitos propios. El estado corresponde al cierre de la entrega (24-nov-2026).

## Datos generales (guía, p. 7)

| Campo | Valor en la guía |
|---|---|
| Tiempo estimado | 8 horas |
| Tipo de trabajo | Individual |
| Descripción | «Configurar un pipeline CI/CD básico usando Jenkins, GitHub Actions» |
| Contexto (p. 8) | Primer entregable del proyecto: fase de estructuración. Se crean **dos pipelines** (CI y CD) para una aplicación web con código en Git que **se desplegará en un clúster de Kubernetes**. El estudiante establece los stages y elige las herramientas |
| Fases posteriores anunciadas (p. 8) | Implementación real en un entorno k8s, ejecución de conectores de seguridad y habilitación de monitoreo (no se evalúan en esta actividad) |

## Requisitos

| ID | Requisito de la Actividad 3 | Sección de la guía | Acción técnica necesaria | Evidencia esperada | Estado |
|---|---|---|---|---|---|
| R01 | Configurar dos pipelines: uno con GitHub Actions y otro con Jenkins | Objetivo del laboratorio (p. 8) | Crear `.github/workflows/ci.yml` y `Jenkinsfile` | Ambos archivos en el repositorio | Cumplido |
| R02 | CI: compilar, testear y validar el código de una aplicación web alojada en GitHub | Objetivo (p. 8) | Job con validación de sintaxis, ESLint y pruebas automatizadas | Ejecución verde en Actions | Cumplido |
| R03 | CD: definición de un pipeline de despliegue para un entorno agnóstico | Objetivo (p. 8) | Jenkinsfile que solo depende de Docker; destino parametrizable (registro y Kubernetes opcional) | Jenkinsfile + ejecución | Cumplido |
| R04 | A. Repositorio en GitHub con el código fuente de la aplicación | Entregable A (p. 8) | Crear el repositorio y subir el código | Enlace público | Cumplido |
| R05 | A. Archivo de configuración del pipeline CI en `.github/workflows/ci.yml` | Entregable A (p. 8) | Workflow en esa ruta exacta | Archivo en el repositorio | Cumplido |
| R06 | A. Documentación básica (`README.md`) que explique el flujo CI/CD | Entregable A (p. 8) | README raíz con diagrama y tabla de etapas | `README.md` | Cumplido |
| R07 | B. El CI se ejecuta automáticamente ante cada push o pull request | Entregable B (p. 8) | `on: push` (todas las ramas) y `on: pull_request` (hacia `main`) | Ejecuciones con evento `push` y `pull_request` | Cumplido |
| R08 | B. Checkout del código | Entregable B (p. 8) | `actions/checkout` | Log del job | Cumplido |
| R09 | B. Instalación de dependencias | Entregable B (p. 8) | `npm ci` desde el lockfile | Log («added 80 packages») | Cumplido |
| R10 | B. Ejecución de pruebas | Entregable B (p. 8) | `npm run test:coverage` (43 pruebas, umbral de cobertura) | Log («tests 43 · pass 43») | Cumplido |
| R11 | B. (Opcional) Análisis estático de código | Entregable B (p. 8) | ESLint (bloqueante) + SonarCloud (opcional, por secreto) | Log de ESLint; aviso de Sonar | Cumplido (ESLint). SonarCloud: pendiente de credenciales |
| R12 | C. Jenkinsfile con los stages definidos | Entregable C (p. 8) | Pipeline declarativo | `Jenkinsfile` | Cumplido |
| R13 | C. Stage: clonar el repositorio | Entregable C (p. 8) | `checkout scm` | Stage «Clonar repositorio» | Cumplido |
| R14 | C. Stage: construir una imagen Docker | Entregable C (p. 8) | `docker build --target runtime` | Stage «Construir imagen Docker» | Cumplido |
| R15 | C. Stage: publicar la imagen en un registro (Docker Hub o similar) | Entregable C (p. 8) | `docker push` a un registro parametrizable | Stage «Publicar imagen en el registro» + catálogo del registro | Cumplido (registro local compatible con Docker Hub; Docker Hub: pendiente de credenciales) |
| R16 | C. No es indispensable que el pipeline funcione; se califica la definición de los stages | Entregable C (p. 8) | — (aun así se ejecutó en un Jenkins real) | Builds #2 y #4 en verde | Superado |
| R17 | Entrega a): enlace al repositorio de GitHub | Instrucciones de entrega (p. 8) | Publicar el repositorio | https://github.com/felipediazrosas/seguimiento-facilitadores-cicd | Cumplido |
| R18 | Entrega b): capturas del pipeline en ejecución (GitHub Actions y Jenkins) | Instrucciones de entrega (p. 8) | Capturas reales de ambas herramientas | `EVIDENCIAS/capturas/` (11 PNG) | Cumplido |
| R19 | Entrega c): archivos de configuración incluidos en el repositorio | Instrucciones de entrega (p. 9) | Versionar workflow, Jenkinsfile, Dockerfile, compose, k8s y JCasC | Árbol del repositorio | Cumplido |
| R20 | Entrega d): documento PDF o Markdown con la documentación técnica | Instrucciones de entrega (p. 9) | Informe en Markdown | `INFORME_ACTIVIDAD_3.md` y anexos | Cumplido |

## Rúbrica de evaluación (guía, pp. 9–10)

| Criterio | Puntos | Nivel «Excelente» según la guía | Dónde se responde |
|---|---|---|---|
| Automatiza el flujo de integración continua con etapas clave | 1.0 | Pipeline funcional, con etapas completas y ejecución automática | `PIPELINE_DEVOPS.md` §2; capturas 01–04 |
| Define correctamente los stages del despliegue | 1.0 | Jenkinsfile completo, con stages bien estructurados y justificados | `PIPELINE_DEVOPS.md` §3; capturas 05–08 |
| Utiliza herramientas actuales y relevantes para CI/CD | 1.0 | Herramientas bien seleccionadas y justificadas según el contexto | `INFORME_ACTIVIDAD_3.md` §5 |
| Documentación técnica | 1.0 | Documentación clara, estructurada y con evidencias (capturas, código) | Esta carpeta |
| Repositorio organizado, funcional y accesible | 1.0 | Repositorio completo con código, configuraciones y enlaces | `README.md` raíz |
| **Total** | **5.0** | | `MATRIZ_CUMPLIMIENTO.md` §2 |

## Observaciones sobre la guía

- La sección «Recomendaciones para la realización» de la Actividad 3 (p. 9) habla de un «cuestionario» con «1 pregunta abierta». Parece heredada de otra actividad: no hay preguntas en la Actividad 3. Se registra la diferencia y no se le asigna ningún entregable.
- La rúbrica de la Actividad 2 aparece en la p. 7, justo antes del título de la Actividad 3. La rúbrica que aplica a esta actividad es la de las pp. 9–10.
