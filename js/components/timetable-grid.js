import { DAYS, formatTime } from '../constants.js';
import { store } from '../store.js';
import { createCourseBlock } from './course-block.js';

export function createTimetableGrid(onEditCourse) {
  const wrapper = document.createElement('div');
  wrapper.className = 'grid-wrapper';

  // Day headers
  const dayHeaders = document.createElement('div');
  dayHeaders.className = 'day-headers';

  const headerGutter = document.createElement('div');
  headerGutter.className = 'header-gutter';
  dayHeaders.appendChild(headerGutter);

  DAYS.forEach(d => {
    const header = document.createElement('div');
    header.className = 'day-header';
    header.textContent = d.label;
    dayHeaders.appendChild(header);
  });

  wrapper.appendChild(dayHeaders);

  // Grid area
  const grid = document.createElement('div');
  grid.className = 'grid';

  // Time gutter
  const gutter = document.createElement('div');
  gutter.className = 'time-gutter';
  grid.appendChild(gutter);

  // Day columns
  const columns = [];
  DAYS.forEach(() => {
    const col = document.createElement('div');
    col.className = 'day-column';
    columns.push(col);
    grid.appendChild(col);
  });

  wrapper.appendChild(grid);

  function render() {
    const s = store.getState();
    const { rowHeight, gridStart, gridEnd, courses } = s;
    const totalSlots = (gridEnd - gridStart) / 15;
    const totalHeight = totalSlots * rowHeight;

    // Update gutter
    gutter.innerHTML = '';
    gutter.style.height = `${totalHeight}px`;
    const firstHour = Math.ceil(gridStart / 60) * 60;
    for (let m = firstHour; m <= gridEnd; m += 60) {
      const label = document.createElement('div');
      label.className = 'time-gutter__label';
      label.style.top = `${((m - gridStart) / 15) * rowHeight}px`;
      label.textContent = formatTime(m);
      gutter.appendChild(label);
    }

    // Update columns
    columns.forEach((col, i) => {
      col.innerHTML = '';
      col.style.height = `${totalHeight}px`;
      col.style.setProperty('--row-h', `${rowHeight}px`);

      // Hour lines
      for (let m = firstHour; m <= gridEnd; m += 60) {
        const line = document.createElement('div');
        line.className = 'hour-line';
        line.style.top = `${((m - gridStart) / 15) * rowHeight}px`;
        col.appendChild(line);
      }

      // Course blocks for this day
      const dayCourses = courses
        .filter(c => c.day === DAYS[i].key)
        .sort((a, b) => a.start - b.start);

      dayCourses.forEach(course => {
        const block = createCourseBlock(course, onEditCourse);
        col.appendChild(block);
      });
    });
  }

  render();
  store.subscribe(render);

  return wrapper;
}
