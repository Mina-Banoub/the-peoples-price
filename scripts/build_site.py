#!/usr/bin/env python3
"""Assemble docs/index.html from src/head.html, src/body.html and src/app.js.
The page loads docs/data.json at runtime, so monthly data updates don't need a rebuild."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = lambda n: open(os.path.join(ROOT, "src", n), encoding="utf-8").read()
RESET = (":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
         "body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}")
html = ('<!doctype html>\n<html lang="en" data-theme="light">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="description" content="What everyday items would cost today if prices had risen only as fast as a typical paycheck since 2019.">\n'
        "<script>try{if(localStorage.getItem('pp-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>\n"
        f'<style>{RESET}</style>\n{src("head.html")}\n</head>\n<body>\n{src("body.html")}\n<script>\n{src("app.js")}</script>\n</body>\n</html>\n')
open(os.path.join(ROOT, "docs", "index.html"), "w", encoding="utf-8").write(html)
print("Wrote docs/index.html")
