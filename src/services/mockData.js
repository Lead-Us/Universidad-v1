// ============================================================
// Mock Data — Universidad v1  (datos reales 1er sem 2026)
// ============================================================
import { v4 as uuidv4 } from 'uuid';

// ── Ramos reales ───────────────────────────────────────────
export const MOCK_RAMOS = [
  {
    id: 'r1',
    name: 'Econometría',
    code: 'ECO355',
    professor: 'Carlos Briceño Sotelo',
    email: 'carlos.briceno@uai.cl',
    credits: 5,
    section: 'Sección 7',
    days: ['Lunes', 'Viernes'],
    has_attendance: false,
    color: '#3B82F6',
    evaluations: [
      { id: 'ev1-1', title: 'Control 1', weight: 8, type: 'control', date: null },
      { id: 'ev1-2', title: 'Control 2', weight: 8, type: 'control', date: null },
      { id: 'ev1-3', title: 'Control 4', weight: 8, type: 'control', date: null },
      { id: 'ev1-4', title: 'Prueba 1', weight: 25, type: 'prueba', date: null },
      { id: 'ev1-5', title: 'Prueba 2', weight: 25, type: 'prueba', date: null },
      { id: 'ev1-6', title: 'Examen Final', weight: 26, type: 'examen', date: null },
    ],
    allFiles: [
      'Unidad 0 - Introducción.pdf',
      'Unidad 1 Tema 1 - Aspectos generales del curso.pdf',
      'Unidad 1 Tema 2 - Breve repaso de estadística matemática.pdf',
      'Unidad 1 Tema 2 - Breve repaso de inferencia estadística.pdf',
      'Unidad 2 - Modelo de regresión lineal simple.pdf',
      'Unidad 3 - Modelo de regresión lineal múltiple (RStudio).pdf',
      'Unidad 4 - Causalidad y Diseño.pdf',
      'Unidad 5 - Modelos de elección discreta.pdf',
      'UNIDAD 6 - Introducción a Big Data y Machine Learning.pdf',
      'Guía Unidad 5 - Modelo de variable discreta.pdf',
      'Guía Unidad 6 - Introducción a la Big Data y Machine Learning.pdf',
      'Guía Preguntas Prueba 1.pdf',
      'Formulario Prueba 1 (Econometría).pdf',
      'Orientaciones Control 1 (Econometría UAI).pdf',
      'Orientaciones Control 2 (Econometría UAI).pdf',
      'Orientaciones Control 4 (Econometría UAI).pdf',
      'Orientaciones sobre el Examen (Econometría I Carlos Briceño Sotelo).pdf',
      'Taller Análisis Datos.pdf',
      'Taller Base de Datos.pdf',
      'Syllabus ECO355 S7 Econometría (1 er sem 2026 Carlos H. Briceño Sotelo).pdf',
    ],
    evaluationModules: [
      { id: 'mod-r1-1', name: 'Controles', weight: 24, items: [
        { id: 'item-r1-1-1', name: 'Control 1', grade: null, date: null },
        { id: 'item-r1-1-2', name: 'Control 2', grade: null, date: null },
        { id: 'item-r1-1-3', name: 'Control 4', grade: null, date: null },
      ]},
      { id: 'mod-r1-2', name: 'Pruebas', weight: 50, items: [
        { id: 'item-r1-2-1', name: 'Prueba 1', grade: null, date: null },
        { id: 'item-r1-2-2', name: 'Prueba 2', grade: null, date: null },
      ]},
      { id: 'mod-r1-3', name: 'Examen', weight: 26, items: [
        { id: 'item-r1-3-1', name: 'Examen Final', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
  {
    id: 'r2',
    name: 'Finanzas',
    code: 'FIN302',
    professor: 'Andrés Cabrera M.',
    email: 'andres.cabrera@uai.cl',
    credits: 5,
    section: 'Sección 3',
    days: ['Martes', 'Miércoles'],
    has_attendance: false,
    color: '#EF4444',
    evaluations: [
      { id: 'ev2-1', title: 'Control 1', weight: 5, type: 'control', date: null },
      { id: 'ev2-2', title: 'Control 2', weight: 5, type: 'control', date: null },
      { id: 'ev2-3', title: 'Control 3', weight: 5, type: 'control', date: null },
      { id: 'ev2-4', title: 'Control 4', weight: 5, type: 'control', date: null },
      { id: 'ev2-5', title: 'Prueba 1', weight: 20, type: 'prueba', date: null },
      { id: 'ev2-6', title: 'Prueba 2', weight: 25, type: 'prueba', date: null },
      { id: 'ev2-7', title: 'Prueba 3 (Examen)', weight: 35, type: 'examen', date: null },
    ],
    allFiles: [
      'Unidad N°1 Finanzas - Introducción.pdf',
      'Unidad N°2 - Análisis Financiero.pdf',
      'Unidad N°3 Finanzas - Matemáticas Financieras.pdf',
      'Unidad N°4 Finanzas- Evaluación de Proyectos.pdf',
      'Unidad N°4 Finanzas- Evaluación de Proyectos - 2° Parte.pdf',
      'Unidad N°5 Finanzas - Bonos y Acciones.pdf',
      'Unidad N°5 Finanzas - Bonos y Acciones - 2° Parte.pdf',
      'Clase Finanzas - Teoría de Portfolio v2.0.pdf',
      'Clase N°3 Finanzas II - CAPM.pdf',
      'Clase N°5 Finanzas II - Estructura de Capital - MM.pdf',
      'Material Mat Financiera y Ev proyectos.pdf',
      'Material Mat Financiera - Parte II.pdf',
      'Material de Estudio Mat Financiera Parte III.pdf',
      'Paquete de estudio Matematica financiera.pdf',
      'Paquete de estudio Ev de Proyectos.pdf',
      'Paquete de estudio Bonos y Acciones.pdf',
      'Enunciado ayudantía 1.pdf',
      'Enunciado ayudantía 2.pdf',
      'Enunciado ayudantía 3.pdf',
      'Enunciado ayudantía 4.pdf',
      'Enunciado ayudantía 5.pdf',
      'Ayudantía N° 1 - Pauta.pdf',
      'Ayudantía N° 2 - Pauta.pdf',
      'Ayudantía N°3 - Pauta.pdf',
      'Formulario Prueba 2.pdf',
      'Formulario Examen.pdf',
      'Programa Finanzas - Sem 1 - 2026 vf.pdf',
    ],
    evaluationModules: [
      { id: 'mod-r2-1', name: 'Controles', weight: 20, items: [
        { id: 'item-r2-1-1', name: 'Control 1', grade: null, date: null },
        { id: 'item-r2-1-2', name: 'Control 2', grade: null, date: null },
        { id: 'item-r2-1-3', name: 'Control 3', grade: null, date: null },
        { id: 'item-r2-1-4', name: 'Control 4', grade: null, date: null },
      ]},
      { id: 'mod-r2-2', name: 'Pruebas', weight: 45, items: [
        { id: 'item-r2-2-1', name: 'Prueba 1', grade: null, date: null },
        { id: 'item-r2-2-2', name: 'Prueba 2', grade: null, date: null },
      ]},
      { id: 'mod-r2-3', name: 'Examen', weight: 35, items: [
        { id: 'item-r2-3-1', name: 'Prueba 3 (Examen)', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
  {
    id: 'r3',
    name: 'Managerial Economics',
    code: 'MGT106',
    professor: 'Diego Avanzini',
    email: 'diego.avanzini@uai.cl',
    credits: 5,
    section: 'Sección 3',
    days: ['Jueves'],
    has_attendance: false,
    color: '#22C55E',
    evaluations: [
      { id: 'ev3-1', title: 'Controles y Tareas (NCT)', weight: 25, type: 'control', date: null },
      { id: 'ev3-2', title: 'Prueba Oficial 1', weight: 25, type: 'prueba', date: null },
      { id: 'ev3-3', title: 'Prueba Oficial 2', weight: 25, type: 'prueba', date: null },
      { id: 'ev3-4', title: 'Prueba Oficial 3 (Examen)', weight: 25, type: 'examen', date: null },
    ],
    allFiles: [
      'Unidad 1 - Economía de la Organización y Management.pdf',
      'Unidad 2 - Riesgo e Incertidumbre_v6 - SHORT.pdf',
      'Man Econ - Unidad 2 - Guia de Ejercicios - Riesgo e Incertidumbre - PAUTA_v2.pdf',
      'Man Econ - Unidad 3 - Guia de Ejercicios - Economía de la Información y Riesgo Moral - PAUTA.pdf',
      'Man Econ - Unidad 4 - Guia de Ejercicios - Economía de la Información y Selección Adversa - PAUTA.pdf',
      'Man Econ - Unidad 5 - Guia de Ejercicios - Estructura interna de la empresa - PAUTA.pdf',
      'Man Econ - Unidad 6 - Guia de Ejercicios - Estrategias de la empresa en el mercado - PAUTA.pdf',
      'Coase - La naturaleza de la empresa (1937).pdf',
      'Managerial Economics - Programa 2026-1S_v1.pdf',
    ],
    evaluationModules: [
      { id: 'mod-r3-1', name: 'Controles y Tareas (NCT)', weight: 25, items: [
        { id: 'item-r3-1-1', name: 'NCT 1', grade: null, date: null },
        { id: 'item-r3-1-2', name: 'NCT 2', grade: null, date: null },
        { id: 'item-r3-1-3', name: 'NCT 3', grade: null, date: null },
      ]},
      { id: 'mod-r3-2', name: 'Pruebas', weight: 50, items: [
        { id: 'item-r3-2-1', name: 'Prueba Oficial 1', grade: null, date: null },
        { id: 'item-r3-2-2', name: 'Prueba Oficial 2', grade: null, date: null },
      ]},
      { id: 'mod-r3-3', name: 'Examen', weight: 25, items: [
        { id: 'item-r3-3-1', name: 'Prueba Oficial 3 (Examen)', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
  {
    id: 'r4',
    name: 'Core Arte',
    code: 'CORE304',
    professor: 'Ignacio Fernández',
    email: 'ignacio.fernandez.c@uai.cl',
    credits: 4,
    section: 'Sección 22',
    days: ['Jueves', 'Viernes'],
    has_attendance: true,
    color: '#F59E0B',
    evaluations: [
      { id: 'ev4-1', title: 'Trabajos y Tareas (6)', weight: 37.5, type: 'tarea', date: null },
      { id: 'ev4-2', title: 'Participación en Clases', weight: 37.5, type: 'participacion', date: null },
      { id: 'ev4-3', title: 'Examen Final', weight: 25, type: 'examen', date: null },
    ],
    allFiles: [
      'PROGRAMA_COREARTE_SECCION_1.PDF',
      'Formato de evaluación.pdf',
      'Instrucciones Trabajo Final.pdf',
      'TrabajoFinal_Ejemplo_1.pdf',
      'TrabajoFinal_Ejemplo_2.pdf',
      'Taller-El Artículo Científico.pdf',
      'Guía para el uso y la creación de material docente con-inteligencia artificial generativa (1) (3).pdf',
      'Díaz Fernández, 2001. Representación gráfica en el Análisis de Datos..pdf',
      'Ramos Galarza, 2016. La Pregunta de Investigación..pdf',
      'Rozemblum et al, 2015. Calidad editorial y científica para inclusión de revistas científicas en bases de datos..pdf',
      'Villagrán Harris, 2009. Claves para escribir un artículo científico.pdf',
    ],
    evaluationModules: [
      { id: 'mod-r4-1', name: 'Trabajos y Tareas', weight: 37.5, items: [
        { id: 'item-r4-1-1', name: 'Trabajo 1', grade: null, date: null },
        { id: 'item-r4-1-2', name: 'Trabajo 2', grade: null, date: null },
        { id: 'item-r4-1-3', name: 'Trabajo 3', grade: null, date: null },
      ]},
      { id: 'mod-r4-2', name: 'Participación en Clases', weight: 37.5, items: [
        { id: 'item-r4-2-1', name: 'Participación General', grade: null, date: null },
      ]},
      { id: 'mod-r4-3', name: 'Examen Final', weight: 25, items: [
        { id: 'item-r4-3-1', name: 'Examen Final', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
  {
    id: 'r5',
    name: 'Core Ciencias',
    code: 'CORE302',
    professor: 'Ignacio Fernández',
    email: 'ignacio.fernandez.c@uai.cl',
    credits: 4,
    section: 'Sección 22',
    days: ['Lunes', 'Miércoles'],
    has_attendance: true,
    color: '#A855F7',
    evaluations: [
      { id: 'ev5-1', title: 'Pruebas Parciales (2)', weight: 30, type: 'prueba', date: null },
      { id: 'ev5-2', title: 'Trabajo de Investigación', weight: 25, type: 'tarea', date: null },
      { id: 'ev5-3', title: 'Participación en Clases', weight: 35, type: 'participacion', date: null },
      { id: 'ev5-4', title: 'Actividades en Clases', weight: 10, type: 'control', date: null },
    ],
    allFiles: [
      'PROGRAMA CORE CIENCIAS 2026.pdf',
      'La pregunta científica y sus métodos.pdf',
      'Clase 2-El Placer de Descubrir.pdf',
      'CLASE 3-El Universo Elegante Cap1.pdf',
      'Clase 4-El Universo Elegante Cap2.pdf',
      'CLASE 5-El Universo Elegante Cap3.pdf',
      'Clase 6-El universo elegante Cap 4.pdf',
      'Clase 08. Bienvenidos al Universo, Caps 7 y 8.pdf',
      'Clase 09-Bienvenidos al Universo, Cap14.pdf',
      'Clase 10-Cap 7 La tierra Joven.pdf',
      'Cap 8 La vida.pdf',
      'Leyes de Mendel.pdf',
      'El gen egoista Capitulo 3.pdf',
      'Actividad Clase Evolución.pdf',
      'Clase Cambio Global.pdf',
      'Barcena et al, 2020. La emergencia del cambio climático en America Latina y el Caribe. Libro Cepal.pdf',
      'Trischler, 2017. El Antropoceno.pdf',
      'Preguntas Guía Clase 15.pdf',
      'Preguntas Guía Clase 17.pdf',
      'Preguntas Guía Clase 18.pdf',
      'Preguntas Guía Clase 19.pdf',
      'Preguntas Guía Clase 20.pdf',
      'Preguntas Guía Clase 21.pdf',
      'Preguntas Guía Clase 24.pdf',
    ],
    evaluationModules: [
      { id: 'mod-r5-1', name: 'Pruebas Parciales', weight: 30, items: [
        { id: 'item-r5-1-1', name: 'Prueba Parcial 1', grade: null, date: null },
        { id: 'item-r5-1-2', name: 'Prueba Parcial 2', grade: null, date: null },
      ]},
      { id: 'mod-r5-2', name: 'Trabajo de Investigación', weight: 25, items: [
        { id: 'item-r5-2-1', name: 'Trabajo de Investigación', grade: null, date: null },
      ]},
      { id: 'mod-r5-3', name: 'Participación', weight: 35, items: [
        { id: 'item-r5-3-1', name: 'Participación General', grade: null, date: null },
      ]},
      { id: 'mod-r5-4', name: 'Actividades en Clases', weight: 10, items: [
        { id: 'item-r5-4-1', name: 'Actividades', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
  {
    id: 'r6',
    name: 'Derecho e Institucionalidad',
    code: 'DER201',
    professor: 'JP Escudero',
    email: '',
    credits: 3,
    section: 'Sección 7',
    days: ['Martes'],
    has_attendance: true,
    color: '#14B8A6',
    evaluations: [
      { id: 'ev6-1', title: 'Evaluación 1', weight: 33, type: 'prueba', date: null },
      { id: 'ev6-2', title: 'Evaluación 2', weight: 33, type: 'prueba', date: null },
      { id: 'ev6-3', title: 'Examen Final', weight: 34, type: 'examen', date: null },
    ],
    allFiles: [
      'Derecho e Institucionalidad PPT v2 (2).pptx',
    ],
    evaluationModules: [
      { id: 'mod-r6-1', name: 'Evaluaciones', weight: 66, items: [
        { id: 'item-r6-1-1', name: 'Evaluación 1', grade: null, date: null },
        { id: 'item-r6-1-2', name: 'Evaluación 2', grade: null, date: null },
      ]},
      { id: 'mod-r6-2', name: 'Examen Final', weight: 34, items: [
        { id: 'item-r6-2-1', name: 'Examen Final', grade: null, date: null },
      ]},
    ],
    attendanceSessions: [],
  },
];

// ── Horario real (extraído del PDF "Horario 1sem 3ero") ─────
// day_of_week: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie
export const MOCK_SCHEDULE = [
  // Econometría — Lun 08:30–09:40 (Lab, sin asistencia)
  { id: 's1',  ramo_id: 'r1', day_of_week: 0, start_time: '08:30', end_time: '09:40', sala: 'Laboratorio', has_attendance: false },
  // Econometría — Lun 13:00–14:10
  { id: 's2',  ramo_id: 'r1', day_of_week: 0, start_time: '13:00', end_time: '14:10', sala: '', has_attendance: false },
  // Econometría — Vie 11:30–12:40
  { id: 's3',  ramo_id: 'r1', day_of_week: 4, start_time: '11:30', end_time: '12:40', sala: '', has_attendance: false },

  // Finanzas — Mié 08:30–09:40 (Ayudantía)
  { id: 's4',  ramo_id: 'r2', day_of_week: 2, start_time: '08:30', end_time: '09:40', sala: '', has_attendance: false },
  // Finanzas — Mar 11:30–12:40
  { id: 's5',  ramo_id: 'r2', day_of_week: 1, start_time: '11:30', end_time: '12:40', sala: '', has_attendance: false },
  // Finanzas — Mar 13:00–14:10
  { id: 's6',  ramo_id: 'r2', day_of_week: 1, start_time: '13:00', end_time: '14:10', sala: '', has_attendance: false },
  // Finanzas — Mié 13:00–14:10
  { id: 's7',  ramo_id: 'r2', day_of_week: 2, start_time: '13:00', end_time: '14:10', sala: '', has_attendance: false },

  // Managerial Eco — Jue 11:30–12:40
  { id: 's8',  ramo_id: 'r3', day_of_week: 3, start_time: '11:30', end_time: '12:40', sala: '', has_attendance: false },
  // Managerial Eco — Jue 13:00–14:10
  { id: 's9',  ramo_id: 'r3', day_of_week: 3, start_time: '13:00', end_time: '14:10', sala: '', has_attendance: false },

  // Core Arte — Jue 10:00–11:10 (75% asistencia)
  { id: 's10', ramo_id: 'r4', day_of_week: 3, start_time: '10:00', end_time: '11:10', sala: '', has_attendance: true },
  // Core Arte — Vie 10:00–11:10 (75% asistencia)
  { id: 's11', ramo_id: 'r4', day_of_week: 4, start_time: '10:00', end_time: '11:10', sala: '', has_attendance: true },

  // Core Ciencias — Lun 11:30–12:40 (75% asistencia)
  { id: 's12', ramo_id: 'r5', day_of_week: 0, start_time: '11:30', end_time: '12:40', sala: '', has_attendance: true },
  // Core Ciencias — Mié 11:30–12:40 (75% asistencia)
  { id: 's13', ramo_id: 'r5', day_of_week: 2, start_time: '11:30', end_time: '12:40', sala: '', has_attendance: true },

  // Derecho — Mar 08:30–09:40 (75% asistencia)
  { id: 's14', ramo_id: 'r6', day_of_week: 1, start_time: '08:30', end_time: '09:40', sala: '', has_attendance: true },
  // Derecho — Mar 10:00–11:10 (75% asistencia)
  { id: 's15', ramo_id: 'r6', day_of_week: 1, start_time: '10:00', end_time: '11:10', sala: '', has_attendance: true },
];

// ── Unidades reales por ramo ────────────────────────────────
export const MOCK_UNITS = {
  r1: [
    {
      id: 'u1-0', ramo_id: 'r1', name: 'Introducción al Curso', order: 0,
      materias: [
        { name: 'Aspectos generales', description: 'Objetivos y metodología del curso', files: ['Unidad 0 - Introducción.pdf', 'Unidad 1 Tema 1 - Aspectos generales del curso.pdf'] },
      ],
    },
    {
      id: 'u1-1', ramo_id: 'r1', name: 'Unidad 1: Repaso Estadístico', order: 1,
      materias: [
        { name: 'Estadística matemática', description: 'Repaso de probabilidad y distribuciones', files: ['Unidad 1 Tema 2 - Breve repaso de estadística matemática.pdf'] },
        { name: 'Inferencia estadística', description: 'Estimación e hipótesis', files: ['Unidad 1 Tema 2 - Breve repaso de inferencia estadística.pdf'] },
      ],
    },
    {
      id: 'u1-2', ramo_id: 'r1', name: 'Unidad 2: Regresión Lineal Simple', order: 2,
      materias: [
        { name: 'Modelo MCO', description: 'Mínimos cuadrados ordinarios', files: ['Unidad 2 - Modelo de regresión lineal simple.pdf'] },
        { name: 'Supuestos y diagnóstico', description: 'Validación del modelo', files: [] },
      ],
    },
    {
      id: 'u1-3', ramo_id: 'r1', name: 'Unidad 3: Regresión Lineal Múltiple', order: 3,
      materias: [
        { name: 'Modelo de regresión múltiple', description: 'Extensión a múltiples variables', files: ['Unidad 3 - Modelo de regresión lineal múltiple (RStudio).pdf'] },
        { name: 'Implementación en RStudio', description: 'Práctica computacional', files: ['Taller Análisis Datos.pdf', 'Taller Base de Datos.pdf'] },
      ],
    },
    {
      id: 'u1-4', ramo_id: 'r1', name: 'Unidad 4: Causalidad y Diseño', order: 4,
      materias: [
        { name: 'Variables instrumentales', description: 'IV y 2SLS', files: ['Unidad 4 - Causalidad y Diseño.pdf'] },
        { name: 'Diferencias en diferencias', description: 'DiD y panel data', files: [] },
      ],
    },
    {
      id: 'u1-5', ramo_id: 'r1', name: 'Unidad 5: Modelos de Elección Discreta', order: 5,
      materias: [
        { name: 'Modelos Logit y Probit', description: 'Variables dependientes binarias', files: ['Unidad 5 - Modelos de elección discreta.pdf', 'Guía Unidad 5 - Modelo de variable discreta.pdf'] },
      ],
    },
    {
      id: 'u1-6', ramo_id: 'r1', name: 'Unidad 6: Big Data y Machine Learning', order: 6,
      materias: [
        { name: 'Introducción a ML', description: 'Supervised learning, regularización', files: ['UNIDAD 6 - Introducción a Big Data y Machine Learning.pdf', 'Guía Unidad 6 - Introducción a la Big Data y Machine Learning.pdf'] },
      ],
    },
  ],

  r2: [
    {
      id: 'u2-1', ramo_id: 'r2', name: 'Unidad 1: Introducción a Finanzas', order: 1,
      materias: [
        { name: 'Conceptos fundamentales', description: 'Introducción al mundo financiero', files: ['Unidad N°1 Finanzas - Introducción.pdf'] },
        { name: 'Análisis Financiero', description: 'Estados financieros y razones', files: ['Unidad N°2 - Análisis Financiero.pdf'] },
      ],
    },
    {
      id: 'u2-2', ramo_id: 'r2', name: 'Unidad 2: Matemáticas Financieras', order: 2,
      materias: [
        { name: 'Valor presente y futuro', description: 'TVM y flujos de caja', files: ['Unidad N°3 Finanzas - Matemáticas Financieras.pdf', 'Material Mat Financiera y Ev proyectos.pdf'] },
        { name: 'Anualidades y perpetuidades', description: 'Flujos regulares', files: ['Material Mat Financiera - Parte II.pdf'] },
      ],
    },
    {
      id: 'u2-3', ramo_id: 'r2', name: 'Unidad 3: Evaluación de Proyectos', order: 3,
      materias: [
        { name: 'VPN y TIR', description: 'Criterios de inversión', files: ['Unidad N°4 Finanzas- Evaluación de Proyectos.pdf'] },
        { name: 'Flujo de caja', description: 'Construcción del flujo libre', files: ['Unidad N°4 Finanzas- Evaluación de Proyectos - 2° Parte.pdf'] },
      ],
    },
    {
      id: 'u2-4', ramo_id: 'r2', name: 'Unidad 4: Bonos y Acciones', order: 4,
      materias: [
        { name: 'Valorización de bonos', description: 'Precio, yield y duration', files: ['Unidad N°5 Finanzas - Bonos y Acciones.pdf'] },
        { name: 'Valorización de acciones', description: 'DDM y múltiplos', files: ['Unidad N°5 Finanzas - Bonos y Acciones - 2° Parte.pdf'] },
      ],
    },
    {
      id: 'u2-5', ramo_id: 'r2', name: 'Unidad 5: Portafolio y CAPM', order: 5,
      materias: [
        { name: 'Teoría de Portafolio', description: 'Diversificación y frontera eficiente', files: ['Clase Finanzas - Teoría de Portfolio v2.0.pdf'] },
        { name: 'CAPM', description: 'Capital Asset Pricing Model', files: ['Clase N°3 Finanzas II - CAPM.pdf'] },
      ],
    },
    {
      id: 'u2-6', ramo_id: 'r2', name: 'Unidad 6: Estructura de Capital', order: 6,
      materias: [
        { name: 'Teorema Modigliani-Miller', description: 'Política de endeudamiento', files: ['Clase N°5 Finanzas II - Estructura de Capital - MM.pdf'] },
      ],
    },
  ],

  r3: [
    {
      id: 'u3-1', ramo_id: 'r3', name: 'Unidad 1: Economía de la Organización', order: 1,
      materias: [
        { name: 'Naturaleza de la empresa', description: 'Coase y los costos de transacción', files: ['Coase - La naturaleza de la empresa (1937).pdf', 'Unidad 1 - Economía de la Organización y Management.pdf'] },
      ],
    },
    {
      id: 'u3-2', ramo_id: 'r3', name: 'Unidad 2: Riesgo e Incertidumbre', order: 2,
      materias: [
        { name: 'Decisiones bajo riesgo', description: 'Utilidad esperada y aversión al riesgo', files: ['Unidad 2 - Riesgo e Incertidumbre_v6 - SHORT.pdf', 'Man Econ - Unidad 2 - Guia de Ejercicios - Riesgo e Incertidumbre - PAUTA_v2.pdf'] },
      ],
    },
    {
      id: 'u3-3', ramo_id: 'r3', name: 'Unidad 3: Riesgo Moral', order: 3,
      materias: [
        { name: 'Problemas de agencia', description: 'Principal-agente y contratos óptimos', files: ['Man Econ - Unidad 3 - Guia de Ejercicios - Economía de la Información y Riesgo Moral - PAUTA.pdf'] },
      ],
    },
    {
      id: 'u3-4', ramo_id: 'r3', name: 'Unidad 4: Selección Adversa', order: 4,
      materias: [
        { name: 'Información asimétrica', description: 'Screening y señalización', files: ['Man Econ - Unidad 4 - Guia de Ejercicios - Economía de la Información y Selección Adversa - PAUTA.pdf'] },
      ],
    },
    {
      id: 'u3-5', ramo_id: 'r3', name: 'Unidad 5: Estructura Interna', order: 5,
      materias: [
        { name: 'Diseño organizacional', description: 'Jerarquías, delegación y control', files: ['Man Econ - Unidad 5 - Guia de Ejercicios - Estructura interna de la empresa - PAUTA.pdf'] },
      ],
    },
    {
      id: 'u3-6', ramo_id: 'r3', name: 'Unidad 6: Estrategias de Mercado', order: 6,
      materias: [
        { name: 'Competencia y estrategia', description: 'Oligopolio, precios y diferenciación', files: ['Man Econ - Unidad 6 - Guia de Ejercicios - Estrategias de la empresa en el mercado - PAUTA.pdf'] },
      ],
    },
  ],

  r4: [
    {
      id: 'u4-1', ramo_id: 'r4', name: 'Unidad 1: Del ver al mirar', order: 1,
      materias: [
        { name: 'Percepción visual', description: 'La diferencia entre ver y observar arte', files: [] },
        { name: 'Análisis formal', description: 'Elementos visuales básicos', files: ['Díaz Fernández, 2001. Representación gráfica en el Análisis de Datos..pdf'] },
      ],
    },
    {
      id: 'u4-2', ramo_id: 'r4', name: 'Unidad 2: La obra, formato y espacio', order: 2,
      materias: [
        { name: 'Formatos artísticos', description: 'Pintura, escultura, instalación', files: [] },
        { name: 'Espacio y contexto', description: 'La obra en su ambiente', files: [] },
      ],
    },
    {
      id: 'u4-3', ramo_id: 'r4', name: 'Unidad 3: Códigos, función y público', order: 3,
      materias: [
        { name: 'Semiótica del arte', description: 'Lectura de signos y símbolos', files: [] },
        { name: 'Arte y comunicación', description: 'La función social del arte', files: [] },
      ],
    },
    {
      id: 'u4-4', ramo_id: 'r4', name: 'Unidad 4: Tipos, formas y estilos', order: 4,
      materias: [
        { name: 'Historia del arte', description: 'Movimientos y estilos artísticos', files: [] },
        { name: 'Arte contemporáneo', description: 'Tendencias actuales', files: [] },
      ],
    },
    {
      id: 'u4-5', ramo_id: 'r4', name: 'Unidad 5: Oficio y creación', order: 5,
      materias: [
        { name: 'Técnicas artísticas', description: 'Medios y materiales', files: ['Taller-El Artículo Científico.pdf'] },
      ],
    },
    {
      id: 'u4-6', ramo_id: 'r4', name: 'Unidad 6: Mediación', order: 6,
      materias: [
        { name: 'Trabajo Final', description: 'Análisis de obra de arte original', files: ['Instrucciones Trabajo Final.pdf', 'TrabajoFinal_Ejemplo_1.pdf', 'TrabajoFinal_Ejemplo_2.pdf'] },
      ],
    },
  ],

  r5: [
    {
      id: 'u5-1', ramo_id: 'r5', name: 'Segmento 1: Cosmología y Relatividad', order: 1,
      materias: [
        { name: 'El Universo Elegante', description: 'Relatividad especial y general', files: ['CLASE 3-El Universo Elegante Cap1.pdf', 'Clase 4-El Universo Elegante Cap2.pdf', 'CLASE 5-El Universo Elegante Cap3.pdf', 'Clase 6-El universo elegante Cap 4.pdf'] },
        { name: 'El placer de descubrir', description: 'Método científico y curiosidad', files: ['Clase 2-El Placer de Descubrir.pdf'] },
      ],
    },
    {
      id: 'u5-2', ramo_id: 'r5', name: 'Segmento 2: Formación del Universo y la Tierra', order: 2,
      materias: [
        { name: 'Astrofísica y cosmología', description: 'Big Bang, galaxias, estrellas', files: ['Clase 08. Bienvenidos al Universo, Caps 7 y 8.pdf', 'Clase 09-Bienvenidos al Universo, Cap14.pdf'] },
        { name: 'La Tierra Joven', description: 'Formación del planeta Tierra', files: ['Clase 10-Cap 7 La tierra Joven.pdf'] },
      ],
    },
    {
      id: 'u5-3', ramo_id: 'r5', name: 'Segmento 3: Vida y Evolución', order: 3,
      materias: [
        { name: 'Origen de la vida', description: 'Primeras moléculas y organismos', files: ['Cap 8 La vida.pdf'] },
        { name: 'Evolución darwiniana', description: 'Selección natural y adaptación', files: ['Actividad Clase Evolución.pdf', 'El gen egoista Capitulo 3.pdf'] },
      ],
    },
    {
      id: 'u5-4', ramo_id: 'r5', name: 'Segmento 4: Genética y Evolución Humana', order: 4,
      materias: [
        { name: 'Genética mendeliana', description: 'Leyes de Mendel y herencia', files: ['Leyes de Mendel.pdf'] },
        { name: 'Evolución humana', description: 'Origen y características del Homo sapiens', files: [] },
      ],
    },
    {
      id: 'u5-5', ramo_id: 'r5', name: 'Segmento 5: Impactos Humanos', order: 5,
      materias: [
        { name: 'Cambio climático', description: 'Causas y consecuencias del cambio global', files: ['Clase Cambio Global.pdf', 'Barcena et al, 2020. La emergencia del cambio climático en America Latina y el Caribe. Libro Cepal.pdf'] },
        { name: 'El Antropoceno', description: 'Era geológica marcada por la humanidad', files: ['Trischler, 2017. El Antropoceno.pdf'] },
      ],
    },
  ],

  r6: [
    {
      id: 'u6-1', ramo_id: 'r6', name: 'Unidad 1: Fundamentos del Derecho', order: 1,
      materias: [
        { name: 'Sistema jurídico chileno', description: 'Ramas del derecho y fuentes', files: ['Derecho e Institucionalidad PPT v2 (2).pptx'] },
      ],
    },
    {
      id: 'u6-2', ramo_id: 'r6', name: 'Unidad 2: Institucionalidad', order: 2,
      materias: [
        { name: 'Estado y gobierno', description: 'Poderes del Estado y Constitución', files: [] },
        { name: 'Regulación económica', description: 'Marco regulatorio empresarial', files: [] },
      ],
    },
  ],
};

// ── Tareas de ejemplo ──────────────────────────────────────
export const MOCK_TASKS = [
  {
    id: 't1', title: 'Control 1 — Econometría', type: 'control',
    ramo_id: 'r1', unit_id: 'u1-1', materia: 'Inferencia estadística',
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't2', title: 'Prueba 1 — Finanzas', type: 'evaluación',
    ramo_id: 'r2', unit_id: 'u2-2', materia: 'Valor presente y futuro',
    due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't3', title: 'Prueba Oficial 1 — Managerial', type: 'evaluación',
    ramo_id: 'r3', unit_id: 'u3-2', materia: 'Decisiones bajo riesgo',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't4', title: 'Trabajo Final — Core Arte', type: 'tarea',
    ramo_id: 'r4', unit_id: 'u4-6', materia: 'Trabajo Final',
    due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't5', title: 'Prueba Parcial — Core Ciencias', type: 'evaluación',
    ramo_id: 'r5', unit_id: 'u5-2', materia: 'Astrofísica y cosmología',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't6', title: 'Evaluación 1 — Derecho', type: 'evaluación',
    ramo_id: 'r6', unit_id: 'u6-1', materia: 'Sistema jurídico chileno',
    due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
  {
    id: 't7', title: 'Taller Base de Datos', type: 'tarea',
    ramo_id: 'r1', unit_id: 'u1-3', materia: 'Implementación en RStudio',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completed: false, description: '',
  },
];

// ── Módulos de aprendizaje ──────────────────────────────────
export const MOCK_LEARNING_MODELS = [
  {
    id: 'lm1',
    name: 'Método Herrera',
    description: 'Construcción de arquitectura mental y transferencia a memoria de largo plazo.',
    color: '#3B82F6',
  },
  {
    id: 'lm2',
    name: 'Método Matemático',
    description: 'Neurociencia de la mecanización: práctica progresiva y modo emergencia para evaluaciones.',
    color: '#F59E0B',
  },
];

export const MOCK_SUBMODULES = {
  lm1: [
    {
      id: 'sm1-1', model_id: 'lm1', name: 'APRENDER', order: 1,
      prompt_content: `# Sub-modelo: Herrera - APRENDER
**Objetivo:** Construcción de la arquitectura mental y comprensión lógica inicial.

---

## 1. Storytelling Simbólico (El Ancla)
* **Acción de la IA:** Antes de presentar datos, la IA debe crear una narrativa breve, una analogía física o un escenario cotidiano que represente el problema central del tema.
* **Requisito:** Debe contener un "símbolo" claro que el alumno pueda recordar.
* **Meta:** Generar una conexión emocional/lógica para que el concepto "importe".

## 2. Explicación Clara y Concreta (El Aterrizaje)
* **Acción de la IA:** Definición técnica y precisa utilizando los términos exactos de las fuentes proporcionadas.
* **Contenido Obligatorio:**
    1. **Definición:** ¿Qué es exactamente?
    2. **Mecánica:** ¿Cómo funciona paso a paso?
    3. **Límites:** ¿Qué NO es y dónde deja de aplicarse?
* **Meta:** Eliminar ambigüedades y asentar el lenguaje técnico.

## 3. Verificación de Intuición
* **Acción de la IA:** La IA lanza una pregunta para validar si la lógica del "Ancla" y la "Teoría" se han fusionado.
* **Interacción:** "¿Cómo se relaciona la historia inicial con la regla técnica que acabamos de ver?".

---

## 🔄 Navegación y Pimponeo
Al finalizar la Verificación de Intuición, la IA evaluará el desempeño y ofrecerá:
1. **Profundizar:** "¿Deseas ver un detalle más específico o técnico de este concepto?"
2. **Siguiente:** "Si está claro, pasemos al siguiente concepto de tus fuentes."
3. **Pimponeo a PRÁCTICA:** "Recomiendo saltar ahora al sub-modelo **Herrera - Practicar** para fijar este conocimiento en tu memoria de largo plazo."`,
    },
    {
      id: 'sm1-2', model_id: 'lm1', name: 'PRACTICAR', order: 2,
      prompt_content: `# Sub-modelo: Herrera - PRACTICAR
**Objetivo:** Transferencia de la memoria de corto plazo a la de largo plazo mediante esfuerzo cognitivo deliberado.

---

## 1. Active Recall de Alta Complejidad (Recuperación Activa)
* **Acción de la IA:** No se permiten preguntas de definición simple. La IA debe plantear retos de **aplicación, contraste y predicción**.
* **Dinámica:** * "Sin mirar tus apuntes, ¿qué sucedería con [Resultado X] si eliminamos la variable [Y] que acabamos de aprender?"
    * "Compara este concepto con [Concepto Anterior]: ¿En qué se parecen y cuál es la diferencia crítica que los separa?"
* **Meta:** Forzar al cerebro a reconstruir el conocimiento desde cero.

## 2. Learning by Teaching (Método Feynman Dinámico)
* **Acción de la IA:** El alumno debe explicar el concepto en sus propias palabras como si le enseñara a alguien que no sabe nada del tema.
* **Rol de la IA:** La IA actuará como un "alumno curioso" que detecta inconsistencias. Interrumpirá con preguntas tipo: "¿Pero por qué asumes que eso siempre es así?" o "¿Qué palabra usarías si no pudieras usar términos técnicos?".
* **Meta:** Identificar lagunas o "puntos ciegos" en la comprensión del alumno.

---

## 🔄 Navegación y Pimponeo
Basado en la calidad de la explicación del alumno:
1. **Éxito Alto:** "Tu dominio es sólido. ¿Deseas pasar al siguiente tema o ir a **Práctica Full** para mecanizar ejercicios?"
2. **Éxito Medio:** "Entiendes la base pero flaqueas en la terminología. Sugiero profundizar un poco más aquí antes de avanzar."
3. **Pimponeo a APRENDER (Rescate):** "Detecto una confusión fundamental en tu explicación. Sugiero volver al sub-modelo **Herrera - Aprender** para revisar la Fase de Aterrizaje del concepto [X]."`,
    },
  ],
  lm2: [
    {
      id: 'sm2-1', model_id: 'lm2', name: 'PRÁCTICA FULL', order: 1,
      prompt_content: `# Skill: Método Matemático - PRÁCTICA FULL
**Áreas:** Econometría, Finanzas, Contabilidad, Cálculo y Álgebra.
**Enfoque:** Neurociencia de la Mecanización y Andamiaje Cognitivo.

---

## 🔵 Sub-modelo: PRÁCTICA FULL (Maestría Progresiva)
*Diseñado para profundizar, mecanizar y automatizar el conocimiento de manera incremental.*

### Fase 1: Desglose de Componentes (Aislamiento)
- **Acción:** La IA descompone el tema en sus "ladrillos" básicos (variables, constantes, reglas de asientos, etc.).
- **Interacción:** El alumno explica qué sucede con el sistema si uno de esos componentes se altera.
- **Meta:** Comprensión de la lógica antes de la operación.

### Fase 2: El Traductor de Contexto (Abstracción)
- **Acción:** Generación de 3 enunciados narrativos (historias o casos de uso real).
- **Tarea:** El alumno identifica datos relevantes y elige la "fórmula o herramienta madre" sin resolver aún.
- **Meta:** Entrenar el filtro de "ruido" en problemas complejos.

### Fase 3: Mecanización Incremental (Músculo Mental)
Se trabaja por bloques de repetición adaptativa:
- **Bloque A (Guiado):** 3 ejercicios donde la IA resuelve el 50% y el alumno completa el proceso.
- **Bloque B (Autónomo):** 5 ejercicios estándar para generar fluidez y velocidad.
- **Bloque C (Desafío):** 2 ejercicios con variables ocultas o datos que requieren un cálculo previo.

### Fase 4: Práctica Intercalada (Interleaving)
- **Acción:** La IA mezcla problemas de diferentes temas encontrados en las fuentes (ej: un ejercicio de interés compuesto seguido de uno de amortización).
- **Meta:** Simular el cambio de contexto de un examen real y evitar la memoria de corto plazo.

### Fase 5: Auditoría de Errores (Metacognición)
- **Acción:** Ante un error, la IA **no entrega la respuesta**. Muestra el paso a paso del alumno vs. un paso a paso correcto (anonimizado).
- **Interacción:** El alumno debe señalar el punto exacto de la bifurcación errónea.

---

## 🔄 Protocolo de "Pimponeo" (Integración con Aprendizaje)
Este modelo de **Práctica Full** detecta automáticamente bloqueos:
1. Si el alumno falla 2 veces consecutivas en la **Fase 3**, el sistema activa un *Trigger de Nivelación*.
2. Se sugiere pausar y saltar al **Sub-modelo de Aprendizaje** para ese concepto específico.
3. Tras resolver la duda teórica, el alumno es reinsertado en la **Fase 3** de la Práctica Full con nuevos valores.`,
    },
    {
      id: 'sm2-2', model_id: 'lm2', name: 'FLASH', order: 2,
      prompt_content: `# Skill: Método Matemático - FLASH
**Áreas:** Econometría, Finanzas, Contabilidad, Cálculo y Álgebra.
**Enfoque:** Neurociencia de la Mecanización y Andamiaje Cognitivo.

---

## 🔴 Sub-modelo: FLASH (Modo Emergencia / Memoria Rápida)
*Ideal para repasos de última hora (30-60 min antes de una evaluación).*

### 1. El Formulario Crítico
La IA identifica y extrae de las fuentes las 3-5 fórmulas o reglas lógicas que resuelven el 80% de los problemas típicos. Define cada variable y su unidad de medida obligatoria.

### 2. Diccionario de Unidades y Conversiones
Reto rápido de "trampas" de magnitudes (ej: pasar tasas anuales a mensuales, o verificar que los activos sumen lo mismo que pasivos + patrimonio).

### 3. Detección de Errores (V/F)
La IA presenta 3 ejercicios resueltos con un error escondido (conceptual o de cálculo). El alumno debe identificar si es **Verdadero** o **Falso**, o señalar dónde está el fallo en menos de 60 segundos por ejercicio.`,
    },
  ],
};
