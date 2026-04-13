import { COLOR_PRESETS, hexToRgba, parseRgba } from '../constants.js';
import { store } from '../store.js';

export function createColorPicker({ value, onChange, allowNone = false }) {
  let currentValue = value;
  let pickerVisible = false;
  let pickerHex = parseRgba(value).hex;
  let pickerOpacity = parseRgba(value).opacity;

  const wrapper = document.createElement('div');
  wrapper.className = 'color-picker';

  const swatchesRow = document.createElement('div');
  swatchesRow.className = 'color-picker__swatches';
  wrapper.appendChild(swatchesRow);

  const pickerRow = document.createElement('div');
  pickerRow.className = 'color-picker__row';
  pickerRow.style.display = 'none';
  wrapper.appendChild(pickerRow);

  // Build picker row contents
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'color-picker__color-input';
  colorInput.value = pickerHex;
  colorInput.addEventListener('input', (e) => {
    pickerHex = e.target.value;
    updatePreview();
  });

  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.className = 'color-picker__opacity-slider';
  opacitySlider.min = '0';
  opacitySlider.max = '100';
  opacitySlider.step = '1';
  opacitySlider.value = String(Math.round(pickerOpacity * 100));
  opacitySlider.addEventListener('input', (e) => {
    pickerOpacity = Number(e.target.value) / 100;
    opacityLabel.textContent = `${Math.round(pickerOpacity * 100)}%`;
    updatePreview();
  });

  const opacityLabel = document.createElement('span');
  opacityLabel.className = 'color-picker__opacity-label';
  opacityLabel.textContent = `${Math.round(pickerOpacity * 100)}%`;

  const preview = document.createElement('div');
  preview.className = 'color-picker__preview';
  const previewInner = document.createElement('div');
  previewInner.className = 'color-picker__preview-inner';
  previewInner.style.backgroundColor = hexToRgba(pickerHex, pickerOpacity);
  preview.appendChild(previewInner);

  const applyBtn = document.createElement('button');
  applyBtn.className = 'color-picker__apply-btn';
  applyBtn.textContent = 'Apply';
  applyBtn.addEventListener('click', () => {
    const rgba = hexToRgba(pickerHex, pickerOpacity);
    store.addCustomColor(rgba);
    currentValue = rgba;
    onChange(rgba);
    pickerVisible = false;
    pickerRow.style.display = 'none';
    renderSwatches();
  });

  pickerRow.appendChild(colorInput);
  pickerRow.appendChild(opacitySlider);
  pickerRow.appendChild(opacityLabel);
  pickerRow.appendChild(preview);
  pickerRow.appendChild(applyBtn);

  function updatePreview() {
    previewInner.style.backgroundColor = hexToRgba(pickerHex, pickerOpacity);
  }

  function isActive(candidate) {
    const isNone = currentValue === '' || currentValue === 'transparent';
    if (isNone) return false;
    const a = parseRgba(candidate);
    const b = parseRgba(currentValue);
    return a.hex === b.hex && Math.abs(a.opacity - b.opacity) < 0.01;
  }

  function renderSwatches() {
    swatchesRow.innerHTML = '';
    const customColors = store.getState().customColors;

    // None button
    if (allowNone) {
      const isNone = currentValue === '' || currentValue === 'transparent';
      const noneBtn = document.createElement('button');
      noneBtn.className = `color-picker__none-btn${isNone ? ' color-picker__none-btn--active' : ''}`;
      noneBtn.title = 'None';
      const noneLine = document.createElement('div');
      noneLine.className = 'color-picker__none-line';
      noneBtn.appendChild(noneLine);
      noneBtn.addEventListener('click', () => {
        currentValue = '';
        onChange('');
        renderSwatches();
      });
      swatchesRow.appendChild(noneBtn);
    }

    // Preset swatches
    const presets = COLOR_PRESETS.map(hex => hexToRgba(hex, 1));
    presets.forEach(c => {
      const swatch = createSwatch(c, isActive(c));
      swatch.addEventListener('click', () => {
        currentValue = c;
        onChange(c);
        renderSwatches();
      });
      swatchesRow.appendChild(swatch);
    });

    // Custom swatches
    customColors.forEach(c => {
      const swatch = createSwatch(c, isActive(c), true);
      swatch.addEventListener('click', () => {
        currentValue = c;
        onChange(c);
        renderSwatches();
      });
      swatch.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        store.removeCustomColor(c);
        renderSwatches();
      });
      swatchesRow.appendChild(swatch);
    });

    // Custom button (+)
    const customBtn = document.createElement('button');
    customBtn.className = 'color-picker__custom-btn';
    customBtn.textContent = '+';
    customBtn.title = 'Custom color';
    customBtn.addEventListener('click', () => {
      pickerVisible = !pickerVisible;
      pickerRow.style.display = pickerVisible ? 'flex' : 'none';
      if (pickerVisible) {
        const parsed = parseRgba(currentValue);
        pickerHex = parsed.hex;
        pickerOpacity = parsed.opacity;
        colorInput.value = pickerHex;
        opacitySlider.value = String(Math.round(pickerOpacity * 100));
        opacityLabel.textContent = `${Math.round(pickerOpacity * 100)}%`;
        updatePreview();
      }
    });
    swatchesRow.appendChild(customBtn);
  }

  function createSwatch(color, active, isCustom = false) {
    const swatch = document.createElement('div');
    swatch.className = `swatch${active ? ' swatch--active' : ''}${isCustom ? ' swatch--custom' : ''}`;
    const inner = document.createElement('div');
    inner.className = 'swatch__inner';
    inner.style.backgroundColor = color;
    swatch.appendChild(inner);
    if (isCustom) {
      const removeBadge = document.createElement('div');
      removeBadge.className = 'swatch__remove';
      removeBadge.textContent = '\u00d7';
      swatch.appendChild(removeBadge);
    }
    return swatch;
  }

  renderSwatches();

  // Re-render on custom color changes
  const unsub = store.subscribe(() => {
    renderSwatches();
  });

  // Public method to update value from outside
  wrapper.setValue = (newValue) => {
    currentValue = newValue;
    const parsed = parseRgba(newValue);
    pickerHex = parsed.hex;
    pickerOpacity = parsed.opacity;
    renderSwatches();
  };

  wrapper.destroy = () => unsub();

  return wrapper;
}
