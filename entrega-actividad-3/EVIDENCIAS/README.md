# Evidencias · Actividad 3

Todas las evidencias se obtuvieron durante la implementación (24-nov-2026) de ejecuciones reales. Ninguna es ilustrativa.

- **Capturas:** se tomaron con Google Chrome en modo *headless* sobre las páginas reales de GitHub (sin sesión iniciada, porque el repositorio es público) y del Jenkins de laboratorio (lectura anónima habilitada solo en `127.0.0.1`).
- **Reportes:** son la salida textual de cada herramienta. En los logs de Jenkins de los builds #2 y #3 se **redactó** una clave efímera que el trazado `set -x` imprimió; el defecto se corrigió en el PR #1 (ver `ANEXOS/A6`, I8).

## Capturas (`capturas/`)

| Archivo | Herramienta | Qué demuestra |
|---|---|---|
| `01-github-actions-ci-verde.png` | GitHub Actions | Run 45504468140: push a `main`, 5 jobs en verde, 48 s, 2 artefactos, aviso de SonarCloud |
| `02-github-actions-gate-rojo.png` | GitHub Actions | Run 45504969995: prueba negativa; `build-test` rojo, `docker` y `sonar` omitidos |
| `03-github-pull-request-checks.png` | GitHub | PR #1 fusionado con 11 checks aprobados |
| `04-github-actions-historial.png` | GitHub Actions | Historial: ejecuciones por `push` y `pull_request` |
| `05-jenkins-stage-view.png` | Jenkins | *Stage view* de los builds #1–#4 y artefactos de la última ejecución estable |
| `06-jenkins-build4-pipeline.png` | Jenkins | Build #4 «ejecutado porque se detectaron cambios en el repositorio», revisión `62fdfcc` |
| `07-jenkins-build4-consola.png` | Jenkins | Consola: clonado desde GitHub y checkout de la revisión |
| `08-jenkins-build3-sin-rollback.png` | Jenkins | Build #3 (prueba negativa) fallido |
| `09-aplicacion-desde-imagen-publicada.png` | Docker | La imagen `62fdfcce921e-b4`, descargada del registro, ejecuta la aplicación |
| `10-registro-imagenes-tags.png` | Registry | `tags/list` con las dos versiones publicadas por Jenkins |
| `11-jenkins-build4-stages.png` | Jenkins | Grafo de stages del build #4: todos en verde, «Desplegar» omitido |

## Reportes (`reportes/`)

| Archivo | Contenido |
|---|---|
| `01-eslint.txt` | ESLint 10.15.0: 0 errores |
| `02-sintaxis.txt` | `node --check` de los 6 módulos |
| `03-pruebas-cobertura.txt` | 43 pruebas + tabla de cobertura |
| `04-npm-audit.txt` | 0 vulnerabilidades |
| `05-trivy-repositorio.txt` | Trivy fs (vuln, secret, misconfig) del repositorio completo |
| `06-trivy-imagen.txt` | Trivy image `plataforma-guia:local` |
| `07-trivy-k8s.txt` | Trivy config de `k8s/` (todas las severidades) |
| `08-validacion-estatica.txt` | actionlint, hadolint ×2, kubeconform, kustomize, compose ×2 |
| `09-github-actions-ci-verde.txt` | Resumen y extracto del log del run verde |
| `10-github-actions-gate-rojo.txt` | Resumen y extracto del log del run rojo |
| `11`–`14-jenkins-build-N.txt` | Consola completa de los builds #1–#4 de Jenkins |
| `jenkins-artefactos/` | Artefactos archivados por Jenkins: `trivy-imagen.txt`, `sbom-plataforma-guia.json` (CycloneDX 1.7), `imagen-publicada*.txt` (imagen, digest, commit, build) |

## Diagramas (`diagramas/`)

Fuentes Mermaid (`.mmd`) de los diagramas del informe. GitHub los muestra dentro de los `.md`.
