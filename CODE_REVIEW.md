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
