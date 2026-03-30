// ============================================================
// localStore.js — Persistencia con localStorage
// Todas las claves de datos usan esta capa para sobrevivir refreshes
// ============================================================

const VERSION     = '2'; // ← bumper al cambiar el schema de datos
const VERSION_KEY = 'uni_data_version';
const DATA_KEYS   = ['uni_ramos', 'uni_tasks', 'uni_schedule', 'uni_units', 'uni_aprendizaje_models', 'uni_aprendizaje_submodules'];

// Caché en memoria: garantiza que dos servicios que comparten la misma
// clave obtienen la misma referencia de array (evita doble-escritura).
const cache = new Map();

/** Carga datos desde localStorage, o siembra con seedFn() si no existe / versión vieja */
export function load(key, seedFn) {
  // Devolver referencia en caché si ya está cargado
  if (cache.has(key)) return cache.get(key);

  // Migración de versión: si la versión guardada no coincide, limpiar todo
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== VERSION) {
    DATA_KEYS.forEach(k => localStorage.removeItem(k));
    localStorage.setItem(VERSION_KEY, VERSION);
    const fresh = seedFn();
    cache.set(key, fresh);
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }

  const raw = localStorage.getItem(key);
  let data;
  try {
    data = raw ? JSON.parse(raw) : seedFn();
  } catch {
    data = seedFn();
  }

  cache.set(key, data);
  return data;
}

/** Guarda datos en localStorage */
export function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Limpia todos los datos de la app (útil para reset/debug) */
export function clearAll() {
  DATA_KEYS.forEach(k => {
    localStorage.removeItem(k);
    cache.delete(k);
  });
  localStorage.removeItem(VERSION_KEY);
}
