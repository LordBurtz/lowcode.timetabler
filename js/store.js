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

function hydrate() {
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
  } catch {
    return { ...defaultState };
  }
}

function createStore() {
  let state = hydrate();
  const listeners = new Set();

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

  return {
    getState, setState, subscribe,
    addCourse, updateCourse, removeCourse,
    setTheme, resetTheme, setTitle, setFootnote,
    setRowHeight, setGridStart, setGridEnd,
    toggleDarkMode, addCustomColor, removeCustomColor,
  };
}

export const store = createStore();
