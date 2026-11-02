#!/usr/bin/env python3
"""Assemble docs/index.html and docs/about.html from src/ and config/site.json.
The main page loads docs/data.json at runtime, so data updates don't need a rebuild."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = lambda n: open(os.path.join(ROOT, "src", n), encoding="utf-8").read()
site = json.load(open(os.path.join(ROOT, "config", "site.json")))
URL = site["siteUrl"].rstrip("/")
DESC = "What everyday items would cost today if prices had risen only as fast as a typical paycheck since 2019."
RESET = (":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
         "body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}")
THEME_EARLY = "<script>try{if(localStorage.getItem('pp-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>"
# EEA + UK + Switzerland: analytics cookies stay off (consent denied by default, no banner shown).
CONSENT_REGIONS = "AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE GB CH".split()


def analytics():
    gid = site.get("gaMeasurementId", "").strip()
    if not gid:
        return ""
    regions = json.dumps(CONSENT_REGIONS)
    return (f'<script async src="https://www.googletagmanager.com/gtag/js?id={gid}"></script>\n'
            "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}"
            f"gtag('consent','default',{{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',region:{regions}}});"
            "gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});"
            f"gtag('js',new Date());gtag('config','{gid}',{{allow_google_signals:false,allow_ad_personalization_signals:false}});</script>\n")


def head(title, path, desc=DESC):
    url = URL + path
    return ('<!doctype html>\n<html lang="en" data-theme="light">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            f'<meta name="description" content="{desc}">\n<link rel="canonical" href="{url}">\n'
            '<meta name="theme-color" content="#FFD23F">\n'
            '<link rel="icon" href="favicon.svg" type="image/svg+xml">\n<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">\n'
            '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
            '<meta property="og:type" content="website">\n<meta property="og:site_name" content="The People\'s Price">\n'
            f'<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n'
            f'<meta property="og:url" content="{url}">\n<meta property="og:image" content="{URL}/og-image.png">\n'
            '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
            '<meta property="og:image:alt" content="The People\'s Price: a table comparing what eggs, ground beef and gasoline would cost at paycheck pace with what they cost now.">\n'
            '<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:title" content="{title}">\n<meta name="twitter:description" content="{desc}">\n'
            f'<meta name="twitter:image" content="{URL}/og-image.png">\n'
            f'{THEME_EARLY}\n{analytics()}<style>{RESET}</style>\n')


def with_contact(html):
    return html.replace("hello@thepeoplesprice.org", site["contactEmail"])


page_head = src("head.html")
body = src("body.html")
index = head("The People's Price", "/") + page_head + "\n</head>\n<body>\n" + body + "\n<script>\n" + src("app.js") + "</script>\n</body>\n</html>\n"
open(os.path.join(ROOT, "docs", "index.html"), "w", encoding="utf-8").write(with_contact(index))

nav = re.search(r"<nav.*?</nav>", body, re.S).group(0)
nav = nav.replace('href="#check"', 'href="./#check"').replace('href="#all"', 'href="./#all"').replace('id="tab-about"', 'id="tab-about" aria-current="page"')
foot = re.search(r"<footer.*?</footer>", body, re.S).group(0).replace('<span id="foot-updated"></span>', "")
about_head = re.sub(r"<title>.*?</title>", "<title>About · The People's Price</title>", page_head)
theme_js = ("(function(){var r=document.documentElement,b=document.getElementById('theme');function s(t,v){r.setAttribute('data-theme',t);"
            "var l=t==='dark'?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-label',l);b.title=l;if(v){try{localStorage.setItem('pp-theme',t)}catch(e){}}}"
            "var t='light';try{if(localStorage.getItem('pp-theme')==='dark')t='dark'}catch(e){}s(t,false);"
            "b.addEventListener('click',function(){s(r.getAttribute('data-theme')==='dark'?'light':'dark',true)})})();")
about = (head("About · The People's Price", "/about.html", "How The People's Price works, where the data comes from, and our privacy policy.")
         + about_head + "\n</head>\n<body>\n" + nav + '\n<div class="wrap">\n' + src("about.html") + "\n" + foot + "\n</div>\n<script>" + theme_js + "</script>\n</body>\n</html>\n")
open(os.path.join(ROOT, "docs", "about.html"), "w", encoding="utf-8").write(with_contact(about))
print("Wrote docs/index.html and docs/about.html" + (" with Google Analytics" if site.get("gaMeasurementId") else " (analytics off)"))
