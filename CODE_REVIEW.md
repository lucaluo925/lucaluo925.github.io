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

## 2026-11-11 (night) · then-again/: darkroom workspace, linked from every case

Reviewed with `ocr delegate` (workspace mode). Covered `then-again/index.html`, `then-again.html`, `projects.html`.

Changed
- The first filter machine was replaced by a darkroom workspace: a float pipeline (exposure, halation, one film-and-print S curve per colour layer, format-scaled grain, vignette), seven looks by year, film edges for 35mm, panoramic, 6x6, 6x7 and instant, date back, split compare, histogram, and JPG export up to 2800 px.
- Every case page now renders a small preview of its own look and opens the darkroom with that look selected. The darkroom links back to the related cases.

Found and fixed during review
- High, correctness: the new per-case key `look` collided with the existing `look` field that holds the "Look closer" paragraph, so every hand-off resolved to no look and threw. Renamed the key to `lk` and added a fallback look.

Checked and found fine
- Structure follows the film-then-print idea of spektrafilm and SpektraLab (GPL-3.0). No code, profiles or LUTs from either were copied, so the licence does not attach. Credit is given on the Sources page.
- Preview render of a 1000 px frame measured at about 60 ms in headless Chrome.

Not verified
- Export at full size from a large phone photo was not timed. The test image was only 960 px wide.
- No real-browser check of the split-compare drag on touch screens.

## 2026-11-12 · then-again/: film stock colour tables from spektrafilm profiles

Reviewed with `ocr delegate` (workspace mode). Covered `then-again/index.html`, `then-again/tools/bake_luts.py`, `then-again.html`, `projects.html`.

Changed
- `tools/bake_luts.py` (new, ours): reads the spektrafilm profile JSON (CC BY-SA 4.0) and bakes twelve 33-cube lookup tables: seven negative-on-paper pairs, three slide films, two cinema negative-on-2383 pairs. It does not import or execute spektrafilm code.
- The darkroom applies a table with trilinear interpolation when a look names one, then trims contrast, colour and fade. Looks are now grouped as "By year" and "Film stocks", seventeen in total, with a slide mount frame.
- `NOTICE.md` records the licences: tables CC BY-SA 4.0, darkroom code GPL-3.0-or-later.

Known limits of the bake, stated on the site
- Illuminants are black-body approximations and the colour matching functions are an analytic fit. RGB is turned into a spectrum with three smooth bands.
- The neutral axis is pulled 75 percent of the way to grey to cancel the drift those approximations cause. This also removes some of each stock's real tint.
- No grain, halation or coupler data from the profiles is used. Those effects are still ours.

Checked and found fine
- Table lookups clamp the cell index to 31, so the +1 neighbours never read past the 33rd entry.
- If a table fails to load, the look falls back to the built-in curve instead of throwing.
- Preview render with a table measured at about 90 ms for a 1000 px frame in headless Chrome.

Not verified
- No side-by-side comparison against output from the real spektrafilm engine. Running it was not possible in the build environment.

## 2026-11-12 · then-again/: every look now starts from published numbers

Reviewed with `ocr delegate` (workspace mode). Covered 2 of 2 reviewable files: `then-again/index.html`, `then-again/tools/hald_to_lut.py`. `NOTICE.md` and the PNG tables are outside what the tool reviews.

Changed
- Instant print, Tri-X, HP5 and expired Time-Zero use tables resampled from the RawTherapee Film Simulation Collection (via cedeber/hald-clut, GPL-3.0). These tables are sRGB encoded, so the engine got a second lookup axis for them.
- Grain is a particle model with the spektrafilm default particle area, layer scales and uniformity. It acts on exposure before the film table and scales with the frame size in millimetres. Curve slope and densities per film are read from the profiles.
- Halation is three reflections with the spektrafilm strengths for each antihalation class and a 65 µm (still) or 50 µm (cinema) first width.
- VHS replaces the scan line effect: 480 lines, 2.4 MHz luma and 320 kHz chroma low pass, 4 sample chroma delay, noise levels and head switching band from ntsc-rs. Code is ours, no ntsc-rs code is used.
- Camera phone runs a real 8×8 DCT with the Annex K tables of ITU-T T.81 on a 640 px frame with 4:2:0 colour.
- Newspaper uses a 65 lpi screen at 45° with Murray-Davies dot area. Vignette is the cos⁴ law for the lens of each format.
- All presets start with exposure, contrast, warmth, colour, fade and light leak at neutral. The eye-tuned curve and tint code is gone.

Found and fixed
- High: `dkVhs` built its low pass filter with a cutoff above half the sample rate when the raster was small (thumbnails). The filter would be unstable. The cutoff is now capped at 0.45 of the sample rate.

Checked and found fine
- Table and grain indices are clamped. The DCT round trip uses an orthonormal basis, and the output is written to a clamped byte array.
- Preview render 60 to 220 ms per look at 1000 px in headless Chrome. No console errors across ten looks.

Not verified
- The upstream licence of the RawTherapee collection is not stated on its wiki page. The credit follows the GPL-3.0 licence of the repository the files came from.
- HP5 and Tri-X have no grain or halation data of their own. They use the generic spektrafilm values.
- The assumed print width for the newspaper screen (3.75 in) and the 30 mm disposable lens are our reading of typical cases.
- No comparison against real ntsc-rs or spektrafilm output.
