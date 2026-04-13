import { store } from '../store.js';
import { createModal } from './modal.js';

export function openShareDialog(onClose) {
  const content = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Share / Export State';
  content.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'share-desc';
  desc.textContent = 'Export the full app state — courses, settings, theme — as JSON or a shareable link.';
  content.appendChild(desc);

  // JSON section
  const jsonBtn = document.createElement('button');
  jsonBtn.className = 'btn-primary share-btn';
  jsonBtn.textContent = 'Copy JSON';
  jsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(store.exportState()).then(() => {
      jsonBtn.textContent = 'Copied!';
      setTimeout(() => { jsonBtn.textContent = 'Copy JSON'; }, 1500);
    });
  });
  content.appendChild(jsonBtn);

  // Link section
  const linkBtn = document.createElement('button');
  linkBtn.className = 'btn-secondary share-btn';
  linkBtn.textContent = 'Copy Link';
  linkBtn.addEventListener('click', async () => {
    linkBtn.textContent = 'Compressing…';
    const url = await store.exportURL();
    await navigator.clipboard.writeText(url);
    linkBtn.textContent = 'Copied!';
    setTimeout(() => { linkBtn.textContent = 'Copy Link'; }, 1500);
  });
  content.appendChild(linkBtn);

  // Close
  const actions = document.createElement('div');
  actions.className = 'settings-actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'settings-btn';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => modal.close());
  actions.appendChild(closeBtn);
  content.appendChild(actions);

  const modal = createModal(content, onClose, { panelClass: 'modal-panel share-panel' });
}
