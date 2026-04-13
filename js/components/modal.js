/**
 * Creates a modal overlay with a panel.
 * Returns { el, close } where el is the overlay DOM element.
 */
export function createModal(panelContent, onClose, opts = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const panel = document.createElement('div');
  panel.className = opts.panelClass || 'modal-panel';
  if (panelContent instanceof HTMLElement) {
    panel.appendChild(panelContent);
  } else {
    panel.innerHTML = panelContent;
  }

  overlay.appendChild(panel);

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  // Prevent panel clicks from closing
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Escape to close
  function handleKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }
  window.addEventListener('keydown', handleKey);

  function close() {
    window.removeEventListener('keydown', handleKey);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (onClose) onClose();
  }

  document.body.appendChild(overlay);

  return { el: overlay, panel, close };
}
