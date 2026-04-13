import { store } from './store.js';
import { createToolbar } from './components/toolbar.js';
import { createTimetableGrid } from './components/timetable-grid.js';
import { createFootnote } from './components/footnote.js';
import { openCourseEditor } from './components/course-editor.js';
import { openSettingsPanel } from './components/settings-panel.js';
import { openExportDialog } from './components/export-dialog.js';

// State
let controlsHidden = false;
let modalOpen = false;

// Apply theme CSS custom properties
function applyTheme(theme) {
  const root = document.documentElement;
  root.style.setProperty('--grid-bg', theme.gridBackground);
  root.style.setProperty('--grid-line', theme.gridLineColor);
  root.style.setProperty('--hour-line', theme.hourLineColor);
  root.style.setProperty('--text-color', theme.textColor);
  root.style.setProperty('--header-bg', theme.headerBackground);
  root.style.setProperty('--header-text', theme.headerTextColor);
  root.style.setProperty('--accent-color', theme.accentColor);
  document.body.style.background = theme.gridBackground;
}

// Initial theme application
applyTheme(store.getState().theme);
document.title = store.getState().title;

// Subscribe to theme changes
store.subscribe(s => {
  applyTheme(s.theme);
  document.title = s.title || 'Timetabler';
});

// Build app
const app = document.getElementById('app');
app.className = 'app';

// Toolbar
const toolbar = createToolbar({
  onAddCourse: () => {
    if (modalOpen) return;
    modalOpen = true;
    openCourseEditor(null, () => { modalOpen = false; });
  },
  onExport: () => {
    if (modalOpen) return;
    modalOpen = true;
    openExportDialog(() => { modalOpen = false; });
  },
  onOpenSettings: () => {
    if (modalOpen) return;
    modalOpen = true;
    openSettingsPanel(() => { modalOpen = false; });
  },
});
app.appendChild(toolbar);

// Timetable Grid
const grid = createTimetableGrid((course) => {
  if (modalOpen) return;
  modalOpen = true;
  openCourseEditor(course, () => { modalOpen = false; });
});
app.appendChild(grid);

// Footnote
const footnote = createFootnote();
app.appendChild(footnote);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  // Shift+H: toggle controls
  if (e.shiftKey && e.key === 'H') {
    controlsHidden = !controlsHidden;
    toolbar.setControlsHidden(controlsHidden);
    footnote.setHidden(controlsHidden);
  }

  // Ctrl/Cmd+E: export dialog
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    if (!modalOpen) {
      modalOpen = true;
      openExportDialog(() => { modalOpen = false; });
    }
  }
});
