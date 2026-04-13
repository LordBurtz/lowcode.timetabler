export const ROW_HEIGHT = 15;
export const BLOCK_GAP = 3;

export const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

export const COLOR_PRESETS = [
  '#4A90D9', '#E07A5F', '#81B29A', '#F2CC8F', '#A78BFA',
  '#F472B6', '#34D399', '#FB923C', '#94A3B8', '#E879F9',
];

export const DEFAULT_THEME = {
  gridBackground: '#fafafa',
  gridLineColor: '#e5e5e5',
  hourLineColor: '#cccccc',
  textColor: '#1a1a1a',
  headerBackground: '#ffffff',
  headerTextColor: '#555555',
  accentColor: '#4A90D9',
};

export const DARK_THEME = {
  gridBackground: '#1a1a1e',
  gridLineColor: '#2a2a30',
  hourLineColor: '#3a3a42',
  textColor: '#e0e0e0',
  headerBackground: '#1e1e22',
  headerTextColor: '#999999',
  accentColor: '#6aa3e0',
};

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function parseTime(str) {
  const match = str.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function roundToQuarter(mins) {
  return Math.round(mins / 15) * 15;
}

export function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function parseRgba(rgba) {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return { hex: `#${r}${g}${b}`, opacity: match[4] !== undefined ? parseFloat(match[4]) : 1 };
  }
  if (rgba.startsWith('#') && rgba.length >= 7) {
    return { hex: rgba.slice(0, 7), opacity: 1 };
  }
  return { hex: '#4A90D9', opacity: 1 };
}

export function toRgba(color) {
  if (color.startsWith('rgba')) return color;
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }
  return color;
}
