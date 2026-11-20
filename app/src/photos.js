// Synthetic demo photos, drawn procedurally on canvas — no real people, no
// borrowed artwork. Each painter returns a 1200x800 canvas the cover engine
// treats exactly like a user-uploaded photo.

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, core, glow) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.6);
  g.addColorStop(0, glow);
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function palmTree(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = '#1c0b12';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 6, -150);
  ctx.stroke();
  ctx.fillStyle = '#160a10';
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.15 - (i * Math.PI) / 6.2;
    ctx.save();
    ctx.translate(6, -150);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(45, -16, 95, 6);
    ctx.quadraticCurveTo(45, 8, 0, 8);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function personSilhouette(ctx, x, y, s, pose) {
  // Simple stylised figure silhouette: head, torso, legs. No face, no identity.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#14090f';
  ctx.beginPath();
  ctx.arc(0, -92, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, -78);
  ctx.quadraticCurveTo(0, -84, 14, -78);
  ctx.lineTo(18, -18);
  ctx.lineTo(-18, -18);
  ctx.closePath();
  ctx.fill();
  if (pose === 'lean') {
    ctx.fillRect(-20, -18, 9, 62);
    ctx.fillRect(11, -18, 9, 62);
  } else if (pose === 'fish') {
    ctx.fillRect(-18, -18, 9, 60);
    ctx.fillRect(9, -18, 9, 58);
    ctx.strokeStyle = '#14090f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, -60);
    ctx.lineTo(78, -128);
    ctx.stroke();
  } else {
    ctx.fillRect(-19, -18, 9, 60);
    ctx.fillRect(10, -18, 9, 60);
  }
  ctx.restore();
}

/** Golden-hour boulevard: sun, palms, a vintage convertible silhouette. */
export function paintBoulevard() {
  const w = 1200, h = 800;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#2b1055'], [0.35, '#c62b6e'], [0.62, '#ff7a18'], [0.8, '#ffc93c'], [1, '#ffe9a8']]);
  sunDisc(ctx, 620, 470, 95, '#fff3c4', 'rgba(255,190,80,0.55)');
  // Distant skyline.
  ctx.fillStyle = 'rgba(60,16,64,0.55)';
  const towers = [[40, 420, 90, 180], [150, 380, 70, 220], [240, 440, 110, 160], [900, 400, 80, 200], [1000, 450, 120, 150], [1120, 420, 80, 180]];
  for (const [x, y, tw, th] of towers) ctx.fillRect(x, y, tw, th);
  // Road.
  ctx.fillStyle = '#241026';
  ctx.fillRect(0, 600, w, 200);
  ctx.fillStyle = '#ffd166';
  for (let x = 30; x < w; x += 130) ctx.fillRect(x, 694, 70, 8);
  // Palms lining the boulevard.
  palmTree(ctx, 90, 620, 1.15, -0.06);
  palmTree(ctx, 330, 630, 0.95, 0.05);
  palmTree(ctx, 1080, 620, 1.2, 0.07);
  palmTree(ctx, 880, 635, 0.8, -0.05);
  // Vintage convertible silhouette.
  ctx.fillStyle = '#160a10';
  ctx.beginPath();
  ctx.moveTo(430, 640);
  ctx.lineTo(470, 585);
  ctx.lineTo(700, 580);
  ctx.lineTo(760, 640);
  ctx.lineTo(800, 645);
  ctx.quadraticCurveTo(800, 668, 770, 668);
  ctx.lineTo(450, 668);
  ctx.quadraticCurveTo(425, 668, 430, 640);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(510, 668, 26, 0, Math.PI * 2);
  ctx.arc(700, 668, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(795, 622, 9, 0, Math.PI * 2);
  ctx.fill();
  // Person leaning on the door.
  personSilhouette(ctx, 445, 640, 1.05, 'lean');
  return c;
}

/** Neon night street: glowing signs, wet pavement, two friends laughing. */
export function paintNeonStreet() {
  const w = 1200, h = 800;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#050914'], [0.5, '#0d1533'], [1, '#1b0f38']]);
  // Buildings.
  ctx.fillStyle = '#0a0e22';
  ctx.fillRect(0, 120, 300, 480);
  ctx.fillRect(900, 90, 300, 510);
  ctx.fillStyle = 'rgba(255,214,102,0.75)';
  for (let y = 160; y < 540; y += 70) {
    for (let x = 30; x < 260; x += 60) if ((x + y) % 130 !== 0) ctx.fillRect(x, y, 26, 34);
    for (let x = 930; x < 1160; x += 60) if ((x + y) % 150 !== 0) ctx.fillRect(x, y, 26, 34);
  }
  // Neon signs with glow.
  function neonSign(x, y, tw, th, color, label) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 34;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, tw, th);
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0a0616';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + tw / 2, y + th / 2 + 2);
    ctx.restore();
  }
  neonSign(330, 150, 240, 90, '#ff2e88', 'DINER');
  neonSign(620, 260, 210, 80, '#19e3c2', 'OPEN');
  neonSign(360, 360, 180, 70, '#ffc93c', '24H');
  // Wet pavement with reflections.
  const g = ctx.createLinearGradient(0, 600, 0, 800);
  g.addColorStop(0, '#141126');
  g.addColorStop(1, '#05060f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 600, w, 200);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(360, 620, 180, 130);
  ctx.fillStyle = '#19e3c2';
  ctx.fillRect(650, 620, 150, 110);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let i = 0; i < 40; i++) ctx.fillRect(60 + (i * 173) % 1100, 640 + (i * 47) % 140, 26, 3);
  // Two friends.
  personSilhouette(ctx, 520, 640, 1.15, 'walk');
  personSilhouette(ctx, 640, 645, 1.1, 'walk');
  return c;
}

/** Sunset pier: turquoise water, wooden pier, an angler at golden hour. */
export function paintPier() {
  const w = 1200, h = 800;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  skyGradient(ctx, w, h, [[0, '#1d2b6b'], [0.4, '#e2547a'], [0.62, '#ff9a3d'], [0.78, '#ffd166'], [1, '#ffe9a8']]);
  sunDisc(ctx, 600, 520, 80, '#fff6cf', 'rgba(255,200,90,0.5)');
  // Sea.
  const sea = ctx.createLinearGradient(0, 500, 0, 800);
  sea.addColorStop(0, '#ff9a5c');
  sea.addColorStop(0.25, '#2fb3a3');
  sea.addColorStop(1, '#0d5f73');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 500, w, 300);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 26; i++) {
    const y = 520 + (i * 53) % 260;
    ctx.fillRect(40 + (i * 211) % 1120, y, 60 + (i % 3) * 30, 3);
  }
  // Wooden pier in perspective.
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(480, 800);
  ctx.lineTo(560, 560);
  ctx.lineTo(660, 560);
  ctx.lineTo(760, 800);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3a26';
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const y = 560 + t * 240;
    const half = 40 + t * 130;
    ctx.fillRect(600 - half, y, half * 2, 10);
  }
  ctx.fillStyle = '#2c1a10';
  ctx.fillRect(552, 560, 14, 60);
  ctx.fillRect(648, 560, 14, 60);
  // Angler at the end of the pier.
  personSilhouette(ctx, 610, 585, 1.0, 'fish');
  return c;
}

/** All demo photos, in display order. */
export const DEMO_PHOTOS = [
  { id: 'boulevard', name: 'Boulevard sunset', paint: paintBoulevard },
  { id: 'neon', name: 'Neon street', paint: paintNeonStreet },
  { id: 'pier', name: 'Pier sunset', paint: paintPier },
];

/** Paint a demo photo by id; null when unknown. */
export function paintDemoPhoto(id) {
  const found = DEMO_PHOTOS.find((d) => d.id === id);
  return found ? found.paint() : null;
}
