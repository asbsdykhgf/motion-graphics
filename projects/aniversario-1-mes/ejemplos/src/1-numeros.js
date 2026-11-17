// ============================================================
//  EJEMPLO 1 · "Nuestro mes en números"  (editorial / kinetic type)
// ============================================================
const CONFIG = {
  nombre: '',            // vacío = "mi amor"
  dias: 30,
  desde: '17.10', hasta: '17.11', anio: '2026',
};
// ------------------------------------------------------------
//  BEAT SHEET  96 BPM · beat 0.625 s · bar 2.5 s · 6.5 bars
//  0.00  HUD rules draw from centre, labels decode           | ticks, pad Dmaj7
//  0.45  "Hace" / "un mes" rise out of a mask                |
//  2.50  ring draws, "30" rolls in like an odometer, DÍAS    | odometer ticks, kick enters
//  5.00  slot swap → "720" HORAS                              | swoosh
//  6.25  slot swap → "43.200" MINUTOS                         | swoosh
//  7.15  ring zooms through the camera                        | woosh
//  7.50  calendar: 30 cells draw, fill one by one             | pentatonic run
//  9.80  leader lines: "el día que empezó todo" / "hoy"       |
// 10.90  cells fly into a heart outline (diamonds)            | riser
// 12.50  heart blooms (downbeat)                              | impact + boom + chord
// 13.10  "Feliz primer mes, mi amor" · TE QUIERO              | piano melody
// 15.60  fade                                                 |
// ------------------------------------------------------------
const BEAT = 60 / 96, BAR = 4 * BEAT, DUR = 6.5 * BAR;
const NOMBRE = CONFIG.nombre.trim() || 'mi amor';
const DIAS = Math.max(1, Math.min(31, CONFIG.dias | 0));
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const C = { cream: '#f6ece2', rose: '#ff5274', wine: '#2a0b16', muted: 'rgba(246,236,226,.5)', faint: 'rgba(246,236,226,.14)' };

const BG = (() => {
  const g = makeCanvas(W, H), x = g.getContext('2d');
  const gr = x.createRadialGradient(W / 2, H * 0.47, 0, W / 2, H * 0.47, H * 0.78);
  gr.addColorStop(0, '#30101b'); gr.addColorStop(0.5, '#1a070f'); gr.addColorStop(1, '#0a0306');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(246,236,226,.045)'; x.lineWidth = 1;
  [80, 300, 540, 780, 1000].forEach(gx => { x.beginPath(); x.moveTo(gx + .5, 0); x.lineTo(gx + .5, H); x.stroke(); });
  return g;
})();
const BLOB = makeGlow(512, [[0, 'rgba(255,82,116,.55)'], [0.45, 'rgba(255,82,116,.16)'], [1, 'rgba(255,82,116,0)']]);
const GLOW = makeGlow(256, [[0, 'rgba(255,240,240,1)'], [0.2, 'rgba(255,150,170,.7)'], [1, 'rgba(255,82,116,0)']]);
const VIG = vignetteCanvas(0.6, '6,1,3');
const nx = noise1(11), ny = noise1(23), nr = noise1(37);

// ---------- camera ----------
function camera(s, rot = 0, dx = 0, dy = 0) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2 + dx, H / 2 + dy); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
}

// ---------- HUD ----------
function hud(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const a = 1 - seg(t, DUR - 0.9, DUR - 0.3);
  ctx.globalAlpha = a;
  drawLine(80, 150, 1000, 150, expoOut(seg(t, 0.1, 1.1)), { from: 'center', color: C.faint, width: 2 });
  drawLine(80, 1786, 1000, 1786, expoOut(seg(t, 0.2, 1.2)), { from: 'center', color: C.faint, width: 2 });
  // progress on the bottom rule
  const p = seg(t, 0.4, DUR - 0.8);
  drawLine(80, 1786, 1000, 1786, p, { color: C.rose, width: 3 });
  label(scramble('N.º 01', t, 0.3, 0.6, 1), 80, 118, { size: 24, color: C.cream, alpha: 0.85 * a, track: 6 });
  label(scramble(`${CONFIG.desde} — ${CONFIG.hasta}`, t, 0.45, 0.8, 2), 1000, 118, { size: 24, color: C.cream, alpha: 0.85 * a, track: 6, align: 'right' });
  label(scramble('NUESTRO PRIMER MES', t, 0.6, 0.9, 3), 80, 1838, { size: 22, color: C.muted, alpha: a, track: 7 });
  const day = Math.round(lerp(1, DIAS, ease(seg(t, 0.6, 12.5))));
  label(scramble(`DÍA ${String(day).padStart(2, '0')} / ${DIAS}`, t, 0.75, 0.8, 4), 1000, 1838, { size: 22, color: C.muted, alpha: a, track: 7, align: 'right' });
  // little heart mark top centre
  heart(540, 112, 22 * expoOut(seg(t, 0.5, 1.2)), C.rose, a);
  ctx.globalAlpha = 1;
}

// ---------- scene A: "Hace un mes" ----------
function sceneA(t) {
  if (t > 2.9) return;
  camera(1 + 0.05 * ease(seg(t, 0, 2.6)), 0, nx(t * 0.4) * 6, ny(t * 0.4) * 6);
  const la = win(t, 1.0, 0.4, 1.9, 0.35);
  if (la > 0) {
    label(scramble(`DESDE EL ${CONFIG.desde}.${CONFIG.anio}`, t, 1.0, 0.7, 9), 540, 660, { size: 26, color: C.cream, alpha: 0.75 * la, track: 9, align: 'center' });
    drawLine(470, 700, 610, 700, expoOut(seg(t, 1.1, 1.8)) * la, { from: 'center', color: C.rose, width: 2 });
  }
  maskText('Hace', 540, 930, t, 0.45, { size: 230, weight: 300, color: C.cream, track: -6, outAt: 2.05 });
  maskText('un mes', 540, 1160, t, 0.7, { size: 240, weight: 300, italic: true, color: C.rose, track: -6, outAt: 2.12 });
}

// ---------- scene B: odometer & slot swaps inside a ring ----------
const RC = [540, 930], RR = 400;
const STATS = [
  { txt: String(DIAS), lab: 'DÍAS', cap: 'días contigo', t: 2.6, size: 620 },
  { txt: fmt(DIAS * 24), lab: 'HORAS', cap: 'horas pensando en ti', t: 5.0, size: 470 },
  { txt: fmt(DIAS * 1440), lab: 'MINUTOS', cap: 'y no cambiaría ni uno', t: 6.25, size: 285 },
];
const B_OUT = 7.05;
function odoColumns() { return [...STATS[0].txt].map((d, i, a) => ({ d: +d, S: +d + 10 * (i + 1), t0: STATS[0].t + i * 0.12, dur: 1.35 })); }
const ODO = odoColumns();
function odometer(t, cx, base, size) {
  setFont(size, 'serif', 300, false, -10);
  const dw = Math.max(...'0123456789'.split('').map(c => ctx.measureText(c).width)) * 0.86;
  const lh = size * 1.3, n = ODO.length, x0 = cx - dw * n / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - 60, base - size * 0.82, dw * n + 120, size * 0.88); ctx.clip();
  ctx.fillStyle = C.cream;
  ODO.forEach((c, i) => {
    if (t < c.t0) return;
    ctx.globalAlpha = clamp((t - c.t0) / 0.15);
    const p = expoOut(seg(t, c.t0, c.t0 + c.dur)), v = c.S * p;
    const out = quintIn(seg(t, STATS[1].t - 0.1 + i * 0.04, STATS[1].t + 0.2 + i * 0.04));
    const k = Math.floor(v), f = v - k, cx_ = x0 + dw * (i + 0.5);
    for (const [dig, off] of (f > 0.002 ? [[k % 10, -f], [(k + 1) % 10, 1 - f]] : [[k % 10, 0]])) {
      const w = ctx.measureText(String(dig)).width;
      ctx.fillText(String(dig), cx_ - w / 2, base + (off + (1 - p) * 0) * lh - out * lh * 1.1);
    }
  });
  ctx.restore();
}
function sceneB(t) {
  if (t < 2.35 || t > 7.8) return;
  const zoom = expoIn(seg(t, 7.1, 7.65));
  camera(1 + 0.03 * ease(seg(t, 2.4, 7.0)), 0, nx(t * 0.4 + 5) * 5, ny(t * 0.4 + 5) * 5);
  // ring
  ctx.save();
  const ra = expoOut(seg(t, 2.4, 3.2)), rs = lerp(0.86, 1, ra) * (1 + zoom * 2.6) * (1 + 0.025 * (spring(t - 5.0, 18, 0.4) - spring(t - 5.25, 18, 0.4)) + 0.025 * (spring(t - 6.25, 18, 0.4) - spring(t - 6.5, 18, 0.4)));
  ctx.translate(RC[0], RC[1]); ctx.scale(rs, rs); ctx.rotate(-Math.PI / 2 + (t - 2.5) * 0.05);
  ctx.globalAlpha = ra * (1 - seg(t, 7.35, 7.7));
  ctx.strokeStyle = C.faint; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, RR, 0, Math.PI * 2); ctx.stroke();
  const arc = expoInOut(seg(t, 2.6, 3.9));
  for (let i = 0; i < DIAS; i++) {
    const a = (i / DIAS) * Math.PI * 2, lit = arc * DIAS > i + 0.5;
    ctx.strokeStyle = lit ? C.rose : C.faint; ctx.lineWidth = lit ? 4 : 2;
    const r1 = RR + 22, r2 = RR + (i % 5 === 0 ? 52 : 38);
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke();
  }
  if (arc > 0) {
    ctx.strokeStyle = C.rose; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, RR, 0, arc * Math.PI * 2); ctx.stroke();
    const ha = arc * Math.PI * 2; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(GLOW, Math.cos(ha) * RR - 60, Math.sin(ha) * RR - 60, 120, 120);
  }
  ctx.restore();
  // numbers
  const base = s => RC[1] + s * 0.34;
  if (t < STATS[1].t + 0.6) odometer(t, RC[0], base(STATS[0].size), STATS[0].size);
  for (let i = 1; i < STATS.length; i++) {
    const s = STATS[i];
    maskText(s.txt, RC[0], base(s.size), t, s.t + 0.16, { size: s.size, weight: 300, color: C.cream, track: -10, stagger: 0.045, outAt: i + 1 < STATS.length ? STATS[i + 1].t - 0.12 : B_OUT, outDur: 0.32, rise: 1.05 });
  }
  // label + caption
  const cur = t < STATS[1].t ? 0 : t < STATS[2].t ? 1 : 2, s = STATS[cur];
  const la = win(t, s.t, 0.2, cur === 2 ? B_OUT : STATS[cur + 1].t - 0.25, 0.25);
  label(scramble(s.lab, t, s.t + (cur ? 0.15 : 0.7), 0.6, 20 + cur), 540, 1215, { size: 34, weight: 500, color: C.cream, alpha: la, track: 22, align: 'center' });
  label(scramble(`0${cur + 1} / 03`, t, s.t + 0.1, 0.5, 30 + cur), 540, 650, { size: 22, color: C.muted, alpha: la, track: 8, align: 'center' });
  STATS.forEach((st, i) => maskText(st.cap, 540, 1490, t, st.t + 0.35, { size: 72, weight: 300, italic: true, color: C.cream, by: 'word', outAt: i + 1 < STATS.length ? STATS[i + 1].t - 0.12 : B_OUT - 0.1, outDur: 0.4 }));
}

// ---------- scene C: calendar of 30 days ----------
const G = { cols: 6, cell: 128, gap: 18 };
G.w = G.cols * G.cell + (G.cols - 1) * G.gap; G.x0 = (W - G.w) / 2; G.y0 = 800;
const cellPos = k => { const r = Math.floor(k / G.cols), c = k % G.cols; return [G.x0 + c * (G.cell + G.gap) + G.cell / 2, G.y0 + r * (G.cell + G.gap) + G.cell / 2, r, c]; };
const FILL_T = k => 8.35 + k * 0.045;
const HEART_PTS = heartSamples(DIAS, 0).map(([x, y]) => [540 + 380 * x, 930 + 380 * y]);
const D0 = 10.9, Dk = k => D0 + k * 0.02;
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function polyline(pts, p) {
  const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let rem = tot * p; ctx.beginPath(); ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length && rem > 0; i++) { const k = Math.min(1, rem / L[i - 1]); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); rem -= L[i - 1]; }
  ctx.stroke();
}
function sceneC(t) {
  if (t < 7.4) return;
  // camera: gentle push during the calendar, then the heart group lifts and shrinks for the final card
  const fin = expoInOut(seg(t, 12.85, 13.9));
  camera(1 + 0.04 * ease(seg(t, 7.4, 10.9)) - 0.04 * ease(seg(t, 10.9, 12.4)), lerp(-0.012, 0, ease(seg(t, 7.4, 10.5))), nx(t * 0.35 + 9) * 4, ny(t * 0.35 + 9) * 4);
  // title
  maskText(`${DIAS === 30 ? 'Treinta' : DIAS} días`, 540, 560, t, 7.55, { size: 130, weight: 300, color: C.cream, track: -3, outAt: 10.8 });
  maskText('y ninguno igual', 540, 690, t, 7.75, { size: 116, weight: 300, italic: true, color: C.rose, track: -3, by: 'word', outAt: 10.85 });
  // cells
  const groupS = lerp(1, 0.56, fin), groupY = lerp(0, -330, fin);
  ctx.save(); ctx.translate(540, 930 + groupY); ctx.scale(groupS, groupS); ctx.translate(-540, -930);
  // bloom heart behind diamonds
  const bloom = spring(t - 12.45, 11, 0.62), beat = t > 13.7 ? 0.035 * (Math.exp(-((t - 13.75) % (2 * BEAT)) * 7)) : 0;
  if (t > 12.4) {
    sprite(BLOB, 540, 930, 1500 * bloom, 1500 * bloom, 0.55 * (1 - seg(t, 12.5, 14)) + 0.25);
    heart(540, 930, 640 * bloom * (1 + beat), C.rose);
    sprite(GLOW, 540, 930, 900, 900, 0.9 * (1 - seg(t, 12.45, 13.0)), 'lighter');
  }
  for (let k = 0; k < DIAS; k++) {
    const [cx, cy, r, c] = cellPos(k);
    const po = expoOut(seg(t, 7.55 + (r + c) * 0.045, 8.25 + (r + c) * 0.045));
    if (po <= 0) continue;
    const pf = seg(t, FILL_T(k), FILL_T(k) + 0.35), pd = expoInOut(seg(t, Dk(k), Dk(k) + 1.0));
    const [hx, hy] = HEART_PTS[k];
    const x = lerp(cx, hx, pd), y = lerp(cy, hy, pd), s = lerp(G.cell, 40, pd) * (1 + beat * 0.6), rot = lerp(0, Math.PI / 4, pd);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    // outline (draws on)
    if (pd < 1) {
      ctx.globalAlpha = 1 - pd; ctx.strokeStyle = 'rgba(246,236,226,.3)'; ctx.lineWidth = 2;
      const per = 4 * G.cell; ctx.setLineDash([po * per, per]); roundRect(-G.cell / 2, -G.cell / 2, G.cell, G.cell, 16); ctx.stroke(); ctx.setLineDash([]);
    }
    // fill
    if (pf > 0) {
      const fs = backOut(pf, 1.7);
      ctx.globalAlpha = clamp(pf * 3); ctx.fillStyle = t > 12.45 ? (k % 2 ? C.cream : '#ffd3db') : C.rose;
      roundRect(-s / 2 * fs, -s / 2 * fs, s * fs, s * fs, lerp(16, 6, pd)); ctx.fill();
      const ph = spring(t - FILL_T(k) - 0.08, 16, 0.55) * (1 - pd);
      if (ph > 0) heart(0, 4, 40 * ph, C.cream, 1 - pd);
    }
    // day number
    if (pd < 0.6) {
      setFont(22, 'sans', 500, false, 1); ctx.globalAlpha = po * (1 - pd / 0.6);
      ctx.fillStyle = pf > 0.3 ? 'rgba(42,11,22,.75)' : C.muted;
      ctx.fillText(String(k + 1).padStart(2, '0'), -G.cell / 2 + 14, -G.cell / 2 + 32);
    }
    ctx.restore();
  }
  ctx.restore();
  // callouts: day 1 and day N
  const ca = 1 - seg(t, 10.75, 11.05);
  if (t > 9.7 && ca > 0) {
    const [c0x, c0y] = cellPos(0), [cnx, cny] = cellPos(DIAS - 1), gx1 = G.x0 + G.w;
    ctx.save(); ctx.globalAlpha = ca; ctx.strokeStyle = C.cream; ctx.lineWidth = 2;
    const la = expoInOut(seg(t, 9.75, 10.35)), lb = expoInOut(seg(t, 9.9, 10.5));
    polyline([[G.x0 - 4, c0y], [70, c0y], [70, 1612], [96, 1612]], la);
    polyline([[gx1 + 4, cny], [1010, cny], [1010, 1612], [984, 1612]], lb);
    ctx.fillStyle = C.rose;
    if (la > 0) { ctx.beginPath(); ctx.arc(G.x0 - 4, c0y, 6, 0, 7); ctx.fill(); }
    if (lb > 0) { ctx.beginPath(); ctx.arc(gx1 + 4, cny, 6, 0, 7); ctx.fill(); }
    // rings around the two cells
    ctx.strokeStyle = C.cream; ctx.lineWidth = 3;
    [[0, 9.8], [DIAS - 1, 9.95]].forEach(([k, t0]) => { const [x, y] = cellPos(k), p = expoOut(seg(t, t0, t0 + 0.5)); if (p > 0) { ctx.globalAlpha = ca * p; roundRect(x - 64 - 10 * p, y - 64 - 10 * p, 128 + 20 * p, 128 + 20 * p, 22); ctx.stroke(); } });
    ctx.restore();
    ctx.globalAlpha = ca;
    label(scramble('DÍA 01', t, 10.2, 0.4, 41), 110, 1600, { size: 22, color: C.rose, track: 6, alpha: ca });
    maskText('el día que empezó todo', 110, 1662, t, 10.25, { size: 46, weight: 300, italic: true, color: C.cream, align: 'left', by: 'word', stagger: 0.05 });
    label(scramble(`DÍA ${DIAS}`, t, 10.35, 0.4, 42), 970, 1600, { size: 22, color: C.rose, track: 6, align: 'right', alpha: ca });
    maskText('hoy', 970, 1662, t, 10.4, { size: 46, weight: 300, italic: true, color: C.cream, align: 'right' });
    ctx.globalAlpha = 1;
  }
}

// ---------- scene E: final card ----------
function sceneE(t) {
  if (t < 12.9) return;
  camera(1 + 0.025 * ease(seg(t, 12.9, DUR)), 0, nx(t * 0.3 + 15) * 3, ny(t * 0.3 + 15) * 3);
  maskText('Feliz', 540, 1130, t, 13.15, { size: 176, weight: 300, color: C.cream, track: -4 });
  maskText('primer mes,', 540, 1310, t, 13.35, { size: 176, weight: 300, italic: true, color: C.cream, track: -4, by: 'char', stagger: 0.03 });
  wipeText(NOMBRE, 540, 1525, t, 13.85, 1.1, { size: 210, color: C.rose });
  label(scramble(`TE QUIERO · ${CONFIG.hasta}.${CONFIG.anio}`, t, 14.7, 0.9, 50), 540, 1660, { size: 24, color: C.muted, track: 12, align: 'center' });
}

function draw(t) {
  ctx.drawImage(BG, 0, 0);
  sprite(BLOB, 540 + nx(t * 0.15) * 260, 900 + ny(t * 0.15) * 380, 1500, 1500, 0.35 + 0.1 * nr(t * 0.3), 'screen');
  sceneA(t); sceneB(t); sceneC(t); sceneE(t);
  hud(t);
  post(t, { vignette: VIG, grain: 0.08, fade: seg(t, DUR - 0.7, DUR) });
}

// ---------- sound ----------
async function buildAudio(ac) {
  const M = await mixer(ac, { seed: 5, wet: 0.45 });
  const chords = [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [42, 45, 50, 54], [40, 43, 47, 50], [50, 54, 57, 61, 64], [50, 54, 57, 61, 64]];
  const roots = [38, 35, 31, 30, 28, 38, 38];
  chords.forEach((ch, b) => M.pad(ch.map(n => n + 12), b * BAR, b === 6 ? BAR * 0.5 : BAR, b === 0 ? 0.35 : 0.45, M.padB, b === 5 ? 1600 : 1100));
  roots.forEach((r, b) => { if (b >= 1) M.bass(r, b * BAR, BAR * 0.95, 0.2); });
  M.bass(33, 4.5 * BAR, BAR * 0.5, 0.2);                  // A under the riser
  // felt-piano arpeggio
  const arp = [0, 2, 1, 3, 2, 1, 3, 2];
  for (let i = 0; i < 6.5 * 8; i++) {
    const t = i * BEAT / 2, b = Math.floor(t / BAR);
    if (t < BAR || t > 6 * BAR - 0.2) continue;
    if (t > 10.6 && t < 12.5) continue;
    const ch = chords[b]; M.piano(ch[arp[i % 8] % ch.length] + 24, t, i % 2 ? 0.05 : 0.075, 1.6);
  }
  // groove
  for (let b = 1; b < 5; b++) for (let q = 0; q < 4; q++) {
    const t = b * BAR + q * BEAT;
    if (q % 2 === 0) M.kick(t, 0.38);
    if (b >= 2) { M.hat(t + BEAT / 2, 0.035); M.hat(t + BEAT / 4, 0.012); M.hat(t + 3 * BEAT / 4, 0.012); }
  }
  // HUD decode ticks
  [0.3, 0.38, 0.47, 0.55, 0.62, 0.75, 0.83].forEach((t, i) => M.sample('tick', t, 0.18, M.fx, 1 + i * 0.05));
  // odometer ticks: one per digit change of the last column
  { const c = ODO[ODO.length - 1]; let prev = 0; for (let t = c.t0; t < c.t0 + c.dur; t += 1 / 480) { const v = Math.floor(c.S * expoOut(seg(t, c.t0, c.t0 + c.dur))); if (v !== prev) { M.sample('tick', t, 0.28, M.fx, 1.1 + 0.4 * (v / c.S)); prev = v; } } }
  M.bell(86, STATS[0].t + 1.3, 0.05, 2);
  // slot swaps
  M.sample('swoosh', STATS[1].t - 0.12, 0.35); M.sample('click', STATS[1].t + 0.1, 0.25);
  M.sample('swoosh', STATS[2].t - 0.12, 0.35, M.fx, 1.12); M.sample('click', STATS[2].t + 0.1, 0.25);
  M.sample('woosh', 7.05, 0.5, M.fx, 0.9);
  // calendar: outlines + fills (pentatonic run)
  const penta = [0, 2, 4, 7, 9];
  for (let k = 0; k < DIAS; k++) { const m = 74 + 12 * Math.floor(k / 5) / 2 + penta[k % 5]; M.bell(Math.min(100, Math.round(m)), FILL_T(k), 0.03 + 0.015 * (k / DIAS), 0.9); }
  M.sample('click', 9.8, 0.25); M.sample('click', 9.95, 0.25);
  // fly into the heart
  M.sample('riser', 10.5, 0.45);
  M.noise(10.9, 1.5, 400, 5000, 0.05, 'swell');
  for (let k = 0; k < DIAS; k += 2) M.sample('tick', Dk(k) + 0.95, 0.1, M.fx, 1.4);
  // bloom
  M.sample('impact', 12.5, 0.7); M.boom(12.5, 0.6); M.sample('triangle', 12.52, 0.35);
  [62, 66, 69, 73, 78].forEach((m, i) => M.bell(m + 12, 12.5 + i * 0.015, 0.06, 3.5));
  // melody over the final card
  const mel = [[13.1, 78], [13.75, 76], [14.05, 74], [14.375, 73], [15.0, 74], [15.3, 69]];
  mel.forEach(([t, m]) => M.piano(m, t, 0.12, 2.6));
  for (let i = 0; i < 8; i++) M.piano(chords[5][i % 5] + 12, 13.1 + i * BEAT / 2 + 0.6, 0.03, 1.4);
  M.sample('tick', 14.7, 0.15); M.sample('tick', 14.8, 0.12);
}

boot(DUR, draw, buildAudio, ['300 100px Fraunces', 'italic 300 100px Fraunces', '500 30px Geist', '400 100px Vibes']);
