import { store } from '../store.js';

export function createFootnote() {
  const wrapper = document.createElement('div');
  wrapper.className = 'footnote';

  const textSpan = document.createElement('span');
  textSpan.className = 'footnote__text';
  textSpan.textContent = store.getState().footnote || '\u00A0';

  const input = document.createElement('input');
  input.className = 'footnote__input';
  input.style.display = 'none';

  let editing = false;

  textSpan.addEventListener('dblclick', () => {
    editing = true;
    input.value = store.getState().footnote;
    textSpan.style.display = 'none';
    input.style.display = '';
    input.focus();
    input.select();
  });

  function commit() {
    store.setFootnote(input.value.trim());
    editing = false;
    input.style.display = 'none';
    textSpan.style.display = '';
  }

  function cancel() {
    editing = false;
    input.style.display = 'none';
    textSpan.style.display = '';
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') cancel();
  });

  wrapper.appendChild(textSpan);
  wrapper.appendChild(input);

  store.subscribe(s => {
    if (!editing) {
      textSpan.textContent = s.footnote || '\u00A0';
    }
  });

  wrapper.setHidden = (hidden) => {
    wrapper.style.visibility = hidden ? 'hidden' : 'visible';
  };

  return wrapper;
}
