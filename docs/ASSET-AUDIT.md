# Asset audit — November 3, 2026

## Provenance and scope

The existing collector captured seven HTML pages but only two assets. The galleries are populated by `/javascript/gallery.js`, which the original collector did not follow. That public script is now preserved under `docs/legacy-snapshot/` and indexed in `gallery-index.json` without executing its code. No third-party stock photography or generated imagery was added.

The gallery index contains 14 albums, 307 unique photograph references within albums, 75 video references, 23 duplicate references, and two malformed paths. These are source references, not verified delivery or participation counts. A representative sample of up to three photos per album was downloaded: 41 files, with source URLs, SHA-256 checksums, dimensions, and file sizes in `gallery-manifest.json`. The remaining referenced media has not been downloaded or visually reviewed. See `contact-sheet.jpg` for the reviewed sample.

## Original brand assets

- `public/assets/legacy/logo.png`: preserved unchanged, 1001 × 335 PNG. SHA-256 `67332e1645013f1927c53639513c6da3449c0490f377086233e143366b1ded1d`. Used in header and footer with its original colours and proportions. A vector master and accessible small-format brand variant would improve future production work.
- `0282e0e100-mic.webp`: 2560 × 1707, technically reusable as decorative music imagery; no documentary connection to participants is established. Excluded from the homepage in favour of real gatherings.

## Selected images

| Curated derivative | Original source | Dimensions before optimization | Editorial decision |
| --- | --- | --- | --- |
| community-picnic.webp | Aug_21_2025_Seniors_club/3.jpeg | 1600 × 1066 | Strong outdoor group portrait; hero and archive. Preserve faces in responsive crop. Moderate source resolution: do not upscale. |
| shared-song.webp | Feb_26_2025_seniors_club/11.jpg | 4000 × 2252 | Clear participant and microphone; music chapter. Authentic Seniors Club activity, not evidence of clinical music therapy. |
| seniors-circle.webp | jan_15_2025_seniors_club/1.jpg | 2048 × 1536 | Warm room and shared circle; community chapter. |
| diwali.webp | 25_10_16_Diwali_Celebrations/1.jpg | 4000 × 2252 | Contextual performance photograph; archive. No invented performer identity. |
| celebration.webp | 25_12_8_Seniors_Club/2.jpg | 2000 × 1500 | Colourful group portrait; archive. |

`curated-manifest.json` maps optimized WebP files back to originals. Derivatives are orientation-corrected and limited to 1800 pixels wide; Next Image supplies responsive sizes and lazy loading. Only the hero and header logo are priority images. Original media remains intact.

## Gallery classification

| Source albums | Classification | Reuse assessment |
| --- | --- | --- |
| Christmas, Diwali | Cultural celebrations / seniors | Strong colourful portraits and performances. Flyers are historical promotional graphics, not suitable hero photography. |
| January, February, March, May, June, November, December Seniors Club / Meet | Social connection / music / talks | Good documentary evidence. Some frames show blank walls, backs of heads, empty floor, or near duplicates; use selectively. Speaker photos alone do not establish qualifications or health outcomes. |
| August Seniors Club | Outdoor gathering / picnic | Best hero candidate in reviewed sample. The event flyer contains historical price/contact details; excluded from current calls to action. |
| October 2 Seniors Club | Talks / gathering | Useful archive context; not selected for homepage due flat room lighting and distant subjects. |
| Hawthorn Woods Care Community | Outreach / location | Sample shows building signage and exterior portraits, not activity. Do not imply a formal partnership from these images. |
| Sick Kids | Outreach / distribution | Sample shows people sorting items; exact activity and beneficiary relationship need confirmation. Not used as food-drive evidence or to imply a hospital partnership. |
| Tribute to Rafi | Concert / music archive | High resolution but prominent baked-in captions, inconsistent orientation, and stage lighting. Excluded from key imagery; do not remove watermarks. |

## Missing, unsuitable, and unresolved

- Initial snapshot reports `Feb_26_2025_seniors_club/TEST.mp4` as 404. The index also contains `5mp4` and `6mp4`, which lack file extensions. No videos are used.
- Third-party gallery thumbnails under `ext.same-assets.com` were not collected: provenance is unclear.
- No visually verified photographs specific to yoga, meditation, nutrition instruction, online workshops, or food drives. Those sections use typography and honest descriptions rather than unrelated photographs.
- Need a vector logo, approved brand guidelines, higher-resolution candid hero alternatives, team portraits and approved biographies, and participant-approved activity close-ups.
- Copyright, reuse permission, participant consent, and preferred image captions remain unconfirmed. All selected photos are for local design review; the user has prohibited deployment.
- No verified impact statistics, testimonials, upcoming event schedule, donation payment destination, instructor credentials, or clinical claims are added.

## Reproduction

`node scripts/index-galleries.mjs` rebuilds the complete reference index from the saved script. `npm run assets:audit` builds the dimension inventory and contact sheet from downloaded originals. `npm run assets:curate` rebuilds the five optimized derivatives. These commands perform no publication or hosting changes.
