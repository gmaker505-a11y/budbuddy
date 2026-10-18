# BudBuddy self-check and visual QA system

This project runs a repeatable browser audit on every push and pull request, with desktop Chromium and Pixel 7 mobile profiles.

## What it checks automatically

- 3D renderer reports ready and the canvas has a measurable viewport.
- The six care actions are visible, enabled, usable, and don't cause uncaught page errors.
- Hunger, thirst, energy and happiness remain between 0 and 100 after each action.
- Feeding/petting behaviour, diary updates, saved progress after reload, and reset flow.
- Basic accessibility contracts: accessible button names, canvas label, and live announcement for buddy speech.
- Responsive layout at desktop, mobile, narrow 320px phone, landscape and tablet sizes; checks for horizontal overflow and clipped controls.
- Screenshots of the full page for desktop and mobile projects, plus failure screenshots and Playwright traces when tests fail.
- A dedicated recorded playthrough on desktop and mobile: loads the game, uses all care actions, explores, reloads to verify saved discoveries, and checks layout/runtime errors.
- Successful playthrough videos are retained as test artifacts, not only when a test fails.

## Run it

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

## Where evidence lives

- GitHub Actions → **Visual QA** workflow → **Artifacts** → `budbuddy-visual-checks`
- The artifact contains recorded gameplay videos (`.webm`), mobile/desktop screenshots, Playwright HTML report, test results and traces.
- Each commit triggers another run, so changes are rechecked automatically.

## Limits (important)

This is an automated smoke/regression suite, not a claim that an AI can understand every visual defect or fix every bug without review. It catches specific measurable failures and preserves screenshots/traces for review. Visual appearance, game design quality, fairness, and bugs outside these assertions still need human/assistant review of the artifacts. Tests can verify the browser-based prototype, not prove a native Android APK exists.


## Recorded playthrough review loop

1. Every push runs the dedicated recorded scenario in desktop and mobile Chromium profiles.
2. Open GitHub Actions → **BudBuddy visual checks** → latest run → **Artifacts** → `budbuddy-visual-checks`.
3. Download the artifact and inspect the `.webm` recordings and `01-loaded.png` / `02-after-playthrough.png` screenshots. The run also reports action, save/reload, layout and browser-error assertions.
4. If an assertion fails, inspect its Playwright trace, screenshot and log; fix the source or test, commit the fix, and rerun the workflow.

The video is a browser automation recording of scripted actions, not a human free-play session or an AI that automatically understands every visual defect. The checks can automatically flag the defined failures; visual review is still needed for issues not covered by assertions.
