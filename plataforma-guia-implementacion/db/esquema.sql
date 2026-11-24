-- ============================================================
-- esquema.sql — Modelo relacional de referencia (PostgreSQL 13+)
-- Guía de estandarización y seguimiento de facilitadores
-- ------------------------------------------------------------
-- La plataforma trabaja con 6 colecciones de documentos (ver
-- docs/modelo-datos.md). Este esquema es su equivalente relacional
-- para que TI la conecte a una base institucional. Un servicio
-- intermedio (API) debe traducir tablas ↔ documentos según
-- db/contrato-api.md.
-- ============================================================

-- 0. Usuarios y roles (acceso a la plataforma) -----------------
CREATE TABLE usuario (
  usuario           VARCHAR(40)  PRIMARY KEY,           -- en minúsculas
  nombre            VARCHAR(120) NOT NULL,
  rol               VARCHAR(12)  NOT NULL CHECK (rol IN ('coordinador','facilitador')),
  facilitador       VARCHAR(120),                        -- nombre exacto en el Excel (obligatorio si rol = facilitador)
  clave_hash        CHAR(128)    NOT NULL,               -- scrypt (N=16384, 64 bytes) en hexadecimal
  clave_sal         CHAR(32)     NOT NULL,
  activo            BOOLEAN      NOT NULL DEFAULT TRUE,
  creado            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (rol = 'coordinador' OR facilitador IS NOT NULL)
);

-- 1. Facilitadores (hoja «Carga» del Excel) -------------------
CREATE TABLE facilitador (
  nombre            VARCHAR(120) PRIMARY KEY,           -- tal como aparece en el Excel
  cargo             VARCHAR(120),
  correo_inst       VARCHAR(160)                         -- solo correo institucional
);

-- 2. Cursos / asignaturas (hoja «Seguimiento Cierre Cursos») ---
CREATE TABLE curso (
  sigla             VARCHAR(60)  PRIMARY KEY,           -- «Sigla Programa»
  asignatura        VARCHAR(250) NOT NULL,
  programa          VARCHAR(250),                        -- «Nombre del programa formal»
  cohorte           VARCHAR(30),
  tipo              VARCHAR(80),                         -- Asignatura Maestría, Pregrado…
  unidad_academica  VARCHAR(120),
  fecha_inicio      DATE NOT NULL,
  fecha_cierre      DATE NOT NULL,
  num_estudiantes   INTEGER DEFAULT 0,                   -- «#ss»
  pct_carga         NUMERIC(6,4) DEFAULT 0,              -- «% Carga Programa» (0,12 = 12 %)
  tipo_aula         VARCHAR(40),
  facilitador       VARCHAR(120) REFERENCES facilitador(nombre),
  url_aula          VARCHAR(500),
  -- tareas de cierre registradas en el Excel (texto o fecha)
  t_caracterizacion VARCHAR(60),
  t_reporte_cierre  VARCHAR(60),                         -- si tiene valor, el curso está «Cerrado»
  t_notas_siga      VARCHAR(60),
  t_bi_percepcion   VARCHAR(60),
  t_exito_academico VARCHAR(60),
  t_consolidado     VARCHAR(60)
);
CREATE INDEX ix_curso_facilitador ON curso(facilitador);

-- 3. Módulos / unidades (hoja «2026») ---------------------------
CREATE TABLE modulo (
  id                SERIAL PRIMARY KEY,
  sigla             VARCHAR(60) NOT NULL REFERENCES curso(sigla) ON DELETE CASCADE,
  nombre            VARCHAR(250),                        -- «Módulo/Unidad/Lección»
  docente           VARCHAR(160),
  correo_docente    VARCHAR(160),                        -- institucional
  fecha_inicio      DATE,
  fecha_cierre      DATE,
  fecha_encuentro   DATE,                                -- encuentro sincrónico
  hora_inicio       TIME,
  hora_fin          TIME
);
CREATE INDEX ix_modulo_sigla ON modulo(sigla);
CREATE INDEX ix_modulo_encuentro ON modulo(fecha_encuentro);

-- 4. Indicaciones de Coordinación (colección «asig») ------------
CREATE TABLE indicacion (
  id                VARCHAR(40) PRIMARY KEY,
  facilitador       VARCHAR(120) NOT NULL REFERENCES facilitador(nombre),
  tipo              VARCHAR(10)  NOT NULL CHECK (tipo IN ('Tarea','Prioridad','Nota')),
  texto             TEXT NOT NULL,
  sigla             VARCHAR(60) REFERENCES curso(sigla),  -- opcional
  fecha_limite      DATE,
  estado            VARCHAR(10)  NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Hecha')),
  respuesta         TEXT,
  creada            TIMESTAMPTZ NOT NULL DEFAULT now(),
  hecha             TIMESTAMPTZ
);

-- 5. Novedades (colección «nov») --------------------------------
CREATE TABLE novedad (
  id                VARCHAR(40) PRIMARY KEY,
  facilitador       VARCHAR(120) NOT NULL REFERENCES facilitador(nombre),
  sigla             VARCHAR(60) REFERENCES curso(sigla),
  tipo              VARCHAR(40) NOT NULL,                -- Información, Aula y configuración, Docente…
  severidad         VARCHAR(5)  NOT NULL CHECK (severidad IN ('Alta','Media','Baja')),
  responsable       VARCHAR(40) NOT NULL,                -- Implementación | Escalada a Coordinación | Soporte (ticket)
  descripcion       TEXT NOT NULL,
  accion_correctiva TEXT,
  estado            VARCHAR(30) NOT NULL CHECK (estado IN ('Abierta','Escalada','Resuelta, por verificar','Cerrada y verificada')),
  creada            TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizada       TIMESTAMPTZ
);

-- 6. Checklist estándar y nota por curso (colección «seg») ------
CREATE TABLE seguimiento_curso (
  sigla             VARCHAR(60) PRIMARY KEY REFERENCES curso(sigla) ON DELETE CASCADE,
  checklist         JSONB NOT NULL DEFAULT '{}',          -- {"4-0": true, ...} etapa-control
  nota              TEXT,
  actualizado       TIMESTAMPTZ
);

-- 7. Tareas de cierre registradas en la plataforma (colección «cierre»)
CREATE TABLE cierre_curso (
  sigla             VARCHAR(60) PRIMARY KEY REFERENCES curso(sigla) ON DELETE CASCADE,
  caracterizacion   DATE, reporte_cierre DATE, notas_siga DATE,
  bi_percepcion     DATE, exito_academico DATE, consolidado DATE,
  actualizado       TIMESTAMPTZ
);

-- 8. Checklist diario del facilitador (colección «rutina») ------
CREATE TABLE rutina_diaria (
  facilitador       VARCHAR(120) NOT NULL REFERENCES facilitador(nombre),
  fecha             DATE NOT NULL,
  controles         JSONB NOT NULL DEFAULT '{}',          -- {"0-0": true, ...}
  semanal           JSONB NOT NULL DEFAULT '{}',          -- actividades de «Hoy toca»
  actualizado       TIMESTAMPTZ,
  PRIMARY KEY (facilitador, fecha)
);

-- 9. Registro de cargas del Excel (colección «excel», documento «meta»)
CREATE TABLE carga_excel (
  id                SERIAL PRIMARY KEY,
  archivo           VARCHAR(200),
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now(),
  num_cursos        INTEGER, num_modulos INTEGER
);

-- ============================================================
-- Vistas con las reglas de negocio (mismas de la plataforma)
-- ============================================================
CREATE VIEW v_curso_fase AS
SELECT c.*,
  CASE
    WHEN CURRENT_DATE - c.fecha_inicio <= -8                     THEN 'Prox. Inicio'
    WHEN CURRENT_DATE - c.fecha_inicio BETWEEN -7 AND 5          THEN 'Alistamiento'
    WHEN COALESCE(NULLIF(c.t_reporte_cierre,''), k.reporte_cierre::text) IS NOT NULL THEN 'Cerrado'
    WHEN CURRENT_DATE - c.fecha_cierre >= 1                      THEN 'Pend. Reporte Cierre'
    WHEN CURRENT_DATE - c.fecha_cierre BETWEEN -7 AND 0          THEN 'Cierre'
    ELSE 'Desarrollo'
  END AS fase
FROM curso c LEFT JOIN cierre_curso k ON k.sigla = c.sigla;

CREATE VIEW v_indice_carga AS
SELECT facilitador,
  ROUND(SUM(pct_carga * CASE fase
      WHEN 'Alistamiento' THEN 0.17 WHEN 'Desarrollo' THEN 0.73
      WHEN 'Cierre' THEN 0.10 WHEN 'Pend. Reporte Cierre' THEN 0.10 ELSE 0 END), 2) AS indice_carga,
  COUNT(*) FILTER (WHERE fase IN ('Alistamiento','Desarrollo','Cierre','Pend. Reporte Cierre')) AS cursos_activos,
  COUNT(*) FILTER (WHERE fase = 'Pend. Reporte Cierre') AS pendientes_reporte
FROM v_curso_fase GROUP BY facilitador;
