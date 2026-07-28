Release v2.1 — July 28, 2026

What's new and what's fixed on igovazd.am since v2.0.

— Cast and content —
1. Cast and crew names are now written in three languages. A name is a proper noun, so it is transliterated rather than translated: Արամ Խաչատրյան / Арам Хачатрян / Aram Khachatryan. Until now the Russian and English versions of the site showed the Armenian spelling in every card.
2. Correcting a name in the Cast & Crew directory updates it in every project at once. A typo used to have to be fixed project by project, and there was no way to see where it still stood wrong.
3. One button fills in the two remaining spellings from the one you typed. Anything already written by hand is left alone — a human spelling outranks a generated one.
4. Forty-seven wordings across the site were replaced with the content writer's versions: the home page headline, catalog headings, the "how it works" block, several genres.
5. Content Original Countries became a proper directory: a country typed once is offered on every project afterwards, and staff can remove one from the pool.
6. Box office was removed from the project form and from the project page. Two money figures were shown side by side, and only one of them meant anything to a brand.
7. Portfolio cases and partners are reordered by dragging. The order was a number you had to type into every row.

— The project form —
8. The Format switch no longer changes by itself. Saving a project twice in the same tab used to leave the switch showing the value from when the page was opened — the database was right the whole time, but the form lied about it, which is worse than a wrong number: you go and "fix" what was already correct.
9. "Save and leave" now actually leaves. Same root cause as the switch: everything that runs after a save stopped running from the second save onwards.
10. A role in Cast & Crew is a single choice again. It was a multi-select, and one mis-click had put seventeen roles on one person.
11. Studio name is a directory you can pick several entries from, and it sits directly above "Available on". Co-productions had nowhere to go and the same company kept arriving spelled differently.
12. A project whose placement deadline has passed leaves the catalog on its own. Nothing is deleted and no switch has to be flipped — the day of the deadline still counts as open.
13. "Placement type" and "Expected release date" were removed from the form, the catalog and the database.

— Product placement, now its own thing —
14. Product placement and sponsorship are two separate offers, and the form no longer confuses them. What it called "Placement(s)" was sponsorship all along — the logo on promo materials, credits, premiere invitations — so it is now called Sponsors, with everything already entered kept as it was.
15. Product placement — the brand appearing inside the story — has its own section above sponsors. A row is a sponsorship row plus a still of the scene, so a brand sees what it is buying rather than reading a line of text.
16. The price of a placement is optional. A creator who has not priced an integration leaves it empty and the site says "on request"; the brand asks and the terms are agreed, instead of a number nobody committed to being published.
17. The project page shows the placements with their stills above the sponsorship packages, and a project's card in the catalog says how many placements it offers. The count comes from real rows, so a project with none stays quiet rather than advertising a zero.

— Sponsorship packages —
18. The fields in the sponsorship table have visible frames. The row used to read as a paragraph of text, so it wasn't obvious anything there could be typed into.
19. The Available and Total columns are wide enough for their own labels. They were clipped to "Availa", which left an empty pair of cells telling you nothing.
20. Price starts empty instead of at zero, and reads back in thousands: 1 500 000, not 1500000. The zero had to be deleted before every price.
21. Typing Total fills in Available, since nothing is sold yet on a new package. Once the two differ — a slot has gone — what you entered is left alone.
22. Ticking Exclusive sets Total to one slot and locks the field. A tick that said "exclusive" next to a total of five contradicted itself. A slot already taken is not put back on sale.
23. A copy button duplicates a row. Gold, Silver and Bronze differ by a price and a line or two, so copying beats retyping.
24. "Add package" now also offers ready-made ones, built from the ones other projects already use. Whatever is written once is offered on the next project for free; the price is never carried over, because that is always project-specific.
25. The row layout now adapts to the width of the card rather than the window. On a 1280px screen the form column is about 640px wide, where the eight-column layout squeezed the name field down to nothing.

— Uploading files —
26. Every upload field on the site looks and behaves the same, and every one of them takes a file dragged onto it. Before, a file could only be attached through a dialog, and dropping one on the page did nothing at all.
27. A field that already holds something shows that thing, with Replace and Remove appearing on it. It used to keep an empty "Upload a file" rectangle above the picture it already had, which read as two separate places to drop a file.
28. The gallery is a grid of tiles ending in an "add" tile, and a file can be dropped anywhere on the grid. Reordering pictures by dragging works as before.
29. The media library page and the media dialog use the same zone as everything else. The dialog previously had no drop zone at all.
30. A video dropped onto the media library no longer disappears. Anything dropped outside the old box was filtered as an image and silently discarded in the Videos folder.
31. A file that is too large is caught before it is sent, on the media page as well. Past the size limit the request is cut off in flight and the server's own message never gets a chance to appear.
32. The media dialog opens in English inside the admin panel. It was appearing in Armenian, because it fell back to the site's default language instead of the panel's.

— The public site —
33. The FAQ is answered in all three languages. Five of the six answers used to read "Coming Soon" in Armenian — the language most visitors see first.
34. The catalog headline is visible again, and breaks into two lines where it should. It was rendering as nothing at all.
35. Section headings are the same size across every page, and the small label above them is now on every page rather than two of them.
36. The line of facts under a project's title — genre, format, studio, countries — carries the same icons the catalog card uses.
37. On the Russian version of the About page, the "Product placement" badge was still in English. Fixed (IA-26).

— Data —
38. The same studio was listed three times under three spellings, splitting its own projects between them. They are now one entry, and the previous values were kept in case the split turns out to have been deliberate.

— Waiting on a decision —
39. The Portfolio section is demo material. All six case studies come from the seed data: the brands, the results and the numbers are invented, and the pictures are stock frames — while the section promises "real placements, real results". It can be hidden until real cases exist, relabelled as examples, or filled with real ones. Nothing was touched, because making invented cases look more convincing is not a fix (IA-21).
40. Nine of the ten published projects have no placement packages at all, and the tenth has one without slots. A brand opening those projects sees no price and nothing to buy. Someone has to write them, and the rule that a project cannot be published without a package needs to start applying to projects that were published before it existed.
41. Two content tasks are with the content writer: the portfolio translations (IA-20), and the tagline and synopsis of seven projects that still show Armenian text on the Russian version (IA-23).
42. Three tickets are in UAT waiting for QA: IA-22, IA-25, IA-26.
