# todo-en-uno

Una sola skill para los 8 repositorios: HyperFrames, Remotion, GSAP, motion-graphics, Kokoro, Hallmark, Humanizer y Superpowers. Instalas esta y ella elige y lee la sub-skill que toca en cada momento, en vez de tener 45 skills instaladas.

## Instalar

Opción A, enlace a esta carpeta (los repos se encuentran solos si están juntos en la misma carpeta):

```bash
mkdir -p ~/.claude/skills
ln -s "$PWD/skills/todo-en-uno" ~/.claude/skills/todo-en-uno
```

Opción B, con el instalador de skills:

```bash
npx skills add asbsdykhgf/motion-graphics --skill todo-en-uno
~/.claude/skills/todo-en-uno/scripts/repos.sh sync   # descarga los 8 repos en ~/.todo-en-uno/repos
```

Después puedes desinstalar las otras skills de estos repos: esta las lee directamente de los repos.

## Comandos

```bash
scripts/repos.sh status          # qué repos hay y dónde
scripts/repos.sh sync            # clona los que falten y actualiza el resto
scripts/repos.sh list            # todas las sub-skills con su descripción
scripts/repos.sh skill humanizer # ruta del SKILL.md de una sub-skill
scripts/repos.sh path GSAP       # ruta de un repo
```

`TODO_EN_UNO_REPOS` fija la carpeta de los repos; `TODO_EN_UNO_OWNER` cambia la cuenta de GitHub de la que se clonan (por defecto `asbsdykhgf`).
