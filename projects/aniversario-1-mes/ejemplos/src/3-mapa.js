// ============================================================
//  EJEMPLO 3 · "El mapa de lo nuestro"
// ============================================================
const CONFIG = {
  nombre: '',                          // vacío = "mi amor"
  dias: 30,
  paradas: [                           // 4 lugares (textos de ejemplo: cámbialos por los vuestros)
    { titulo: 'Donde nos conocimos', sitio: 'La cafetería de la esquina', fecha: '17 OCT' },
    { titulo: 'Nuestra primera cita', sitio: 'El cine del centro', fecha: '21 OCT' },
    { titulo: 'El primer beso', sitio: 'El puente del río', fecha: '25 OCT' },
    { titulo: 'Nuestro sitio', sitio: 'El banco del parque', fecha: '02 NOV' },
  ],
};
// ------------------------------------------------------------
//  BEAT SHEET (90 BPM)
//  0.0  whole city from above under a cream veil; title rises   | guitar enters
//  1.6  title leaves, camera dives to the first place          | woosh
//  3.0  pin 01 drops, card pops                                 | pop
//  4.3  route draws to 02 (camera rides along, banks slightly)  | swoosh
//  5.9  pin 02 + card · 7.2 → 8.8 pin 03 + card · 10.1 → 11.7 pin 04 + card
//  13.0 route closes back to the start                          | riser
//  14.3 camera pulls out: the route is a heart                  | chime + chord
//  15.3 "Feliz primer mes, mi amor"                             |
// ------------------------------------------------------------
const NOMBRE = CONFIG.nombre.trim() || 'mi amor';
const C = { street: '#faf6ef', block: '#ebe1d1', bline: '#f4ede1', park: '#cfdcb5', tree: '#b7c99b', water: '#bdd6de', waterEdge: '#a6c5cf', label: '#b2a48e', rose: '#e0436a', wine: '#4e1222', ink: '#3a2b2b', cream: '#fbf7f0' };
const nx = noise1(3), ny = noise1(9);

// ---------- procedural city (built once) ----------
const GA = 0.2;                                         // grid angle
const river = y => -260 + 420 * Math.sin(y / 760 + 0.9); // river centre x (world) for a given y
const PARKS = [[-1100, -1250, 520, 380], [380, 520, 430, 460], [-700, 900, 360, 300], [700, -900, 300, 420]];
const CITY = (() => {
  const blocks = new Path2D(), parks = new Path2D(), lines = new Path2D(), trees = new Path2D(), r = rng(42);
  const B = 150, S = 26, A = 54;                       // block, street, avenue
  const pos = i => i * (B + S) + Math.floor(i / 4) * (A - S);
  const inPark = (x, y) => PARKS.some(([px, py, pw, ph]) => x > px && x < px + pw && y > py && y < py + ph);
  for (let gx = -14; gx < 14; gx++) for (let gy = -16; gy < 16; gy++) {
    const x = pos(gx), y = pos(gy), cx = x + B / 2, cy = y + B / 2;
    // world position of the block centre (grid is rotated by GA)
    const wx = cx * Math.cos(GA) - cy * Math.sin(GA), wy = cx * Math.sin(GA) + cy * Math.cos(GA);
    if (Math.abs(wx - river(wy)) < 170) continue;
    if (inPark(cx, cy)) { parks.roundRect(x - S / 2, y - S / 2, B + S, B + S, 4); for (let k = 0; k < 7; k++) { const tx = x + 14 + r() * (B - 28), ty = y + 14 + r() * (B - 28), tr = 9 + r() * 9; trees.moveTo(tx + tr, ty); trees.arc(tx, ty, tr, 0, Math.PI * 2); } continue; }
    blocks.roundRect(x, y, B, B, 10);
    const n = Math.floor(r() * 3);
    for (let k = 0; k < n; k++) { if (r() < 0.5) { const lx = x + B * (0.3 + r() * 0.4); lines.moveTo(lx, y + 10); lines.lineTo(lx, y + B - 10); } else { const ly = y + B * (0.3 + r() * 0.4); lines.moveTo(x + 10, ly); lines.lineTo(x + B - 10, ly); } }
  }
  const water = new Path2D(); for (let y = -2400; y <= 2400; y += 40) { const x = river(y); y === -2400 ? water.moveTo(x, y) : water.lineTo(x, y); }
  return { blocks, parks, lines, trees, water, pos };
})();
const STREET_LABELS = [['AVENIDA DEL PARQUE', 0, CITY.pos(4) - 40, 0], ['CALLE MAYOR', -150, CITY.pos(-4) - 40, 0], ['PASEO DE LAS FLORES', CITY.pos(4) - 40, 120, Math.PI / 2], ['CALLE DEL SOL', CITY.pos(-8) - 40, -500, Math.PI / 2]];
function drawCity(labelsAlpha = 1) {
  ctx.fillStyle = C.street; ctx.fillRect(-4000, -4000, 8000, 8000);
  ctx.save(); ctx.rotate(GA);
  ctx.fillStyle = C.block; ctx.fill(CITY.blocks);
  ctx.strokeStyle = C.bline; ctx.lineWidth = 3; ctx.stroke(CITY.lines);
  ctx.fillStyle = C.park; ctx.fill(CITY.parks);
  ctx.fillStyle = C.tree; ctx.fill(CITY.trees);
  if (labelsAlpha > 0) {
    setFont(19, 'sans', 600, false, 7); ctx.fillStyle = C.label; ctx.globalAlpha = labelsAlpha;
    for (const [txt, x, y, rot] of STREET_LABELS) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillText(txt, 0, 0); ctx.restore(); }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = C.waterEdge; ctx.lineWidth = 196; ctx.stroke(CITY.water);
  ctx.strokeStyle = C.water; ctx.lineWidth = 180; ctx.stroke(CITY.water);
  // bridges where the avenues cross
  ctx.save(); ctx.rotate(GA); ctx.fillStyle = C.street; ctx.strokeStyle = 'rgba(150,130,110,.35)'; ctx.lineWidth = 3;
  for (const gy of [-12, -8, -4, 0, 4, 8, 12]) {
    const yy = CITY.pos(gy) - 40, wy = (x) => x * Math.sin(GA) + yy * Math.cos(GA);
    // find the river crossing along this avenue (grid x where world x == river(world y))
    let gx = -2000; for (let x = -2600; x < 2600; x += 8) { const wx = x * Math.cos(GA) - yy * Math.sin(GA); if (wx > river(wy(x))) { gx = x; break; } }
    ctx.beginPath(); ctx.rect(gx - 150, yy - 22, 300, 44); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ---------- route: a heart, starting at its bottom tip ----------
const HR = 760, HC = [0, 40];
const ROUTE = heartSamples(720, 0.5).map(([x, y]) => [HC[0] + x * HR, HC[1] + y * HR]); ROUTE.push(ROUTE[0]);
const routeAt = s => { const f = clamp(s) * (ROUTE.length - 1), i = Math.min(ROUTE.length - 2, Math.floor(f)), k = f - i; return [lerp(ROUTE[i][0], ROUTE[i + 1][0], k), lerp(ROUTE[i][1], ROUTE[i + 1][1], k)]; };
const STOP_S = [0, 0.27, 0.5, 0.73];
const ARRIVE = [3.0, 5.9, 8.8, 11.7], LEAVE = [4.3, 7.2, 10.1, 13.0], CLOSE = 14.5, PULL = [14.2, 15.9], DUR = 19.0;
const sOf = kf([[0, 0], [LEAVE[0], 0], [ARRIVE[1], STOP_S[1], quintInOut], [LEAVE[1], STOP_S[1]], [ARRIVE[2], STOP_S[2], quintInOut], [LEAVE[2], STOP_S[2]], [ARRIVE[3], STOP_S[3], quintInOut], [LEAVE[3], STOP_S[3]], [CLOSE, 1, quintInOut]]);

// ---------- camera ----------
function cam(t) {
  // follow the head with a little lag
  let fx = 0, fy = 0; for (let k = 0; k < 4; k++) { const [x, y] = routeAt(sOf(t - k * 0.09)); fx += x / 4; fy += y / 4; }
  const travel = [0, 1, 2, 3].reduce((a, i) => a + Math.sin(Math.PI * seg(t, LEAVE[i], i < 3 ? ARRIVE[i + 1] : CLOSE)), 0);
  let s = 1.32 - 0.2 * travel, r = 0.06 * [0, 1, 2, 3].reduce((a, i) => a + Math.sin(Math.PI * seg(t, LEAVE[i], i < 3 ? ARRIVE[i + 1] : CLOSE)) * (i % 2 ? -1 : 1), 0);
  const dive = expoInOut(seg(t, 1.5, 3.0));
  fx = lerp(HC[0], fx, dive); fy = lerp(HC[1] + 60, fy, dive); s = Math.exp(lerp(Math.log(0.36 + 0.02 * seg(t, 0, 1.5)), Math.log(s), dive)); r = lerp(-0.08, r, dive);
  const pull = expoInOut(seg(t, PULL[0], PULL[1]));
  fx = lerp(fx, HC[0], pull); fy = lerp(fy, HC[1] + 40, pull); s = Math.exp(lerp(Math.log(s), Math.log(0.52 + 0.02 * seg(t, PULL[1], DUR)), pull)); r = lerp(r, 0, pull);
  return { fx: fx + nx(t * 0.4) * 6, fy: fy + ny(t * 0.4) * 6, s, r };
}
const toScreen = (c, x, y) => { const dx = (x - c.fx) * c.s, dy = (y - c.fy) * c.s, cs = Math.cos(c.r), sn = Math.sin(c.r); return [540 + dx * cs - dy * sn, 960 + dx * sn + dy * cs]; };

// ---------- pins & cards (screen space, constant size) ----------
function pin(x, y, t0, t, i, k = 1) {
  if (t < t0) return;
  const d = spring(t - t0, 15, 0.5), drop = (1 - d) * 140, sq = 1 + 0.12 * Math.sin(Math.min(1, (t - t0) * 3) * Math.PI) * Math.exp(-(t - t0) * 4);
  // ripple & shadow
  const rp = seg(t, t0 + 0.12, t0 + 0.9);
  if (rp > 0 && rp < 1) { ctx.strokeStyle = `rgba(224,67,106,${0.5 * (1 - rp)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 20 + 70 * rp, (20 + 70 * rp) * 0.45, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = 'rgba(70,30,30,.22)'; ctx.beginPath(); ctx.ellipse(x, y, 18 * k * clamp(d), 7 * k * clamp(d), 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y - drop); ctx.scale(k / sq, k * sq);
  ctx.shadowColor = 'rgba(80,20,30,.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.rose; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-10, -22, -34, -40, -34, -66); ctx.arc(0, -66, 34, Math.PI, 0); ctx.bezierCurveTo(34, -40, 10, -22, 0, 0); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -66, 22, 0, 7); ctx.fill();
  setFont(20, 'sans', 700, false, 0); ctx.fillStyle = C.rose; const s = String(i + 1).padStart(2, '0'); ctx.fillText(s, -textW(s) / 2, -59);
  ctx.restore();
}
function card(x, y, i, t) {
  const a = ARRIVE[i] + 0.15, b = LEAVE[i] + 0.05;
  if (t < a || t > b + 0.4) return;
  const pin_ = spring(t - a, 13, 0.72), pout = cubicIn(seg(t, b, b + 0.3)), st = CONFIG.paradas[i];
  const cw = 640, ch = 196, cx = clamp(x, 70 + cw / 2, W - 70 - cw / 2), cy = y - 150 - ch / 2;
  ctx.save(); ctx.translate(x, y - 110); ctx.scale(lerp(0.4, 1, pin_) * (1 - pout * 0.08), lerp(0.4, 1, pin_) * (1 - pout * 0.08)); ctx.translate(-x, -(y - 110));
  ctx.globalAlpha = clamp(pin_ * 2) * (1 - pout);
  ctx.translate(0, (1 - pin_) * 30 - pout * 20);
  ctx.shadowColor = 'rgba(80,30,30,.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#fffdf9'; ctx.beginPath(); ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 30); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 16, cy + ch / 2 - 1); ctx.lineTo(x, cy + ch / 2 + 16); ctx.lineTo(x + 16, cy + ch / 2 - 1); ctx.fill();
  ctx.shadowColor = 'transparent';
  const L = cx - cw / 2 + 40;
  label(scramble(`PARADA 0${i + 1} · ${st.fecha}`, t, a + 0.1, 0.5, 60 + i), L, cy - 44, { size: 20, color: C.rose, track: 6, weight: 600, alpha: ctx.globalAlpha });
  setFont(54, 'serif', 400, false, -1); ctx.fillStyle = C.ink; ctx.fillText(st.titulo, L, cy + 18);
  label(st.sitio, L, cy + 62, { size: 24, color: '#8d7d74', track: 0.5, weight: 400, alpha: ctx.globalAlpha });
  ctx.restore();
}

// ---------- HUD ----------
function compass(x, y, rot, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255,253,249,.92)'; ctx.shadowColor = 'rgba(80,30,30,.15)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(0, 0, 42, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.rotate(rot);
  ctx.fillStyle = C.rose; ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.fill();
  ctx.fillStyle = '#c9bcb0'; ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.fill();
  setFont(15, 'sans', 700, false, 0); ctx.fillStyle = C.ink; ctx.fillText('N', -5, -32 + 2 - 4);
  ctx.restore();
}
function hud(t, c) {
  const a = win(t, 0.2, 0.6, PULL[0], 0.5);
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,253,249,.92)'; ctx.shadowColor = 'rgba(80,30,30,.12)'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.roundRect(70, 92, 330, 64, 32); ctx.fill(); ctx.restore();
  heart(110, 124, 24, C.rose, a);
  label(scramble('NUESTRO MAPA', t, 0.3, 0.6, 1), 136, 132, { size: 20, color: C.ink, track: 6, weight: 600, alpha: a });
  compass(968, 124, -c.r - GA * 0, a);
  // bottom: stop counter + scale bar
  const stop = t < ARRIVE[0] ? 0 : [0, 1, 2, 3].filter(i => t >= ARRIVE[i]).length;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,253,249,.92)'; ctx.shadowColor = 'rgba(80,30,30,.12)'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.roundRect(70, 1764, 940, 70, 35); ctx.fill(); ctx.restore();
  label(`PARADA 0${stop} / 04`, 110, 1808, { size: 20, color: C.ink, track: 6, weight: 600, alpha: a });
  for (let i = 0; i < 4; i++) { ctx.globalAlpha = a; ctx.fillStyle = i < stop ? C.rose : '#e3d8cc'; ctx.beginPath(); ctx.roundRect(370 + i * 56, 1793, 44, 8, 4); ctx.fill(); }
  const m = 100, px = m * c.s * 1.6; ctx.globalAlpha = a; ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(970 - px, 1792); ctx.lineTo(970 - px, 1804); ctx.lineTo(970, 1804); ctx.lineTo(970, 1792); ctx.stroke();
  label('100 m', 970 - px - 14, 1808, { size: 18, color: C.ink, track: 2, weight: 500, align: 'right', alpha: a });
  ctx.globalAlpha = 1;
}

const VIG = vignetteCanvas(0.28, '90,50,40');
const VEIL = (() => { const g = makeCanvas(W, H), x = g.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, 'rgba(251,247,240,.97)'); gr.addColorStop(0.25, 'rgba(251,247,240,.75)'); gr.addColorStop(0.32, 'rgba(251,247,240,0)'); gr.addColorStop(0.7, 'rgba(251,247,240,0)'); gr.addColorStop(0.78, 'rgba(251,247,240,.8)'); gr.addColorStop(1, 'rgba(251,247,240,.97)');
  x.fillStyle = gr; x.fillRect(0, 0, W, H); return g; })();
const GLOWR = makeGlow(256, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,170,190,.8)'], [1, 'rgba(224,67,106,0)']]);

function draw(t) {
  const c = cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(540, 960); ctx.rotate(c.r); ctx.scale(c.s, c.s); ctx.translate(-c.fx, -c.fy);
  drawCity(1 - seg(c.s, 0.75, 0.5));
  // heart fill after closing
  const fillA = seg(t, CLOSE - 0.1, CLOSE + 0.8);
  if (fillA > 0) { ctx.save(); ctx.translate(HC[0], HC[1]); ctx.scale(HR, HR); ctx.globalAlpha = 0.22 * fillA; ctx.fillStyle = C.rose; ctx.fill(HEART); ctx.restore(); }
  // route
  const s = sOf(t), n = Math.max(1, Math.floor(s * (ROUTE.length - 1)));
  if (t > ARRIVE[0] - 0.2) {
    const head = routeAt(s), lw = 1 / c.s;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = new Path2D(); path.moveTo(...ROUTE[0]); for (let i = 1; i <= n; i++) path.lineTo(...ROUTE[i]); path.lineTo(...head);
    const thick = 1 + 0.5 * fillA;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 22 * lw * thick; ctx.stroke(path);
    ctx.strokeStyle = C.rose; ctx.lineWidth = 11 * lw * thick; ctx.stroke(path);
    ctx.setLineDash([2 * lw, 26 * lw]); ctx.lineDashOffset = -t * 60 * lw; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4 * lw; ctx.stroke(path); ctx.setLineDash([]);
  }
  // screen-space overlays
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (t > ARRIVE[0] - 0.2 && t < CLOSE + 0.6) {
    const [hx, hy] = toScreen(c, ...routeAt(s)), p = 1 + 0.25 * Math.sin(t * 6);
    sprite(GLOWR, hx, hy, 110 * p, 110 * p, 0.8 * (1 - seg(t, CLOSE, CLOSE + 0.6)), 'source-over');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 11, 0, 7); ctx.fill();
    ctx.fillStyle = C.rose; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, 7); ctx.fill();
  }
  const pk = lerp(1, 0.72, expoInOut(seg(t, PULL[0], PULL[1])));
  STOP_S.forEach((ss, i) => { const [px, py] = toScreen(c, ...routeAt(ss)); pin(px, py, ARRIVE[i] - 0.05, t, i, pk); });
  STOP_S.forEach((ss, i) => { const [px, py] = toScreen(c, ...routeAt(ss)); card(px, py, i, t); });
  if (t > CLOSE - 0.05) { const [px, py] = toScreen(c, ...ROUTE[0]); sprite(GLOWR, px, py, 400, 400, 0.9 * (1 - seg(t, CLOSE, CLOSE + 0.8)), 'lighter'); }

  // intro veil + title
  const intro = 1 - expoInOut(seg(t, 1.45, 2.6));
  if (intro > 0) {
    ctx.globalAlpha = intro * 0.82; ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    label(scramble(`UN MES · ${CONFIG.paradas.length} LUGARES`, t, 0.25, 0.7, 5), 540, 790, { size: 24, color: C.rose, track: 12, weight: 600, align: 'center', alpha: intro });
    maskText('El mapa', 540, 960, t, 0.35, { size: 170, weight: 300, color: C.wine, track: -4, outAt: 1.4, outDur: 0.5 });
    maskText('de lo nuestro', 540, 1130, t, 0.55, { size: 150, weight: 300, italic: true, color: C.rose, track: -3, outAt: 1.45, outDur: 0.5 });
  }
  hud(t, c);
  // outro veil + text
  const ov = seg(t, PULL[1] - 0.6, PULL[1] + 0.3);
  if (ov > 0) {
    ctx.globalAlpha = ov; ctx.drawImage(VEIL, 0, 0); ctx.globalAlpha = 1;
    label(scramble(`${CONFIG.paradas.length} LUGARES · ${CONFIG.dias} DÍAS · 1 CORAZÓN`, t, PULL[1] - 0.4, 0.9, 8), 540, 250, { size: 24, color: C.rose, track: 10, weight: 600, align: 'center' });
    maskText('Feliz primer mes,', 540, 1600, t, PULL[1] - 0.25, { size: 104, weight: 300, color: C.wine, track: -2, by: 'word', stagger: 0.1 });
    wipeText(NOMBRE, 540, 1770, t, PULL[1] + 0.35, 1.1, { size: 160, color: C.rose });
  }
  post(t, { vignette: VIG, grain: 0.05, fade: seg(t, DUR - 0.6, DUR), fadeColor: '#2a0b12' });
}

// ---------- sound ----------
async function buildAudio(ac) {
  const M = await mixer(ac, { seed: 33, wet: 0.42 });
  const BEAT = 60 / 90, BAR = 4 * BEAT;
  // G | D/F# | Em | C
  const prog = [[43, [55, 59, 62, 67]], [42, [54, 57, 62, 66]], [40, [52, 55, 59, 64]], [36, [52, 55, 60, 64]]];
  const pat = [0, 2, 1, 3, 2, 1, 3, 2];
  const nb = Math.ceil(DUR / BAR);
  for (let b = 0; b < nb; b++) {
    const [root, ch] = prog[b % 4], t0 = b * BAR;
    if (t0 > DUR - 1) break;
    const fin = t0 >= PULL[0] - 0.5;
    const [r2, c2] = fin ? prog[0] : [root, ch];
    M.pad(c2.map(n => n + 12), t0, BAR, b === 0 ? 0.18 : 0.25, M.padB, 1000);
    if (b >= 1) M.bass(r2, t0, BAR * 0.9, 0.18);
    M.pluck(r2 + 12, t0, 0.3);
    for (let i = 0; i < 8; i++) { const t = t0 + i * BEAT / 2; if (t > DUR - 0.8) break; M.pluck(c2[pat[i]] + 12, t + (i % 2 ? 0.012 : 0), i % 2 ? 0.13 : 0.18); }
    if (b >= 1 && !fin) for (let q = 0; q < 8; q++) M.hat(t0 + q * BEAT / 2 + BEAT / 4, q % 2 ? 0.02 : 0.03, M.fx, 0.07);
  }
  // title ticks + dive
  [0.25, 0.32, 0.4, 0.47].forEach((t, i) => M.sample('tick', t, 0.15, M.fx, 1 + i * 0.06));
  M.sample('woosh', 1.5, 0.45, M.fx, 0.8); M.noise(1.5, 1.4, 300, 2500, 0.04, 'hump');
  // stops
  ARRIVE.forEach((t, i) => {
    M.sample('plop', t, 0.4, M.fx, 1 + i * 0.06); M.sample('pop', t + 0.15, 0.3, M.fx, 1.1);
    M.bell(79 + [0, 2, 4, 7][i], t + 0.15, 0.06, 1.8);
    M.sample('click', LEAVE[i] + 0.05, 0.15, M.fx, 1.2);
    M.sample('swoosh', LEAVE[i] - 0.05, 0.22, M.fx, 0.9 + i * 0.05);
  });
  // closing the heart + pull-out
  M.sample('riser', CLOSE - 2.0, 0.35);
  M.sample('triangle', CLOSE, 0.4); M.boom(CLOSE, 0.4);
  [67, 71, 74, 79, 83].forEach((m, i) => M.bell(m + 12, CLOSE + 0.02 + i * 0.07, 0.05, 3.5));
  M.noise(PULL[0], 1.6, 2000, 400, 0.04, 'hump');
  [[PULL[1], 79], [PULL[1] + 0.67, 78], [PULL[1] + 1.33, 76], [PULL[1] + 2.0, 74], [PULL[1] + 2.67, 79]].forEach(([t, m]) => M.piano(m, t, 0.09, 2.5));
}

boot(DUR, draw, buildAudio, ['300 100px Fraunces', 'italic 300 100px Fraunces', '600 30px Geist', '400 100px Vibes']);
