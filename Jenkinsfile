// =============================================================================
// Jenkinsfile — Pipeline de CD (entrega continua) de la plataforma
// «Guía de estandarización y seguimiento de facilitadores»
// Actividad 3 · Laboratorio técnico · Diplomado en Fundamentos DevOps
//
// Stages exigidos por la guía:  Clonar repositorio → Construir imagen Docker →
//                               Publicar la imagen en un registro (Docker Hub o similar)
// Stages añadidos (justificados en entrega-actividad-3/PIPELINE_DEVOPS.md):
//   Validar (lint + pruebas) · Prueba de humo · Escaneo de seguridad (Trivy) ·
//   Desplegar (opcional, Kubernetes) con rollback condicionado.
//
// Entorno agnóstico: el agente solo necesita Docker (y kubectl si se despliega).
// Node.js, ESLint y Trivy se ejecutan en contenedores con versión fijada.
// Basado en skills/09-cd-deployment/templates/Jenkinsfile, que corrige los
// defectos del Jenkinsfile de referencia (rollback incondicional, imagen sin
// trazabilidad al commit, apply que pisa la imagen, gate parcial).
//
// Credenciales de Jenkins (se crean en Jenkins, nunca en el repositorio):
//   registry-creds  Usuario/contraseña (token) del registro. No se necesita
//                   para el registro local de laboratorio (localhost:5000).
//   kubeconfig      Secret file con un kubeconfig limitado al namespace (solo
//                   si DEPLOY_TARGET = kubernetes).
// =============================================================================
pipeline {
  agent any

  parameters {
    string(name: 'REGISTRY', defaultValue: 'localhost:5000',
           description: 'Registro de imágenes: localhost:5000 (registro local de laboratorio), docker.io/<usuario> (Docker Hub) o ghcr.io/<owner>')
    string(name: 'REGISTRY_CREDENTIALS_ID', defaultValue: '',
           description: 'ID de la credencial usuario/token del registro (p. ej. registry-creds). Vacío = registro sin autenticación')
    booleanParam(name: 'PUSH_LATEST', defaultValue: false,
           description: 'Publicar también la etiqueta «latest» (nunca se usa para desplegar)')
    choice(name: 'DEPLOY_TARGET', choices: ['none', 'kubernetes'],
           description: 'Destino de despliegue. «none» = solo entrega (publicar la imagen)')
  }

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    APP_DIR      = 'plataforma-guia-implementacion'
    IMAGE_NAME   = 'plataforma-guia'
    TRIVY_IMAGE  = 'aquasec/trivy:0.76.2'
    K8S_NAMESPACE = 'seguimiento'
    // DEPLOY_STARTED NO se declara aquí: las variables de environment{} no se pueden
    // reasignar desde script{}. Se asigna en el stage «Desplegar» y se lee en post.
  }

  stages {
    stage('Clonar repositorio') {
      steps {
        checkout scm
        script {
          env.GIT_SHORT = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
          env.GIT_FULL  = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
          env.VERSION   = "${env.GIT_SHORT}-b${env.BUILD_NUMBER}"   // trazable al commit y al build
          env.IMAGE_REF = "${params.REGISTRY}/${env.IMAGE_NAME}:${env.VERSION}"
        }
        sh 'git log -1 --format="Commit %H · %an · %s"'
        echo "Imagen a construir: ${env.IMAGE_REF}"
      }
    }

    stage('Validar (lint + pruebas)') {
      steps {
        // Etapa «test» del Dockerfile: npm ci + ESLint + 43 pruebas automatizadas.
        // Si una prueba falla, docker build termina con error y el pipeline se detiene.
        sh 'docker build --target test -t "$IMAGE_NAME:test-$VERSION" "$APP_DIR"'
      }
    }

    stage('Construir imagen Docker') {
      steps {
        sh '''
          docker build --target runtime \
            --build-arg APP_VERSION="$VERSION" \
            --build-arg VCS_REF="$GIT_FULL" \
            -t "$IMAGE_REF" "$APP_DIR"
          docker image inspect "$IMAGE_REF" \
            --format 'Imagen {{index .RepoTags 0}} · {{.Size}} bytes · usuario {{.Config.User}} · revisión {{index .Config.Labels "org.opencontainers.image.revision"}}'
        '''
      }
    }

    stage('Prueba de humo del contenedor') {
      steps {
        sh '''
          SMOKE="smoke-$BUILD_TAG"
          # Clave efímera: se desactiva el trazado (set -x de Jenkins) para que no aparezca en el log
          set +x
          SMOKE_KEY="$(od -An -N16 -tx1 /dev/urandom | tr -d ' \\n')"
          export DATA_KEY="$SMOKE_KEY" ADMIN_PASS="$SMOKE_KEY"
          echo "+ docker run -d --name $SMOKE (DATA_KEY y ADMIN_PASS efímeras, ocultas) $IMAGE_REF"
          docker run -d --name "$SMOKE" --read-only --tmpfs /tmp --cap-drop ALL \
            --security-opt no-new-privileges:true \
            -e DATA_KEY -e ADMIN_USER=smoke -e ADMIN_PASS "$IMAGE_REF"
          unset SMOKE_KEY DATA_KEY ADMIN_PASS
          set -x
          for _ in $(seq 1 30); do
            if docker exec "$SMOKE" wget -qO- http://127.0.0.1:8080/api/health 2>/dev/null; then echo; break; fi
            sleep 1
          done
          docker exec "$SMOKE" wget -qO- http://127.0.0.1:8080/api/health | grep -q '"ok":true'
          test "$(docker exec "$SMOKE" id -u)" != "0"
          echo "Prueba de humo OK: /api/health responde y el proceso no corre como root"
        '''
      }
      post {
        always { sh 'docker rm -f "smoke-$BUILD_TAG" >/dev/null 2>&1 || true' }
      }
    }

    stage('Escaneo de seguridad (Trivy)') {
      steps {
        sh '''
          TRIVY="docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache $TRIVY_IMAGE"
          $TRIVY image --quiet --severity HIGH,CRITICAL --format table "$IMAGE_REF" > trivy-imagen.txt
          $TRIVY image --quiet --format cyclonedx "$IMAGE_REF" > sbom-plataforma-guia.json
          cat trivy-imagen.txt
          # Quality gate: bloquea la publicación si hay HIGH/CRITICAL con corrección disponible
          $TRIVY image --quiet --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 "$IMAGE_REF"
        '''
      }
      post {
        always { archiveArtifacts artifacts: 'trivy-imagen.txt,sbom-plataforma-guia.json', allowEmptyArchive: true }
      }
    }

    stage('Publicar imagen en el registro') {
      steps {
        script {
          if (params.REGISTRY_CREDENTIALS_ID?.trim()) {
            withCredentials([usernamePassword(credentialsId: params.REGISTRY_CREDENTIALS_ID,
                                              usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
              sh 'echo "$REG_PASS" | docker login "${REGISTRY%%/*}" -u "$REG_USER" --password-stdin'
            }
          } else {
            echo "Registro sin autenticación: ${params.REGISTRY}"
          }
        }
        sh '''
          docker push "$IMAGE_REF"
          if [ "$PUSH_LATEST" = "true" ]; then
            docker tag "$IMAGE_REF" "$REGISTRY/$IMAGE_NAME:latest"
            docker push "$REGISTRY/$IMAGE_NAME:latest"
          fi
          DIGEST=$(docker image inspect "$IMAGE_REF" --format '{{index .RepoDigests 0}}')
          echo "Publicada: $IMAGE_REF"
          echo "Digest inmutable: $DIGEST"
          printf 'imagen=%s\\ndigest=%s\\ncommit=%s\\nbuild=%s\\n' "$IMAGE_REF" "$DIGEST" "$GIT_FULL" "$BUILD_NUMBER" > imagen-publicada.txt
        '''
        archiveArtifacts artifacts: 'imagen-publicada.txt'
      }
    }

    stage('Desplegar (Kubernetes)') {
      when { expression { params.DEPLOY_TARGET == 'kubernetes' } }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          script { env.DEPLOY_STARTED = 'true' }
          sh '''
            # Overlay con la imagen EXACTA publicada (no se aplica la base con un tag genérico)
            mkdir -p .deploy
            cat > .deploy/kustomization.yaml <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources: [../k8s/base]
images:
  - {name: plataforma-guia, newName: ${REGISTRY}/${IMAGE_NAME}, newTag: ${VERSION}}
EOF
            kubectl apply -k .deploy
            kubectl -n "$K8S_NAMESPACE" annotate deploy/plataforma-guia kubernetes.io/change-cause="$VERSION" --overwrite
            kubectl -n "$K8S_NAMESPACE" rollout status deploy/plataforma-guia --timeout=180s
            kubectl -n "$K8S_NAMESPACE" exec deploy/plataforma-guia -- wget -qO- http://127.0.0.1:8080/api/health
          '''
        }
      }
    }
  }

  post {
    success {
      echo "CD completado: ${env.IMAGE_REF} construida, validada, escaneada y publicada."
    }
    failure {
      script {
        if (env.DEPLOY_STARTED == 'true') {
          withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
            sh 'kubectl -n "$K8S_NAMESPACE" rollout undo deploy/plataforma-guia || true'
          }
        } else {
          echo 'Fallo previo al despliegue: no se hace rollback (la versión en ejecución sigue intacta).'
        }
      }
    }
    always {
      sh '''
        docker image rm -f "$IMAGE_NAME:test-$VERSION" >/dev/null 2>&1 || true
        docker logout "${REGISTRY%%/*}" >/dev/null 2>&1 || true
      '''
    }
  }
}
