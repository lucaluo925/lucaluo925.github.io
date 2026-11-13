# Then, Again: licences and credits

## The darkroom

The darkroom's film looks are based on **spektrafilm** by Andrea Volpato
(https://github.com/andreavolpato/spektrafilm). Film modelling inspired by `spektrafilm`.

- **Colour tables in `lut/`.** Each PNG is a 33 x 33 x 33 lookup table that we computed from the
  spektrafilm film and paper profiles (spectral sensitivities, dye densities and density curves).
  The profiles are licensed CC BY-SA 4.0 by Andrea Volpato. These tables are direct derivatives
  and are shared under **CC BY-SA 4.0** as well.
- **How they were made.** `tools/bake_luts.py` is our own simplified spectral calculation. It
  reads the profile JSON files and does not import or run spektrafilm code. It uses approximate
  illuminants and colour matching functions and pulls the neutral axis most of the way back to
  grey, so results differ from the real engine.
- **Code.** spektrafilm asks that tools inspired by its methods be open source under GPLv3.
  The darkroom code in this folder (`index.html` and `tools/`) is offered under
  **GPL-3.0-or-later**.

- **Grain and halation.** The particle area, layer scales, uniformity, halation strengths and base
  thicknesses are the default values in spektrafilm (`runtime/params_schema.py`,
  `runtime/params_builder.py`). The curve slope, mid grey density and top density of each film are
  read from its profile. The code that uses them is ours.

### Tables from the RawTherapee Film Simulation Collection

`lut/hald_polaroid_669.png`, `lut/hald_polaroid_timezero.png`, `lut/hald_trix400.png` and
`lut/hald_hp5.png` are 33 x 33 x 33 resamplings (`tools/hald_to_lut.py`) of HaldCLUT images from
the RawTherapee Film Simulation Collection by Pat David, Pavlov Dmitry and Michael Ezra
(https://rawpedia.rawtherapee.com/Film_Simulation). We took them from
https://github.com/cedeber/hald-clut, which distributes them under GPL-3.0. Our resampled tables
are offered under the same terms.

### Numbers from other projects

- **VHS.** Luma cut 2.4 MHz, chroma cut 320 kHz, chroma delay 4 samples, the 14.318 MHz clock, noise
  levels and the head switching band are values listed in ntsc-rs by valadaptive
  (https://github.com/valadaptive/ntsc-rs, MIT / Apache-2.0 / ISC). No ntsc-rs code is used.
- **Camera phone.** Quantisation tables K.1 and K.2 from ITU-T T.81 (the JPEG standard), Annex K.
- **Newspaper.** A 65 lines per inch screen at 45 degrees, with dot area set by the Murray-Davies relation.
- **Disposable camera.** Corner falloff follows the cos⁴ law for a 30 mm lens on a 35 mm frame.

Fade and light leak have no data source. They default to zero and are manual controls.

Stock names such as Kodak Gold 200 or Fujifilm Velvia 100 identify the published data the looks
were computed from. This site is not affiliated with or endorsed by those companies.

## Other material

- Object photographs: Wikimedia Commons, credited one by one on the Sources page of the site.
- Music: Rachmaninoff, Piano Concerto No. 2, second movement. Public domain recording from Musopen.

## Update, 12 November 2026: the engine now runs in the page

- `data/profiles.json` is a compact copy of the measured data in 28 spektrafilm profiles (CC BY-SA 4.0, Andrea Volpato)
  and 5 profiles from SpektraLab's `engine/resources_product/` (Kodak Tri-X 400, Kodak T-Max 100, Fujifilm Neopan
  Acros 100 II, Ilford HP5 Plus 400, Ilford Multigrade IV RC, plus the CineStill 800T alias and the Multigrade grade
  table). SpektraLab is GPL-3.0-or-later. Values are rounded to four decimals by `tools/pack_profiles.py`; nothing else is changed.
  The packed file is offered under CC BY-SA 4.0 for the spektrafilm part and GPL-3.0-or-later for the SpektraLab part.
- `src/engine.js` is our own code (GPL-3.0-or-later). It builds a 33 x 33 x 33 table for the chosen film, paper and enlarger
  setting. The DIR coupler strengths are the defaults in spektrafilm's `DirCouplersParams`.
- The baked PNG tables for film stocks are no longer shipped. `lut/hald_polaroid_669.png` and
  `lut/hald_polaroid_timezero.png` remain. `hald_trix400` and `hald_hp5` were removed because the black and white
  looks now use the measured profiles.
- The enlarger's yellow and magenta filters are modelled as smooth dye bands and the paper's neutral balance is found
  by the page itself. spektrafilm uses measured filter spectra and stored neutral packs, so numbers will differ.

## Update, 13 November 2026

- RAW files are opened by our own reader, which finds the largest JPEG preview stored inside the file. No RAW decoding library is used.
- Preflash and the scanner's unsharp mask follow the definitions in spektrafilm (`runtime/stages/printing.py`, `ScannerParams`). The code is ours.
- The four stage order of the Develop page (capture, development, print, scan) follows spektrafilm, SpektraLab and LightTable
  (https://github.com/reville/lighttable-digital-darkroom, GPL-3.0). No LightTable code or data is used.
