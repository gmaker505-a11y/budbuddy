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

## Run it

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

## Where evidence lives

- GitHub Actions → **Visual QA** workflow → **Artifacts** → `budbuddy-visual-checks`
- The artifact contains mobile/desktop screenshots, Playwright HTML report, test results and failure traces.
- Each commit triggers another run, so changes are rechecked automatically.

## Limits (important)

This is an automated smoke/regression suite, not a claim that an AI can understand every visual defect or fix every bug without review. It catches specific measurable failures and preserves screenshots/traces for review. Visual appearance, game design quality, fairness, and bugs outside these assertions still need human/assistant review of the artifacts. Tests can verify the browser-based prototype, not prove a native Android APK exists.
