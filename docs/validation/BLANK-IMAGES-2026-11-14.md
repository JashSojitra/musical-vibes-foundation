# Blank image investigation — 2026-11-14

Historical investigation snapshot. The subsequently authorized visibility repair and
current browser results are recorded in [the completion report](PHOTO-VISIBILITY-2026-11-14.md).

## Finding and scope

The reproduced blank areas are publication fallbacks, not failed image requests.
This patch adds diagnostics and regression coverage; **it does not restore withheld
photographs**. Restoring those photographs requires a separately authorized owner
publication decision. No Sanity writes, draft publication, approval bypass, image
reupload, deployment, commit or push was performed.

Anonymous published-perspective reads of project `6jpdhhxg`, dataset `production`
returned 14 `mediaItem` documents: 13 have `editorialApproval: "pending"` and
`publicationEnabled: false`; one is approved and enabled. There are 18 inbound
references to withheld media. The three public Updates reference withheld media
(Diwali, Christmas and picnic). The public reader returned three journal entries;
the 11 newly imported drafts described in the migration report are intentionally
outside this perspective. Uploaded asset counts do not establish public visibility.

`src/lib/sanity-model.ts` requires approval and publication enablement before
mapping media. `src/lib/content.ts` returns `unavailableMedia` for an unavailable
photo. That placeholder points to `public/assets/image-unavailable.svg`, which
contains only a solid beige rectangle. Homepage photo selections use those
fallbacks. Update cards use MVF placeholders and article photo sections are omitted
when no eligible photos remain. Gallery includes the one approved standalone photo;
withheld story photos do not create collections. Existing snapshot regression
coverage already records the pending legacy publication states.

## Checks that distinguish other causes

- Staging HTML responses contain no `Content-Security-Policy` header. Neither
  `public/_headers` nor the Worker security header wrapper sets one. No CSP change
  is warranted. Existing nosniff, frame denial, referrer, permission and noindex
  protections remain intact.
- `next.config.ts` allows HTTPS images only from
  `cdn.sanity.io/images/6jpdhhxg/production/**`. The preview declares an IMAGES
  binding. No remote-domain expansion or optimization bypass is needed.
- The public reference audit returned `unreadableReferences: []`. The failure is
  distinct from the earlier private/dotted document-ID problem.
- The approved asset `24eecf209f2b132a55c68eadf5ba512720fe9a03-4000x2252.jpg`
  resolves through the mapper to the expected Sanity image URL. Its direct JPEG
  decoded at 1920 × 1081. The staging `/_next/image` responses decoded as WebP at
  640 × 360 and 1920 × 1081 (Pillow fully loaded pixel data).
- A request made with Python's default user agent received Cloudflare 403/1010;
  the same optimizer URLs with a browser user agent succeeded. Chromium also
  decoded the actual page-selected image variants. The isolated 403 is not proof
  of browser image failure.

## Actual staging browser evidence

Chromium, reduced motion, desktop 1440 × 1000 and mobile 390 × 844:

| View                                | Decoded Sanity images per viewport           | Intentional fallback evidence                          |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------ |
| Homepage                            | 1                                            | 10 beige SVG image elements, 3 MVF Update placeholders |
| Gallery                             | 2 (intro and thumbnail, same approved asset) | 1 beige SVG element                                    |
| Gallery lightbox                    | 1                                            | Open/close succeeded                                   |
| Updates index                       | 0                                            | 1 beige SVG element, 2 MVF thumbnails                  |
| Each of 3 published Update articles | 0                                            | 1 beige SVG element; article photos omitted            |

Each tested photograph passed `HTMLImageElement.decode()`, had positive natural
dimensions and a nonzero rendered bounding box. Page photographs had computed
opacity 1 and visible display/visibility. Lightbox decoded at 1296 × 729 on desktop
and 351 × 197 on mobile. This verifies the approved photograph's rendering, **not**
restoration of missing Update/homepage photographs. Navigation aborted some RSC
prefetches; no failed photograph requests were observed in that probe.

Private scratch evidence is under `.tmp/staging-image-evidence.jsonl` and
`.tmp/public-image-audit.json` on this worker; it is not part of the returned patch.

## Patch and validation

- Public audit now reports withheld media and inbound field locations separately
  from unreadable references. Withheld content is diagnostic information, not a
  reason to weaken the reader's publication controls.
- Regression tests cover independent approval/publication gates, missing fields,
  and an imported draft failing to restore a withheld photo to published models.
- The existing desktop/mobile live browser check now decodes Sanity photographs
  on routes and published articles and opens/decodes the Gallery lightbox. It
  attaches publication diagnostics and separate decoded-photo/placeholder counts;
  a beige SVG or logo is never counted as a successful photograph.
- Node 22.22.0: lint and typecheck passed. The targeted content, media visibility
  and preview configuration tests passed: 18/18. Formatting checks passed.
- The modified live Playwright suite passed against existing staging: 2/2,
  desktop and mobile, 16.7 seconds. A temporary config imported
  `playwright.cms-preview-live.config.ts`, set `webServer: undefined`, set
  `testDir` to the absolute repository `tests` directory and overrode `use.baseURL`
  with the supplied staging URL. This tested existing staging, not a newly built
  or deployed Worker.

## Caller checks and remaining action

Run the existing lab-dispatch skill's `ld` workflow for the heavyweight CMS preview
build; `/usr/bin/ld` on this snapshot is the system linker, not that dispatcher.
Inside the dispatched project environment, use Node 22.14+ (below 25), then run:

```sh
npm run cf:build:cms-preview
npm run cf:validate:cms-preview
npm run cf:dry-run:cms-preview
npm run test:cms-preview
npm run test:cms-preview:live
```

These build, dry-run and local built-Worker checks were not run on the memory
limited worker. The browser suite's absence of eligible Update photographs is
reported explicitly; passing transport/decoding tests does not mean those photos
have been restored. Independent review of this patch remains with the caller;
the worker has no configured `codex-remote` delegation workflow.

The owner must decide which existing media may be approved/enabled and whether
any imported Updates may be published. Those changes are outside this task's
explicit prohibition on Sanity mutation and draft publication. Until then, changing
headers, URLs or CSS cannot legitimately restore the withheld photographs.
