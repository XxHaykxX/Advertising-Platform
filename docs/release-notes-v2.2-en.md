Release v2.2 — July 30, 2026

What's new and what's fixed on igovazd.am since v2.1.

— A brand's offer —
1. An offer can now be made for a product placement, not only a sponsorship package. The list comes in two groups: placements first, then packages. Until now only packages could be picked, so a brand that wanted to appear inside the story could describe it in prose and nothing else, and the seller had to guess which scene was meant.
2. The price in the offer is shown in drams — the currency the deal is actually done in. The conversion into the visitor's own currency moved to a line under the list, "≈ … at today's rate", and appears only when the page is not already being read in drams. A package priced at 2,500,000 ֏ used to reach the seller as "€5,988", a number that is different tomorrow.
3. A "your price" field was added. The brand names the amount it is prepared to pay. This matters most on placements priced "on request", where the whole point is for the buyer to open with a number. Each round's amount is kept separately in the history, so resending does not overwrite what was offered before.
4. The required field is the right one now. "What is being placed" must be filled in; the free-text message is optional (and, if written, must still say something — twenty characters). It used to be the other way round: the seller got a paragraph of prose and still did not know what the offer was about.
5. The phone field carries a country flag and dial code. A phone field also appeared in the brand's own profile — there was none at all before, so a number could only ever be given through the offer popup, with no way to correct a typo afterwards.
6. The fields are ordered the way the thought runs: what the offer is for → what is being placed → your price and how you'd pay → timing → message → phone.

— One offer, one application —
7. A second application no longer erases the first. An application now belongs to a specific offer rather than to the project as a whole. Sending one for a second placement on the same film used to overwrite the first: the creator's answer was wiped, an already accepted deal was rolled back to "sent", the slot it held went back on sale — and nobody was told.
8. The card you applied through is marked as sent; the neighbouring cards stay active. Withdrawing from the cabinet removes that one application and frees its slot alone.
9. Accepting an application for a placement now books the slot. Slot accounting had been written for packages only, so the same exclusive placement could be sold to two brands, each told it was theirs.

— The project page —
10. Every offer card has its own apply button. There used to be one button for the whole page, and nothing said which offer it meant.
11. A sticky bar at the foot of the page: "placement from … · N of M free", plus a button. It appears once the page is scrolled and no longer covers the content beneath it.
12. A guest who clicks apply is not lost. After signing in — or registering — the visitor comes back to the exact offer they started from, with the popup already open.
13. Four tabs: Overview · Production · Team · Offer to brands. A tab for an empty section is not shown. On a phone the active tab scrolls itself into view, and a section heading no longer lands underneath the tab bar after you click through to it.
14. The first screen now carries a deal card: production budget, "placement from …", free slots, the application deadline with a countdown in days, and a button. The right-hand column used to hold the budget alone, and on a phone there was no apply button anywhere in the first two screens.
15. One short label on every button: "Apply". The same action had been going by three different names.
16. The production timeline was fixed. It now shows that it scrolls (a fade at each edge), parks itself on the current stage when the page opens without dragging the page along with it, no longer clips the cards at either end, snaps stage by stage on a phone, and the dots below it have a tap target big enough not to hit the neighbouring stage.
17. The cast and crew strip: arrows dim at the ends, the edge of the next card stays visible as a sign there is more, and on a phone it is swiped.
18. The strips can be dragged with the mouse. Dragging from a photo did nothing at all — the browser was starting to drag the picture itself. Now the whole strip moves, from anywhere on it, and without lag.
19. A series format is written plainly: "12 ep × 11 min".
20. The application popup behaves properly: the keyboard stays inside it, Escape closes it, and the mouse wheel scrolls the form rather than the page behind it.
21. When the page is printed, the tabs, the sticky bar, the buttons and the strip arrows are left out.

— The admin form —
22. The placement and sponsor editors are cards, not a table. Instead of six columns squeezed into a form column, each offer is a card with a 16:9 preview that looks the way it will look on the site. Filled ones collapse, the order changes by dragging, and deleting asks first.
23. The "what the brand gets" list is edited line by line: Enter starts the next item, Backspace on an empty one removes it, Alt with the arrow keys moves it.
24. Images are cropped to 16:9 at the moment they are uploaded.
25. A sponsorship package can now carry an image, and it is shown on the project page.
26. A "what a brand will see" checklist sits beside the form. It says which sections are empty, and each item links to the right place in the form. The project lists — both in the admin panel and in the creator's "My projects" — gained an "incomplete profile" marker.

— Elsewhere —
27. Project cards in the brand cabinet are complete: genres, free slots, number of placements, release date, platforms. A brand used to see less about a project inside its own cabinet than a passing visitor saw in the catalog.
28. The "How it works" page gained a diagram: two flows, the creator's and the brand's, meeting in the middle at the offer-and-agreement node.
29. Cast and crew roles are translated all the way through. A few were still appearing in Armenian on the Russian and English pages.
30. "Վալդակար" was filled in as a complete worked example: description in three languages, poster, gallery, trailer, five placements and four sponsorship packages with stills, ten production stages, and a full cast and crew.
31. A blocked member no longer hits a dead end. A page opened on a deactivated account redirected in circles and never loaded; such a visitor is now simply signed out and left on the login page.

— From the QA round —
32. Logging out works again. Signing out was sending the browser to an address that does not exist outside the server, so instead of the login page you got "This site can't be reached". It also caught anyone whose session had been blocked or deactivated while they were signed in — they had no way back to the login page at all.
33. A brand can open a project it has applied to even after the creator takes it off the catalog. Both "My offers" and the dashboard listed such a project but the link led to a "not found" page — so a brand could hold an accepted deal and have no way to look at it. The project now opens, with the offer section shown as closed rather than inviting a fresh application.
34. Clicking a media item under "Active interests" on the dashboard opens it. Same cause as the above.
35. Signing in from the header brings you back to the page you were reading. A guest looking at a project who clicked "Sign in / Register" ended up in the cabinet, having lost their place. The apply buttons already did this correctly; the header link did not.
36. The Portfolio, About and FAQ links in the footer work for signed-in members. All three sent a member back to their dashboard instead — visible links leading nowhere. FAQ also gained a page of its own at /faq, so it can be read and linked to directly instead of only as a section of the home page.
37. The logout confirmation holds the page. The wheel scrolled the page behind it and the Tab key walked out of the box onto the links underneath.
38. The website field on the brand profile is checked properly. It accepted addresses written with backslashes and stored them exactly as typed. A bare "example.com" — what most people type, and what the browser used to reject outright — is now accepted and saved as a proper address, while anything that is not a real web address is refused with an explanation instead of being quietly stored, which matters because this value is shown to others as a clickable link.
39. The offer form explains why the send button is disabled. It was correct to stay disabled — the message was too short — but the field was labelled "optional" while demanding twenty characters, and nothing said which field was holding things up. Each field now says what it needs, and the message field's own wording no longer contradicts itself.

One issue reported in the same round is still open: a brand's budget range was said to flash a different option for a moment when changed. It could not be reproduced — the field was recorded once per screen frame through both the change and the save without a single wrong frame — so it is waiting on a recording before anything is changed.
