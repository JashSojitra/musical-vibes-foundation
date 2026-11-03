#!/usr/bin/env python3
"""Read-only public-site snapshot. Run locally with internet. Never touches hosting or DNS."""
from __future__ import annotations
import hashlib,json,re,time
from pathlib import Path
from urllib.parse import urljoin,urlparse,urldefrag
import requests
from bs4 import BeautifulSoup

BASE='https://www.musicalvibesfoundation.com'
PAGES=['/','/pages/about.html','/pages/program.html','/pages/contact.html','/pages/gallery.html','/pages/galleryseniors.html','/pages/gallerymusicalvibes.html']
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/assets/legacy'; SNAP=ROOT/'docs/legacy-snapshot';DEST.mkdir(parents=True,exist_ok=True);SNAP.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers.update({'User-Agent':'MusicalVibesFoundation-AuthorizedRedesignAudit/1.0 (public site backup)'})
manifest={'site':BASE,'pages':[],'assets':[],'errors':[]}
urls={urljoin(BASE,'/assets/logo.png')}
def add(raw,page):
    if not raw or raw.startswith(('data:','javascript:','mailto:','tel:','#')):return
    url=urldefrag(urljoin(page,raw.strip()))[0]
    p=urlparse(url)
    if p.hostname not in ('www.musicalvibesfoundation.com','musicalvibesfoundation.com'):return
    ext=Path(p.path).suffix.lower()
    if ext in ('.png','.jpg','.jpeg','.webp','.gif','.svg','.avif','.mp4','.webm','.mov','.pdf'):
        urls.add(url)
for path in PAGES:
    url=urljoin(BASE,path)
    try:
        r=S.get(url,timeout=25);r.raise_for_status();soup=BeautifulSoup(r.text,'html.parser')
        key='home' if path=='/' else Path(path).stem
        (SNAP/f'{key}.html').write_text(r.text,encoding='utf-8')
        for node in soup.find_all(['img','source','video','a','meta']):
            for attr in ('src','href','poster','content','data-src','data-background','data-image','data-lazy-src'):
                add(node.get(attr),url)
            for attr in ('srcset','data-srcset'):
                for v in (node.get(attr) or '').split(','):add(v.strip().split(' ')[0],url)
        for match in re.findall(r'''["']([^"']+\.(?:png|jpe?g|webp|gif|svg|mp4|webm|avif)(?:\?[^"']*)?)["']''',r.text,re.I):add(match,url)
        (SNAP/f'{key}.txt').write_text(soup.get_text('\n',strip=True),encoding='utf-8')
        manifest['pages'].append({'url':url,'title':soup.title.get_text(' ',strip=True) if soup.title else '', 'status':r.status_code})
        print('PAGE',url)
    except Exception as e:manifest['errors'].append({'url':url,'error':str(e)});print('ERROR',url,e)
    time.sleep(.25)
for i,url in enumerate(sorted(urls),1):
    try:
        r=S.get(url,timeout=40);r.raise_for_status()
        path=urlparse(url).path
        name=Path(path).name or 'asset'
        prefix=hashlib.sha256(url.encode()).hexdigest()[:10]
        # Original logo keeps a predictable file name, all other filenames retain original basenames.
        name='logo.png' if path=='/assets/logo.png' else f'{prefix}-{name}'
        out=DEST/name;out.write_bytes(r.content)
        manifest['assets'].append({'source':url,'local':str(out.relative_to(ROOT)).replace('\\','/'),'bytes':len(r.content),'sha256':hashlib.sha256(r.content).hexdigest()})
        print('ASSET',i,len(urls),name)
    except Exception as e:manifest['errors'].append({'url':url,'error':str(e)});print('ERROR ASSET',url,e)
    time.sleep(.2)
(SNAP/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Done: ',len(manifest['pages']),'pages;',len(manifest['assets']),'assets;',len(manifest['errors']),'errors')
