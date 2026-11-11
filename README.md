# Blob Tag

A first-person online hide-and-tag game that runs in the browser. One player seeks, everyone else hides, and getting tagged makes you the seeker.

## Playing

Open the site, pick "Host a game", choose a map and share the room code. Friends pick "Join a game" and type the code.

## Hosting

This is a static site with no build step. On Cloudflare Pages, leave the build command empty and use the repo root as the output directory.

- `index.html` is the whole game.
- `net.js` is the live multiplayer link. It uses Supabase Realtime broadcast channels with a publishable key and stores nothing.
- `assets/` holds the textures, skies and character model.
- `source/game.html` is the game without the page wrapper, and `source/build_site.py` rebuilds `index.html` from it (run it from the repo root).

## Credits

- Textures and sky photos: Poly Haven (CC0).
- Character model and animations: the "Soldier" example model from the three.js repository.
- 3D engine: three.js r128.
