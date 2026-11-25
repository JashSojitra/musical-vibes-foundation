# Gallery archive and verification

Production and CMS preview read the existing public Sanity albums and their image assets. The local demo groups the 12 previously approved curated images by original folder and retains their Journal links. A demo build includes those WebP files and the new logo derivative. The CMS Workers package the logo and placeholder. Eligible album photographs are served through the existing Sanity CDN and Cloudflare Images binding, where Next Image requests responsive variants. They survive a Hostinger cutover because delivery uses Sanity asset IDs.

Albums preserve the original order and album-specific crops and descriptions. The Timeline groups by the recorded UTC calendar date, newest first. Shared originals appear once in the Timeline at their latest recorded album date and remain in each album position. Eligible photographs with no recorded date appear under **Date unrecorded**. The calendar uses native selects, buttons and a table. The **Jump to a date** select lists dates with available photographs, and choosing a date focuses its results heading. The Gallery initially renders up to 24 thumbnails and loads more on request. React Aria Calendar was considered. An archive date is a jump to existing results, so native controls provide the required keyboard interaction without another dependency. [React Aria Calendar documentation](https://reactspectrum.blob.core.windows.net/reactspectrum/94000afaff2d09051d67d1ea51d4811efa0856c2/docs/react-aria/Calendar.html)

## Archive accounting

| Evidence | Result |
| --- | --- |
| Historical index | 14 albums, 307 normalized photo positions, 75 video positions and 2 malformed entries. The original index records 23 repeated raw paths across media types. |
| Checked-in recovery inventory | 307 successful source URLs, 299 distinct SHA-256 binaries and 8 identical-byte aliases. Zero reported missing or inaccessible photos in that recovery run. |
| Offline recovery run in this snapshot | 41 originals verified from the sample manifest. The other 266 source URLs were uncollected locally. |
| Tokenless published Sanity query | 14 approved albums, 307 existing photo references and 299 distinct Sanity asset IDs. Every ordered position matched the corresponding recovery SHA-1. Zero missing or unmatched positions. |
| New Hostinger recovery in this job | One sample, Christmas album `3.jpg`, returned HTTP 200 and matched the recovery inventory's SHA-256. Its Sanity CDN original matched byte-for-byte. The downloaded copy was temporary. The other 265 unstaged originals were covered by the Sanity verification and were not downloaded again. |

Album titles, original folders and dates come from the historical index. Source paths are attached to album positions only when the Sanity asset identity matches the recovery inventory. Descriptions, crops and approval come from the public content adapter. An editorial approval does not confirm participant consent. The original image files and existing consent/provenance records are retained. Hostinger source URLs are archival metadata.

Rebuild the metadata with `node scripts/index-archive.mjs`. Run `node scripts/index-archive.mjs --check` to verify it. To reconcile the live dataset, save a published-perspective GROQ response outside Git and pass it as `--public-export=/path/to/response.json`. The query is:

```groq
*[_type == "galleryAlbum" && editorialApproval == "approved" && publicationEnabled == true] {
  sourceId,
  albumPhotos[]{"ref": asset._ref, "exists": defined(asset->._id)}
}
```

Keep a full backup of documents and original assets on the trusted operator workstation using [the existing recovery workflow](PHOTO-RECOVERY.md). Use the legacy host for a bounded recovery only if a required original is absent from the verified Sanity backup. The 75 video positions merit a separate rights, captions, storage and streaming review.
