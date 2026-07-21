# 09 · Deployment

## Local build

```bash
npm install
npm run build     # tsc -b && vite build → dist/
# chrome://extensions → Developer mode → Load unpacked → select dist/
```

## Chrome Web Store submission

- Zip the contents of `dist/` (`manifest.json` must be at the zip root, not nested in a `dist/` subfolder).
- Justify every permission in the store listing: `storage` (settings + history), `contextMenus` ("Ask Ombre AI"), `activeTab`, `sidePanel`, and the `api.toqan.ai` host permission.
- The `<all_urls>` + `all_frames: true` content script is the item most likely to draw reviewer scrutiny — the listing should explain plainly that it only renders a UI locally and only calls the Toqan API through the background worker, never reads or transmits page content on its own.

## Versioning & CI

- Bump `manifest.json`'s `version` on every store-bound release (semantic-ish: MAJOR for breaking storage-schema changes, MINOR for new surfaces/features, PATCH for fixes).
- Recommended: a GitHub Actions workflow running `npm ci && npm run build` on every push, uploading `dist/` as a build artifact and (optionally) auto-zipping it for release tags — this project does not yet have CI configured.

---
◀ [Testing Strategy](./08_Testing_Strategy.md) · [Index](../README.md#documentation) · Next: [Environment Variables & Configuration](./10_Environment_Variables.md) ▶
