"""Inline the fonts into src.html -> aniversario.html (one self-contained file)."""
import base64, pathlib
here = pathlib.Path(__file__).parent
def face(family, file, style='normal', weight='400'):
    b = base64.b64encode((here / 'fonts' / file).read_bytes()).decode()
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b}) format('woff2');font-style:{style};font-weight:{weight};}}"
css = '\n'.join([face('Corm', 'corm.woff2', 'normal', '300 700'), face('Corm', 'corm-italic.woff2', 'italic', '300 700'), face('Vibes', 'greatvibes.woff2')])
src = (here / 'src.html').read_text()
(here / 'aniversario.html').write_text(src.replace('/*FONTFACES*/', css))
print('built aniversario.html')
