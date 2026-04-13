import { BLOCK_GAP, formatTime } from '../constants.js';
import { store } from '../store.js';

export function createCourseBlock(course, onClick) {
  const s = store.getState();
  const { rowHeight, gridStart, gridEnd } = s;

  const top = ((course.start - gridStart) / 15) * rowHeight;
  const height = ((course.end - course.start) / 15) * rowHeight - BLOCK_GAP;

  const bg = course.background && course.background !== 'transparent'
    ? course.background
    : undefined;

  // Hour-line padding
  const firstHour = Math.ceil(gridStart / 60) * 60;
  const startsOnHour = course.start >= firstHour && course.start % 60 === 0;
  const endsOnHour = course.end >= firstHour && course.end <= gridEnd && course.end % 60 === 0;
  const hourLineH = 2;
  const basePad = 3;
  const insetTop = startsOnHour ? basePad + hourLineH : basePad;
  const insetBottom = Math.max(0, (endsOnHour ? basePad + hourLineH : basePad) - BLOCK_GAP);

  const el = document.createElement('div');
  el.className = 'course-block';
  el.style.top = `${top}px`;
  el.style.height = `${height}px`;
  el.style.setProperty('--inset-top', `${insetTop}px`);
  el.style.setProperty('--inset-bottom', `${insetBottom}px`);
  el.style.setProperty('--block-bg', bg || 'transparent');

  // Bracket
  const bracket = document.createElement('div');
  bracket.className = 'course-block__bracket';
  bracket.style.top = `${insetTop}px`;
  bracket.style.bottom = `${insetBottom}px`;

  const serifTop = document.createElement('div');
  serifTop.className = 'course-block__serif-top';
  serifTop.style.backgroundColor = course.color;

  const stem = document.createElement('div');
  stem.className = 'course-block__stem';
  stem.style.backgroundColor = course.color;

  const serifBottom = document.createElement('div');
  serifBottom.className = 'course-block__serif-bottom';
  serifBottom.style.backgroundColor = course.color;

  bracket.appendChild(serifTop);
  bracket.appendChild(stem);
  bracket.appendChild(serifBottom);
  el.appendChild(bracket);

  // Name (always shown)
  const nameEl = document.createElement('div');
  nameEl.className = 'course-block__name';
  nameEl.textContent = course.name;
  el.appendChild(nameEl);

  // Location (if height > 35)
  if (height > 35) {
    const locEl = document.createElement('div');
    locEl.className = 'course-block__location';
    locEl.textContent = course.location;
    el.appendChild(locEl);
  }

  // Time (if height > 50)
  if (height > 50) {
    const timeEl = document.createElement('div');
    timeEl.className = 'course-block__time';
    timeEl.textContent = `${formatTime(course.start)} \u2013 ${formatTime(course.end)}`;
    el.appendChild(timeEl);
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(course);
  });

  return el;
}
