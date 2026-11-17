# Tres ejemplos para el primer mes

Tres vídeos verticales (1080×1920, 60 fps, con música y efectos de sonido), uno por cada idea:

| | Idea | Estilo | Duración |
|---|---|---|---|
| `1-numeros.mp4` | Nuestro mes en números | Editorial, oscuro: contador de rodillo dentro de un anillo, "720 horas / 43.200 minutos", calendario de 30 días que se convierte en corazón | 16 s |
| `2-carta.mp4` | Carta que se escribe sola | Cálido, papel: el lacre se rompe, la carta se despliega y se escribe a mano con pluma (con una palabra tachada), se vuelve a doblar y se sella | 21 s |
| `3-mapa.mp4` | El mapa de lo nuestro | Mapa ilustrado: la cámara sigue la ruta, cae una chincheta y sale una tarjeta en cada lugar, y al alejarse la ruta forma un corazón | 19 s |

Los textos (nombres de los lugares, fechas, la carta) son **de ejemplo**: cámbialos por los vuestros.

## Ver y retocar

- Abre cualquier `.html` en el navegador: se reproduce con sonido y puedes moverte por la línea de tiempo.
- Los textos están en el bloque `CONFIG` al principio de cada archivo de `src/` (`1-numeros.js`, `2-carta.js`, `3-mapa.js`).
- Después de editar: `python3 build.py` (mete fuentes, sonidos y la librería común en cada HTML).

## Renderizar

```
node ../render.mjs 2-carta.html 2-carta.mp4 60 4 4      # 60 fps, desenfoque de movimiento, 4 procesos
node ../render.mjs 2-carta.html check.png --stills 1,5,10  # hoja de fotogramas para revisar
```

Necesita Playwright (Chromium) y ffmpeg.

## Créditos

- Fuentes: Fraunces, Caveat y Great Vibes (SIL Open Font License, Google Fonts) y Geist (SIL OFL, `fonts/OFL-Geist.txt`).
- Efectos de sonido: CC0, de `skills/sound-effects` (autores en `TOP-PICKS.md` y `LICENSES.md` de esa carpeta).
- La música está sintetizada en el propio HTML (piano, guitarra pulsada, pads).
