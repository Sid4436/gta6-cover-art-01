// Vice Cover Studio editor: state, controls, drag-to-pan, export.
// Runs fully offline; photos are read on this machine and never uploaded.

import { LAYOUTS, TITLE_STYLES, layoutById, panelAt, drawCover } from './cover.js';
import { GRADES } from './grades.js';
import { DEMO_PHOTOS, paintDemoPhoto } from './photos.js';

const $ = (sel) => document.querySelector(sel);
const canvas = $('#cover');
const ctx = canvas.getContext('2d');
const statusEl = $('#status');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'hero',
  gradeId: 'sunset',
  gradeStrength: 80,
  title: 'VICE CITY',
  subtitle: 'Neon Shore',
  titleStyle: 'sunset',
  titleSize: 100,
  titlePos: 'top',
  frame: true,
  grain: true,
  vignette: true,
  badge: true,
  size: '1080x1350',
  panels: Array.from({ length: 9 }, () => ({ photo: null, zoom: 1, ox: 0, oy: 0 })),
};

let selectedPanel = 0;
let demoCursor = 0;

function setStatus(msg) {
  statusEl.textContent = msg;
  if (msg) window.setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 4000);
}

/** Redraw the preview canvas from the current state. */
function render() {
  const [W, H] = SIZES[state.size];
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  drawCover(ctx, state, W, H);
}

function buildChoices(container, items, current, onPick) {
  container.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice-btn' + (item.id === current ? ' active' : '');
    b.textContent = item.name;
    b.addEventListener('click', () => {
      onPick(item.id);
      buildChoices(container, items, item.id, onPick);
      render();
    });
    container.appendChild(b);
  }
}

function buildLayoutChoices() {
  buildChoices($('#layout-choices'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    selectedPanel = 0;
    buildPanelList();
  });
}

function buildGradeChoices() {
  buildChoices($('#grade-choices'), GRADES, state.gradeId, (id) => { state.gradeId = id; });
}

function buildTitleStyleChoices() {
  buildChoices($('#title-style-choices'), TITLE_STYLES, state.titleStyle, (id) => { state.titleStyle = id; });
}

function buildTitlePosChoices() {
  buildChoices($('#title-pos-choices'), [
    { id: 'top', name: 'Title on top' },
    { id: 'bottom', name: 'Title at bottom' },
  ], state.titlePos, (id) => { state.titlePos = id; });
}

/** The per-panel cards: demo photo, clear, zoom. */
function buildPanelList() {
  const list = $('#panel-list');
  const layout = layoutById(state.layout);
  list.innerHTML = '';
  layout.panels.forEach((_, i) => {
    const p = state.panels[i];
    const card = document.createElement('div');
    card.className = 'panel-card' + (i === selectedPanel ? ' selected' : '');
    const title = document.createElement('h3');
    title.textContent = `Panel ${i + 1}${p.photo ? ' — photo loaded' : ' — empty'}`;
    const row = document.createElement('div');
    row.className = 'row';
    const demoBtn = document.createElement('button');
    demoBtn.type = 'button';
    demoBtn.className = 'mini-btn';
    demoBtn.textContent = 'Demo photo';
    demoBtn.addEventListener('click', () => {
      assignDemoPhoto(i);
      selectedPanel = i;
      buildPanelList();
      render();
    });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'mini-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      state.panels[i] = { photo: null, zoom: 1, ox: 0, oy: 0 };
      buildPanelList();
      render();
    });
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '100';
    zoom.max = '300';
    zoom.value = String(Math.round((p.zoom || 1) * 100));
    zoom.setAttribute('aria-label', `Zoom panel ${i + 1}`);
    zoom.addEventListener('input', () => {
      state.panels[i].zoom = Number(zoom.value) / 100;
      render();
    });
    row.append(demoBtn, clearBtn, zoom);
    card.addEventListener('click', (ev) => {
      if (ev.target === zoom) return;
      selectedPanel = i;
      buildPanelList();
    });
    card.append(title, row);
    list.appendChild(card);
  });
}

/** Assign the next demo photo to a panel. */
function assignDemoPhoto(i) {
  const demo = DEMO_PHOTOS[demoCursor % DEMO_PHOTOS.length];
  demoCursor++;
  state.panels[i] = { photo: paintDemoPhoto(demo.id), zoom: 1, ox: 0, oy: 0 };
}

/** Fill every panel of the current layout with demo photos. */
function loadDemoPhotos() {
  const layout = layoutById(state.layout);
  layout.panels.forEach((_, i) => assignDemoPhoto(i));
  buildPanelList();
  render();
}

/** Read user files into panels, starting at the selected one. */
function loadUserFiles(files) {
  const layout = layoutById(state.layout);
  let slot = selectedPanel;
  for (const file of files) {
    if (slot >= layout.panels.length) break;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      render();
    };
    img.src = url;
    state.panels[slot] = { photo: img, zoom: 1, ox: 0, oy: 0 };
    slot++;
  }
  buildPanelList();
  render();
  setStatus(`${files.length} photo${files.length === 1 ? '' : 's'} loaded.`);
}

/** Render the cover at W x H on an offscreen canvas and download it as PNG. */
function exportCover(W, H, filename) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    drawCover(off.getContext('2d'), state, W, H);
    off.toBlob((blob) => {
      if (!blob) { setStatus('Export failed.'); resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(true);
    }, 'image/png');
  });
}

async function exportSelected() {
  const [W, H] = SIZES[state.size];
  const ok = await exportCover(W, H, `vice-cover-${W}x${H}.png`);
  if (ok) setStatus(`Exported ${W} x ${H} PNG.`);
}

async function exportAll() {
  for (const [key, [W, H]] of Object.entries(SIZES)) {
    await exportCover(W, H, `vice-cover-${W}x${H}.png`);
    await new Promise((r) => window.setTimeout(r, 350));
  }
  setStatus('Exported all 3 sizes: 1080x1080, 1080x1350, 1920x1080.');
}

// ---- Pointer interaction: drag a panel's photo to pan, wheel to zoom. ----

function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  const [W, H] = SIZES[state.size];
  return {
    x: (ev.clientX - r.left) * (W / r.width),
    y: (ev.clientY - r.top) * (H / r.height),
    W,
    H,
  };
}

let drag = null;
canvas.addEventListener('pointerdown', (ev) => {
  const pt = canvasPoint(ev);
  const layout = layoutById(state.layout);
  const frame = state.frame ? Math.round(Math.min(pt.W, pt.H) * 0.028) : 0;
  const i = panelAt(layout, pt.x, pt.y, pt.W, pt.H, frame);
  if (i < 0) return;
  selectedPanel = i;
  buildPanelList();
  const p = state.panels[i];
  drag = { i, startX: ev.clientX, startY: ev.clientY, ox: p.ox || 0, oy: p.oy || 0 };
  canvas.setPointerCapture(ev.pointerId);
});

canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const p = state.panels[drag.i];
  p.ox = drag.ox + (ev.clientX - drag.startX) / r.width;
  p.oy = drag.oy + (ev.clientY - drag.startY) / r.height;
  render();
});

canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const pt = canvasPoint(ev);
  const layout = layoutById(state.layout);
  const frame = state.frame ? Math.round(Math.min(pt.W, pt.H) * 0.028) : 0;
  const i = panelAt(layout, pt.x, pt.y, pt.W, pt.H, frame);
  if (i < 0) return;
  const p = state.panels[i];
  p.zoom = Math.min(3, Math.max(1, (p.zoom || 1) * (ev.deltaY < 0 ? 1.08 : 0.92)));
  selectedPanel = i;
  buildPanelList();
  render();
}, { passive: false });

// ---- Wire the controls. ----

function wireControls() {
  document.querySelectorAll('.size-btn').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      document.querySelectorAll('.size-btn').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
  });
  $('#export-one').addEventListener('click', exportSelected);
  $('#export-all').addEventListener('click', exportAll);
  $('#photo-file').addEventListener('change', (ev) => {
    if (ev.target.files.length > 0) loadUserFiles([...ev.target.files]);
    ev.target.value = '';
  });
  $('#demo-photos').addEventListener('click', () => {
    loadDemoPhotos();
    setStatus('Demo photos loaded — replace any panel with your own photo.');
  });
  $('#grade-strength').addEventListener('input', (ev) => {
    state.gradeStrength = Number(ev.target.value);
    render();
  });
  $('#title-text').addEventListener('input', (ev) => { state.title = ev.target.value; render(); });
  $('#subtitle-text').addEventListener('input', (ev) => { state.subtitle = ev.target.value; render(); });
  $('#title-size').addEventListener('input', (ev) => { state.titleSize = Number(ev.target.value); render(); });
  $('#opt-frame').addEventListener('change', (ev) => { state.frame = ev.target.checked; render(); });
  $('#opt-grain').addEventListener('change', (ev) => { state.grain = ev.target.checked; render(); });
  $('#opt-vignette').addEventListener('change', (ev) => { state.vignette = ev.target.checked; render(); });
  $('#opt-badge').addEventListener('change', (ev) => { state.badge = ev.target.checked; render(); });
}

// ---- Modes from the URL: ?shot=cover draws the cover full-frame (for
// screenshots), ?demo=1 pre-loads the demo photos in the editor. ----

function applyUrlModes() {
  const q = new URLSearchParams(window.location.search);
  const layout = q.get('layout');
  if (layout && LAYOUTS.some((l) => l.id === layout)) state.layout = layout;
  const grade = q.get('grade');
  if (grade && GRADES.some((g) => g.id === grade)) state.gradeId = grade;
  const size = q.get('size');
  if (size && SIZES[size]) state.size = size;
  const title = q.get('title');
  if (title) state.title = title;
  const subtitle = q.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot-cover');
    loadDemoPhotos();
  } else if (q.get('demo') === '1') {
    loadDemoPhotos();
  }
}

/** Boot: wait for the display fonts, then build the UI and render. */
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to system fonts when the bundled ones cannot load.
  }
  buildLayoutChoices();
  buildGradeChoices();
  buildTitleStyleChoices();
  buildTitlePosChoices();
  buildPanelList();
  wireControls();
  applyUrlModes();
  render();
}

boot();
