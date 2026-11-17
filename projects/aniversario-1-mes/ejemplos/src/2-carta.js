// ============================================================
//  EJEMPLO 2 · "Una carta que se escribe sola"
// ============================================================
const CONFIG = {
  para: 'mi amor',                    // lo que pone encima del sobre
  fecha: '17 · 11 · 2026',
  // cada línea de la carta; ~~palabra~~ se escribe y luego se tacha
  lineas: [
    'Mi amor:',
    'Hace un mes que eres',
    'mi persona favorita.',
    'Eres ~~guapa~~ lo más',
    'bonito que me ha pasado.',
    'Gracias por este mes,',
    'te quiero',                      // al final se dibuja un corazón
  ],
  firma: '',                          // opcional, p. ej. "Pepe"
};
// ------------------------------------------------------------
//  BEAT SHEET (80 BPM, bar 3 s)
//  0.0  envelope slides up from below, "PARA mi amor" rises     | paper slide, piano enters
//  1.45 wax seal cracks in two and falls away                   | crack
//  1.75 flap swings open                                        | paper crinkle
//  2.40 folded letter slides out, envelope drops away           | paper slide
//  3.70 letter unfolds (top, then bottom)                       | two rustles
//  4.70 camera pushes in; pen writes line by line, follows it   | pen scratch
//       "guapa" gets scribbled out, then "lo más bonito…"      | scribble
//  end  heart drawn in red ink, pen leaves                      |
//  +1.0 letter folds in three, wax seal stamps down             | rustles, thud
//  +2.9 "Feliz primer mes" / CON TODO MI AMOR                   | final chord
// ------------------------------------------------------------
const C = { bg: '#e9cfc6', paper: '#fbf6ec', paperBack: '#f1e8da', ink: '#26305c', red: '#c42a4c', wine: '#5a1426', env: '#f2e5d3', envDark: '#e4d2bb', liner: '#e3a0a7', wax: '#a3162e' };
const nx = noise1(4), ny = noise1(8);

// ---------- static art ----------
const BG = (() => {
  const g = makeCanvas(W, H), x = g.getContext('2d');
  x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
  let gr = x.createRadialGradient(W * 0.3, H * 0.18, 0, W * 0.3, H * 0.18, H * 0.9);
  gr.addColorStop(0, 'rgba(255,244,236,.75)'); gr.addColorStop(0.5, 'rgba(255,236,226,.15)'); gr.addColorStop(1, 'rgba(120,50,50,.18)');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  // soft window-light bands
  x.save(); x.globalAlpha = 0.07; x.fillStyle = '#fff'; x.translate(W * 0.2, 0); x.rotate(0.35);
  for (let i = 0; i < 3; i++) x.fillRect(-200 + i * 330, -400, 140, H * 1.6); x.restore();
  return g;
})();
const VIG = vignetteCanvas(0.35, '90,30,40');
const LINER = (() => {
  const g = makeCanvas(900, 600), x = g.getContext('2d'); x.fillStyle = C.liner; x.fillRect(0, 0, 900, 600);
  x.fillStyle = 'rgba(255,240,240,.55)';
  for (let r = 0; r < 14; r++) for (let c = 0; c < 20; c++) { const px = c * 48 + (r % 2) * 24, py = r * 46; x.save(); x.translate(px, py); x.scale(7, 7); x.fill(HEART); x.restore(); }
  return g;
})();
const SEAL = (() => {
  const S = 220, g = makeCanvas(S, S), x = g.getContext('2d'), r = rng(5);
  x.translate(S / 2, S / 2);
  x.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2, rr = 92 + (r() - 0.5) * 9 + Math.sin(a * 5) * 3; i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  x.closePath();
  const gr = x.createRadialGradient(-30, -35, 10, 0, 0, 100); gr.addColorStop(0, '#d23a52'); gr.addColorStop(0.6, C.wax); gr.addColorStop(1, '#6e0c1e');
  x.fillStyle = gr; x.fill();
  x.strokeStyle = 'rgba(70,5,18,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 66, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(255,170,180,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(-1.5, -1.5, 66, Math.PI * 0.9, Math.PI * 1.6); x.stroke();
  // embossed heart
  x.save(); x.translate(2, 4); x.scale(38, 38); x.fillStyle = 'rgba(255,190,200,.35)'; x.fill(HEART); x.restore();
  x.save(); x.scale(38, 38); x.fillStyle = '#7d0f22'; x.fill(HEART); x.restore();
  return g;
})();

// ---------- letter geometry & handwriting schedule ----------
const LW = 860, LH = 1350, LS = 0.95;               // letter size and its screen scale when open
const MARGIN = -LW / 2 + 105, LINE0 = -LH / 2 + 300, LSTEP = 112;
const T_WRITE = 4.75, SPEED = 520;                  // px per second of handwriting
const LINES = (() => {
  // parse ~~struck~~ words, pick a font size that fits the widest line
  const parsed = CONFIG.lineas.map(l => { const m = l.match(/^(.*?)~~(.*?)~~(.*)$/); return m ? { text: m[1] + m[2] + m[3], strike: [m[1].length, m[1].length + m[2].length] } : { text: l }; });
  let size = 78; setFont(size, 'hand', 500);
  const widest = Math.max(...parsed.map(p => ctx.measureText(p.text).width)); if (widest > LW - 210) size = Math.floor(size * (LW - 210) / widest);
  return { size, parsed };
})();
const SCHED = (() => {
  setFont(LINES.size, 'hand', 500);
  let t = T_WRITE; const segs = [], lines = [];
  LINES.parsed.forEach((p, li) => {
    const y = LINE0 + li * LSTEP, wTot = ctx.measureText(p.text).width;
    const L = { y, text: p.text, keys: [] };          // keys: [time, revealedX]
    const write = (x0, x1) => { const d = (x1 - x0) / SPEED; segs.push({ kind: 'write', t0: t, t1: t + d, x0: MARGIN + x0, x1: MARGIN + x1, y }); L.keys.push([t, x0], [t + d, x1]); t += d; };
    if (p.strike) {
      const a = ctx.measureText(p.text.slice(0, p.strike[0])).width, b = ctx.measureText(p.text.slice(0, p.strike[1])).width;
      write(0, b); t += 0.28;
      segs.push({ kind: 'scribble', t0: t, t1: t + 0.6, x0: MARGIN + a + 6, x1: MARGIN + b - 2, y }); L.strike = { t0: t, t1: t + 0.6, x0: MARGIN + a + 6, x1: MARGIN + b - 2 }; t += 0.6 + 0.25;
      write(b, wTot);
    } else write(0, wTot);
    lines.push(L);
    if (li === LINES.parsed.length - 1) { t += 0.15; segs.push({ kind: 'heart', t0: t, t1: t + 0.75, cx: MARGIN + wTot + 62, y: y - LINES.size * 0.3 }); L.heart = { t0: t, t1: t + 0.75, cx: MARGIN + wTot + 62, cy: y - LINES.size * 0.3 }; t += 0.75; }
    t += li === 0 ? 0.35 : 0.24;                    // pen lifts to the next line
  });
  return { segs, lines, end: t };
})();
const WEND = SCHED.end;
const FOLD_B = [WEND + 1.0, WEND + 1.5], FOLD_T = [WEND + 1.45, WEND + 1.95], STAMP = WEND + 2.55;
const DUR = STAMP + 3.6;

function scribblePt(s, sc) { return [lerp(sc.x0, sc.x1, s) + 9 * Math.cos(s * Math.PI * 2 * 5.5), -LINES.size * 0.26 + 14 * Math.sin(s * Math.PI * 2 * 5.5)]; }
function heartStrokePt(s, h) { const [x, y] = heartPt((s + 0.0) % 1); return [h.cx + x * 34, h.cy + y * 34]; }

// pen tip in letter coordinates (+ lift amount 0..1)
function penPos(t) {
  const S = SCHED.segs;
  const at = (sg, k) => sg.kind === 'write' ? [lerp(sg.x0, sg.x1, k), sg.y - LINES.size * 0.22] : sg.kind === 'scribble' ? (([x, y]) => [x, sg.y + y])(scribblePt(k, sg)) : heartStrokePt(k, sg);
  const off = [LW * 0.75, LH * 0.15];
  if (t < S[0].t0) { const k = ease(seg(t, S[0].t0 - 0.7, S[0].t0)), p = at(S[0], 0); return [lerp(off[0], p[0], k), lerp(off[1], p[1], k), 1 - k * 0.999]; }
  for (let i = 0; i < S.length; i++) {
    const sg = S[i];
    if (t <= sg.t1) {
      if (t >= sg.t0) { const k = (t - sg.t0) / (sg.t1 - sg.t0), [x, y] = at(sg, k); const wob = sg.kind === 'write' ? Math.sin(t * Math.PI * 2 * 7.5) * LINES.size * 0.2 : 0; return [x + Math.sin(t * 40) * 1.5, y + wob, 0]; }
      const pv = S[i - 1], a = at(pv, 1), b = at(sg, 0), k = ease(seg(t, pv.t1, sg.t0));
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.sin(Math.PI * k)];
    }
  }
  const last = S[S.length - 1], a = at(last, 1), k = ease(seg(t, last.t1 + 0.1, last.t1 + 0.9));
  return [lerp(a[0], off[0] + 200, k), lerp(a[1], off[1] - 200, k), Math.min(1, k * 3)];
}

// ---------- drawing helpers ----------
function paperRect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function letterContent(t) {
  // letterhead
  setFont(22, 'sans', 500, false, 6); ctx.fillStyle = 'rgba(38,48,92,.55)';
  const d = CONFIG.fecha.toUpperCase(); ctx.fillText(d, LW / 2 - 100 - textW(d, 6), -LH / 2 + 150);
  heart(-LW / 2 + 116, -LH / 2 + 142, 30, C.red, 0.9);
  ctx.strokeStyle = 'rgba(38,48,92,.12)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-LW / 2 + 100, -LH / 2 + 190); ctx.lineTo(LW / 2 - 100, -LH / 2 + 190); ctx.stroke();
  // ruled lines
  ctx.strokeStyle = 'rgba(150,120,100,.16)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { const y = LINE0 + i * LSTEP + 18; ctx.beginPath(); ctx.moveTo(-LW / 2 + 90, y); ctx.lineTo(LW / 2 - 90, y); ctx.stroke(); }
  // handwriting
  setFont(LINES.size, 'hand', 500); ctx.fillStyle = C.ink;
  for (const L of SCHED.lines) {
    if (!L.keys.length || t < L.keys[0][0]) continue;
    let rx = 0; for (let i = 0; i < L.keys.length; i += 2) { const [a, xa] = L.keys[i], [b, xb] = L.keys[i + 1]; if (t >= a) rx = lerp(xa, xb, seg(t, a, b)); }
    const top = L.y - LINES.size * 1.05, bot = L.y + LINES.size * 0.45, hx = MARGIN + rx, sl = 16;
    ctx.save(); ctx.beginPath(); ctx.moveTo(MARGIN - 40, top); ctx.lineTo(hx + sl, top); ctx.lineTo(hx - sl, bot); ctx.lineTo(MARGIN - 40, bot); ctx.closePath(); ctx.clip();
    ctx.fillText(L.text, MARGIN, L.y); ctx.restore();
    if (L.strike && t > L.strike.t0) {
      const p = seg(t, L.strike.t0, L.strike.t1), n = Math.ceil(p * 160);
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const [x, y] = scribblePt(Math.min(p, i / 160), L.strike); i ? ctx.lineTo(x, L.y + y) : ctx.moveTo(x, L.y + y); }
      ctx.stroke(); ctx.restore();
    }
    if (L.heart && t > L.heart.t0) {
      const p = seg(t, L.heart.t0, L.heart.t1), n = Math.ceil(p * 200);
      ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const [x, y] = heartStrokePt(Math.min(p, i / 200), L.heart); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
  }
  if (CONFIG.firma) wipeText('— ' + CONFIG.firma, LW / 2 - 120, LINE0 + 7.4 * LSTEP, t, WEND - 0.1, 0.8, { size: 90, color: C.ink, align: 'right' });
}
// a fold panel rotating about a horizontal hinge: dir -1 = panel above hinge, +1 = below. f 0 = open, 1 = folded over
function panel(t, y0, y1, hinge, f, dir) {
  const c = Math.cos(Math.PI * f), front = c > 0;
  ctx.save();
  ctx.translate(0, hinge); ctx.scale(1 + 0.05 * Math.sin(Math.PI * f), c || 0.0001); ctx.translate(0, -hinge);
  ctx.beginPath(); ctx.rect(-LW / 2, y0, LW, y1 - y0); ctx.clip();
  paperRect(-LW / 2, y0, LW, y1 - y0, front ? C.paper : C.paperBack);
  if (front) letterContent(t);
  // fold shading
  const sh = Math.sin(Math.PI * f) * 0.22 + (front ? 0 : 0.04);
  if (sh > 0) { ctx.fillStyle = `rgba(90,50,40,${sh})`; ctx.fillRect(-LW / 2, y0, LW, y1 - y0); }
  ctx.restore();
}
// letter at its own origin (middle panel centre); fT/fB fold amounts
function letter(t, fT, fB, shadow = 1) {
  const third = LH / 3, hT = -third / 2, hB = third / 2;
  // shadow follows the visible outline
  const top = hT - third * Math.max(0, Math.cos(Math.PI * fT)), bot = hB + third * Math.max(0, Math.cos(Math.PI * fB));
  ctx.save(); ctx.shadowColor = `rgba(90,30,30,${0.28 * shadow})`; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
  ctx.fillStyle = C.paper; ctx.fillRect(-LW / 2, top, LW, bot - top); ctx.restore();
  panel(t, hT, hB, 0, 0, 0);
  panel(t, hB, hB + third, hB, fB, 1);
  panel(t, hT - third, hT, hT, fT, -1);
}

// ---------- envelope ----------
const EW = 900, EH = 600;
function envelopeBack(flapD) {
  ctx.save(); ctx.shadowColor = 'rgba(90,30,30,.3)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  ctx.fillStyle = C.envDark; ctx.fillRect(-EW / 2, -EH / 2, EW, EH); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(-EW / 2 + 14, -EH / 2 + 14, EW - 28, EH - 28); ctx.clip(); ctx.globalAlpha = 0.85; ctx.drawImage(LINER, -EW / 2, -EH / 2); ctx.restore();
  if (flapD < 0) flap(flapD);
}
function flap(d) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(-EW / 2, -EH / 2); ctx.lineTo(EW / 2, -EH / 2); ctx.lineTo(0, -EH / 2 + d); ctx.closePath();
  if (d > 0) { ctx.shadowColor = 'rgba(90,40,30,.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; ctx.fillStyle = C.env; ctx.fill(); }
  else { ctx.fillStyle = C.envDark; ctx.fill(); ctx.clip(); ctx.globalAlpha = 0.9; ctx.drawImage(LINER, -EW / 2, -EH / 2 + d, EW, -d); }
  ctx.restore();
}
function envelopeFront(flapD) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(-EW / 2, -EH / 2); ctx.lineTo(0, EH * 0.08); ctx.lineTo(EW / 2, -EH / 2); ctx.lineTo(EW / 2, EH / 2); ctx.lineTo(-EW / 2, EH / 2); ctx.closePath();
  ctx.fillStyle = C.env; ctx.fill();
  ctx.strokeStyle = 'rgba(150,110,80,.18)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-EW / 2, EH / 2); ctx.lineTo(-40, -EH * 0.02); ctx.moveTo(EW / 2, EH / 2); ctx.lineTo(40, -EH * 0.02); ctx.stroke();
  ctx.restore();
  if (flapD >= 0) flap(flapD);
}

// ---------- pen ----------
function pen(x, y, lift, rot) {
  ctx.save(); ctx.translate(x, y);
  const L = 560, w = 34;
  // shadow
  ctx.save(); ctx.translate(30 + lift * 40, 26 + lift * 30); ctx.rotate(rot); ctx.globalAlpha = 0.16 - lift * 0.06; ctx.fillStyle = '#4a1a1a';
  ctx.beginPath(); ctx.roundRect(-w / 2, -L, w, L - 40, 16); ctx.fill(); ctx.restore();
  ctx.translate(0, -lift * 26); ctx.rotate(rot);
  // nib
  ctx.fillStyle = '#d9b46a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -46); ctx.lineTo(12, -46); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -34); ctx.stroke();
  // grip & body
  ctx.fillStyle = '#121933'; ctx.beginPath(); ctx.roundRect(-13, -96, 26, 54, 8); ctx.fill();
  ctx.fillStyle = '#d9b46a'; ctx.fillRect(-w / 2, -104, w, 9);
  const gr = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#2a3566'); gr.addColorStop(0.35, '#4b5aa0'); gr.addColorStop(0.55, '#1f2850'); gr.addColorStop(1, '#141b3a');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(-w / 2, -L, w, L - 104, 16); ctx.fill();
  ctx.fillStyle = '#d9b46a'; ctx.fillRect(-w / 2, -L + 120, w, 7);
  ctx.restore();
}

// ---------- timeline ----------
const envY = kf([[0, 2350], [1.3, 1160, expoOut], [3.2, 1160], [3.95, 2900, expoIn]]);
const envR = kf([[0, -0.22], [1.3, -0.04, expoOut], [1.7, 0, ease]]);
const flapD = t => { const k = ease(seg(t, 1.75, 2.45)); return k < 0.5 ? lerp(EH * 0.62, 0, k * 2) : lerp(0, -EH * 0.48, k * 2 - 1); };
const zoom = kf([[4.3, 1], [5.0, 1.24, expoInOut], [WEND, 1.24], [WEND + 0.9, 1, expoInOut], [STAMP + 0.4, 1.0], [DUR, 1.04]]);

function camFocus(t) {
  const first = LINE0 * LS + 960;
  let f = first + 140;
  SCHED.lines.forEach((L, i) => { if (i === 0) return; const ts = L.keys[0][0]; f += LSTEP * LS * expoInOut(seg(t, ts - 0.45, ts + 0.15)); });
  const zk = (zoom(t) - 1) / 0.24;
  return lerp(960, f, clamp(zk));
}

function draw(t) {
  ctx.drawImage(BG, 0, 0);
  // camera
  const shake = Math.exp(-Math.max(0, t - STAMP) * 9) * (t > STAMP ? 1 : 0);
  const z = zoom(t), fy = camFocus(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(540 + nx(t * 0.5) * 4 + Math.sin(t * 90) * 10 * shake, 960 + ny(t * 0.5) * 4 + Math.cos(t * 77) * 10 * shake);
  ctx.scale(z, z); ctx.translate(-540, -fy);

  // ----- intro label above the envelope
  if (t < 3.6) {
    label(scramble('PARA', t, 0.55, 0.5, 3), 540, 330, { size: 26, color: C.wine, track: 14, align: 'center', alpha: 1 - seg(t, 2.0, 2.4) });
    maskText(CONFIG.para, 540, 460, t, 0.7, { size: 120, weight: 300, italic: true, color: C.wine, by: 'char', outAt: 2.05, outDur: 0.5 });
  }

  // ----- letter transform
  const out = ease(seg(t, 2.4, 3.3)), toC = expoInOut(seg(t, 3.15, 3.95));
  const fT = 1 - ease(seg(t, 3.7, 4.2)), fB = 1 - ease(seg(t, 3.95, 4.45));
  const refoldB = ease(seg(t, FOLD_B[0], FOLD_B[1])), refoldT = ease(seg(t, FOLD_T[0], FOLD_T[1]));
  const ey = envY(t), er = envR(t);
  // letter position: inside envelope → above it → centre of screen
  const inEnv = [540, ey + 40], above = [540, ey - EH / 2 - 210];
  let lx = lerp(inEnv[0], above[0], out), ly = lerp(inEnv[1], above[1], out), ls = 0.82, lr = er;
  lx = lerp(lx, 540, toC); ly = lerp(ly, 960, toC); ls = lerp(ls, LS, toC); lr = lerp(lr, 0, toC);
  // after folding: tilt and settle above the final text
  const fin = expoInOut(seg(t, FOLD_T[1] - 0.1, FOLD_T[1] + 0.7));
  ly = lerp(ly, 900, fin); lr = lerp(lr, -0.05, fin); ls = lerp(ls, 1.0, fin);
  const stampSquash = t > STAMP ? 1 - 0.025 * Math.exp(-(t - STAMP) * 10) : 1;
  const foldT = Math.max(fT, refoldT), foldB = Math.max(fB, refoldB);

  const drawLetter = () => { ctx.save(); ctx.translate(lx, ly); ctx.rotate(lr); ctx.scale(ls * stampSquash, ls / stampSquash); letter(t, foldT, foldB); ctx.restore(); };

  if (t < 3.95) {
    // envelope with the letter between its back and its front pocket
    ctx.save(); ctx.translate(540, ey); ctx.rotate(er);
    const d = flapD(t); envelopeBack(d);
    ctx.restore();
    drawLetter();
    ctx.save(); ctx.translate(540, ey); ctx.rotate(er); envelopeFront(d);
    // wax seal on the flap tip, cracking in two
    const sy = -EH / 2 + EH * 0.62 - 10, crack = seg(t, 1.45, 2.3);
    if (crack <= 0) { const pulse = 1 + 0.04 * Math.sin(Math.PI * seg(t, 1.2, 1.45)); ctx.drawImage(SEAL, -110 * pulse, sy - 110 * pulse, 220 * pulse, 220 * pulse); }
    else if (crack < 1) for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 40 * expoOut(crack) * 2, sy + 900 * crack * crack); ctx.rotate(side * 0.9 * crack); ctx.globalAlpha = 1 - seg(crack, 0.6, 1);
      ctx.beginPath(); ctx.rect(side < 0 ? -120 : 2, -120, 118, 240); ctx.clip(); ctx.drawImage(SEAL, -110, -110); ctx.restore();
    }
    ctx.restore();
  } else drawLetter();

  // ----- pen (letter space → screen)
  if (t > T_WRITE - 0.8 && t < WEND + 1.0) {
    const [px, py, lift] = penPos(t);
    const sx = 540 + px * LS, sy = 960 + py * LS;
    pen(sx, sy, lift, 0.62 + 0.04 * Math.sin(t * 2.3));
  }

  // ----- the seal stamps onto the folded letter
  if (t > STAMP - 0.45) {
    const k = seg(t, STAMP - 0.45, STAMP), s = lerp(2.8, 1, expoIn(k)) * (t > STAMP ? 1 - 0.06 * Math.exp(-(t - STAMP) * 12) * Math.cos((t - STAMP) * 40) : 1);
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(lr);
    if (t > STAMP) { // wax squeeze ring
      const r = expoOut(seg(t, STAMP, STAMP + 0.5)); ctx.strokeStyle = `rgba(163,22,46,${0.35 * (1 - r)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 110 + r * 140, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = clamp(k * 3);
    ctx.shadowColor = 'rgba(60,10,20,.35)'; ctx.shadowBlur = 30 * s; ctx.shadowOffsetY = 18 * s;
    ctx.drawImage(SEAL, -110 * s, -110 * s, 220 * s, 220 * s);
    ctx.restore();
  }

  // ----- final text
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (t > STAMP) {
    maskText('Feliz primer mes', 540, 1500, t, STAMP + 0.35, { size: 116, weight: 300, italic: true, color: C.wine, by: 'word', stagger: 0.09 });
    drawLine(470, 1570, 610, 1570, expoOut(seg(t, STAMP + 0.8, STAMP + 1.5)), { from: 'center', color: C.red, width: 2 });
    label(scramble('CON TODO MI AMOR', t, STAMP + 0.9, 0.8, 7), 540, 1635, { size: 24, color: C.wine, track: 12, align: 'center', alpha: 0.85 });
  }
  post(t, { vignette: VIG, grain: 0.06, fade: seg(t, DUR - 0.6, DUR), fadeColor: '#2a0b12' });
}

// ---------- sound ----------
async function buildAudio(ac) {
  const M = await mixer(ac, { seed: 21, wet: 0.5 });
  const BEAT = 0.75, BAR = 3;
  // F | Am | Bb | F | Dm | Bb | C | F ...
  const prog = [[41, [65, 69, 72]], [45, [64, 69, 72]], [46, [65, 70, 74]], [41, [65, 69, 72]], [38, [65, 69, 74]], [46, [65, 70, 74]], [48, [64, 67, 72]], [41, [65, 69, 72]]];
  const nb = Math.ceil(DUR / BAR);
  for (let b = 0; b < nb; b++) {
    const [root, ch] = prog[b % prog.length], t0 = b * BAR;
    const last = t0 > STAMP - 0.6 && t0 < STAMP + BAR;
    M.pad(ch.map(n => n - 12), t0, BAR, 0.22, M.padB, 900);
    M.piano(root, t0, 0.12, 2.8); M.piano(root + 12, t0 + 2 * BEAT, 0.05, 1.5);
    ch.forEach((n, i) => M.piano(n, t0 + (i + 1) * BEAT * (i === 2 ? 0.666 : 1) + (i === 2 ? BEAT * 0.67 : 0), 0.045, 1.8));
  }
  // melody fragments
  [[1.5, 77], [2.25, 76], [3.0, 74], [4.5, 72], [6.0, 77], [6.75, 79], [7.5, 81], [9.0, 79], [10.5, 77], [12.0, 74], [13.5, 76], [15, 77]].forEach(([t, m]) => { if (t < DUR - 1) M.piano(m + 12, t, 0.06, 2.4); });
  // paper & envelope foley (filtered noise)
  M.noise(0.05, 1.1, 1500, 700, 0.06, 'hump', M.fx, 'bandpass', 0.7);
  M.sample('click', 1.47, 0.35, M.fx, 0.7); M.sample('pop', 1.5, 0.25, M.fx, 0.6);
  for (let i = 0; i < 6; i++) M.noise(1.8 + i * 0.09, 0.08, 3000 + i * 300, 2200, 0.05, 'hit', M.fx, 'bandpass', 1.5);
  M.noise(2.4, 0.95, 2500, 1200, 0.07, 'hump', M.fx, 'bandpass', 0.8);
  M.sample('woosh', 3.25, 0.25, M.fx, 1.2);
  [3.75, 4.0].forEach(t => { for (let i = 0; i < 5; i++) M.noise(t + i * 0.07, 0.07, 3500, 2500, 0.05, 'hit', M.fx, 'bandpass', 1.4); });
  // pen scratch: amplitude follows the stroke rhythm
  for (const sg of SCHED.segs) {
    const dur = sg.t1 - sg.t0, n = Math.max(1, Math.round(dur * (sg.kind === 'scribble' ? 11 : 7.5)));
    for (let i = 0; i < n; i++) M.noise(sg.t0 + (i / n) * dur, dur / n * 0.9, 5200, 3800, sg.kind === 'scribble' ? 0.05 : 0.026, 'hump', M.fx, 'bandpass', 2.2);
  }
  // fold, stamp
  [FOLD_B[0], FOLD_T[0]].forEach(t => { M.noise(t, 0.45, 2600, 1100, 0.06, 'hump', M.fx, 'bandpass', 0.9); });
  M.noise(STAMP - 0.45, 0.45, 300, 2000, 0.03, 'swell');
  M.sample('soft_impact', STAMP, 0.7); M.boom(STAMP, 0.35); M.sample('triangle', STAMP + 0.05, 0.3);
  [65, 69, 72, 77].forEach((m, i) => M.bell(m + 12, STAMP + 0.35 + i * 0.12, 0.05, 3));
}

boot(DUR, draw, buildAudio, ['500 80px Caveat', '300 100px Fraunces', 'italic 300 100px Fraunces', '500 30px Geist']);
