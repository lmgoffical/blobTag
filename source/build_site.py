src=open('source/game.html').read()
i=src.index('<style>'); head_bits=src[:i]            # title, meta, font link
j=src.index('</style>')+len('</style>'); style=src[i:j]; body=src[j:]
hook='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert body.count(hook)==1
body=body.replace(hook,'<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n<script src="net.js"></script>\n'+hook)
head_bits=head_bits.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
doc='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="A first-person online hide-and-tag game to play with friends in the browser.">\n'+head_bits+'<style>html, body { margin: 0; } img { max-width: 100%; }</style>\n'+style+'\n</head>\n<body>'+body+'</body>\n</html>\n'
open('index.html','w').write(doc)
