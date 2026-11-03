# A place in the rhythm

The first complete homepage direction uses the foundation's own gatherings as its visual centre. An oversized editorial serif, deep plum, warm ivory, dusty rose, sage, and saffron echo the warmth and variety of the original logo. The logo is never redrawn or recoloured.

## Narrative and composition

1. **Welcome:** an outdoor Seniors Club portrait meets a cinematic plum gradient and “Find your joy. Feel the connection.” The main action explores programs; the second route starts a conversation.
2. **Story:** generous ivory space and a fine animated rule frame the foundation's empathy, empowerment, and community values.
3. **Programs:** an editorial title introduces six real initiatives. Music uses a documentary portrait and a restrained rotating record motif. Wellness uses spacious sage typography. Senior engagement combines saffron with an arched photograph. Learning and food support finish with a quieter pair of editorial columns.
4. **Archive:** an asymmetric photo essay labels historical gatherings with source dates. Full photographs are available through descriptive links.
5. **Invitation:** a plum closing scene and fine elliptical lines invite participation without an unverified donation flow.
6. **Practical next steps:** accessible native FAQs, email, telephone, and location.

## Motion

GSAP and ScrollTrigger load as enhancements after hydration: staggered title entrance, restrained hero parallax, a story rule that draws with reading progress, chapter progress, slow record rotation, and a drifting wellness word. Native document scrolling remains in control. No pinned sections, scroll hijacking, looping animations, or WebGL runtime. Three.js is deferred because it would add weight without clarifying the story.

Reduced-motion preference bypasses animation imports initially; GSAP matchMedia also reverts active animations if that preference changes. Content is rendered on the server and visible without JavaScript. Small hover transitions and focus outlines support orientation.

## Content architecture

`src/data/site.ts` contains organization information, programs, selected imagery, archive captions, and FAQs. `src/lib/content.ts` is the server-side content boundary. A future Sanity adapter can return the same `HomeContent` shape. The page remains a server component; navigation and motion are separate client islands. No Sanity package, client, schema, project, or credentials are configured.

Future editorial entities: site settings, program, gallery album/image (source, alt text, crop, consent), event, team member, and SEO. Testimonials require approved source material. Publish only validated events and claims. No fictional records are seeded.

## Scope

This is the complete first homepage implementation. Further About, Program detail, and full archive routes belong to the next phase. Current navigation resolves to functional homepage sections. Every program enquiry goes to the foundation's existing public email address. No production deployment, DNS, hosting setting, or push is part of this phase.
