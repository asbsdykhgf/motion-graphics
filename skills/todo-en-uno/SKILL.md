---
name: todo-en-uno
description: Una sola entrada para los 8 repositorios (HyperFrames, Remotion, GSAP, motion-graphics, Kokoro, Hallmark, Humanizer, Superpowers). Úsala para cualquier vídeo, motion graphics, animación, voz en off, efectos de sonido, subtítulos, B-roll, página web o landing, presentación, texto que suena a IA o trabajo de software (planificar, TDD, depurar, revisar). Elige la sub-skill adecuada y la lee bajo demanda, así no hace falta instalar las otras 45. Make a video, animate, render, TTS voiceover, sound design, website design, humanize text, plan/debug code.
---

# Todo en uno

Esta skill sustituye a las 45 sub-skills de los 8 repositorios. No repite su contenido: decide cuál toca, abre su `SKILL.md` y la sigue al pie de la letra.

## Cómo usarla

1. **Encuentra los repos.** Desde la carpeta de esta skill:
   ```bash
   scripts/repos.sh status     # dónde están y si falta alguno
   scripts/repos.sh sync       # clona los que falten (en ~/.todo-en-uno/repos) o actualiza
   ```
   Si el usuario los tiene en otra carpeta, `export TODO_EN_UNO_REPOS=/esa/carpeta`.
2. **Elige la sub-skill** con la tabla de abajo. Si duda entre dos, `scripts/repos.sh list` muestra todas con su descripción.
3. **Ábrela y síguela.** `scripts/repos.sh skill <nombre>` da la ruta de su `SKILL.md`; léelo entero. Las rutas relativas que use (`references/…`, `scripts/…`) son relativas a **su** carpeta, no a esta.
4. **Encadena.** Un encargo grande suele pasar por varias sub-skills; los recorridos típicos están en `references/flujos.md`. Lee la siguiente sub-skill solo cuando llegues a ese paso.

GSAP y Kokoro no traen skill propia; sus notas están en `references/gsap.md` y `references/kokoro.md`.

## Qué sub-skill usar

### Vídeo y motion graphics

| Si el usuario quiere… | Sub-skill (repo) |
|---|---|
| Cualquier vídeo hecho con HTML, sin motor elegido | `hyperframes` (hyperframes) — **leer primero** |
| Comandos: crear proyecto, revisar, previsualizar, renderizar | `hyperframes-cli` (hyperframes) |
| Una pieza con nombre: transición, glitch, gráfico, mapa, título cinético, 3D | `hyperframes-registry` (hyperframes) — antes de construirla a mano |
| Música, imágenes, logos, voz con HeyGen, transcripción, recortes, etalonaje | `media-use` (hyperframes) |
| Rehacer un vídeo existente como proyecto editable | `reverse-any-video` (hyperframes) |
| Un episodio en uno de los cinco estilos probados | `style-sampling` (hyperframes) |
| Usar un diseño o marca de Figma en el vídeo | `figma` (hyperframes) |
| Pasar Remotion, Lottie, Motion Canvas… a HyperFrames | `remotion-to-hyperframes` (hyperframes) |
| Trabajar en Remotion (React) o el proyecto ya es de Remotion | `remotion-best-practices` (remotion), que enruta a `remotion-create`, `-markup`, `-captions`, `-render`, `-studio`, `-maps`, `-multimedia`, etc. |
| Demo de producto limpia, 45–90 s | `explainer-default` (motion-graphics) |
| Historia en un solo plano, 10–30 s | `explainer-engaging` (motion-graphics) |
| Promo o teaser enérgico, 12–20 s | `explainer-high-energy` (motion-graphics) |
| B-roll animado sobre un vídeo de alguien hablando | `motion-broll` (motion-graphics) |
| Separar persona u objeto del fondo de un vídeo | `object-separation` (motion-graphics) |
| Efectos de sonido, música y mezcla | `sound-effects` (motion-graphics) |
| Animar con GSAP (timelines, SplitText, MorphSVG…) | `references/gsap.md` |
| Voz en off local y gratuita | `references/kokoro.md` |

**Qué motor elegir.** Si el usuario no dice nada, HyperFrames. Remotion solo si lo pide, si el proyecto ya lo usa o si necesita React. Si el encargo encaja con una receta de motion-graphics (demo, promo, plano único, B-roll), usa la receta: ya trae estilo, duración y sonido decididos.

### Diseño web y textos

| Si el usuario quiere… | Sub-skill (repo) |
|---|---|
| Diseñar una página o web nueva, o rediseñar/auditar una con `/hallmark` | `hallmark` (hallmark) |
| Que un texto no suene a IA: guion, rótulos, copy, post, documentación | `humanizer` (humanizer) |

Hallmark solo se aplica a diseños existentes si el usuario lo nombra. Humanizer se pasa también, sin que lo pidan, a todo texto que vaya a leer o escuchar el público final (guion de locución, titulares, textos de la web).

### Método de trabajo (superpowers)

| Momento | Sub-skill |
|---|---|
| Antes de crear algo nuevo y el encargo es vago | `brainstorming` |
| Hay requisitos y la tarea tiene varios pasos | `writing-plans` |
| Ejecutar un plan | `subagent-driven-development` (con subagentes) o `executing-plans` (sin ellos) |
| Varias tareas independientes a la vez | `dispatching-parallel-agents` |
| Aislar el trabajo en otra rama/carpeta | `using-git-worktrees` |
| Escribir código o arreglar un bug | `test-driven-development` |
| Algo falla y no se sabe por qué | `systematic-debugging` |
| Pedir o recibir una revisión de código | `requesting-code-review` / `receiving-code-review` |
| Antes de decir "listo" | `verification-before-completion` — siempre, también en vídeos: mirar fotogramas reales |
| Integrar la rama al terminar | `finishing-a-development-branch` |
| Crear o editar una skill (incluida esta) | `writing-skills` |
| Una sesión salió mal y se quiere saber por qué | `diagnosing-superpowers` |

`using-superpowers` no hace falta: esta skill ya cumple su papel de índice.

## Reglas

- Lee la sub-skill antes de actuar; esta tabla solo elige, no explica cómo se hace.
- Si una sub-skill dice que leas otra (p. ej. `hyperframes` remite a sus `references/`), hazlo: su orden manda sobre el de aquí.
- Si falta un repo y no hay red para clonarlo, dilo y sigue con lo que haya; no inventes el contenido de una sub-skill que no has leído.
- Las instrucciones del usuario y los `CLAUDE.md`/`AGENTS.md` del proyecto mandan sobre esta skill y sobre las sub-skills.
