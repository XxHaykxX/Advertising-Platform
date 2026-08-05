Release v2.7 — August 5, 2026

What's new and what's fixed on igovazd.am since v2.6.

— The catalog card —
1. The project card has been rebuilt around the decision a brand actually makes. It used to be one wrapping row in which the project title, its genres, the free-slot count and the placement count were all the same grey pill, so a genre looked exactly like a scarcity signal. There was no price anywhere, which meant two listings could not be compared without opening both.
2. The age rating (0+, 6+, 12+, 16+, 18+) is shown, as a solid dark plate on the top-left corner of the poster. It is one of the first things a brand screens on and it was stored but never displayed on the card. The plate is deliberately opaque rather than translucent: posters are arbitrary artwork and a see-through badge vanishes on a light one.
3. The title has its line to itself. Nothing wraps around it any more.
4. Genres are capped at two, with a "+N" for the rest, so a four-genre project no longer silently loses two of them to the wrap.
5. The format chip (Feature, Series, and so on) sits next to the genres, and is hidden when it would simply repeat one of them — "Animation" is both a genre and a format bucket, and the very first card in the catalog read "Animation · Adventure · +1 · Animation".
6. The card now names what it is selling. A project sells two different things — a product placement inside the story, and a sponsorship package — and the old card mixed their numbers into one line, so no figure was attributable: "8 / 10 slots" counted packages only, "5 placements" counted the other table, and the single "from" price was the cheapest of both at once. There are now two labelled lines, each with its own count and its own "from" price.
7. Sponsorship capacity is a progress bar with "N of M slots left" under it, instead of a bare fraction.
8. A price is shown, as "from X" in the currency you have selected, and reads "on request" when nothing is priced. An unpriced offer is excluded from the calculation rather than counted as zero, so one unpriced package can no longer make a project look like the cheapest on the site.
9. The list view of the catalog was given the same treatment. Switching between grid and list no longer changes which facts a project appears to have.
10. The full list of platforms a project will be available on is shown, not the first few. Where a project comes out is something a brand weighs, and a "+1" hides which channel it is.
11. For a signed-in brand, the button on the card opens the application dialog directly instead of repeating the link to the project page.

— The application form —
12. Applying to a project asks for four things instead of seven. "Your price", "Payment type" and "Preferred timing" are gone from the dialog, from both cabinets, from the admin panel and from the notification e-mail. They belong to the negotiation that follows an application, not to the form that opens it; anything a brand wants to say up front goes in the message. What remains: which offer you are applying for, what you want to place, an optional message, and a phone number (hidden if your profile already has one).
13. The price of the offer being applied for is unaffected — that is the creator's figure, and staff still see it next to the offer's name in the admin panel.

— Placements and sponsorship packages —
14. A new project now opens with three positions already in place: an advertising integration under Placements, and a general sponsor and an official sponsor under Sponsors. Every project was starting from an empty form even though the same three positions were being typed in each time — and, because a project cannot be sent for review without at least one placement and one package, every new project also started life blocked.
15. Projects that already exist are untouched. They get an "Add the standard set" button next to Add placement and Add package, which adds only the positions that are missing and never duplicates one you already have.
16. The name of a placement or package, and its list of what the brand gets, can be entered in Armenian, Russian and English. Each position has its own language switcher with a filled/empty dot per language, the same control the project's own texts already use. Whatever was entered before is preserved and now appears on the Armenian tab.
17. Leaving a language empty is safe: a reader in that language sees the Armenian text rather than an empty offer, so nothing disappears mid-translation.
18. A project can carry a PDF presentation. There is a "Presentation (PDF)" field in the Design section of the form — one file, up to 20 MB — and when a project has one, its page shows a "Download presentation" button under the facts, before the offers, so a brand can take the deck before reading the packages.

— The brand's cabinet —
19. A brand can edit its own display name. The profile page read the name from the database and rendered no control for it, so the one string everyone else sees — the "From" on every application, and the only identifier in the e-mail a creator receives — was frozen at whatever registration captured. A typo made on sign-up was permanent.
20. A brand can upload its own logo, which the creator side has had for some time.
21. "Personal page" and "Favourite projects" have moved out of the left sidebar and into the header, next to the logo. They are the two most-used pages of the cabinet. They are moved rather than duplicated — two doors into the same page make it harder to tell where you are — and on a phone they fold into the menu with everything else.

— The home page —
22. The wall of posters behind the headline is under a dark blue veil, so the headline and the two buttons lead and the section reads calm. The posters are still visible, just quieter.
23. The "Matching & Deal" card that closed the "How it works" section has been removed. It restated what the two columns above it already say.

— Fixes —
24. Editing a project shows up on the site immediately. A save cleared the cached data but never refreshed the pages that render it, so a change — an age rating, a title, a price — stayed invisible on the home page and in the catalog until a manual reload, which looked exactly like the save having been rolled back.
25. The Format field fills itself in from the Type radio above it when left blank. It is a publish requirement that asks the same question as the control directly above it, so a project could sit refused over a field whose answer the form already had.
26. Documentaries and animation are filed correctly. A documentary was being classified as a feature film and animation matched nothing at all, so a cartoon series appeared in the catalog as a plain feature — and the Format filter never found either.
27. Icons in the cabinet no longer contradict the section they sit in. The empty "My offers" page used the heart that belongs to Favourites one row above it; removing a project from Favourites used a bare "×", which reads as "close" rather than "take this off my shortlist"; and only two of the seven notification types had an icon at all, so "your project was approved" looked identical to a rejection. Every type now has one — a tick for approvals, a cross for refusals, a clock for "sent for review", a megaphone for announcements.
28. The Armenian word for the non-brand side of the platform has been changed to «Հեղինակ» throughout.
29. "Brand offers" in the admin panel is now just "Offers" — the section has always shown every offer on the platform.
30. The "Manage projects" and "Manage users" buttons have been removed from the admin dashboard; both sections are in the sidebar.

— Security —
31. Every file path the site stores is now checked when it is saved, not only when the file is uploaded. A poster, a gallery still, an uploaded video, a placement or package image, a cast photo, a portfolio image, a partner logo and the new PDF presentation must all point inside the site's own uploads folder. Nothing stored today pointed anywhere else — this closes the door rather than fixes a leak — but these values are rendered as images and links on public pages, and a hand-built request could previously have pointed one of them at another server.
32. An uploaded presentation must genuinely be a PDF: the file's own signature is checked, not just the type the browser claims, and the file is always delivered as a download rather than opened in the page.

— Housekeeping —
33. Six database columns behind the three removed application fields have been dropped.
