# Flujos completos que combinan varios repos

Cada paso nombra la sub-skill que hay que leer (`scripts/repos.sh skill <nombre>`). Salta los pasos que no hagan falta; no hace falta preguntar por cada uno.

## 1. Vídeo explicativo o de producto con voz (el más común)

1. **Idea y guion** — `brainstorming` (superpowers) si el encargo es vago; si ya viene claro, escribe el guion directamente.
2. **Pulir el guion** — `humanizer` sobre el texto de la locución y los rótulos, para que no suene a IA.
3. **Voz** — Kokoro (`references/kokoro.md`), o `media-use` si el proyecto es HyperFrames y hay cuenta de HeyGen.
4. **Escenas** — ¿encaja una receta? `explainer-default` (demo 45–90 s), `explainer-engaging` (plano único 10–30 s), `explainer-high-energy` (promo 12–20 s). Si no, `hyperframes` + `hyperframes-registry` para piezas hechas. Animación con GSAP (`references/gsap.md`).
5. **Sonido** — `sound-effects` (efectos reales, música, mezcla a −16 LUFS medida).
6. **Subtítulos** — referencia de captions dentro de `hyperframes`, o `remotion-captions`.
7. **Render y comprobación** — `hyperframes-cli` (`npx hyperframes lint`, `check`, `render`) o `remotion-render`; después `verification-before-completion` (superpowers): mirar fotogramas reales antes de decir que está terminado.

## 2. B-roll para un vídeo de una persona hablando

`motion-broll` (necesita el vídeo y, si hay, la transcripción) → opcional `object-separation` para recortar a la persona y poner gráficos detrás → `sound-effects`.

## 3. Copiar o portar un vídeo existente

- Un archivo de vídeo que hay que rehacer editable → `reverse-any-video`.
- "Un episodio al estilo de…" uno de los cinco estilos → `style-sampling`.
- Código de Remotion / Lottie / Motion Canvas que pasar a HyperFrames → `remotion-to-hyperframes`.

## 4. Página web o landing

`hallmark` (diseño, temas, revisión en navegador) → textos con `humanizer` → animaciones de scroll o entrada con GSAP (`ScrollTrigger`, respetando `prefers-reduced-motion`) → `verification-before-completion`.

## 5. Presentación

`slideshow` (HyperFrames) para un deck navegable con notas; `humanizer` para el texto de las diapositivas.

## 6. Trabajo de software (cualquier repo)

`brainstorming` → `writing-plans` → `using-git-worktrees` → `test-driven-development` mientras se implementa (`subagent-driven-development` o `executing-plans`) → `systematic-debugging` si algo falla → `requesting-code-review` → `verification-before-completion` → `finishing-a-development-branch`.
