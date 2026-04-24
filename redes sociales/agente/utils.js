import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const OUTPUT_DIR = join(__dirname, 'output');

// Retorna label de la semana actual: "2026-W17"
export function getWeekLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

// Retorna fecha actual como "2026-04-24"
export function getDateLabel() {
  return new Date().toISOString().split('T')[0];
}

// Lee JSON guardado, retorna null si no existe
export function readJSON(filepath) {
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

// Formatea número grande: 12400 → "12.4k"
export function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Trunca texto a N caracteres
export function truncate(str, n = 200) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
}
