import { DEFAULT_THEME, DARK_THEME } from './constants.js';

const STORAGE_KEY = 'timetabler-storage';

const defaultState = {
  courses: [],
  theme: { ...DEFAULT_THEME },
  title: 'Timetabler',
  footnote: 'shift + h to hide controls',
  rowHeight: 15,
  gridStart: 480,
  gridEnd: 1200,
  darkMode: false,
  customColors: [],
};

// ── Compact encoding helpers ─────────────────────────────
// Short keys for state fields
const K = {
  courses:'c', theme:'t', title:'T', footnote:'f', rowHeight:'r',
  gridStart:'a', gridEnd:'z', darkMode:'d', customColors:'x',
};
// Short keys for theme fields
const TK = {
  gridBackground:'g', gridLineColor:'l', hourLineColor:'h',
  textColor:'t', headerBackground:'b', headerTextColor:'x', accentColor:'a',
};
// Day shortcodes (index)
const DAY_I = { monday:0, tuesday:1, wednesday:2, thursday:3, friday:4 };
const I_DAY = ['monday','tuesday','wednesday','thursday','friday'];

function packState(state) {
  const o = {};
  // Only include non-default values
  if (state.title !== defaultState.title) o[K.title] = state.title;
  if (state.footnote !== defaultState.footnote) o[K.footnote] = state.footnote;
  if (state.rowHeight !== defaultState.rowHeight) o[K.rowHeight] = state.rowHeight;
  if (state.gridStart !== defaultState.gridStart) o[K.gridStart] = state.gridStart;
  if (state.gridEnd !== defaultState.gridEnd) o[K.gridEnd] = state.gridEnd;
  if (state.darkMode) o[K.darkMode] = 1;
  if (state.customColors.length) o[K.customColors] = state.customColors;

  // Theme: only include keys that differ from the current base theme
  const baseTheme = state.darkMode ? DARK_THEME : DEFAULT_THEME;
  const td = {};
  let themeDiff = false;
  for (const [full, short] of Object.entries(TK)) {
    if (state.theme[full] !== baseTheme[full]) { td[short] = state.theme[full]; themeDiff = true; }
  }
  if (themeDiff) o[K.theme] = td;

  // Courses: compact array
  if (state.courses.length) {
    o[K.courses] = state.courses.map(c => {
      const p = [c.name, DAY_I[c.day] ?? c.day, c.start, c.end, c.color];
      if (c.location) p.push(c.location);
      if (c.background && c.background !== 'transparent') {
        if (!c.location) p.push('');
        p.push(c.background);
      }
      return p;
    });
  }
  return o;
}

function unpackState(o) {
  const s = {};
  if (K.title in o) s.title = o[K.title];
  if (K.footnote in o) s.footnote = o[K.footnote];
  if (K.rowHeight in o) s.rowHeight = o[K.rowHeight];
  if (K.gridStart in o) s.gridStart = o[K.gridStart];
  if (K.gridEnd in o) s.gridEnd = o[K.gridEnd];
  s.darkMode = !!o[K.darkMode];
  if (K.customColors in o) s.customColors = o[K.customColors];

  // Theme
  if (K.theme in o) {
    const base = s.darkMode ? { ...DARK_THEME } : { ...DEFAULT_THEME };
    const td = o[K.theme];
    for (const [full, short] of Object.entries(TK)) {
      if (short in td) base[full] = td[short];
    }
    s.theme = base;
  }

  // Courses
  if (K.courses in o) {
    s.courses = o[K.courses].map(p => ({
      id: crypto.randomUUID(),
      name: p[0],
      day: typeof p[1] === 'number' ? (I_DAY[p[1]] || p[1]) : p[1],
      start: p[2],
      end: p[3],
      color: p[4],
      location: p[5] || '',
      background: p[6] || 'transparent',
    }));
  }
  return s;
}

// Compress bytes via DecompressionStream/CompressionStream
async function deflate(data) {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

async function inflate(data) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(data);
  writer.close();
  const chunks = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

// Base64url (no padding)
function toB64(bytes) {
  let b = '';
  for (const x of bytes) b += String.fromCharCode(x);
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(str) {
  const b = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

async function stateFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');
    if (!encoded) return null;
    const compressed = fromB64(encoded);
    const jsonBytes = await inflate(compressed);
    const json = new TextDecoder().decode(jsonBytes);
    return unpackState(JSON.parse(json));
  } catch {
    return null;
  }
}

function hydrateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const saved = JSON.parse(raw);
    const s = saved.state || saved;

    // Migration: old hour-based to minute-based
    if ('gridStartHour' in s && !('gridStart' in s)) {
      s.gridStart = s.gridStartHour * 60;
      s.gridEnd = s.gridEndHour * 60;
      delete s.gridStartHour;
      delete s.gridEndHour;
    }

    return mergeWithDefaults(s);
  } catch {
    return { ...defaultState };
  }
}

function mergeWithDefaults(s) {
  return {
    courses: s.courses || [],
    theme: s.theme || (s.darkMode ? { ...DARK_THEME } : { ...DEFAULT_THEME }),
    title: s.title || 'Timetabler',
    footnote: s.footnote !== undefined ? s.footnote : 'shift + h to hide controls',
    rowHeight: s.rowHeight || 15,
    gridStart: s.gridStart !== undefined ? s.gridStart : 480,
    gridEnd: s.gridEnd !== undefined ? s.gridEnd : 1200,
    darkMode: !!s.darkMode,
    customColors: s.customColors || [],
  };
}

function createStore() {
  let state = hydrateFromStorage();
  const listeners = new Set();

  // Async: override with URL state if present
  stateFromURL().then(urlState => {
    if (urlState) {
      state = mergeWithDefaults(urlState);
      persist();
      notify();
      window.history.replaceState(null, '', window.location.pathname);
    }
  });

  function getState() {
    return state;
  }

  function setState(partial) {
    const update = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...update };
    persist();
    notify();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: {
        courses: state.courses,
        theme: state.theme,
        title: state.title,
        footnote: state.footnote,
        rowHeight: state.rowHeight,
        gridStart: state.gridStart,
        gridEnd: state.gridEnd,
        darkMode: state.darkMode,
        customColors: state.customColors,
      }
    }));
  }

  // Actions
  function addCourse(course) {
    setState(s => ({
      courses: [...s.courses, { ...course, id: crypto.randomUUID() }],
    }));
  }

  function updateCourse(id, updates) {
    setState(s => ({
      courses: s.courses.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  }

  function removeCourse(id) {
    setState(s => ({
      courses: s.courses.filter(c => c.id !== id),
    }));
  }

  function setTheme(partial) {
    setState(s => ({ theme: { ...s.theme, ...partial } }));
  }

  function resetTheme() {
    setState(s => ({ theme: s.darkMode ? { ...DARK_THEME } : { ...DEFAULT_THEME } }));
  }

  function setTitle(title) {
    setState({ title });
  }

  function setFootnote(text) {
    setState({ footnote: text });
  }

  function setRowHeight(h) {
    setState({ rowHeight: h });
  }

  function setGridStart(mins) {
    setState({ gridStart: mins });
  }

  function setGridEnd(mins) {
    setState({ gridEnd: mins });
  }

  function toggleDarkMode() {
    setState(s => {
      const dark = !s.darkMode;
      return { darkMode: dark, theme: dark ? { ...DARK_THEME } : { ...DEFAULT_THEME } };
    });
  }

  function addCustomColor(color) {
    setState(s => ({
      customColors: [color, ...s.customColors.filter(c => c !== color)].slice(0, 12),
    }));
  }

  function removeCustomColor(color) {
    setState(s => ({
      customColors: s.customColors.filter(c => c !== color),
    }));
  }

  function exportState() {
    return JSON.stringify({
      courses: state.courses,
      theme: state.theme,
      title: state.title,
      footnote: state.footnote,
      rowHeight: state.rowHeight,
      gridStart: state.gridStart,
      gridEnd: state.gridEnd,
      darkMode: state.darkMode,
      customColors: state.customColors,
    });
  }

  async function exportURL() {
    const packed = packState(state);
    const json = JSON.stringify(packed);
    const bytes = new TextEncoder().encode(json);
    const compressed = await deflate(bytes);
    const b64 = toB64(compressed);
    const base = window.location.origin + window.location.pathname;
    return `${base}?s=${b64}`;
  }

  return {
    getState, setState, subscribe,
    addCourse, updateCourse, removeCourse,
    setTheme, resetTheme, setTitle, setFootnote,
    setRowHeight, setGridStart, setGridEnd,
    toggleDarkMode, addCustomColor, removeCustomColor,
    exportState, exportURL,
  };
}

export const store = createStore();
