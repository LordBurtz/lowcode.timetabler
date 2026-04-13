import { DAYS, BLOCK_GAP, formatTime } from '../constants.js';
import { store } from '../store.js';
import { createModal } from './modal.js';

// ── Helpers ──────────────────────────────────────────────

function parseRgbaExport(color) {
  const m = color.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
  if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1];
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b, 1];
  }
  return [0, 0, 0, 1];
}

function withAlpha(color, alpha) {
  const [r, g, b] = parseRgbaExport(color);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Canvas Renderer ──────────────────────────────────────

function renderTimetable(canvas, opts) {
  const { courses, title, theme, rowHeight, gridStart, gridEnd, padding, bgColor, scale } = opts;
  const totalSlots = (gridEnd - gridStart) / 15;
  const gutterW = 56;
  const dayCount = DAYS.length;
  const colBorderW = 1;

  const titleH = 36;
  const headerH = 32;
  const gridH = totalSlots * rowHeight;
  const dayColW = 120;
  const totalW = gutterW + dayCount * dayColW;
  const totalH = titleH + headerH + gridH;

  canvas.width = (totalW + padding * 2) * scale;
  canvas.height = (totalH + padding * 2) * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

  const ox = padding;
  const oy = padding;

  // Title
  ctx.fillStyle = theme.textColor;
  ctx.font = `600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(title, ox, oy + titleH / 2);

  // Day headers
  const headY = oy + titleH;
  ctx.font = `500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  for (let i = 0; i < dayCount; i++) {
    const colX = ox + gutterW + i * dayColW;
    if (i > 0) {
      ctx.fillStyle = theme.gridLineColor;
      ctx.fillRect(colX, headY, colBorderW, headerH);
    }
    if (i === dayCount - 1) {
      ctx.fillStyle = theme.gridLineColor;
      ctx.fillRect(colX + dayColW, headY, colBorderW, headerH);
    }
    ctx.fillStyle = theme.headerTextColor;
    ctx.fillText(DAYS[i].label.toUpperCase(), colX + dayColW / 2, headY + headerH / 2);
  }

  // Grid area
  const gridY = headY + headerH;

  // Quarter-hour lines
  for (let s = 1; s <= totalSlots; s++) {
    const y = gridY + s * rowHeight;
    ctx.fillStyle = theme.gridLineColor;
    ctx.fillRect(ox + gutterW, y - 1, dayCount * dayColW + colBorderW, 1);
  }

  // Hour lines
  const firstHour = Math.ceil(gridStart / 60) * 60;
  for (let m = firstHour; m <= gridEnd; m += 60) {
    const y = gridY + ((m - gridStart) / 15) * rowHeight;
    ctx.fillStyle = theme.hourLineColor;
    ctx.fillRect(ox + gutterW, y - 1, dayCount * dayColW + colBorderW, 2);
  }

  // Column borders
  for (let i = 0; i <= dayCount; i++) {
    const x = ox + gutterW + i * dayColW;
    if (i > 0 || i === dayCount) {
      ctx.fillStyle = theme.gridLineColor;
      ctx.fillRect(x, gridY, colBorderW, gridH);
    }
  }
  ctx.fillStyle = theme.gridLineColor;
  ctx.fillRect(ox + gutterW + dayCount * dayColW, gridY, colBorderW, gridH);

  // Time gutter labels
  ctx.font = `400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let m = firstHour; m <= gridEnd; m += 60) {
    const y = gridY + ((m - gridStart) / 15) * rowHeight;
    ctx.fillStyle = withAlpha(theme.textColor, 0.5);
    ctx.fillText(formatTime(m), ox + gutterW - 8, y);
  }

  // Course blocks
  for (const course of courses) {
    const dayIdx = DAYS.findIndex(d => d.key === course.day);
    if (dayIdx < 0) continue;

    const colX = ox + gutterW + dayIdx * dayColW;
    const blockTop = gridY + ((course.start - gridStart) / 15) * rowHeight;
    const blockH = ((course.end - course.start) / 15) * rowHeight - BLOCK_GAP;
    const blockLeft = colX + 3;
    const blockRight = colX + dayColW - 3;
    const blockW = blockRight - blockLeft;

    // Hour-line padding
    const startsOnHour = course.start >= firstHour && course.start % 60 === 0;
    const endsOnHour = course.end >= firstHour && course.end <= gridEnd && course.end % 60 === 0;
    const hourLineH = 2;
    const basePad = 3;
    const insetTop = startsOnHour ? basePad + hourLineH : basePad;
    const insetBottom = Math.max(0, (endsOnHour ? basePad + hourLineH : basePad) - BLOCK_GAP);

    // Background fill
    const bg = course.background && course.background !== 'transparent' ? course.background : null;
    if (bg) {
      const bgInsetTop = insetTop + 3;
      const bgInsetBottom = insetBottom + 3;
      ctx.fillStyle = bg;
      roundRect(ctx, blockLeft + 8, blockTop + bgInsetTop, blockW - 8 - 2, blockH - bgInsetTop - bgInsetBottom, 2);
      ctx.fill();
    }

    // Bracket
    const bracketX = blockLeft + 4;
    const bracketTopPos = blockTop + insetTop;
    const bracketBottom = blockTop + blockH - insetBottom;
    const serifW = 10;
    const serifH = 1.5;
    const stemW = 1.5;

    ctx.fillStyle = course.color;
    ctx.fillRect(bracketX, bracketTopPos, serifW, serifH);
    ctx.fillRect(bracketX, bracketTopPos, stemW, bracketBottom - bracketTopPos);
    ctx.fillRect(bracketX, bracketBottom - serifH, serifW, serifH);

    // Text content
    const textX = blockLeft + 16;
    const textMaxW = blockW - 20;
    const centerY = blockTop + blockH / 2;

    const nameSize = 13;
    const locSize = 11;
    const timeSize = 10;

    if (blockH > 50) {
      const totalTextH = nameSize * 1.2 + 1 + locSize * 1.2 + 2 + timeSize * 1.2;
      const startY = centerY - totalTextH / 2 + nameSize * 0.6;

      ctx.font = `600 ${nameSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.textColor;
      drawClippedText(ctx, course.name, textX, startY, textMaxW);

      ctx.font = `400 ${locSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = withAlpha(theme.textColor, 0.55);
      drawClippedText(ctx, course.location, textX, startY + nameSize * 1.2 + 1, textMaxW);

      ctx.font = `400 ${timeSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = withAlpha(theme.textColor, 0.4);
      drawClippedText(ctx, `${formatTime(course.start)} \u2013 ${formatTime(course.end)}`, textX, startY + nameSize * 1.2 + 1 + locSize * 1.2 + 2, textMaxW);
    } else if (blockH > 35) {
      const totalTextH = nameSize * 1.2 + 1 + locSize * 1.2;
      const startY = centerY - totalTextH / 2 + nameSize * 0.6;

      ctx.font = `600 ${nameSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.textColor;
      drawClippedText(ctx, course.name, textX, startY, textMaxW);

      ctx.font = `400 ${locSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = withAlpha(theme.textColor, 0.55);
      drawClippedText(ctx, course.location, textX, startY + nameSize * 1.2 + 1, textMaxW);
    } else {
      ctx.font = `600 ${nameSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.textColor;
      drawClippedText(ctx, course.name, textX, centerY, textMaxW);
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawClippedText(ctx, text, x, y, maxW) {
  let t = text;
  while (t.length > 0 && ctx.measureText(t).width > maxW) {
    t = t.slice(0, -1);
  }
  if (t.length < text.length && t.length > 1) {
    t = t.slice(0, -1) + '\u2026';
  }
  ctx.fillText(t, x, y);
}

// ── Component ────────────────────────────────────────────

export function openExportDialog(onClose) {
  const s = store.getState();
  let padding = 24;
  let bgColor = s.theme.gridBackground;
  let scalePercent = 200;

  const content = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Export as PNG';
  content.appendChild(title);

  // Padding
  const paddingField = createExportRow('Padding', () => {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = '0';
    slider.max = '80';
    slider.step = '4';
    slider.value = String(padding);

    const label = document.createElement('span');
    label.className = 'slider-value';
    label.textContent = `${padding}px`;

    slider.addEventListener('input', (e) => {
      padding = Number(e.target.value);
      label.textContent = `${padding}px`;
    });

    group.appendChild(slider);
    group.appendChild(label);
    return group;
  });
  content.appendChild(paddingField);

  // Scale
  const scaleField = createExportRow('Scale', () => {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = '100';
    slider.max = '400';
    slider.step = '50';
    slider.value = String(scalePercent);

    const label = document.createElement('span');
    label.className = 'slider-value';
    label.textContent = `${scalePercent}%`;

    slider.addEventListener('input', (e) => {
      scalePercent = Number(e.target.value);
      label.textContent = `${scalePercent}%`;
    });

    group.appendChild(slider);
    group.appendChild(label);
    return group;
  });
  content.appendChild(scaleField);

  // Background color
  const bgField = createExportRow('Background', () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'settings-color-input';
    input.value = bgColor;
    input.addEventListener('input', (e) => {
      bgColor = e.target.value;
    });
    return input;
  });
  content.appendChild(bgField);

  // Hidden canvas
  const canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  content.appendChild(canvas);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'settings-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'settings-btn';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => modal.close());

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-primary';
  exportBtn.style.flex = '1';
  exportBtn.textContent = 'Export';
  exportBtn.addEventListener('click', () => {
    const currentState = store.getState();
    exportBtn.textContent = 'Exporting...';
    exportBtn.disabled = true;

    requestAnimationFrame(() => {
      renderTimetable(canvas, {
        courses: currentState.courses,
        title: currentState.title,
        theme: currentState.theme,
        rowHeight: currentState.rowHeight,
        gridStart: currentState.gridStart,
        gridEnd: currentState.gridEnd,
        padding,
        bgColor,
        scale: scalePercent / 100,
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          exportBtn.textContent = 'Export';
          exportBtn.disabled = false;
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentState.title.replace(/\s+/g, '_').toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        exportBtn.textContent = 'Export';
        exportBtn.disabled = false;
      }, 'image/png');
    });
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(exportBtn);
  content.appendChild(actions);

  const modal = createModal(content, onClose, { panelClass: 'modal-panel export-panel' });
}

function createExportRow(labelText, createControl) {
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
