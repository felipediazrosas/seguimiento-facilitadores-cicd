# Entrega · Actividad 3: Laboratorio técnico

**Diplomado en Fundamentos DevOps · Universidad de La Sabana**
Estudiante: Luis Felipe Diaz Rosas · Docente: María Fernanda Ochoa Paipilla · 24 de noviembre de 2026

| Entregable de la guía | Dónde está |
|---|---|
| a) Enlace al repositorio de GitHub | https://github.com/felipediazrosas/seguimiento-facilitadores-cicd |
| b) Capturas del pipeline en ejecución (GitHub Actions y Jenkins) | [EVIDENCIAS/capturas/](EVIDENCIAS/capturas/) · índice en [EVIDENCIAS/README.md](EVIDENCIAS/README.md) |
| c) Archivos de configuración en el repositorio | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) · [`Jenkinsfile`](../Jenkinsfile) · [`Dockerfile`](../plataforma-guia-implementacion/Dockerfile) · [`compose.yaml`](../plataforma-guia-implementacion/compose.yaml) · [`jenkins/`](../jenkins/) · [`k8s/base/`](../k8s/base/) |
| d) Documentación técnica (Markdown) | Esta carpeta |

## Cómo leer esta entrega

1. **[INFORME_ACTIVIDAD_3.md](INFORME_ACTIVIDAD_3.md):** el informe completo (introducción → conclusiones y referencias). **Empezar aquí.**
2. **[PIPELINE_DEVOPS.md](PIPELINE_DEVOPS.md):** cada etapa del CI y cada stage del CD, con sus disparadores, gates y justificación.
3. **[ARQUITECTURA_IMPLEMENTADA.md](ARQUITECTURA_IMPLEMENTADA.md):** la arquitectura de la Actividad 2 materializada, la integración de herramientas y las decisiones tomadas (ADR).
4. **[MATRIZ_CUMPLIMIENTO.md](MATRIZ_CUMPLIMIENTO.md):** cada requisito y cada criterio de la rúbrica con su evidencia, y los pendientes con instrucciones.
5. **[EVIDENCIAS/](EVIDENCIAS/README.md):** 11 capturas, 14 reportes de ejecución, artefactos de Jenkins y diagramas.
6. **[ANEXOS/](ANEXOS/):** el análisis previo:

| Anexo | Contenido |
|---|---|
| [A1](ANEXOS/A1_MATRIZ_REQUISITOS_GUIA.md) | Matriz de requisitos extraída de la guía, con trazabilidad por página |
| [A2](ANEXOS/A2_CONTINUIDAD_ACTIVIDAD_2.md) | Continuidad con la Actividad 2 y diferencias registradas |
| [A3](ANEXOS/A3_DIAGNOSTICO_TECNICO.md) | Diagnóstico técnico de la aplicación (línea base verificada) |
| [A4](ANEXOS/A4_MATRIZ_SKILLS.md) | Uso de la biblioteca de skills y comparación con el proyecto de referencia |
| [A5](ANEXOS/A5_DIAGNOSTICO_BRECHAS.md) | Diagnóstico de brechas |
| [A6](ANEXOS/A6_VALIDACION_Y_PRUEBAS.md) | Validación (33 verificaciones con estado), riesgos aceptados y problemas resueltos |
| [A7](ANEXOS/A7_REGISTRO_AVANCES.md) | Registro de avances |

## Resultado en una línea

El **CI (GitHub Actions)** se ejecuta en cada push y PR: lint, 43 pruebas con 82 % de cobertura, Trivy, imagen Docker con prueba de humo y SBOM. Está en verde, y su gate se demostró en rojo.
El **CD (Jenkins)** clona, valida, construye, escanea y **publica** la imagen en un registro. Se ejecutó de forma automática tras fusionar un PR, con rollback condicionado verificado.

| Estado | Elementos |
|---|---|
| ✅ Cumplidos | Los 20 requisitos de la guía |
| ⏳ Pendientes de credenciales del propietario | SonarCloud y Docker Hub |
| 🔜 Fases siguientes anunciadas por la guía | Kubernetes y monitoreo |
