# =============================================================================
# Jenkins de laboratorio (local) para ejecutar el Jenkinsfile del repositorio.
# Configuración como código: plugins.txt + casc.yaml (sin pasos manuales en la UI).
# Incluye el cliente Docker (y buildx) para usar el Docker del equipo anfitrión
# a través del socket. SOLO PARA LABORATORIO: el acceso al socket equivale a
# privilegios de administrador sobre Docker del equipo.
# =============================================================================
FROM docker:29-cli AS dockercli

FROM jenkins/jenkins:lts-jdk21
USER root
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/docker-buildx /usr/local/libexec/docker/cli-plugins/docker-buildx
USER jenkins

# Sin asistente de instalación: la configuración la aplica JCasC
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false" \
    CASC_JENKINS_CONFIG=/var/jenkins_home/casc.yaml

COPY --chown=jenkins:jenkins plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
COPY --chown=jenkins:jenkins casc.yaml /var/jenkins_home/casc.yaml

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/login >/dev/null || exit 1
