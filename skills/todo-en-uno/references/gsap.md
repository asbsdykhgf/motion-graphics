# GSAP (repo `GSAP`)

El repo es la librería compilada (v3.15), no una skill. Todo GSAP es gratis, incluidos los plugins que antes eran de pago (SplitText, MorphSVG, DrawSVG, ScrollSmoother, Inertia…).

## Dónde está cada cosa

| Necesito | Ruta en el repo |
|---|---|
| Núcleo para `<script>` | `dist/gsap.min.js` |
| Un plugin para `<script>` | `dist/<Plugin>.min.js` (p. ej. `dist/SplitText.min.js`) |
| Módulos ES | `esm/` (`esm/index.js`, `esm/all.js`) |
| Tipos (consultar la API sin internet) | `types/*.d.ts` |
| Código fuente | `src/` |

`ls "$(scripts/repos.sh path GSAP)/dist" | grep -v map` lista los plugins disponibles.

Desde CDN (lo que usan las composiciones de HyperFrames): `https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js`. Para trabajar sin red, copia el `.min.js` del repo junto a la composición y enlázalo con ruta relativa.

## Reglas al usarlo para vídeo

GSAP por defecto anima en tiempo real. En un vídeo cada fotograma se calcula por tiempo, así que:

- **HyperFrames:** una sola línea de tiempo raíz, en pausa, registrada en `window.__timelines`. Las sub-líneas que añadas a la raíz no van en pausa. El renderizador hace `seek` por fotograma. Nada de `Date.now()`, `Math.random()` sin semilla ni `repeat: -1` que dependa del reloj. El detalle está en la skill `hyperframes` (léela antes).
- **Remotion:** crea la línea con `paused: true` y en cada render haz `tl.seek(frame / fps)` con `useCurrentFrame()` y `useVideoConfig()`. No uses `gsap.ticker` ni `ScrollTrigger`.
- **Web normal (páginas de `hallmark`):** respeta `prefers-reduced-motion` con `gsap.matchMedia()`.

## Plugins más útiles en vídeo

`SplitText` (texto letra a letra / palabra a palabra), `MorphSVGPlugin` (una forma que se transforma en otra), `DrawSVGPlugin` (trazos que se dibujan), `MotionPathPlugin` (seguir una curva), `CustomEase` (curvas propias), `Flip` (transiciones de layout). Regístralos siempre: `gsap.registerPlugin(SplitText, MorphSVGPlugin)`.
