# Modelo de datos de la plataforma

La plataforma guarda **6 colecciones de documentos**. Cualquier base de datos que se conecte
(ver `js/store.js`) debe poder guardarlas y avisar sus cambios. Equivalente relacional: `db/esquema.sql`.

## 1. `excel` — datos importados del Excel de programación
| Documento | Contenido |
|---|---|
| `meta` | `nc` bloques de cursos, `nm` bloques de módulos, `archivo`, `fecha` (ISO), `ncur`, `nmod`, `ros` (facilitadores: `n` nombre, `cargo`, `em` correo institucional) |
| `c0…cN` | `items`: lista de **cursos** |
| `m0…mN` | `items`: lista de **módulos** |

**Curso**: `s` sigla (obligatorio, único) · `a` asignatura · `p` programa formal · `c` cohorte · `t` tipo · `u` unidad académica ·
`i` fecha de inicio (AAAA-MM-DD, obligatoria) · `f` fecha de cierre (obligatoria) · `ss` n.º de estudiantes · `pc` % de carga (decimal) ·
`au` tipo de aula · `fa` facilitador · `url` enlace del aula · `k` tareas de cierre `{car, rep, siga, bi, exi, con}`.

**Módulo**: `s` sigla del curso · `m` nombre · `pr` docente · `em` correo institucional del docente · `i`, `f` fechas ·
`es` fecha del encuentro sincrónico · `hi`, `hf` horas (HH:MM).

## 2. `asig` — indicaciones de Coordinación
`fa` facilitador · `tipo` (Tarea, Prioridad, Nota) · `txt` · `lim` fecha límite · `s` sigla (opcional) · `est` (Pendiente, Hecha) ·
`f` creación (ISO) · `resp` respuesta del facilitador · `fh` fecha en que se hizo.

## 3. `nov` — novedades
`fa` · `s` · `tipo` · `sev` (Alta, Media, Baja) · `resp` (Implementación, Escalada a Coordinación, Soporte (ticket)) · `desc` · `acc` acción correctiva ·
`est` (Abierta, Escalada, Resuelta, por verificar, Cerrada y verificada) · `f` · `fe` última actualización.

## 4. `seg` — checklist estándar y nota por curso
Id = sigla normalizada (caracteres no permitidos → `_`). `s` sigla · `ck` `{ "etapa-control": true }` · `nota` · `u`.

## 5. `cierre` — tareas de cierre registradas en la plataforma
Id = sigla normalizada. `s` · `a` asignatura · `fa` · `k` `{car, rep, siga, bi, exi, con}` con fechas AAAA-MM-DD · `u`.

## 6. `rutina` — checklist diario del facilitador
Id = `Nombre_Facilitador__AAAA-MM-DD`. `fa` · `d` fecha · `ck` `{ "grupo-ítem": true }` (11 controles) · `w` actividades de «Hoy toca» · `u`.

## 7. Usuarios (servidor)
`usuario` · `nombre` · `rol` (coordinador, facilitador) · `fa` nombre exacto del facilitador en el Excel ·
`hash` y `salt` de la contraseña (scrypt) · `activo` · `creado`. La contraseña nunca se guarda en claro.

## Excel requerido para la importación
| Hoja | Columnas que se leen (encabezado en la fila 1, sin importar tildes ni mayúsculas) |
|---|---|
| `2026` | Sigla Programa · Módulo/Unidad/Lección · Profesor · Correo Profesor Institucional · Fecha de Inicio · Fecha de Cierre · Fecha Encuentros Sincrónicos · Hora Inicio · Hora Fin · Facilitador de Aprendizaje Virtual · Aula Virtual |
| `Seguimiento Cierre Cursos` | Asignatura · Sigla Programa · Nombre del programa formal · Cohorte · Tipo · Unidad Académica · Fecha de Inicio · Fecha de Cierre · Tipo de aula · #ss · % Carga Programa · Facilitador de Aprendizaje Virtual · Encuestas de caracterización · Envío de reporte de cierre (Excel) · Subida de notas a SIGA · Generación de BI de encuestas de percep. · Ingreso de notas al archivo de éxito académico · Cierre del curso en consolidado de programación |
| `Carga` (opcional) | Nombres · Cargo · Correo |

No se importan cédulas, celulares, direcciones, fechas de nacimiento ni correos personales aunque estén en el archivo.
