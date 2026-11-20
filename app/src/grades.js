// Vice City colour grades. A grade is a canvas filter plus one or two
// gradient overlays blended over the photo; strength scales the overlays.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.04)',
    overlays: [
      { from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,110,60,0.34)'], [0.55, 'rgba(255,46,136,0.16)'], [1, 'rgba(43,16,85,0.30)']], blend: 'overlay' },
      { from: [0, 1], to: [0, 0], stops: [[0, 'rgba(255,190,80,0.20)'], [1, 'rgba(255,190,80,0)']], blend: 'soft-light' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Night',
    filter: 'saturate(1.55) contrast(1.18) brightness(0.96)',
    overlays: [
      { from: [0, 0], to: [1, 1], stops: [[0, 'rgba(255,46,136,0.30)'], [0.5, 'rgba(80,40,180,0.10)'], [1, 'rgba(25,227,194,0.26)']], blend: 'overlay' },
      { from: [0, 0], to: [0, 1], stops: [[0, 'rgba(10,8,40,0.34)'], [1, 'rgba(10,8,40,0)']], blend: 'multiply' },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.08) brightness(1.08) sepia(0.22)',
    overlays: [
      { from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,214,102,0.26)'], [1, 'rgba(255,122,24,0.22)']], blend: 'soft-light' },
    ],
  },
  {
    id: 'teal',
    name: 'Teal Noir',
    filter: 'saturate(1.15) contrast(1.22) brightness(0.94)',
    overlays: [
      { from: [0, 0], to: [1, 0], stops: [[0, 'rgba(25,227,194,0.22)'], [1, 'rgba(255,46,136,0.18)']], blend: 'overlay' },
      { from: [0, 0], to: [0, 1], stops: [[0, 'rgba(4,10,24,0.30)'], [1, 'rgba(4,10,24,0)']], blend: 'multiply' },
    ],
  },
  {
    id: 'pop',
    name: 'Vice Pop',
    filter: 'saturate(1.8) contrast(1.25) brightness(1.02)',
    overlays: [
      { from: [0, 0], to: [0, 1], stops: [[0, 'rgba(255,46,136,0.28)'], [0.5, 'rgba(255,201,60,0.14)'], [1, 'rgba(25,227,194,0.24)']], blend: 'overlay' },
    ],
  },
];

/** A grade by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

/**
 * Paint a grade's overlays over rect (x, y, w, h) on ctx.
 * `strength` is 0..1 and scales every overlay's alpha.
 */
export function paintGradeOverlays(ctx, grade, x, y, w, h, strength) {
  if (strength <= 0) return;
  ctx.save();
  for (const ov of grade.overlays) {
    const gx = x + ov.from[0] * w;
    const gy = y + ov.from[1] * h;
    const gx2 = x + ov.to[0] * w;
    const gy2 = y + ov.to[1] * h;
    const g = ctx.createLinearGradient(gx, gy, gx2, gy2);
    for (const [at, color] of ov.stops) g.addColorStop(at, color);
    ctx.globalCompositeOperation = ov.blend;
    ctx.globalAlpha = strength;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}
