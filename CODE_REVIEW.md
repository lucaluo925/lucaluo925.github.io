# Code review log

Append only. Newest entry at the bottom.

## 2026-11-11 · then-again/ (new interactive site) and its project page

Reviewed with `ocr delegate` (workspace mode, 20 reviewable files, default rule group). Covered: `then-again/index.html`, `then-again.html`, `projects.html`, pager edits in `fuelworth.html` and `frozen-protocol.html`. The other 15 HTML files only had the footer month changed and were checked by diff.

Fixed before commit
- Medium, performance: `then-again/index.html` redrew the full-screen noise canvas on every `resize` event. Now debounced by 180 ms.
- Low, hardening: image credit fields from Wikimedia metadata were written with `innerHTML` unescaped. They are build-time constants, but they are now escaped.

Checked and found fine
- `then-again/` keeps the site-wide `noindex, nofollow` meta.
- External links opened in a new tab carry `rel="noopener"`.
- `localStorage` and `sessionStorage` access is wrapped in try/catch, and the page renders without them.
- Audio only starts from a click handler.

Not verified
- Music playback and the volume-driven halo animation were not exercised in a real browser. The headless test browser has no MP3 decoder.

## 2026-11-11 (later) · then-again/: quiz game removed, filter machine added

Reviewed with `ocr delegate` (workspace mode). Covered `then-again/index.html`, `then-again.html`, `projects.html`.

Changed
- The keep-or-change quiz and its score were removed after user testing found them dull. `playing()` now always returns false, so the pattern and timeline pages show everything.
- New `#machine` view: applies one of four period looks (1998, 1985, 1977, 1955) to a sample scene or to a photo the visitor picks. All pixel work happens on a canvas in the browser. No upload.

Checked and found fine
- Picked files are read with `URL.createObjectURL` and only accepted when the MIME type starts with `image/`. A file that fails to decode shows a message instead of throwing.
- Working size is capped at 960 px on the long side, so a large phone photo cannot stall the pixel loops.
- Renders are coalesced through `requestAnimationFrame`.

Left as is, on purpose
- Low: object URLs for picked photos are not revoked while the photo is in use. They are released when the page closes.
- Low: dead game code (guess form handlers, score helpers) is still in the script behind `playing()`. Kept in case the game returns in another form.

Not verified
- `Save picture` was not exercised in a real browser. Inside the claude.ai artifact frame downloads are blocked, so it only works on the GitHub Pages copy.
