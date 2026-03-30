export const RAMO_COLORS = [
  { id: 1,  hex: '#4f8ef7', name: 'Azul' },
  { id: 2,  hex: '#e05a5a', name: 'Rojo' },
  { id: 3,  hex: '#4cd97b', name: 'Verde' },
  { id: 4,  hex: '#e6a530', name: 'Ámbar' },
  { id: 5,  hex: '#bf5ff1', name: 'Violeta' },
  { id: 6,  hex: '#2fc4c4', name: 'Teal' },
  { id: 7,  hex: '#f0814a', name: 'Naranja' },
  { id: 8,  hex: '#f050a8', name: 'Rosa' },
  { id: 9,  hex: '#72c472', name: 'Salvia' },
  { id: 10, hex: '#89c8f5', name: 'Cielo' },
];

/** Appends a 2-digit hex alpha to a hex color string.
 *  colorAlpha('#4f8ef7', 0.12) → '#4f8ef71f'
 */
export const colorAlpha = (hex, opacity) =>
  hex + Math.round(opacity * 255).toString(16).padStart(2, '0');
