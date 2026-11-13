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

## 2026-11-12 · then-again/: cases and darkroom joined, all sixteen faces are photographs

Reviewed with `ocr delegate` (workspace mode). Covered 1 of 1 reviewable file: `then-again/index.html`. Images are outside what the tool reviews.

Changed
- Each case now has two looks, one for each side of the card. Turning the card changes the hand-off below it, so "Today" shows today's phone look and no longer the 1955 one.
- The hand-off shows the object's own unedited photograph with that look applied. Clicking it opens the darkroom on that photograph, with the credit shown under the caption. "My photo" returns to an uploaded picture.
- The darkroom has a panel that lists what the chosen look is made of and a tone curve measured by sending a grey ramp through the engine. Both change with every preset and slider.
- Looks have their own address (`#machine/1972`). The default picture is a CC0 market photograph instead of a drawn sunset.
- The six faces that were drawings are now Wikimedia Commons photographs, credited on the Sources page.
- Each case question has a short answer. The hand-off card is no longer a black block.

Found and fixed
- Medium: the histogram counted the black film border, which put a false spike at the dark end. It now reads the picture before the frame is added.
- Medium: the canvas blocked page scrolling on touch screens at all times. It now blocks it only in compare mode.
- Medium: returning to the darkroom reset any slider changes. It now resets only when the look changes.
- Low: "VHS" was lowercased in the hand-off text. The home button text wrapped on narrow phones. The VHS counter was white on white.

Checked and found fine
- Credit text placed with `innerHTML` comes only from the site's own photo list, never from user input.
- `history.replaceState` is wrapped, so a sandboxed frame cannot break look changes.
- Sixteen case sides tested on desktop and phone sizes with no console errors.

Not verified
- "The way 1955 recorded it" applies a look to a modern photograph of the object. It is not a period photograph.
- The camera's "now" photo shows a person from behind at a museum (CC0 on Commons). Katherine and Haoyuan should confirm they are comfortable using it.
- The Moonliner photo is the later rebuilt rocket, standing in for the 1955 original.

## 2026-11-12 · then-again/: pass against model defaults

Reviewed with `ocr delegate` (workspace mode), 1 of 1 reviewable file (`then-again/index.html`). No new logic beyond string and colour changes.

Changed
- High (fact): the slide look was labelled 1968 but uses Kodachrome 64 data, a film sold from 1974. The label is now 1974 and the looks are back in year order. The drugstore print's date back moved from '04 to '08 because the UltraMax name is later than 2004.
- The default sample photo was a fruit market, the stock choice for a colour test. It is now the project's own jukebox photograph.
- The darkroom used the usual blue-black tool palette and a floating shadow under the picture. It is now a neutral warm black matching the film base colours, and the shadow is gone.
- Half of the case answers ended on a one-line slogan. Those endings were cut.
- The hand-off no longer says "the way 1955 recorded it". It names the look instead.

Kept on purpose
- Blue halftone, lime and silver come from the two reference images Haoyuan supplied. Syne and the wide mono labels follow those references and the edge print on film.
- Left rail, picture, strip of looks: the common layout for an editor. Kept because people already know where things are.

## 2026-11-12 · then-again/: spectral engine in the page, Develop and Edit, roll, export, new entrance

Reviewed with `ocr delegate` (workspace mode). Reviewable files: `then-again/index.html`, `then-again/tools/engine.js` (a readable copy of the engine that is inlined in the page), `then-again/tools/pack_profiles.py`. `data/profiles.json` is data and was checked by the parity test below.

Changed
- The film colour is no longer read from baked PNG tables. `engine.js` builds the 33³ table in the page for any film, paper and enlarger setting, from 28 spektrafilm profiles and SpektraLab's 4 black and white films, Multigrade paper and CineStill 800T.
- Develop page: film, paper, paper grade, exposure, temperature, tint, print exposure, yellow and magenta filters, grain, halation, scatter, glare, couplers. Edit page: brightness, contrast, highlights, shadows, a point curve, temperature, vibrance, saturation, vignette, hue, saturation and lightness for eight colour bands. Frame page: nine film formats, slide mount, instant print, date back.
- A roll of up to 24 photos with ratings, colour tags, per photo settings, copy and paste of settings, paste to all. Export as JPEG, PNG or WebP with quality and size, one photo or the whole roll.
- The entrance is rebuilt from the site's own photographs as two rolls of film. This is a first draft waiting for Haoyuan's choice of reference.

Verified
- Parity: tables from the JavaScript engine against the earlier Python bake for four film and paper pairs differ by at most 2 of 255 (mean under 0.05).
- Couplers leave the grey scale unchanged and raise the saturation of a red patch. More yellow filter makes the print bluer. Paper grade 00 is softer than grade 5.
- Playwright on desktop and phone sizes: every case hand-off, look addresses, film and paper changes, edit tools, formats, roll, ratings, copy and paste, PNG export. No console errors.

Found and fixed during the work
- High: the coupler correction used the corrected curves to estimate the inhibitor, which moved the grey scale. It now uses the measured curves, as spektrafilm does.
- High: the filter sliders had the wrong sign.
- Medium: viewing a negative without paper went through the neutral correction and came out as noise. The negative is now shown as it is.
- Medium: each redraw processed the photo twice. Switching photos could save the current settings into the wrong roll entry.
- Medium: thumbnails for 21 looks were built in one block and froze the page. They now fill in one at a time.

Not built (SpektraLab has these)
- RAW decoding, 16 bit TIFF, HEIF and wide gamut export, Capture One catalogs, saved catalogs and albums, the Light Table, half frame pairs, colour wheels, channel mixer, diffusion filters, saved export recipes, Chinese and Japanese interface text.

Not verified
- No comparison against real SpektraLab or spektrafilm output. Our filters are smooth dye bands and the neutral balance is found by the page, so numbers differ from theirs.
- Export at 4800 px on a phone. Batch export in Safari, which may block several downloads in a row.

## 2026-11-12 · then-again/: the entrance can be reopened

Reviewed with `ocr delegate` (workspace mode), 1 of 1 reviewable file. Small change: the entrance only showed on the first visit of a tab with no hash, so it could not be seen again. `#entrance` now opens it, and the menu has an Entrance item. `openIntro` clears the closing class so it can run more than once. Tested both paths in Playwright, no errors.
