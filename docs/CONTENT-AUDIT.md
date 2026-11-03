# Musical Vibes Foundation — legacy website audit

## Redesign audit update — November 3, 2026

The snapshot and original logo are now present. The JavaScript gallery index has also been recovered and classified; 41 representative photographs were downloaded and visually reviewed. See [ASSET-AUDIT.md](ASSET-AUDIT.md) for current provenance, selections, exclusions, and missing material. Earlier collection notes below describe the initial starter state.

Captured from publicly visible website content November 3, 2026. Full HTML and media files require executing `python scripts/collect_legacy.py` on a network-enabled laptop.

## Source
https://www.musicalvibesfoundation.com/

## Original logo
https://www.musicalvibesfoundation.com/assets/logo.png
Expected local destination once asset collector runs: `public/assets/legacy/logo.png`.
Logo is not regenerated or modified. Keep original as reference, obtain permission to reuse brand assets.

## Page inventory
- `/` — homepage: introduction, six featured programs, why choose us, mission, music education, music therapy, community outreach
- `/pages/about.html` — about us, values: empathy, empowerment, community
- `/pages/program.html` — descriptions of all six programs
- `/pages/contact.html` — contact information
- `/pages/gallery.html` — two gallery sections
- `/pages/galleryseniors.html` — Seniors Club gallery (JS-dependent)
- `/pages/gallerymusicalvibes.html` — Foundation gallery (JS-dependent)

## Programs
1. Healing Through Music
2. Meditation and Yoga
3. Senior Engagement Activities
4. Nutrition and Health Guidance
5. Online Workshops and Talks
6. Food Drives for the Needy

## Publicly listed contact information
- Email: meenumalik77@gmail.com
- Phone: +1 (416) 832-6970
- Brampton, ON, Canada

## Content integrity / questions for client
- Existing homepage displays unverified marketing claim 'hundreds of people already benefiting'; do not propagate as fact without confirmation.
- Existing site mentions 'music therapy' and 'certified instructors'; validate qualifications and approved terminology before publication.
- Gallery photo rights and appropriate consent for identifiable people, especially seniors, need confirmation.
- No current events database identified; need actual event details before displaying upcoming events.
- Donation destination and accepted payment methods need confirmation; do not invent a donate endpoint.
- No DNS or existing hosting changes necessary during build. GoDaddy manages domain; Hostinger currently hosts site.
