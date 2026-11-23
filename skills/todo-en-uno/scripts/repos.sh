#!/usr/bin/env bash
# todo-en-uno: localiza, descarga y lista las skills de los 8 repositorios.
#
#   repos.sh root                 carpeta donde viven los 8 repos
#   repos.sh path <repo>          ruta de un repo (p. ej. hyperframes)
#   repos.sh skill <nombre>       ruta del SKILL.md de una sub-skill (p. ej. humanizer, brainstorming)
#   repos.sh list                 todas las sub-skills con su descripción
#   repos.sh status               qué repos están presentes y en qué commit
#   repos.sh sync                 clona los que falten y actualiza los presentes
#
# Variables opcionales:
#   TODO_EN_UNO_REPOS   carpeta con los repos (gana sobre la detección automática)
#   TODO_EN_UNO_OWNER   dueño en GitHub de donde clonar (por defecto asbsdykhgf)
set -euo pipefail

REPOS=(hyperframes remotion GSAP motion-graphics kokoro hallmark humanizer superpowers)
OWNER="${TODO_EN_UNO_OWNER:-asbsdykhgf}"
FALLBACK="${HOME}/.todo-en-uno/repos"

# Dónde buscar los SKILL.md dentro de cada repo.
skill_dirs() {
  case "$1" in
    hyperframes)     echo "skills" ;;
    remotion)        echo "packages/skills/skills" ;;
    motion-graphics) echo "skills" ;;
    hallmark)        echo "skills" ;;
    superpowers)     echo "skills" ;;
    humanizer)       echo "." ;;
    *)               echo "" ;;   # GSAP y kokoro no traen skill: ver references/
  esac
}

# Carpetas mínimas para clonar en modo disperso (repos grandes).
sparse_dirs() {
  case "$1" in
    remotion)    echo "packages/skills" ;;
    hyperframes) echo "skills" ;;
    *)           echo "" ;;
  esac
}

has_repos() {
  local d="$1" n=0 r
  for r in "${REPOS[@]}"; do [ -d "$d/$r" ] && n=$((n + 1)); done
  [ "$n" -ge 2 ]
}

find_root() {
  if [ -n "${TODO_EN_UNO_REPOS:-}" ]; then echo "$TODO_EN_UNO_REPOS"; return; fi
  local here
  here="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
  # La skill vive en <root>/motion-graphics/skills/todo-en-uno/scripts
  local candidate
  candidate="$(cd "$here/../../../.." 2>/dev/null && pwd || true)"
  if [ -n "$candidate" ] && has_repos "$candidate"; then echo "$candidate"; return; fi
  for candidate in "$PWD" "$PWD/.." "$HOME" "$HOME/repos" "$HOME/src" "$FALLBACK"; do
    if [ -d "$candidate" ] && has_repos "$candidate"; then (cd "$candidate" && pwd); return; fi
  done
  echo "$FALLBACK"
}

repo_dir() {
  local root r
  root="$(find_root)"
  for r in "${REPOS[@]}"; do
    if [ "${r,,}" = "${1,,}" ]; then echo "$root/$r"; return 0; fi
  done
  echo "repo desconocido: $1 (opciones: ${REPOS[*]})" >&2
  return 1
}

each_skill() {
  local root r sub f
  root="$(find_root)"
  for r in "${REPOS[@]}"; do
    sub="$(skill_dirs "$r")"
    [ -z "$sub" ] && continue
    [ -d "$root/$r/$sub" ] || continue
    if [ "$sub" = "." ]; then
      [ -f "$root/$r/SKILL.md" ] && echo "$r|$root/$r/SKILL.md"
    else
      for f in "$root/$r/$sub"/*/SKILL.md; do
        [ -f "$f" ] || continue
        [ "$(basename "$(dirname "$f")")" = "todo-en-uno" ] && continue  # no listarse a sí misma
        echo "$r|$f"
      done
    fi
  done
}

frontmatter() { # $1 = campo, $2 = archivo; une descripciones multilínea (description: |)
  awk -v key="$1" '
    NR==1 && /^---/ {fm=1; next}
    fm && /^---/ {exit}
    fm && $0 ~ "^"key":" {
      v=$0; sub("^"key":[ ]*", "", v)
      if (v=="|" || v==">") {grab=1; v=""; next}
      gsub(/^"|"$/, "", v); print v; exit
    }
    grab && /^[ ]+/ {sub(/^[ ]+/, ""); out = out (out==""?"":" ") $0; next}
    grab {print out; exit}
  ' "$2"
}

cmd="${1:-list}"
case "$cmd" in
  root) find_root ;;
  path) repo_dir "${2:?uso: repos.sh path <repo>}" ;;
  skill)
    want="${2:?uso: repos.sh skill <nombre>}"
    while IFS='|' read -r r f; do
      name="$(frontmatter name "$f")"
      [ -z "$name" ] && name="$(basename "$(dirname "$f")")"
      if [ "$name" = "$want" ] || [ "$(basename "$(dirname "$f")")" = "$want" ]; then echo "$f"; exit 0; fi
    done < <(each_skill)
    echo "no encontré la skill '$want'. Prueba: repos.sh list  (o repos.sh sync si faltan repos)" >&2
    exit 1 ;;
  list)
    while IFS='|' read -r r f; do
      name="$(frontmatter name "$f")"
      desc="$(frontmatter description "$f")"
      printf '%-16s %-34s %s\n' "$r" "${name:-$(basename "$(dirname "$f")")}" "${desc:0:160}"
    done < <(each_skill) ;;
  status)
    root="$(find_root)"; echo "raíz: $root"
    for r in "${REPOS[@]}"; do
      if [ -d "$root/$r/.git" ]; then
        printf '  %-16s ok   %s\n' "$r" "$(git -C "$root/$r" log -1 --format='%h %cs' 2>/dev/null)"
      else
        printf '  %-16s FALTA\n' "$r"
      fi
    done ;;
  sync)
    root="$(find_root)"; mkdir -p "$root"
    for r in "${REPOS[@]}"; do
      d="$root/$r"
      if [ -d "$d/.git" ]; then
        echo "== actualizando $r"
        git -C "$d" pull --ff-only --quiet || echo "   (no se pudo actualizar $r; se deja como está)"
      else
        echo "== clonando $r"
        url="https://github.com/$OWNER/$r.git"
        sp="$(sparse_dirs "$r")"
        if [ -n "$sp" ]; then
          git clone --depth 1 --filter=blob:none --sparse --quiet "$url" "$d" && git -C "$d" sparse-checkout set $sp
        else
          git clone --depth 1 --quiet "$url" "$d"
        fi
      fi
    done
    echo "listo: $root" ;;
  *) sed -n '2,13p' "$0"; exit 1 ;;
esac
