# Combobox POC

Accessibility-first combobox built on
[`react-aria-components`](https://react-spectrum.adobe.com/react-aria/components.html).
Desktop renders as a single combobox with popover; small screens (`<= 700px`)
switch to an iOS-style tray pattern.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

The workflow lives at the repo root: `../.github/workflows/deploy-combobox.yml`.
To publish:

1. Push the parent repo (the one rooted at `sandbox/`) to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push any change under `combobox/` (or run the workflow manually) — the
   site lands at `https://<user>.github.io/<repo>/`.

The workflow injects `BASE_PATH=/<repo>/` so Vite emits assets with the
correct paths under the repo subpath.

## Project layout

```
src/
  components/
    Combobox.tsx           desktop combobox + Item + Section
    Combobox.module.css
    MobileCombobox.tsx     small-screen tray pattern
    MobileCombobox.module.css
    Field.tsx              minimal label/hint/message chrome
    Field.module.css
    icons.tsx              chevron + xmark SVGs
    usePlatform.ts         small-screen detection
    data.ts                sample option data
  App.tsx                  story-style demo gallery
  App.module.css
  main.tsx
  index.css
```

## Notes

- The bottom-link variant manages a manual tab trap so focus loops between the
  combobox input and the secondary link without leaving the popover.
- The mobile tray uses `role="searchbox"` (not `combobox`) to keep iOS
  VoiceOver from announcing "double tap to collapse" while the on-screen
  keyboard is open. See the [react-aria combobox blog post](https://react-aria.adobe.com/blog/building-a-combobox).
