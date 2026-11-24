# Anexo A5 · Diagnóstico de brechas

Se comparan cuatro fuentes:

- **A.** El pipeline de la profesora (`skills/ANALYSIS_REPORT.md`).
- **B.** La arquitectura de la Actividad 2.
- **C.** El código antes de esta actividad.
- **D.** La guía de la Actividad 3.

La última columna indica lo que se hizo. Leyenda: **Obl.** = obligatorio en la guía · **Opc.** = opcional en la guía · **—** = no lo pide la guía.

| Componente | A. Referencia profesora | B. Actividad 2 | C. Proyecto antes | D. Requisito Act. 3 | Acción tomada |
|---|---|---|---|---|---|
| Repositorio GitHub | Público, `main` sin proteger | GitHub con ramas y PR | No existía | **Obl.** | Repositorio público, PR #1 |
| README con el flujo CI/CD | README + Killercoda | — | README funcional | **Obl.** | README raíz con Mermaid y tablas |
| CI disparado por push/PR | push/PR a `main` | Sí | No existía | **Obl.** | push (todas las ramas) + PR a `main` |
| Checkout / dependencias / pruebas | `npm ci` + 5 pruebas | Pruebas unitarias y de API | Sin pruebas ni `package.json` | **Obl.** | `npm ci` + 43 pruebas, Node 22/24 |
| Cobertura | No se medía | — | — | — | LCOV + umbral 70 % (82,11 % logrado) |
| Análisis estático | Sonar (nunca corrió) | Análisis estático / lint | No existía | **Opc.** | ESLint bloqueante + SonarCloud condicional |
| Seguridad (SCA, secretos, IaC) | Trivy fs informativo; sin secretos | Secretos + dependencias | No existía | — (Act. 2) | Trivy con gates + `npm audit` + SARIF |
| Construcción de la imagen Docker | Dockerfiles de una etapa con npm | Docker opcional | No existía | **Obl.** (Jenkins) | Multi-stage endurecido; build en CI y en Jenkins |
| Escaneo de la imagen + SBOM | Gate solo del backend; sin SBOM | — | — | — | Gate HIGH/CRITICAL + SBOM en CI y Jenkins |
| Publicar en un registro | Docker Hub (placeholder, sin verificar) | — | — | **Obl.** | Push real al registro (`localhost:5000`); Docker Hub/GHCR por parámetro |
| Jenkinsfile con stages | 8 stages, sin verificar, con defectos | — (CD en Actions) | — | **Obl.** | 7 stages + post; ejecutado 4 veces en Jenkins 2.580.2 |
| Despliegue en Kubernetes | kubectl + rollback incondicional | Staging → producción | — | Contexto (fase posterior) | Manifiestos validados + stage opcional con rollback condicionado |
| Capturas de ambos pipelines | — | — | — | **Obl.** | 11 capturas reales |
| Monitoreo | Prometheus + Grafana | Logs, métricas, alertas | Solo consola | Fase posterior | Health + HEALTHCHECK + probes (base) |
| Respaldos | — | Copias cifradas | Datos cifrados en disco | — | Pendiente (operación) |

## Prioridades aplicadas

1. Primero los requisitos **obligatorios** de la guía (filas «Obl.»).
2. Después lo comprometido en la Actividad 2 que es viable sin infraestructura institucional: seguridad y Docker.
3. No se añadieron herramientas por sofisticación. Prometheus, Grafana, kind y ZAP se reservaron para las fases que anuncia la guía.
