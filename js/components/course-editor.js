import { DAYS, COLOR_PRESETS, formatTime, parseTime, roundToQuarter, toRgba } from '../constants.js';
import { store } from '../store.js';
import { createModal } from './modal.js';
import { createColorPicker } from './color-picker.js';

export function openCourseEditor(course, onClose) {
  const s = store.getState();
  const isEdit = !!course;

  // Local state
  let name = course?.name ?? '';
  let location = course?.location ?? '';
  let day = course?.day ?? 'monday';
  let start = course?.start ?? s.gridStart;
  let end = course?.end ?? s.gridStart + 60;
  let color = toRgba(course?.color ?? COLOR_PRESETS[0]);
  let background = course?.background ?? '';

  // Build form
  const form = document.createElement('div');

  // Title
  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = isEdit ? 'Edit Course' : 'Add Course';
  form.appendChild(title);

  // Name field
  form.appendChild(createField('Name', () => {
    const input = document.createElement('input');
    input.className = 'input';
    input.value = name;
    input.placeholder = 'Course name';
    input.addEventListener('input', (e) => { name = e.target.value; });
    setTimeout(() => { input.focus(); }, 50);
    return input;
  }));

  // Location field
  form.appendChild(createField('Location', () => {
    const input = document.createElement('input');
    input.className = 'input';
    input.value = location;
    input.placeholder = 'Room / Building';
    input.addEventListener('input', (e) => { location = e.target.value; });
    return input;
  }));

  // Day field
  form.appendChild(createField('Day', () => {
    const select = document.createElement('select');
    select.className = 'select';
    DAYS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.key;
      opt.textContent = d.label;
      if (d.key === day) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', (e) => { day = e.target.value; });
    return select;
  }));

  // Time row
  const timeRow = document.createElement('div');
  timeRow.className = 'time-row';

  const startField = createField('Start', () => {
    return createTimeInput(start, (v) => {
      start = v;
      if (end <= start) end = Math.min(start + 15, s.gridEnd);
      endInput.value = formatTime(end);
    }, s.gridStart, s.gridEnd - 15);
  });

  let endInput;
  const endField = createField('End', () => {
    const inp = createTimeInput(end, (v) => { end = v; }, start + 15, s.gridEnd);
    endInput = inp;
    return inp;
  });

  timeRow.appendChild(startField);
  timeRow.appendChild(endField);
  form.appendChild(timeRow);

  // Bracket color
  form.appendChild(createField('Bracket Color', () => {
    return createColorPicker({
      value: color,
      onChange: (c) => { color = c; },
      allowNone: false,
    });
  }));

  // Background color
  form.appendChild(createField('Background', () => {
    return createColorPicker({
      value: background,
      onChange: (c) => { background = c; },
      allowNone: true,
    });
  }));

  // Actions
  const actions = document.createElement('div');
  actions.className = 'actions';

  if (isEdit) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      store.removeCourse(course.id);
      modal.close();
    });
    actions.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => {
    modal.close();
  });
  actions.appendChild(cancelBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    if (!name.trim()) return;
    if (end <= start) return;
    if (isEdit) {
      store.updateCourse(course.id, { name, location, day, start, end, color, background });
    } else {
      store.addCourse({ name, location, day, start, end, color, background });
    }
    modal.close();
  });
  actions.appendChild(saveBtn);

  form.appendChild(actions);

  const modal = createModal(form, onClose);
}

function createField(labelText, createInput) {
  const field = document.createElement('div');
  field.className = 'field';

  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = labelText;
  field.appendChild(label);

  const input = createInput();
  field.appendChild(input);
  return field;
}

function createTimeInput(initialValue, onChange, min = 0, max = 1440) {
  const input = document.createElement('input');
  input.className = 'input';
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
