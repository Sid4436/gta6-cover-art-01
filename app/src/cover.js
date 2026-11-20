// The cover engine: layouts, panel drawing, lettering, grain and vignette.
// Everything is drawn on a 2D canvas, so the same code renders the live
// preview and the exported PNG at any post size.

import { gradeById, paintGradeOverlays } from './grades.js';

/** Layouts: panel rects as fractions of the cover [x, y, w, h]. */
export const LAYOUTS = [
  {
    id: 'hero',
    name: 'Hero + 3',
    panels: [
      [0, 0, 1, 0.62],
      [0, 0.62, 0.34, 0.38],
      [0.34, 0.62, 0.33, 0.38],
      [0.67, 0.62, 0.33, 0.38],
    ],
  },
  {
    id: 'grid4',
    name: 'Four panels',
    panels: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
  {
    id: 'strips',
    name: 'Three strips',
    panels: [
      [0, 0, 0.34, 1],
      [0.34, 0, 0.33, 1],
      [0.67, 0, 0.33, 1],
    ],
  },
  {
    id: 'full',
    name: 'Full bleed',
    panels: [[0, 0, 1, 1]],
  },
  {
    id: 'nine',
    name: 'Nine grid',
    panels: [
      [0, 0, 1 / 3, 1 / 3], [1 / 3, 0, 1 / 3, 1 / 3], [2 / 3, 0, 1 / 3, 1 / 3],
      [0, 1 / 3, 1 / 3, 1 / 3], [1 / 3, 1 / 3, 1 / 3, 1 / 3], [2 / 3, 1 / 3, 1 / 3, 1 / 3],
      [0, 2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 1 / 3, 1 / 3], [2 / 3, 2 / 3, 1 / 3, 1 / 3],
    ],
  },
];

/** A layout by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/** Title lettering styles: fill gradient + outline + shadow. */
export const TITLE_STYLES = [
  { id: 'sunset', name: 'Sunset', stops: [[0, '#ffe9a8'], [0.45, '#ff7a18'], [0.75, '#ff2e88'], [1, '#c62b6e']] },
  { id: 'neon', name: 'Neon pink', stops: [[0, '#ffd7ec'], [0.5, '#ff2e88'], [1, '#b3125e']] },
  { id: 'white', name: 'White', stops: [[0, '#ffffff'], [1, '#ffe9c4']] },
  { id: 'teal', name: 'Teal pop', stops: [[0, '#d8fff4'], [0.5, '#19e3c2'], [1, '#0d8f7d']] },
];

export function titleStyleById(id) {
  return TITLE_STYLES.find((s) => s.id === id) || TITLE_STYLES[0];
}

/** The panel rect (in cover pixels) for panel i of a layout. */
export function panelRect(layout, i, W, H, frame) {
  const [fx, fy, fw, fh] = layout.panels[i];
  return {
    x: frame + fx * (W - frame * 2),
    y: frame + fy * (H - frame * 2),
    w: fw * (W - frame * 2),
    h: fh * (H - frame * 2),
  };
}

/** Which panel index holds point (x, y), or -1. */
export function panelAt(layout, x, y, W, H, frame) {
  for (let i = 0; i < layout.panels.length; i++) {
    const r = panelRect(layout, i, W, H, frame);
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

/**
 * Draw one photo into a panel rect, cover-fit, with the panel's zoom and
 * pan offsets (fractions of the drawn size) and the active grade.
 */
export function drawPanelPhoto(ctx, photo, rect, zoom, ox, oy, grade, strength) {
  if (!photo) return;
  const iw = photo.width;
  const ih = photo.height;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.filter = 'none';
  paintGradeOverlays(ctx, grade, rect.x, rect.y, rect.w, rect.h, strength);
  ctx.restore();
}

/** A small deterministic film-grain tile, generated once. */
let grainTile = null;
export function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  let seed = 20261120;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return grainTile;
}

/**
 * Draw the whole cover onto ctx at W x H from the editor state.
 * state: { layout, panels: [{photo, zoom, ox, oy}], gradeId, gradeStrength,
 *   title, subtitle, titleStyle, titleSize (percent), titlePos ('top'|'bottom'),
 *   frame, grain, vignette, badge }
 */
export function drawCover(ctx, state, W, H) {
  const layout = layoutById(state.layout);
  const grade = gradeById(state.gradeId);
  const strength = state.gradeStrength / 100;
  const frame = state.frame ? Math.round(Math.min(W, H) * 0.028) : 0;
  const gutter = Math.round(Math.min(W, H) * 0.008);

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W, H);

  // Panels.
  for (let i = 0; i < layout.panels.length; i++) {
    const p = state.panels[i] || {};
    const r = panelRect(layout, i, W, H, frame);
    const inset = {
      x: r.x + (i % 1 === 0 ? gutter / 2 : 0),
      y: r.y + gutter / 2,
      w: r.w - gutter,
      h: r.h - gutter,
    };
    if (p.photo) {
      drawPanelPhoto(ctx, p.photo, inset, p.zoom || 1, p.ox || 0, p.oy || 0, grade, strength);
    } else {
      // Empty panel: a sunset placeholder so the grid still reads as a poster.
      const g = ctx.createLinearGradient(inset.x, inset.y, inset.x, inset.y + inset.h);
      g.addColorStop(0, '#3d1c5c');
      g.addColorStop(0.55, '#c62b6e');
      g.addColorStop(1, '#ff7a18');
      ctx.fillStyle = g;
      ctx.fillRect(inset.x, inset.y, inset.w, inset.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `${Math.round(inset.h * 0.09)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', inset.x + inset.w / 2, inset.y + inset.h / 2);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, gutter * 0.7);
    ctx.strokeRect(inset.x, inset.y, inset.w, inset.h);
  }

  // White poster frame.
  if (state.frame) {
    ctx.strokeStyle = '#f6ead9';
    ctx.lineWidth = frame;
    ctx.strokeRect(frame / 2, frame / 2, W - frame, H - frame);
  }

  // Title block.
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  if (title) {
    const style = titleStyleById(state.titleStyle);
    const baseSize = Math.min(W * 0.16, H * 0.11) * (state.titleSize / 100);
    const bandH = baseSize * 1.7;
    const bandY = state.titlePos === 'bottom' ? H - frame - bandH - H * 0.02 : frame + H * 0.015;
    // Soft dark band so lettering stays readable over any photo.
    const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
    band.addColorStop(0, 'rgba(10,5,18,0)');
    band.addColorStop(0.35, 'rgba(10,5,18,0.72)');
    band.addColorStop(0.65, 'rgba(10,5,18,0.72)');
    band.addColorStop(1, 'rgba(10,5,18,0)');
    ctx.fillStyle = band;
    ctx.fillRect(frame, bandY, W - frame * 2, bandH);

    ctx.save();
    ctx.translate(W / 2, bandY + bandH * 0.52);
    ctx.rotate(-0.02);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(baseSize)}px Anton, "Arial Narrow", sans-serif`;
    const tw = ctx.measureText(title.toUpperCase()).width;
    const grad = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0);
    for (const [at, color] of style.stops) grad.addColorStop(at, color);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10,5,18,0.9)';
    ctx.lineWidth = Math.max(3, baseSize * 0.09);
    ctx.strokeText(title.toUpperCase(), 0, 0);
    ctx.shadowColor = 'rgba(255,46,136,0.65)';
    ctx.shadowBlur = baseSize * 0.18;
    ctx.fillStyle = grad;
    ctx.fillText(title.toUpperCase(), 0, 0);
    ctx.restore();

    if (subtitle) {
      ctx.save();
      ctx.translate(W / 2, bandY + bandH * 0.92);
      ctx.rotate(-0.02);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${Math.round(baseSize * 0.34)}px Pacifico, cursive`;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(10,5,18,0.9)';
      ctx.lineWidth = Math.max(2, baseSize * 0.03);
      ctx.strokeText(subtitle, 0, 0);
      ctx.shadowColor = 'rgba(25,227,194,0.7)';
      ctx.shadowBlur = baseSize * 0.1;
      ctx.fillStyle = '#d8fff4';
      ctx.fillText(subtitle, 0, 0);
      ctx.restore();
    }
  }

  // Sunset badge.
  if (state.badge) {
    const br = Math.min(W, H) * 0.055;
    const bx = W - frame - br - W * 0.02;
    const by = state.titlePos === 'bottom' ? frame + br + H * 0.02 : H - frame - br - H * 0.02;
    ctx.save();
    ctx.translate(bx, by);
    const bg = ctx.createLinearGradient(-br, -br, br, br);
    bg.addColorStop(0, '#ffc93c');
    bg.addColorStop(0.55, '#ff2e88');
    bg.addColorStop(1, '#7b1fa2');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f6ead9';
    ctx.lineWidth = Math.max(2, br * 0.06);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(br * 0.42)}px Anton, sans-serif`;
    ctx.fillText('VICE', 0, -br * 0.18);
    ctx.font = `${Math.round(br * 0.3)}px Anton, sans-serif`;
    ctx.fillText('CITY', 0, br * 0.26);
    ctx.restore();
  }

  // Vignette.
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(10,5,18,0)');
    v.addColorStop(1, 'rgba(10,5,18,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // Film grain.
  if (state.grain) {
    const tile = getGrainTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  ctx.restore();
}
