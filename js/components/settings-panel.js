import { formatTime, parseTime, roundToQuarter } from '../constants.js';
import { store } from '../store.js';
import { createModal } from './modal.js';

const THEME_FIELDS = [
  { key: 'gridBackground', label: 'Grid background' },
  { key: 'gridLineColor', label: 'Quarter-hour line' },
  { key: 'hourLineColor', label: 'Hour line' },
  { key: 'textColor', label: 'Text color' },
  { key: 'headerBackground', label: 'Header background' },
  { key: 'headerTextColor', label: 'Header text' },
  { key: 'accentColor', label: 'Accent color' },
];

export function openSettingsPanel(onClose) {
  const content = document.createElement('div');

  // Title
  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Settings';
  content.appendChild(title);

  // Dark mode toggle
  const darkField = createSettingsRow('Dark mode', () => {
    const s = store.getState();
    const toggle = document.createElement('button');
    toggle.className = `toggle${s.darkMode ? ' toggle--on' : ''}`;
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    const knob = document.createElement('span');
    knob.className = 'toggle__knob';
    toggle.appendChild(knob);
    toggle.addEventListener('click', () => {
      store.toggleDarkMode();
      const newState = store.getState();
      toggle.className = `toggle${newState.darkMode ? ' toggle--on' : ''}`;
    });
    return toggle;
  });
  content.appendChild(darkField);

  content.appendChild(createDivider());

  // Day start
  const startField = createSettingsRow('Day start', () => {
    const s = store.getState();
    return createSettingsTimeInput(s.gridStart, (v) => store.setGridStart(v), 0, store.getState().gridEnd - 60);
  });
  content.appendChild(startField);

  // Day end
  const endField = createSettingsRow('Day end', () => {
    const s = store.getState();
    return createSettingsTimeInput(s.gridEnd, (v) => store.setGridEnd(v), store.getState().gridStart + 60, 24 * 60);
  });
  content.appendChild(endField);

  // Quarter spacing
  const spacingField = createSettingsRow('Quarter spacing', () => {
    const s = store.getState();
    const group = document.createElement('div');
    group.className = 'slider-group';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = '8';
    slider.max = '30';
    slider.step = '1';
    slider.value = String(s.rowHeight);

    const valueLabel = document.createElement('span');
    valueLabel.className = 'slider-value';
    valueLabel.textContent = `${s.rowHeight}px`;

    slider.addEventListener('input', (e) => {
      const v = Number(e.target.value);
      store.setRowHeight(v);
      valueLabel.textContent = `${v}px`;
    });

    group.appendChild(slider);
    group.appendChild(valueLabel);
    return group;
  });
  content.appendChild(spacingField);

  content.appendChild(createDivider());

  // Theme color fields
  THEME_FIELDS.forEach(f => {
    const row = createSettingsRow(f.label, () => {
      const s = store.getState();
      const input = document.createElement('input');
      input.type = 'color';
      input.className = 'settings-color-input';
      input.value = s.theme[f.key];
      input.addEventListener('input', (e) => {
        store.setTheme({ [f.key]: e.target.value });
      });
      return input;
    });
    content.appendChild(row);
  });

  // Actions
  const actions = document.createElement('div');
  actions.className = 'settings-actions';

  const resetBtn = document.createElement('button');
  resetBtn.className = 'settings-btn';
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    store.resetTheme();
    store.setRowHeight(15);
    store.setGridStart(480);
    store.setGridEnd(1200);
    modal.close();
  });
  actions.appendChild(resetBtn);

  const doneBtn = document.createElement('button');
  doneBtn.className = 'settings-btn';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => {
    modal.close();
  });
  actions.appendChild(doneBtn);

  content.appendChild(actions);

  const modal = createModal(content, onClose, { panelClass: 'modal-panel settings-panel' });
}

function createSettingsRow(labelText, createControl) {
  const row = document.createElement('div');
  row.className = 'settings-field';

  const label = document.createElement('span');
  label.className = 'settings-label';
  label.textContent = labelText;
  row.appendChild(label);

  const control = createControl();
  row.appendChild(control);
  return row;
}

function createSettingsTimeInput(initialValue, onChange, min, max) {
  const input = document.createElement('input');
  input.className = 'settings-time-input';
  input.value = formatTime(initialValue);
  input.placeholder = 'H:MM';

  let currentValue = initialValue;

  input.addEventListener('blur', () => {
    const parsed = parseTime(input.value);
    if (parsed !== null) {
      const rounded = Math.max(min, Math.min(max, roundToQuarter(parsed)));
      currentValue = rounded;
      onChange(rounded);
      input.value = formatTime(rounded);
    } else {
      input.value = formatTime(currentValue);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
  });

  return input;
}

function createDivider() {
  const div = document.createElement('div');
  div.className = 'divider';
  return div;
}
