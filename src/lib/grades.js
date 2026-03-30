// ============================================================
// grades.js — Helpers de cálculo de notas (escala chilena 1.0–7.0)
// ============================================================

/** Promedio de los ítems que tienen nota asignada */
export function moduleAverage(items = []) {
  const graded = items.filter(i => i.grade !== null && i.grade !== undefined && i.grade !== '');
  if (!graded.length) return null;
  const sum = graded.reduce((s, i) => s + Number(i.grade), 0);
  return sum / graded.length;
}

/**
 * Nota final ponderada (parcial: solo considera módulos con al menos una nota).
 * Devuelve null si ningún módulo tiene nota.
 */
export function weightedFinalGrade(modules = []) {
  let weightedSum = 0;
  let weightUsed  = 0;
  for (const mod of modules) {
    const avg = moduleAverage(mod.items);
    if (avg !== null) {
      weightedSum += avg * (mod.weight ?? 0);
      weightUsed  += (mod.weight ?? 0);
    }
  }
  if (weightUsed === 0) return null;
  return weightedSum / weightUsed;
}

/** Formatea una nota o devuelve '–' */
export function formatGrade(g) {
  if (g === null || g === undefined || g === '') return '–';
  return Number(g).toFixed(1);
}

/** Color semántico según nota en escala chilena */
export function gradeColor(g) {
  if (g === null || g === undefined) return 'var(--text-muted)';
  const n = Number(g);
  if (n >= 5.0) return 'var(--color-success)';
  if (n >= 4.0) return '#78dcff';
  if (n >= 3.0) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/** Suma de pesos de todos los módulos */
export function totalWeight(modules = []) {
  return modules.reduce((s, m) => s + (m.weight ?? 0), 0);
}
