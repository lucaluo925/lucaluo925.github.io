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

Stock names such as Kodak Gold 200 or Fujifilm Velvia 100 identify the published data the looks
were computed from. This site is not affiliated with or endorsed by those companies.

## Other material

- Object photographs: Wikimedia Commons, credited one by one on the Sources page of the site.
- Music: Rachmaninoff, Piano Concerto No. 2, second movement. Public domain recording from Musopen.
