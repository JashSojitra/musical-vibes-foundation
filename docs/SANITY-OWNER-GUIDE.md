# Editing Musical Vibes Foundation

Open the Studio address provided by the maintainer and sign in with your invited Sanity account. You do not need GitHub or programming. A draft is a saved work in progress; **Publish** makes its current version available to website readers. Drafts are not displayed on the website, but this is a public dataset: do not put confidential material in any field or upload private files.

## Write an update or event story

1. Open **Updates & Stories**, choose **Create**, and enter the title, Description and publication date. A website address is supplied automatically; you can Generate a title-based address before first publication if preferred. Longer story text and related Events/Programs are optional.
2. In **Upload photographs**, select or drop 10–20 or more files together. Drag photos to reorder. The first photo is the cover; open another photo and select **Use as story cover** to override it (only one cover). Each photo has optional Description and Caption fields, plus a Decorative switch for images that screen readers should skip. Missing descriptions fall back to the story title and photo number. Add meaningful descriptions when the image conveys information the story does not explain.
3. Check **I have permission to publish all uploaded photographs** once for the batch after reviewing rights in your private records. Any photo edit clears this confirmation, so confirm again when finished. Unconfirmed uploads stay off the website, even if the story is published. Never upload private files: asset URLs are public immediately.
4. Leave **Also show this story in Gallery** on to create its Gallery collection automatically; switch it off for a Journal-only story. No Event record or second Gallery entry is required. **Feature on homepage** is optional.
5. Press **Publish**. The same published title, description, date and photographs drive Journal and Gallery. Future publication dates stay hidden until that UTC day; publishing is manual and does not use paid scheduling.

Existing stories keep their photographs and addresses. Previously published photographs can be selected by reference; their separate approval and public visibility settings still apply. Older Event stories retain their automatic Gallery behavior until you explicitly change the Gallery switch.

There is no private website preview in this release. Review drafts in Studio; after publishing, check the website on a phone and desktop. Ask the maintainer for a supervised preview if a change needs review before public publication. Existing published text remains visible while you edit its next draft.

## Add or withdraw photographs

In **Photos**, create a photograph record, upload the original once, write a useful screen-reader description and a caption, and choose its category. Use the image crop/hotspot control to keep the subject visible. For example, describe the action and setting without adding unnecessary personal information.

New photographs start **pending**, with **Allow on the public website** turned off. Check permission and rights in your private records first. Then choose **approved**, switch public visibility on and **Publish** the media record. Both approval and visibility are required. A photograph can be used by several stories and programs without duplicating the file.

Leave **Also show in the standalone Gallery archive** off for photographs intended only for a Journal story. Turn it on only when the photograph should remain in the general archive independently of that story. The imported archive flags are retained, but imported photos remain hidden until you review and approve them.

To remove a photograph from all public website views, switch its public visibility off (or change approval), then **Publish** the change. Refresh the website. An article remains readable without photos; a collection with no approved photos disappears. The website may show a neutral blank photo area where its layout needs space. Unpublishing a media record also removes its public use.

Approval is **not confidentiality**. Uploaded image URLs are public, and people may already have downloaded them. For an urgent privacy withdrawal, contact the maintainer about removing the original asset and downstream caches as well. Never upload consent forms, private contact lists or sensitive records. Imported rights remain labelled unconfirmed; this is not a claim of verified consent.

## Rename, unpublish and maintain other content

Changing a story title updates its Gallery title without breaking the relationship. To change a published website address, copy the old slug (last part only) into **Previous addresses**, then generate or edit the new address and publish. Keep all older addresses. Studio blocks a rename if the last published address has not been preserved, and checks address collisions. The old link then redirects to the new one. Do the same for Events and Programs.

Use the document menu's **Unpublish** to withdraw a Journal story. Its Gallery collection disappears automatically. A photo marked for the standalone archive can remain there; disable that media record too if it must disappear everywhere. Deleting a draft of an existing published story only discards your unpublished edits, so use Unpublish when you intend to withdraw the public story.

**Events:** enter the actual date, optional display date/location, description and upcoming/past status. Update status after a gathering. Journal stories link to this record. The Events page uses Gallery for its past memories rather than a second archive to maintain.

**Programs:** edit the headline, description, full story, focus points, photo and colour. Keep the address history when changing a URL. Homepage featured-program choices are under Homepage.

**Homepage:** choose an approved Photos record as the hero image, edit the two headline lines, introduction, button label and destination. Empty fields retain the existing design defaults. Select featured stories in order (published and date-visible only); otherwise stories flagged for the homepage appear, falling back to the latest stories. Select Programs and Events in order. Featured Events appear in a homepage gathering section; event cover photos and program cover photos are chosen on their own records. Homepage and Site Settings edit tabs on the same existing singleton; no content is copied.

**Site Settings:** use Contact & organization to keep contact details, mission and social links current.

**FAQs:** edit the question/answer, choose a category, and set Display order (smaller numbers first). Publish the changes.

Published changes appear on the next fresh website request in CMS mode. Reload an already open page before checking. If something is missing, check Publish, publication date, Gallery switch, batch rights confirmation, media approval and visibility first. Ask the maintainer if the site reports a content error; never paste API tokens into a content field. Ask them to keep private dataset backups and review monthly Free-plan quotas periodically.

## Maintainer: legacy duplicate inventory

Do not rerun an importer or repair live data to tidy the menu. Run `npx tsx scripts/sanity-duplicates.ts /path/to/documents.ndjson` on a privately held authenticated export (JSON arrays also work). It reports dotted legacy IDs and possible duplicates by source identity or slug without any network calls, deletion or mutations. Anonymous public queries cannot reliably detect private dotted IDs. Review candidates manually: a match is not authorization to merge or remove anything. Keep all current `mvf-*` identities, owner edits, slug history, image assets and permissions.
