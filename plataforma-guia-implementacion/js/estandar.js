/* ============================================================
   estandar.js — Contenido del proceso estándar de Implementación
   Etapas (ST), línea de tiempo (TL), rutina diaria (RUT), ritmo semanal (SEM),
   plantillas de mensajes (TPL), criterios (DEFS), roles RACI, canales,
   carpetas, indicadores y riesgos. Editar aquí para cambiar el estándar.
   ============================================================ */

const ST = [
  {
    n: 1,
    t: 'Recibir programa',
    fase: 'Antes del inicio',
    cuando: 'Al recibir la asignación. Ideal: D−15 o antes.',
    quien: 'Coordinación entrega · Facilitador recibe',
    entra: 'Asignación, documentación, cronograma, datos del docente, listado de matriculados',
    sale: 'Programa registrado con sus insumos completos o solicitados',
    steps: [
      [
        'Registrar el programa en el seguimiento con la fecha de asignación',
        '5',
        'La fecha de asignación es el inicio del indicador de alistamiento.'
      ],
      [
        'Crear la carpeta del programa con las subcarpetas estándar',
        '5',
        'Usar la nomenclatura AAAA-MM_Programa_Documento_v01.'
      ],
      [
        'Verificar que llegaron los cinco insumos',
        '5',
        'Documentación y syllabus, cronograma, datos del docente, listado de matriculados y fecha de inicio.'
      ],
      [
        'Si falta algo, pedirlo el mismo día con la plantilla de información faltante',
        '5',
        'Siempre con fecha límite y por correo, para que quede registro.'
      ]
    ],
    check: [
      'Programa registrado con fecha de asignación',
      'Carpeta creada con la estructura estándar',
      'Documentación y syllabus recibidos',
      'Cronograma académico recibido',
      'Datos del docente recibidos',
      'Listado de matriculados recibido',
      'Faltantes solicitados con fecha límite'
    ],
    listo:
      'El programa está registrado y sus cinco insumos están completos o solicitados por correo con fecha límite.',
    no: [
      'Empezar a configurar el aula con información incompleta.',
      'Pedir información solo por chat, sin dejar registro.'
    ],
    escala:
      'Si la asignación llega con menos de 10 días hábiles para el inicio, informar a Coordinación y registrarlo como riesgo.',
    tpl: ['faltante']
  },
  {
    n: 2,
    t: 'Validar información',
    fase: 'Antes del inicio',
    cuando: 'Máximo 2 días hábiles después de recibir. Ideal: D−13.',
    quien: 'Facilitador valida · Coordinación completa faltantes',
    entra: 'Insumos recibidos',
    sale: 'Información completa y validada, con constancia',
    steps: [
      [
        'Validar que el syllabus y la documentación estén vigentes',
        '10',
        'Revisar versión y fecha del documento.'
      ],
      [
        'Comparar el cronograma con el de e-Learning y el de la Facultad',
        '20',
        'Marcar cualquier diferencia de fechas antes de configurar.'
      ],
      [
        'Verificar el perfil del docente',
        '15',
        'Si falta información, pedírsela al docente y ajustarla con ticket.'
      ],
      [
        'Validar el listado de estudiantes contra la Facultad, una sola vez',
        '20',
        'Dejar constancia en el seguimiento; no se repite en el alistamiento.'
      ],
      [
        'Registrar el resultado de la validación y los faltantes abiertos',
        '5',
        'Cada faltante con responsable y fecha límite.'
      ]
    ],
    check: [
      'Syllabus y documentación vigentes',
      'Cronograma coincide con e-Learning y Facultad',
      'Perfil del docente completo',
      'Listado de estudiantes validado contra la Facultad',
      'Resultado de la validación registrado',
      'Sin faltantes abiertos'
    ],
    listo: 'Se cumple el criterio de información completa y quedó constancia de la validación.',
    no: [
      'Validar el listado de estudiantes dos veces en momentos distintos.',
      'Asumir que el cronograma de la Facultad es igual al de e-Learning.'
    ],
    escala:
      'Si un faltante no llega en la fecha límite, escalar a Coordinación con la plantilla de escalamiento.',
    tpl: ['faltante', 'escala']
  },
  {
    n: 3,
    t: 'Planificar implementación',
    fase: 'Antes del inicio',
    cuando: 'D−12 a D−10.',
    quien: 'Facilitador planifica · Docente acuerda fechas',
    entra: 'Información validada',
    sale: 'Encuentros, fechas de entrega y calendario de mensajes definidos',
    steps: [
      [
        'Acordar y programar los encuentros sincrónicos con el docente',
        '20',
        'Antes de confirmar, revisar cruces con otras cohortes y asignaturas.'
      ],
      [
        'Definir las fechas de entrega de actividades',
        '15',
        'Deben coincidir con la guía de cada actividad.'
      ],
      [
        'Armar el calendario de mensajes del programa',
        '10',
        'Apertura de módulos, recordatorios y encuestas, todos con su plantilla.'
      ],
      ['Registrar el plan en el seguimiento', '5', '']
    ],
    check: [
      'Encuentros acordados con fecha, hora y enlace',
      'Sin cruces con otras cohortes',
      'Fechas de entrega definidas',
      'Calendario de mensajes programado',
      'Plan registrado'
    ],
    listo:
      'Cada encuentro tiene fecha, hora y enlace, las entregas tienen fecha y los mensajes están programados.',
    no: ['Confirmar fechas sin revisar el horario de otras cohortes.'],
    escala: 'Si el docente no confirma fechas en 2 días hábiles, informar a Coordinación.',
    tpl: ['sesion']
  },
  {
    n: 4,
    t: 'Preparar programa (alistamiento)',
    fase: 'Antes del inicio',
    cuando: 'D−10 a D−2. Debe quedar terminado a más tardar en D−2.',
    quien: 'Facilitador configura · Docente confirma · Soporte resuelve tickets',
    entra: 'Plan aprobado',
    sale: 'Aula lista y configuración confirmada por el docente',
    steps: [
      [
        'Verificar que el aula esté bien duplicada',
        '10',
        'Comparar con el aula base: secciones, recursos y fechas del periodo anterior.'
      ],
      [
        'Revisar botones, recursos, actividades, enlaces y multimedia',
        '30',
        'Cada falla se reporta con un ticket usando la plantilla de soporte.'
      ],
      [
        'Parametrizar fechas y actividades con el docente',
        '30',
        'Enlazar los encuentros y validar que cada espacio de entrega coincida con su guía. Si aplica, parametrizar otras plataformas.'
      ],
      ['Programar el espacio de asistencia', '20', 'Debe quedar visible en el aula.'],
      ['Verificar el perfil y la presentación del docente', '15', ''],
      ['Automatricularse o pedir el acceso a Coordinación', '5', ''],
      ['Crear los grupos y agregar a los estudiantes', '20', ''],
      [
        'Si el docente es nuevo: citarlo a inducción y explicarle el aula',
        '30',
        'Usar la plantilla de inducción docente.'
      ],
      [
        'Pedir al docente la confirmación escrita de la configuración',
        '5',
        'A partir de aquí la configuración queda congelada: todo cambio es una novedad.'
      ]
    ],
    check: [
      'Aula duplicada correctamente',
      'Botones, enlaces y recursos funcionan',
      'Multimedia carga correctamente',
      'Fechas y actividades parametrizadas',
      'Espacios de entrega coinciden con la guía',
      'Encuentros enlazados en el aula',
      'Espacio de asistencia programado',
      'Perfil y presentación del docente visibles',
      'Facilitador matriculado en el aula',
      'Grupos de estudiantes creados',
      'Tickets de soporte cerrados',
      'Confirmación escrita del docente',
      'Docente nuevo con inducción realizada (si aplica)'
    ],
    listo: 'El checklist del aula está completo y el docente confirmó la configuración por escrito.',
    no: [
      'Aceptar cambios después de la confirmación sin registrarlos como novedad.',
      'Dejar tickets abiertos para el día de inicio.'
    ],
    escala: 'Si un ticket sigue abierto en D−2, escalar a Coordinación: el inicio en fecha está en riesgo.',
    tpl: ['induccion', 'confirmacion', 'ticket']
  },
  {
    n: 5,
    t: 'Iniciar programa',
    fase: 'Inicio',
    cuando: 'D−1 y D0.',
    quien: 'Facilitador habilita · Docente ingresa',
    entra: 'Aula lista',
    sale: 'Programa iniciado en fecha con estudiantes y docente dentro del aula',
    steps: [
      [
        'Entregar el aula al docente y confirmar su acceso',
        '10',
        'Pedirle que confirme que entra y ve el contenido.'
      ],
      [
        'Enviar bienvenida y apertura con el cronograma adjunto',
        '10',
        'Un solo envío; el cronograma no se vuelve a enviar por separado.'
      ],
      ['Agendar a los estudiantes en las sesiones sincrónicas', '15', ''],
      ['Verificar el ingreso de los estudiantes y apoyar a quien no pueda entrar', '20', ''],
      ['Registrar la fecha real de inicio', '2', 'Alimenta el indicador de inicio en fecha.']
    ],
    check: [
      'Docente con acceso confirmado',
      'Bienvenida y cronograma enviados en un solo mensaje',
      'Estudiantes agendados en las sesiones',
      'Ingreso de estudiantes verificado',
      'Fecha real de inicio registrada'
    ],
    listo: 'El aula está habilitada y la bienvenida enviada antes de la hora de inicio.',
    no: [
      'Enviar el cronograma en dos momentos distintos.',
      'Dar por iniciado el programa sin confirmar el acceso del docente.'
    ],
    escala:
      'Si el día de inicio el aula no está habilitada, informar de inmediato a Coordinación y registrarlo como novedad de severidad alta.',
    tpl: ['entrega_aula', 'bienvenida']
  },
  {
    n: 6,
    t: 'Gestionar operación',
    fase: 'Durante el programa',
    loop: true,
    cuando: 'Todas las semanas mientras dure el programa.',
    quien: 'Facilitador acompaña · Docente dicta',
    entra: 'Programa en curso',
    sale: 'Estudiantes y docente acompañados y registros al día',
    steps: [
      [
        'Enviar los mensajes de la semana: apertura de módulo y entrega de actividades',
        '10',
        'Siempre desde la plantilla, el día fijo de la semana.'
      ],
      [
        'Preparar cada encuentro sincrónico',
        '21',
        'Revisión 15 minutos antes, controles, inicio y fin de grabación, descarga y publicación.'
      ],
      ['Responder dudas por WhatsApp y foros', '20', 'Dentro del mismo día hábil.'],
      ['Asesorar a estudiantes en el uso de la plataforma', '30', ''],
      ['Asesorar al docente en calificación y funcionamiento del aula', '30', ''],
      [
        'Reportar las horas de sesiones sincrónicas para el pago docente',
        '15',
        'Tomarlas del registro de asistencia, no de memoria.'
      ],
      ['Enviar encuestas de percepción y caracterización según el calendario', '15', '']
    ],
    check: [
      'Mensajes de la semana enviados',
      'Encuentro revisado 15 minutos antes',
      'Grabación descargada y publicada',
      'Dudas respondidas el mismo día hábil',
      'Asistencia registrada',
      'Horas sincrónicas reportadas',
      'Encuestas enviadas según el calendario'
    ],
    listo:
      'Los mensajes de la semana salieron, los encuentros quedaron grabados y publicados, y no hay dudas sin responder.',
    no: [
      'Enviar mensajes improvisados cuando existe una plantilla.',
      'Responder dudas importantes solo por chat privado, sin registro.'
    ],
    escala: 'Cualquier situación que impida la operación pasa a la etapa 8 como novedad.',
    tpl: ['modulo', 'actividad', 'sesion', 'encuesta']
  },
  {
    n: 7,
    t: 'Monitorear operación',
    fase: 'Durante el programa',
    loop: true,
    cuando: 'Un día fijo a la semana (propuesta: miércoles).',
    quien: 'Facilitador monitorea · Docente es notificado',
    entra: 'Registros de la plataforma',
    sale: 'Decisión registrada: continuar, gestionar novedad o cerrar',
    steps: [
      ['Revisar el ingreso de los estudiantes a la plataforma', '10', ''],
      ['Enviar el mensaje de no ingreso a quien corresponda', '12', ''],
      ['Revisar la entrega de actividades', '20', ''],
      ['Enviar el mensaje de no entrega', '6', ''],
      ['Notificar al docente los estudiantes sin ingreso o sin entrega', '5', ''],
      ['Actualizar el seguimiento del programa', '5', ''],
      [
        'Decidir y registrar el siguiente paso',
        '2',
        '¿Hay novedad? Etapa 8. ¿Terminó el programa? Etapa 9. Si no, vuelve a la etapa 6.'
      ]
    ],
    check: [
      'Monitoreo hecho en el día fijo',
      'Estudiantes sin ingreso contactados',
      'Estudiantes sin entrega contactados',
      'Docente notificado',
      'Seguimiento actualizado',
      'Decisión registrada'
    ],
    listo: 'El seguimiento está actualizado y la decisión de la semana quedó registrada.',
    no: ['Monitorear solo cuando hay tiempo, sin día fijo.'],
    escala: 'Si un estudiante lleva dos semanas sin ingreso, informar al docente y a Coordinación.',
    tpl: ['no_ingreso', 'no_entrega', 'notif_docente']
  },
  {
    n: 8,
    t: 'Gestionar novedad',
    fase: 'Durante el programa',
    loop: true,
    cuando: 'Cuando ocurre; con los plazos según su severidad.',
    quien: 'Facilitador gestiona · Coordinación decide lo escalado · Soporte resuelve tickets',
    entra: 'Novedad detectada',
    sale: 'Novedad resuelta, verificada y cerrada',
    steps: [
      ['Registrar la novedad con tipo y severidad', '3', 'En la pestaña Novedades.'],
      ['Decidir si Implementación puede resolverla', '2', ''],
      ['Si puede: gestionar la solución', '—', ''],
      [
        'Si no: escalar a Coordinación con evidencia y plazo, o abrir ticket',
        '5',
        'Plantilla de escalamiento o de soporte.'
      ],
      ['Definir la acción correctiva si la causa puede repetirse', '5', 'Con responsable y fecha.'],
      ['Verificar que la solución funcionó y cerrar', '5', 'Sin verificación no se cierra.'],
      [
        'Casos frecuentes: entrega extemporánea (aprobar y configurar) y reprogramación de sesión',
        '3–4',
        'Usar la plantilla de reprogramación.'
      ]
    ],
    check: [
      'Novedad registrada',
      'Tipo y severidad asignados',
      'Escalada con evidencia, si aplica',
      'Acción correctiva definida, si aplica',
      'Eficacia verificada',
      'Novedad cerrada y seguimiento actualizado'
    ],
    listo: 'La solución se verificó con el afectado y la novedad quedó cerrada en el registro.',
    no: ['Cerrar una novedad sin verificar que funcionó.', 'Resolver cambios del docente sin registrarlos.'],
    escala: 'Ver plazos por severidad en la pestaña Novedades.',
    tpl: ['escala', 'reprog', 'ticket']
  },
  {
    n: 9,
    t: 'Cerrar programa',
    fase: 'Cierre',
    cuando: 'Máximo 10 días hábiles después del fin académico.',
    quien: 'Facilitador cierra · Docente califica · Coordinación recibe el informe',
    entra: 'Programa finalizado',
    sale: 'Notas enviadas, informe de cierre, archivo y lección aprendida',
    steps: [
      [
        'Verificar actividades y calificaciones pendientes',
        '15',
        'Incluye entregas extemporáneas aprobadas.'
      ],
      ['Enviar al docente el enlace de calificación y asesorarlo si lo necesita', '17', ''],
      ['Descargar las notas desde la plataforma y enviarlas a la Facultad', '10', 'No duplicarlas a mano.'],
      [
        'Elaborar los reportes y el informe de cierre',
        '45',
        'Horas sincrónicas, asistencia y novedades del programa.'
      ],
      ['Archivar la documentación en la carpeta estándar', '10', ''],
      [
        'Cerrar novedades y riesgos abiertos',
        '5',
        'Si queda algo pendiente: responsable y fecha, y el programa no se cierra.'
      ],
      ['Registrar la lección aprendida', '10', 'Cuatro preguntas; ver Criterios y roles.']
    ],
    check: [
      'Sin calificaciones pendientes',
      'Notas descargadas de la plataforma y enviadas',
      'Reportes elaborados',
      'Informe de cierre entregado',
      'Documentación archivada',
      'Novedades y riesgos cerrados',
      'Lección aprendida registrada'
    ],
    listo: 'No quedan pendientes, el informe se entregó y la lección aprendida quedó registrada.',
    no: ['Copiar las notas a mano entre sistemas.', 'Cerrar con novedades abiertas.'],
    escala: 'Si a los 10 días hábiles siguen notas pendientes del docente, informar a Coordinación.',
    tpl: ['calificacion']
  }
];
const TL = [
  ['D−15', 'Recibir y registrar'],
  ['D−13', 'Información validada'],
  ['D−10', 'Plan listo'],
  ['D−2', 'Aula confirmada'],
  ['D0', 'Inicio'],
  ['Semanal', 'Operar, monitorear y gestionar novedades'],
  ['Fin', 'Último encuentro'],
  ['Fin +10 h', 'Cierre completo']
];
const RUT = [
  [
    'Al empezar el día',
    [
      ['Revisar correo institucional y WhatsApp', '10'],
      ['Revisar alertas y novedades abiertas', '5'],
      ['Revisar los encuentros sincrónicos del día', '3'],
      ['Revisar tickets de soporte abiertos', '3']
    ]
  ],
  [
    'Durante el día',
    [
      ['Registrar cada novedad en el momento en que aparece', ''],
      ['Responder dudas el mismo día hábil', ''],
      ['Entrar a cada encuentro 15 minutos antes', ''],
      ['Usar plantillas para todos los mensajes', '']
    ]
  ],
  [
    'Al cerrar el día',
    [
      ['Actualizar el seguimiento de cada programa', '10'],
      ['Dejar programados los mensajes de mañana', '5'],
      ['Anotar pendientes con fecha', '3']
    ]
  ]
];
const SEM = [
  [
    'Lunes',
    ['Mensajes de apertura de módulo y de la semana', 'Revisar el calendario de encuentros de la semana']
  ],
  ['Martes', ['Asesorías a docentes y estudiantes', 'Avanzar alistamiento de programas por iniciar']],
  [
    'Miércoles',
    [
      'Monitoreo: ingreso y entregas (día fijo)',
      'Mensajes de no ingreso y no entrega',
      'Notificar a los docentes'
    ]
  ],
  ['Jueves', ['Recordatorios de entrega de actividades', 'Seguimiento de novedades escaladas y tickets']],
  [
    'Viernes',
    [
      'Revisar riesgos y acciones correctivas',
      'Cierres pendientes y lecciones aprendidas',
      'Actualizar indicadores del área'
    ]
  ]
];
const TPL = [
  {
    id: 'faltante',
    n: 'Solicitud de información faltante',
    para: 'Coordinación',
    canal: 'Correo',
    m: 'Antes del inicio',
    x: 'Asunto: Información pendiente – {programa}\n\nHola,\n\nPara avanzar con el alistamiento de {programa} – {asignatura}, que inicia el {fecha}, necesitamos la siguiente información:\n\n{detalle}\n\n¿Nos la pueden enviar a más tardar el {limite}? Sin ella no podemos garantizar que el aula esté lista a tiempo.\n\nGracias,\n{facilitador}\nÁrea de Implementación – Unisabana e-Learning'
  },
  {
    id: 'induccion',
    n: 'Citación a inducción de docente nuevo',
    para: 'Docente',
    canal: 'Correo',
    m: 'Antes del inicio',
    x: 'Asunto: Inducción al aula virtual – {asignatura}\n\nEstimado(a) {docente}:\n\nBienvenido(a) a {programa}. Soy {facilitador}, del Área de Implementación de Unisabana e-Learning, y le acompañaré durante el curso.\n\nLe propongo una sesión de inducción de 20 minutos para mostrarle el aula, el cronograma y el proceso de calificación:\n{fecha}, {hora}\nEnlace: {enlace}\n\nSi el horario no le funciona, indíqueme otro y lo ajustamos.\n\nCordialmente,\n{facilitador}'
  },
  {
    id: 'confirmacion',
    n: 'Confirmación de configuración del aula',
    para: 'Docente',
    canal: 'Correo',
    m: 'Antes del inicio',
    x: 'Asunto: Aula lista para revisión – {asignatura}\n\nEstimado(a) {docente}:\n\nEl aula de {asignatura} quedó configurada con las fechas, actividades y encuentros acordados. Puede revisarla aquí: {enlace}\n\nLe agradezco confirmar por este medio a más tardar el {limite} que todo está correcto. Después de su confirmación, cualquier ajuste lo registraremos como novedad para mantener la trazabilidad.\n\nCordialmente,\n{facilitador}'
  },
  {
    id: 'ticket',
    n: 'Ticket a soporte',
    para: 'Soporte',
    canal: 'Mesa de ayuda',
    m: 'Antes del inicio',
    x: 'Programa: {programa}\nAsignatura: {asignatura}\nAula: {enlace}\n\nDescripción de la falla:\n{detalle}\n\nImpacto: el programa inicia el {fecha}. Solicitamos solución a más tardar el {limite}.\n\nReportado por: {facilitador}'
  },
  {
    id: 'entrega_aula',
    n: 'Entrega del aula al docente',
    para: 'Docente',
    canal: 'Correo',
    m: 'Inicio',
    x: 'Asunto: Acceso al aula – {asignatura}\n\nEstimado(a) {docente}:\n\nSu aula ya está habilitada: {enlace}\n\nPor favor confirme que puede ingresar y ver el contenido. El curso inicia el {fecha}. Quedo atento(a) a cualquier inquietud.\n\nCordialmente,\n{facilitador}'
  },
  {
    id: 'bienvenida',
    n: 'Bienvenida y apertura de la asignatura',
    para: 'Estudiantes',
    canal: 'WhatsApp y aula',
    m: 'Inicio',
    x: '¡Bienvenidos a {asignatura}! 👋\n\nSoy {facilitador}, su facilitador(a) en {programa}. El curso inicia el {fecha} con el docente {docente}.\n\n📎 Adjunto el cronograma con todas las fechas de actividades y encuentros.\n🔗 Aula: {enlace}\n\nSi tienen problemas para ingresar, escríbanme por este medio y les ayudo el mismo día.'
  },
  {
    id: 'modulo',
    n: 'Apertura de módulo',
    para: 'Estudiantes',
    canal: 'WhatsApp y aula',
    m: 'Durante el programa',
    x: 'Buen día. Desde hoy está habilitado el nuevo módulo de {asignatura}: {detalle}.\n\nRevisen los recursos y las actividades en el aula: {enlace}\nLa entrega de esta semana vence el {limite}.'
  },
  {
    id: 'actividad',
    n: 'Recordatorio de entrega de actividad',
    para: 'Estudiantes',
    canal: 'WhatsApp',
    m: 'Durante el programa',
    x: 'Recordatorio: la actividad «{detalle}» de {asignatura} vence el {limite}.\n\nLa entrega se hace en el aula: {enlace}\nSi tienen alguna dificultad, escríbanme antes de la fecha límite.'
  },
  {
    id: 'sesion',
    n: 'Recordatorio de encuentro sincrónico',
    para: 'Estudiantes y docente',
    canal: 'WhatsApp',
    m: 'Durante el programa',
    x: 'Les recuerdo nuestro encuentro sincrónico de {asignatura}:\n📅 {fecha}\n🕕 {hora}\n🔗 {enlace}\n\nLa sesión quedará grabada y publicada en el aula.'
  },
  {
    id: 'reprog',
    n: 'Reprogramación de encuentro',
    para: 'Estudiantes y docente',
    canal: 'WhatsApp y correo',
    m: 'Novedad',
    x: 'Aviso importante: el encuentro de {asignatura} se reprograma.\n\nNueva fecha: {fecha}\nHora: {hora}\nEnlace: {enlace}\n\nMotivo: {detalle}. Disculpen las molestias.'
  },
  {
    id: 'no_ingreso',
    n: 'Mensaje de no ingreso',
    para: 'Estudiante',
    canal: 'WhatsApp o correo',
    m: 'Monitoreo semanal',
    x: 'Hola. Vemos que aún no has ingresado al aula de {asignatura} en {programa}.\n\nAquí está el enlace: {enlace}\n\n¿Tienes alguna dificultad para entrar? Respóndeme y te ayudo hoy mismo.'
  },
  {
    id: 'no_entrega',
    n: 'Mensaje de no entrega',
    para: 'Estudiante',
    canal: 'WhatsApp o correo',
    m: 'Monitoreo semanal',
    x: 'Hola. En el aula de {asignatura} no aparece la entrega de «{detalle}», que venció el {limite}.\n\nSi tuviste algún inconveniente, cuéntame para revisar contigo y con el docente las opciones.'
  },
  {
    id: 'notif_docente',
    n: 'Notificación al docente',
    para: 'Docente',
    canal: 'Correo',
    m: 'Monitoreo semanal',
    x: 'Asunto: Seguimiento semanal – {asignatura}\n\nEstimado(a) {docente}:\n\nLe comparto el seguimiento de la semana:\n{detalle}\n\nYa contactamos a estos estudiantes. Si considera necesario otro paso, me indica.\n\nCordialmente,\n{facilitador}'
  },
  {
    id: 'escala',
    n: 'Escalamiento de novedad a Coordinación',
    para: 'Coordinación',
    canal: 'Correo',
    m: 'Novedad',
    x: 'Asunto: Novedad para decisión – {programa}\n\nHola,\n\nPrograma: {programa} – {asignatura}\nNovedad: {detalle}\nEvidencia: adjunta.\nImpacto: \nLo que ya hicimos desde Implementación: \n\nNecesitamos una decisión o acción a más tardar el {limite} para no afectar la operación.\n\nGracias,\n{facilitador}'
  },
  {
    id: 'encuesta',
    n: 'Encuesta de percepción y caracterización',
    para: 'Estudiantes',
    canal: 'WhatsApp y aula',
    m: 'Durante el programa',
    x: 'Su opinión nos ayuda a mejorar. Les pedimos responder la encuesta de {asignatura}; toma menos de 5 minutos:\n{enlace}\n\nEstará abierta hasta el {limite}. ¡Gracias!'
  },
  {
    id: 'calificacion',
    n: 'Enlace de calificación y cierre',
    para: 'Docente',
    canal: 'Correo',
    m: 'Cierre',
    x: 'Asunto: Cierre de calificaciones – {asignatura}\n\nEstimado(a) {docente}:\n\nEl curso finalizó. Le comparto el enlace para registrar las calificaciones: {enlace}\n\nLe agradezco completarlas a más tardar el {limite}. Si necesita apoyo con el proceso, con gusto le acompaño.\n\nCordialmente,\n{facilitador}'
  }
];
const DEFS = [
  [
    'Información completa',
    'Syllabus vigente, cronograma validado contra e-Learning y la Facultad, perfil del docente completo y listado de estudiantes validado. Si falta uno, no está completa.'
  ],
  [
    'Aula lista',
    'Checklist de la etapa 4 completo y confirmación escrita del docente. Antes de eso, el aula no se entrega.'
  ],
  ['Inicio en fecha', 'Aula habilitada y bienvenida enviada antes de la hora de inicio del programa.'],
  [
    'Novedad',
    'Cualquier desviación del plan después de la confirmación del aula: cambios del docente, fallas, estudiantes, fechas o calificaciones.'
  ],
  ['Novedad cerrada', 'Solución verificada con el afectado o en el aula. Ejecutar la acción no basta.'],
  [
    'Acción correctiva',
    'Lo que se hace para que la causa no se repita; siempre con responsable, fecha y verificación de eficacia.'
  ],
  [
    'Programa cerrado',
    'Sin calificaciones pendientes, notas enviadas, informe entregado, archivo completo y lección aprendida registrada.'
  ],
  ['Respuesta oportuna', 'Estudiantes: el mismo día hábil. Docentes y Coordinación: máximo 1 día hábil.']
];
const RACI = [
  ['1. Recibir', 'R / A', 'R', '—', '—'],
  ['2. Validar', 'C', 'R / A', 'C', '—'],
  ['3. Planificar', 'I', 'R / A', 'C', '—'],
  ['4. Preparar', 'I', 'R / A', 'C', 'R (tickets)'],
  ['5. Iniciar', 'I', 'R / A', 'C', '—'],
  ['6. Gestionar operación', 'I', 'R / A', 'R', 'C'],
  ['7. Monitorear', 'I', 'R / A', 'I', '—'],
  ['8. Gestionar novedad', 'A (escaladas)', 'R', 'C', 'R (tickets)'],
  ['9. Cerrar', 'I', 'R / A', 'R (notas)', '—']
];
const CAN = [
  ['Docentes y Coordinación', 'Correo institucional (todo lo que deba quedar registrado)'],
  ['Estudiantes, avisos', 'Grupo de WhatsApp del programa'],
  ['Estudiantes, contenido', 'Aula virtual'],
  ['Fallas técnicas', 'Ticket a soporte'],
  ['Novedades', 'Registro de novedades + correo si se escala']
];
const CARP = [
  '01_Informacion_recibida',
  '02_Validacion',
  '03_Aula_y_configuracion',
  '04_Comunicaciones',
  '05_Novedades',
  '06_Cierre_y_reportes'
];
const KP = [
  [
    'K01',
    'Tiempo de alistamiento',
    'Fecha de asignación y fecha real de inicio',
    '−20 % frente a la línea base'
  ],
  ['K02', 'Inicio en fecha', 'Fecha real de inicio', '≥ 95 %'],
  ['K03', 'Checklist de inicio completo', 'Checklist de la etapa 4', '100 %'],
  ['K04', 'Ciclos de solicitud de información', 'Solicitudes de faltantes', '≤ 1 por programa'],
  ['K05', 'Tiempo de resolución de novedades', 'Registro de novedades', 'Según severidad'],
  ['K07', 'Acciones correctivas en plazo', 'Registro de novedades', '≥ 90 %'],
  ['K12', 'Tiempo de cierre', 'Fin académico y fecha de cierre', '≤ 10 días hábiles'],
  ['K13', 'Lecciones aprendidas registradas', 'Checklist de la etapa 9', '100 %']
];
const RSK = [
  'Programas asignados con menos de 10 días hábiles para el inicio.',
  'Docentes nuevos sin inducción.',
  'Cambios del docente después de confirmar el aula.',
  'Tickets de soporte abiertos cerca del inicio.',
  'Cruces de horario con otras cohortes.',
  'Facilitadores con más programas activos de lo habitual.'
];
