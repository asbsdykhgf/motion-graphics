# Kokoro (repo `kokoro`): voz en off local y gratis

El repo es la librería de inferencia de Kokoro-82M, un TTS abierto (licencia Apache) que corre en CPU. No es una skill; úsalo cuando haga falta locución sin pagar ni subir nada a la nube.

## Instalar (una vez)

```bash
pip install "kokoro>=0.9.4" soundfile        # o: pip install -e "$(scripts/repos.sh path kokoro)"
apt-get install -y espeak-ng                 # macOS: brew install espeak-ng
```

La primera ejecución descarga el modelo y las voces de Hugging Face (`hexgrad/Kokoro-82M`).

## Generar audio desde la terminal

```bash
python -m kokoro -l e --voice ef_dora -i guion.txt -o voz.wav     # español
python -m kokoro -l a --voice af_heart --text "Hello there" -o voz.wav
```

Opciones: `-l` idioma, `--voice`, `-s/--speed`, `-i` archivo de texto, `-o` WAV (24 kHz, mono). Cada salto de línea del guion separa un bloque. En español (y en todo idioma que no sea inglés) pon una o dos frases por línea: un párrafo largo sin saltos puede salir cortado.

| `-l` | Idioma | Voces de ejemplo |
|---|---|---|
| `e` | Español | `ef_dora`, `em_alex`, `em_santa` |
| `a` | Inglés EE. UU. | `af_heart`, `af_bella`, `am_michael` |
| `b` | Inglés RU | `bf_emma`, `bm_george` |
| `f` / `i` / `p` | Francés / italiano / portugués BR | `ff_siwis` / `if_sara` / `pf_dora` |
| `j` / `z` / `h` | Japonés / chino / hindi | requieren `pip install misaki[ja]` o `misaki[zh]` |

La primera letra de la voz es el idioma y la segunda el género (f/m). Las voces se pueden mezclar: `voice="af_bella,af_heart"`.

## Tiempos por palabra (para subtítulos)

Solo en inglés (`a`, `b`) el pipeline devuelve cuándo empieza y acaba cada palabra:

```python
from kokoro import KPipeline
import soundfile as sf, numpy as np, json
p = KPipeline(lang_code="a")
audio, words, t0 = [], [], 0.0
for r in p(open("guion.txt").read(), voice="af_heart"):
    for tk in r.tokens or []:
        if tk.start_ts is not None:
            words.append({"text": tk.text, "start": t0 + tk.start_ts, "end": t0 + tk.end_ts})
    a = r.audio.numpy(); audio.append(a); t0 += len(a) / 24000
sf.write("voz.wav", np.concatenate(audio), 24000)
json.dump(words, open("palabras.json", "w"), indent=1)
```

Para otros idiomas, transcribe el WAV resultante (HyperFrames: `npx hyperframes transcribe`, ver skill `media-use`; Remotion: skill `remotion-captions`).

## Atajo dentro de HyperFrames

`npx hyperframes tts` ya usa Kokoro por debajo (necesita `pip install kokoro-onnx soundfile`). Si el proyecto es de HyperFrames, prefiere ese comando; usa el repo directamente para Remotion, para otros proyectos o para voces mezcladas.
