#!/usr/bin/env python3
"""Build the sales site from src/ into one self-contained HTML file per page.

Name, tagline and domain live only in brand.json; colours only in the :root
tokens at the top of src/site.css. Pages are src/pages/*.html. Each starts
with a comment block of `key: value` lines (title, description, ...), then
the page body. In any source file:
  {{> name}}   inserts src/partials/name.html
  {{KEY}}      inserts a brand value or a page value (page values win)

  python3 build.py                 writes index.html, kataskeves.html, ...
  python3 build.py --preview DIR   also writes a claude.ai preview copy to DIR
"""
import json, os, re, sys, unicodedata, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')


def read(*p):
    with open(os.path.join(SRC, *p), encoding='utf-8') as f:
        return f.read()


def caps(text):
    """Greek capitals never carry a tonos: strip accents, keep dialytika."""
    out = []
    for ch in unicodedata.normalize('NFD', text.upper()):
        if ch == '́':
            continue
        out.append(ch)
    return unicodedata.normalize('NFC', ''.join(out))


def brand_vars():
    with open(os.path.join(HERE, 'brand.json'), encoding='utf-8') as f:
        b = json.load(f)
    return {
        'NAME': b['name'],
        'DOMAIN': b['domain'],
        'APP': b['app'],
        'TAGLINE': b['tagline'],
        'TAGLINE_CAPS': caps(b['tagline']),
        'LOGO_A': b['logo'][0],
        'LOGO_B': b['logo'][1],
        'YEAR': str(datetime.date.today().year),
    }


def include(text, depth=0):
    if depth > 8:
        sys.exit('partials nest too deep')
    return re.sub(r'\{\{>\s*([\w-]+)\s*\}\}',
                  lambda m: include(read('partials', m.group(1) + '.html'), depth + 1), text)


def fill(text, values):
    def sub(m):
        k = m.group(1)
        if k not in values:
            sys.exit('unknown value {{%s}}' % k)
        return values[k]
    # Values may hold placeholders themselves (a page title naming the brand), so repeat.
    for _ in range(4):
        text = re.sub(r'\{\{([A-Z_]+)\}\}', sub, text)
    return text


def page(name, brand):
    raw = read('pages', name)
    m = re.match(r'\s*<!--(.*?)-->\s*', raw, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(':')
            meta[k.strip().upper()] = v.strip()
        raw = raw[m.end():]
    values = dict(brand)
    values.update(meta)
    values['CONTENT'] = include(raw)
    values['CSS'] = read('site.css')
    values['JS'] = read('site.js')
    html = fill(include(read('layout.html')), values)
    left = re.findall(r'\{\{[^}]*\}\}', html)
    if left:
        sys.exit('%s: unfilled %s' % (name, left[:3]))
    return html


def preview(html, main):
    """claude.ai preview: the main page loses its document skeleton, and links to it become ./"""
    html = re.sub(r'href="index\.html(#[^"]*)?"', lambda m: 'href="./%s"' % (m.group(1) or ''), html)
    if not main:
        return html
    a = html.index('<!--BODY-START-->') + len('<!--BODY-START-->')
    b = html.index('<!--BODY-END-->')
    body = re.sub(r'</head>\s*<body>\s*', '', html[a:b], count=1)
    body = re.sub(r'<title>[^<]*</title>', '<title>%s Site</title>' % brand_vars()['NAME'], body, count=1)
    if re.search(r'<(html|head|body)[\s>]|</(html|head|body)>|<!doctype', body, re.I):
        sys.exit('preview still has a document skeleton')
    return body


def main():
    brand = brand_vars()
    names = sorted(f for f in os.listdir(os.path.join(SRC, 'pages')) if f.endswith('.html'))
    out = {}
    for n in names:
        out[n] = page(n, brand)
        with open(os.path.join(HERE, n), 'w', encoding='utf-8') as f:
            f.write(out[n])
        print('built', n, len(out[n]))
    if '--preview' in sys.argv:
        d = sys.argv[sys.argv.index('--preview') + 1]
        os.makedirs(d, exist_ok=True)
        for n, html in out.items():
            target = 'preview.html' if n == 'index.html' else n
            with open(os.path.join(d, target), 'w', encoding='utf-8') as f:
                f.write(preview(html, n == 'index.html'))
            print('preview', target)


if __name__ == '__main__':
    main()
