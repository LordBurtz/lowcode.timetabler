import { store } from '../store.js';

export function createToolbar({ onAddCourse, onExport, onOpenSettings }) {
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  // Title
  const titleSpan = document.createElement('span');
  titleSpan.className = 'toolbar__title';
  titleSpan.textContent = store.getState().title;

  const titleInput = document.createElement('input');
  titleInput.className = 'toolbar__title-input';
  titleInput.style.display = 'none';

  let editing = false;

  titleSpan.addEventListener('dblclick', () => {
    editing = true;
    titleInput.value = store.getState().title;
    titleSpan.style.display = 'none';
    titleInput.style.display = '';
    titleInput.focus();
    titleInput.select();
  });

  function commit() {
    const trimmed = titleInput.value.trim();
    if (trimmed) {
      store.setTitle(trimmed);
      document.title = trimmed;
    }
    editing = false;
    titleInput.style.display = 'none';
    titleSpan.style.display = '';
  }

  function cancel() {
    editing = false;
    titleInput.style.display = 'none';
    titleSpan.style.display = '';
  }

  titleInput.addEventListener('blur', commit);
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleInput.blur();
    }
    if (e.key === 'Escape') {
      cancel();
    }
  });

  toolbar.appendChild(titleSpan);
  toolbar.appendChild(titleInput);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'toolbar__actions';

  const addBtn = document.createElement('button');
  addBtn.className = 'toolbar__btn';
  addBtn.textContent = '+ Add';
  addBtn.addEventListener('click', onAddCourse);

  const renderBtn = document.createElement('button');
  renderBtn.className = 'toolbar__btn';
  renderBtn.textContent = 'Render';
  renderBtn.addEventListener('click', onExport);

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'toolbar__btn';
  settingsBtn.textContent = 'Settings';
  settingsBtn.addEventListener('click', onOpenSettings);

  actions.appendChild(addBtn);
  actions.appendChild(renderBtn);
  actions.appendChild(settingsBtn);
  toolbar.appendChild(actions);

  // Subscribe to title changes
  store.subscribe(s => {
    if (!editing) {
      titleSpan.textContent = s.title;
    }
  });

  // Expose method to toggle visibility
  toolbar.setControlsHidden = (hidden) => {
    actions.style.visibility = hidden ? 'hidden' : 'visible';
  };

  return toolbar;
}
