// ─── Contexto del producto ────────────────────────────────────────────────────
export const APP = {
  nombre: 'Universidad V1',
  handle: '@universidadv1',
  descripcion:
    'App chilena para universitarios — gestiona tus ramos, notas, tareas y calendario académico en un solo lugar.',
  painPoints: [
    'No entiendo bien el ramo y me pierdo con tantos ramos a la vez',
    'Me pillan de sorpresa las pruebas y las entregas',
    'No sé si voy pasando el ramo o no',
    'Se me olvidan tareas y controles',
    'Tengo todo disperso: WhatsApp, correo, cuadernos',
  ],
  features: [
    'Vista unificada de todos tus ramos',
    'Calendario académico con evaluaciones',
    'Seguimiento de notas por ramo',
    'Lista de tareas con fechas límite',
    'Horario semanal',
    'Cuaderno de apuntes por unidad',
  ],
  tono: `
    Directo e informativo, pero cercano como un amigo.
    Lenguaje informal chileno: "cachai", "po", "altiro", "la raja", "weón" (con cuidado).
    Sin floro ni motivacional genérico.
    Habla como alguien que encontró algo útil y te lo está contando.
    El que habla es el primo — un estudiante real, no una empresa.
  `,
  audiencia: 'Universitarios chilenos, 18-25 años',
  instagram: 'https://www.instagram.com/universidadv1',
};

// ─── Config de scraping (gratis, sin API keys) ────────────────────────────────
export const SCRAPING = {
  // Subreddits a monitorear para pain points reales
  subreddits: ['chile', 'Universitarios', 'ingenieria'],
  // Queries de búsqueda en Reddit
  redditQueries: [
    'universidad ramos notas',
    'semestre prueba estudio',
    'organización notas ramos',
  ],
  // Queries para DuckDuckGo (tendencias de contenido)
  searchQueries: [
    'instagram reels universitarios chile 2025',
    'tiktok app estudiantes universitarios viral',
    'instagram reels organización universitaria chile',
  ],
};

// ─── Modelo Claude ─────────────────────────────────────────────────────────────
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
