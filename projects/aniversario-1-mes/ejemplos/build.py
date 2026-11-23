"""Build the three self-contained example pages: fonts, sound effects and the shared lib are inlined.
   python3 build.py  ->  1-numeros.html, 2-carta.html, 3-mapa.html"""
import base64, json, pathlib
here = pathlib.Path(__file__).parent
SFX_DIR = here.parent.parent.parent / 'skills' / 'sound-effects' / 'sfx'
b64 = lambda p: base64.b64encode(p.read_bytes()).decode()

def face(family, file, style='normal', weight='400'):
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b64(here / 'fonts' / file)}) format('woff2');font-style:{style};font-weight:{weight};}}"
FONTS = '\n'.join([
    face('Fraunces', 'fraunces-normal.woff2', 'normal', '300 700'),
    face('Fraunces', 'fraunces-italic.woff2', 'italic', '300 700'),
    face('Geist', 'geist.woff2', 'normal', '100 900'),
    face('Caveat', 'caveat.woff2', 'normal', '400 700'),
    face('Vibes', 'greatvibes.woff2'),
])
# CC0 sound effects from skills/sound-effects (credits in that folder's TOP-PICKS.md / LICENSES.md)
SFX = {
    'whoosh': 'kit/whoosh.ogg', 'pop': 'kit/pop.ogg', 'tick': 'kit/tick.ogg', 'click': 'kit/click.ogg',
    'impact': 'kit/impact.ogg', 'riser': 'kit/riser.ogg',
    'swoosh': 'transition/fs-786514-swoosh-v2.ogg', 'woosh': 'transition/fs-683096-woosh.ogg',
    'soft_impact': 'impact/kenney-impact-impactsoft-heavy-000.ogg', 'plop': 'pop/fs-447910-plop.ogg',
    'glass': 'ding/kenney-interface-glass-001.ogg', 'triangle': 'ding/fs-349504-triangle-open-04.ogg',
}
SFX_JS = 'const SFX_B64 = ' + json.dumps({k: b64(SFX_DIR / v) for k, v in SFX.items() if (SFX_DIR / v).exists()}) + ';'
shell = (here / 'src' / 'shell.html').read_text()
lib = (here / 'src' / 'lib.js').read_text()
for name, title in [('1-numeros', 'Nuestro mes en números'), ('2-carta', 'Una carta para ti'), ('3-mapa', 'El mapa de lo nuestro')]:
    scene = here / 'src' / f'{name}.js'
    if not scene.exists(): continue
    out = shell.replace('/*TITLE*/', title).replace('/*FONTS*/', FONTS).replace('/*SFX*/', SFX_JS).replace('/*LIB*/', lib).replace('/*SCENE*/', scene.read_text())
    (here / f'{name}.html').write_text(out)
    print('built', name + '.html', f'{len(out) / 1e6:.1f} MB')
