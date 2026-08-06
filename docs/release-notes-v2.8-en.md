Release v2.8 — August 6, 2026

What's new and what's fixed on igovazd.am since v2.7.

— The project page —
1. The hero has been rebuilt around the deal card. The right column held the card, the left held a video frame and then about 300px of nothing, because the card is roughly twice as tall. The synopsis, meanwhile, ran the full width of the page underneath at a line length no one reads comfortably. The synopsis now sits in the left column under the images: it reads at a sane measure and it fills the space that was empty.
2. The gallery has a strip of thumbnails under it. The slider's arrows only ever moved one frame at a time, so on a project with a dozen stills the last one was eleven clicks away and nothing on screen suggested it existed. The strip scrolls and drives the same slider.
3. "Where it airs" and the release date have moved into the deal card, joining the genre, format, studio and countries that moved there earlier. A brand read the price in the card and then had to scroll to a second card to find out where and when the thing actually shows.
4. Fact labels in the deal card wrap instead of being cut off. At roughly 185px per column the Armenian labels are longer than the space, and truncation had turned half of them into "ՆԿԱՐԱՀ…".
5. The apply button below the facts has been removed. It duplicated the deal card's own button exactly — same behaviour, same dialog — while sitting below the fold, so the page looked like it was asking twice.
6. The auto-scrolling storyboard strip has been removed. It drew the same gallery images the slider already shows, and once those images got a real clickable strip it was the third copy of one image set on one screen.
7. The sales deck download has moved into the deal card, directly above the apply button. It used to have a section of its own between the facts and the timeline, set at text weight, where it read as a caption rather than something to click. The deck is what a brand reaches for before it is ready to apply, so it now sits where that decision is made. The duplicate copy above the footer is gone.
8. The deal card is the width it was designed to be. It was rendering at 232px instead of about 500. The thumbnail strip added in this release puts roughly 1030px of thumbnails into the left column; the strip scrolls, so none of that is ever visible at once, but the browser still counted the full width when sizing the two columns and squeezed the card into what was left. Every fact in the card then wrapped onto two or three lines. Measured after the fix: 407px at 1024 and 490px from 1280 up, with no horizontal scroll at any width from 320 to 1440.
9. The deal card no longer stretches. It used to match the height of the video beside it, which was right while the card was the taller of the two columns. Once the synopsis and the thumbnails moved into the left column that stopped being true, and the card opened a ~200px hole between its last fact and its button — inside a bordered card, where empty space reads as something that failed to load.

— Placements and sponsorship packages —
10. Both offer sections use one identical card. Placements had grown a different treatment from sponsorship packages — a still behind a blurred glass panel with the name and price laid over it — and two sections sitting one above the other read as two different products when their cards disagree. The image is back on top and the copy back under it, down to the padding, the type scale, the rule and the bullets.
11. The muted text on offer cards is legible. The body copy, the "on request" price and the benefit lines were set light enough to disappear against the card.
12. The "X of Y slots free" line has been dropped from the offer cards. The same count already leads the deal card for the whole project, and repeating it on every card turned each offer into an inventory row. The numbers themselves are unchanged and still control whether an offer can be applied for.
13. Cards in the same row line up again. The "exclusive" mark is the one element some packages carry and others do not, and giving it space only when present pushed that card's name, price and rule out of step with its neighbours. Every card now reserves the line whether or not it has the mark. It costs about 26px per card and cannot break at any width; measured at 320, 360, 414, 768, 1024, 1280, 1440 and 1920. Screen readers do not announce "exclusive" on an ordinary package.
14. A package with no cover starts at its name instead of showing a grey block with a faint roman numeral in it. The placeholder filled a third of the card with nothing.

— The home page —
15. The two trust figures open the page now, directly under the hero, instead of sitting between the featured projects and the sign-up section. The scroll-down arrow follows them, so it lands on the next section instead of jumping over one.
16. The contact form has been removed from the home page. The footer already carries the contacts and there is a page of its own for getting in touch, so the page was asking for the same thing twice at its very end.
17. The gap between the featured projects and the sign-up section has been closed. Both of the sections that used to meet there had the same grey background, so their two paddings ran together into roughly 190px of empty colour. Measured after: 145px, with a change of background in the middle of it.
18. The "create an account" button in the sign-up section opens the sign-up form. It linked to the catalog while calling itself something else.
19. "Browse projects" and "Create an account" are separate pieces of text. One button label was doing both jobs — it appears on the hero, on the About page, on the How it works page and on the sign-up card — so renaming it for the sign-up card renamed the catalog button everywhere else at the same time. The catalog button reads "Տեսնել նախագծերը" again.

— Signing in —
20. An open admin session and an open member session no longer evict each other. Both audiences shared one browser cookie, and a browser keeps one value per cookie name, so signing into the member cabinet silently ended an editor's admin session and vice versa. Using different email addresses did not help — the collision was on the cookie, not the account. Staff sessions are unaffected by this release; members are signed out once and will not be again. Signing out of one cabinet now leaves the other alone.

— The admin panel —
21. The section holding the poster, the gallery, the video and the presentation is called "Media". It was called "Design", and the presentation upload was reported as missing entirely — the field had been there all along, in a section nobody would open looking for a PDF.
22. The presentation upload is a single attachment line under the three asset cards rather than a fourth card of its own. At the same size as Poster, Gallery and Video it read as a fourth required asset, which it is not: it is optional and it blocks nothing. Its Replace and Remove buttons are visible instead of appearing on hover — a control you have to discover is the wrong trade on a field that was already hard to find. The empty field went from 166px to 42px.

— Content —
23. Cast and crew names are filled in all three languages across every person on the site. A missing Armenian spelling did not render as blank, it rendered Latin letters beside Armenian ones, which is what was reported as "the names disappeared".
24. Eleven line-art illustrations are available in the media library for use as placement and package covers.

— Fixes —
25. The name field in the admin panel's cast editor now tells a screen reader which list of suggestions it controls. It announced itself as a combobox without ever naming its own dropdown.

— Housekeeping —
26. 212 unused entries have been removed from the site's text dictionary, which drops from 1219 to 1007. They belonged to features that no longer exist — an ROI calculator, a deep-dive section, an investment breakdown, the old application dialog and an audience filter — or to forms that were rebuilt against different text. Nothing that is still reachable was touched: 148 entries that are only ever looked up at run time (genres, cast roles, the completeness checklist, format categories, FAQ rows, brand categories, portfolio metrics) were identified and kept, and three more were kept deliberately because the content editor has unpublished drafts on them.
