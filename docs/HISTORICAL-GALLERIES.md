# Independent Gallery albums

Gallery albums use published `galleryAlbum` documents. An album appears only when
its editorial approval is **approved**, public visibility is enabled, and its
photographs reference existing public image assets. Album publication is separate
from Update publication: publishing an album never publishes or reads a draft Update.

In Studio, use **Gallery albums** to edit the title, display order and ordered
photographs. The first photograph is the album cover. Drag photographs to reorder;
repeated uses of an original are preserved as separate positions. Descriptions,
captions and crops belong to each position; existing shared Media Library metadata
is preserved. Check rights and permission privately before approval and publication.

The optional **Related published Update** adds a reading link and replaces that
Update's derived Gallery collection. It does not replace the article's wording,
publication state or selected photographs. An album remains browsable when its
related article is unpublished. The three historical collection IDs are retained,
so existing article-to-Gallery links continue to work.

The Gallery lists every album. Selecting one opens its exact ordered sequence;
lightbox navigation includes repeated positions. **View full-resolution photograph**
opens the existing original Sanity image. The all-photograph view deduplicates shared
asset identities, while individual albums retain every ordered position.

`scripts/historical-gallery-plan.mjs` is a pure, create-only historical planner.
It checks the recovered associations against original hashes from a complete backup,
requires 14 albums / 299 unique originals / 307 positions, preserves the known
published relationships, and rejects occupied or ambiguous identities. It performs
no network calls, uploads, updates, deletions or article publication. Live execution
receipts and full backups remain private; they are never website assets or Git inputs.
