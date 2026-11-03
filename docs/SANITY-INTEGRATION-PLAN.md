# Future Sanity integration plan — not configured

## Objective

Replace the local adapter behind `src/lib/content.ts` while retaining routes, typed page props, layouts, accessibility, and visual components. This release intentionally contains no Sanity dependency, studio, project configuration, credentials, or remote writes.

## Proposed editorial models

| Document | Fields and validation |
| --- | --- |
| Site settings | Name, public email, telephone, location, mission, logo, default SEO. Validate contacts and preserve original logo. |
| Program | Unique slug, official title, number/order, category, headline, summary, paragraphs, focus items, media reference, contextual caption, visual theme, SEO. Slugs must remain stable. |
| Event | Unique slug, title, factual summary, status, verified date/time, timezone, optional verified location, media references, source/provenance, SEO. Do not turn a date-only archive into an invented timed event. |
| Gallery collection | Title, historical date label, category, ordered media references, source album, publication status. |
| Gallery image | Asset, required alt text, source URL, original hash, caption, focal point, rights/consent status, consent evidence reference, publication approval. Block publication if consent is not approved. |
| Homepage | Hero copy/media, featured program references, featured event references, mission introduction, closing invitation, SEO. |
| FAQ | Question, factual answer, category, order, source/reference. |
| Team member | Only create after approved identities, roles, biographies, portrait rights, and publication consent exist. No seed people. |

Testimonials and impact metrics require their own verified sources and explicit approval before adding schemas or UI.

## Adapter migration

1. Agree on approved content, ownership, image rights, and publication rules with the foundation.
2. Set up a Sanity project and development dataset in a separately authorised phase.
3. Implement queries that map to `SiteContent`, `Program`, `CommunityEvent`, and `MediaAsset`. Keep SDK types inside the adapter. Validate returned data at that boundary.
4. Import real records with source IDs, stable slugs, contextual captions, and original provenance. All currently unconfirmed media stays in drafts until approved.
5. Add preview/draft access with server-only credentials and clear preview status. Never expose write tokens to client components.
6. Add tagged caching and a signed revalidation webhook. Revalidate the relevant program/event detail, index, homepage, gallery, and sitemap after publication.
7. Use the image service for responsive formats and crops while preserving required alt text and approved focal points.
8. Test draft/published isolation, missing content, image removal, slug redirects, unknown routes, query errors, and webhook authentication.

## Publication and SEO rules

The upcoming-events hub must retain a helpful empty state when no approved upcoming record exists. Emit Event structured data only when its required dates and location/status are genuinely known. Keep Organization information consistent with the contact page. Publish FAQ schema only for visible, factual answers.

## Separate launch work

Sanity does not provide contact delivery or a donation processor. Those remain separate integrations with their own privacy, accessibility, and operational requirements. DNS, hosting, production deployment, and GitHub pushes require the owner's explicit authorisation and are outside this release.
