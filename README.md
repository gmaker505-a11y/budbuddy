# BudBuddy 🐹

BudBuddy is an original, single-player 3D virtual-pet survival game for mobile and desktop browsers. Care for a laid-back, goofy hamster: feed him, give him water, pet him, play with him, and keep his needs balanced while he explores his habitat.

## Play
Open the deployed GitHub Pages site in a modern browser. Three.js loads from a CDN, so the 3D renderer needs an internet connection.

## Controls
Tap/click Feed, Water, Pet, Play, Nap or Talk. Drag the habitat to rotate the view. Progress is stored locally in this browser using localStorage; it is not cloud-synchronised.

## Development
- `index.html` — playable 3D browser prototype.
- `tests/game.test.mjs` — automated gameplay and layout checks.
- `.github/workflows/pages.yml` — validation and GitHub Pages deployment.
- `.github/workflows/visual-checks.yml` — mobile/desktop browser checks and screenshot artifacts.

## Roadmap
1. 3D habitat, hamster, care actions and local save.
2. Expressions, sound and repeat-after-you mode.
3. Exploration, toys, room upgrades and autonomous behaviours.
4. Improve visual fidelity and expand screenshot-driven regression tests.

BudBuddy is fictional. Its needs are game mechanics, not real animal-care advice.
