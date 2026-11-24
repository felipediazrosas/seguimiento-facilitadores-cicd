# Anexo A2 · Continuidad con la Actividad 2

**Fuentes:** *Actividad_2_Arquitectura_DevOps_Felipe_Diaz.pdf* (14-nov-2026), su Figura 1 (*Diseño de arquitectura DevOps para una plataforma de seguimiento operativo.png*) y *Documentacion_Plataforma_Guia_Estandarizacion.docx* (v1.2.0).

## 1. Lo que definió la Actividad 2

| Aspecto | Definición en la Actividad 2 |
|---|---|
| Escenario | Aplicación web de seguimiento operativo de tutores: Coordinación (vista general, cargas, usuarios, indicaciones) y tutor (cursos, checklists, cierres, novedades), con importación y exportación de Excel |
| Arquitectura | Tres capas: presentación, servidor de aplicación (Node.js, API REST) y persistencia (base institucional por definir con TI; almacenamiento temporal admisible si protege, respalda y recupera) |
| Seguridad | HTTPS, cuentas individuales, autorización en el servidor, derivación segura de contraseñas con sal, cookies protegidas, claves fuera del repositorio, Excel fuera de Git y de las imágenes (OWASP) |
| Flujo CI/CD | Git con ramas y PR → GitHub Actions (lint, pruebas unitarias, pruebas de API, construcción, análisis de dependencias) → imagen Docker → staging → aprobación → producción, con respaldo previo y reversión |
| Docker | «Opcional»: para estandarizar entornos, no indispensable en la primera versión |
| Monitoreo | Logs, disponibilidad, tasa de errores, tiempo de respuesta, alertas |
| Implementación por etapas | 1) repositorio + CI con pruebas y análisis de dependencias; 2) entorno de pruebas + despliegue automatizado; 3) base institucional e inicio de sesión corporativo; 4) monitoreo, alertas, respaldos |

## 2. Matriz de continuidad

| Componente | Definido en la Actividad 2 | Situación al iniciar la Actividad 3 | Acción en la Actividad 3 |
|---|---|---|---|
| Control de versiones | GitHub con ramas y pull requests | El código era un ZIP sin repositorio | Repositorio público creado; flujo rama → PR → CI → fusión demostrado (PR #1) |
| Integración continua | GitHub Actions: lint, pruebas unitarias, pruebas de API, compilación | No existía | `ci.yml`: sintaxis, ESLint y 43 pruebas (unitarias y de API HTTP) en Node 22/24, con cobertura ≥ 70 % |
| Análisis de dependencias | Escaneo de secretos y de dependencias | No existía | Trivy (secretos, SCA, misconfig) + `npm audit` como gates; SARIF en GitHub Security; Dependabot |
| Aplicación | Interfaz web + Node.js con API REST | Implementada (`server/server.js`, sin dependencias de ejecución) | Sin cambios funcionales; solo se exporta el servidor para poder probarlo |
| Autenticación y autorización en el servidor | Validar en el servidor, no solo en el frontend | Implementada (scrypt, cookies HttpOnly/SameSite, permisos por rol) | Ahora **verificada automáticamente**: 22 pruebas de integración de la API (autenticación, autorización por rol, cifrado en disco y protección de archivos) |
| Persistencia | Base institucional por definir con TI; almacenamiento temporal protegido | Archivos JSON cifrados AES-256-GCM | Se mantiene. En contenedor: volumen `/data`; en k8s: PVC. La base institucional sigue pendiente de TI |
| Contenedorización | Docker opcional | No existía | **Se materializa**: la guía de la Actividad 3 exige construir y publicar una imagen Docker |
| Despliegue | Flujo CD de **GitHub Actions** hacia staging y producción | No existía | **Ajuste justificado:** la guía de la Actividad 3 exige el CD con **Jenkins**. El Jenkinsfile publica la imagen y puede desplegar en Kubernetes (opcional) |
| Staging / aprobación / producción | Entorno de pruebas, aprobación controlada y producción | No existía | Parcial: prueba de humo de la imagen en cada build; despliegue a k8s detrás de un parámetro explícito (sin producción, que requiere infraestructura de TI) |
| Respaldo y rollback | Copias cifradas y reversión a la versión anterior | No existía | Rollback condicionado (`kubectl rollout undo` solo si el despliegue empezó), `revisionHistoryLimit: 5`; los datos quedan en el volumen cifrado. Respaldos programados: pendientes (fase de operación) |
| Monitoreo y logs | Disponibilidad, errores, tiempos, alertas | Solo logs de consola | Parcial: HEALTHCHECK de Docker y probes de k8s sobre `/api/health`. Prometheus/alertas: fase posterior anunciada por la guía (p. 8) |
| Excel fuera de Git y de las imágenes | Requisito de seguridad | `.gitignore` con `*.xlsx` | Reforzado: `.dockerignore` y `.gitignore` raíz; Trivy de secretos en cada push |

## 3. Diferencias registradas (no resueltas de forma arbitraria)

| # | Diferencia | Fuente A | Fuente B | Decisión |
|---|---|---|---|---|
| D1 | Herramienta de CD | Actividad 2: «Flujo CD de GitHub Actions» | Guía de la Actividad 3: «Pipeline CD con Jenkins» | Manda la guía académica: **Jenkins** para el CD. GitHub Actions conserva el CI, como definió la Actividad 2 |
| D2 | Docker | Actividad 2: opcional | Guía de la Actividad 3: construir y publicar una imagen Docker | Manda la guía: Docker se vuelve obligatorio |
| D3 | Número de controles del estándar | Documentación de la plataforma, sección 7: «63 controles en nueve etapas» | Código `js/estandar.js`: 62 controles | No se modifica ninguna de las dos. Se informa a los autores. Las pruebas verifican las invariantes que sí coinciden (9 etapas, 16 plantillas, 11 controles diarios) |
| D4 | Autoría | Actividad 2: Luis Felipe Diaz Rosas | README y docx de la plataforma: Sebastián Castellanos Escárraga y André Leonard Duque Aricapa | El código de la aplicación se atribuye a sus autores en el README; la arquitectura y la implementación CI/CD, a Luis Felipe Diaz Rosas |
