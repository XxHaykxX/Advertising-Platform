Release v2.6 — August 4, 2026

What's new and what's fixed on igovazd.am since v2.5.

— A guide for creators —
1. There is a page telling a creator what a project submission actually needs, at /for-creators. Until now the only way to find out was to open the form itself: about thirty fields, five repeating blocks, and two lines of help text between them. The page is open to everyone, so a creator can read it before deciding to register.
2. It explains every field the form asks for, grouped into the five steps of a submission — the texts, the press kit, cast and crew, production data, and what you are selling to a brand. Each field says what belongs in it and shows an example.
3. Each field carries a label saying how much it matters: "Required" (the form will not save without it), "Needed for publication" (it saves, but the project cannot reach moderation or the catalog), and "Recommended" (nothing is blocked, but an empty block simply does not appear on the project page, so a brand never learns it exists). Those three levels have always existed in the system and were never written down anywhere.
4. File requirements are stated plainly in one table: a poster is 16:9 up to 1600×900 and up to 8 MB, cast photos are square 800×800, video is either a YouTube/Vimeo link or an MP4/WebM file up to 50 MB. The page also warns that a portrait poster will be cropped to 16:9 from the centre, which used to be discovered only after uploading.
5. It shows a real, fully filled-in project from the catalog as a worked example.
6. It explains what happens after you submit: the moderation steps, a turnaround of up to two working days, the reasons a project usually comes back — and, separately, that editing an already published project sends it back for review and takes it off the catalog until it is approved again. That last one was true all along and stated nowhere.
7. Links to the guide sit on the "How it works" page, in the creator's cabinet next to "Submit project", and in the header of the submission form itself, where it opens in a new tab so a half-filled form is never lost.

— What a project needs before it can be published —
8. A project now needs a poster to be published. Without one the catalog card rendered as an empty rectangle, which is the first thing a brand judges a project by.
9. It also needs a format (feature, series, sitcom and so on). An empty format does not just leave a gap: the project drops out of the catalog's Format filter entirely, so a brand filtering the list never sees it — and the creator had no way of knowing.
10. It also needs an answer about the offer deadline: either a date or the "we accept applications continuously" flag. Leaving both empty was possible, and a brand then had no way to tell whether the project was still open.
11. A project created from this release onwards also needs at least one product placement. The platform is built around placements, yet a project could be published with none — a storefront with nothing on the shelves. Projects that already existed before this release are exempt from this one requirement, so nothing currently in the catalog is affected.
12. Projects published before this release are not exempt from points 8–10. Where a poster, a format or a deadline is missing, the project stays live as it is, but the next time it is edited it will not pass review until that field is filled in.
13. The form refuses a submission with the missing fields listed by name, as before — the list is simply longer and more honest now.

— The project form —
14. Fields that are empty and would block publication are marked in the form itself, as you type. Each one gets an amber outline and a line saying "The project can't be submitted for review without this", and the mark disappears the moment the field is filled. Previously the only signal was the checklist in the sidebar, which reflects the last save rather than what is on screen, so the first real warning came from being refused at submit.
15. The "What a brand sees" checklist covers four more things: countries, whether the cast rows actually have photos, whether the placements carry prices, and whether the texts exist in all three languages. That last one matters more than it sounds: a title, synopsis and logline only need one language to save, so a project can be Armenian-only while an English-reading brand is shown Armenian.
16. Clicking the Countries item in that checklist now jumps to the field, like every other item already did.
17. The production timeline — pre-production, shooting, post, release, and which stage the project is on now — is open to creators. It was visible only to staff, who were never going to fill it in on a creator's behalf: one stage had been entered across the entire site. The timeline is what tells a brand whether it can still get into the shoot.
18. The warning label on an unfilled publication requirement is legible. The amber it used failed the contrast minimum for text.

— Sponsorship packages —
19. A sponsorship package can be priced "on request", by leaving the price empty — the same as a product placement has always been able to. The price field used to be mandatory and turned a blank into 0, so a package nobody had priced yet was shown to brands as costing 0 AMD, which reads as free.
20. A package priced on request no longer makes the whole project look free. In the brand's comparison table of saved projects, and in the "Recommended for you" ranking, the cheapest package was calculated in a way that treated an unpriced package as costing nothing — so a project with one unpriced package appeared as the cheapest on the site and was recommended ahead of genuinely cheap ones.

— Forms across the site —
21. Mandatory fields are marked. A required label carries a red asterisk, and a field left empty on submit turns red with a (!) at the end of the row and a one-line explanation underneath.
22. That explanation is in the language of the site. It used to be the browser's own pop-up, which renders in the browser's interface language and cannot be styled: an Armenian visitor using an English Chrome was told "Please fill out this field" in English. This covers the contact block on the home page, /contact, registration, sign-in, password reset and the creator's profile; the application dialog gets the asterisks, since its submit button was already locked until the same fields were filled.
23. The contact form no longer accepts a blank message. Both forms marked the message as required, but the server took it either way.
24. A password reset request checks the address is a real address. A typo like "user@" got the same "check your inbox" answer as a valid one, with no mail sent and nothing to explain why it never arrived. Saying an address is malformed reveals nothing about whether an account exists.

— Across the site —
25. The thin white line across the top of every page with a dark hero is gone. The header is 64px tall and each hero pulls itself up by exactly 64px to sit under it, but the header's bottom rule added a 65th pixel, leaving one row of page background showing through.

— The admin panel —
26. Creating a member account reports what actually happened. The account was created and the screen still showed a generic error, so the same account was often created twice before anyone realised.
27. The button on that screen no longer spins forever. Returning to the page with the browser's Back button restored it mid-submission and left it disabled.

— Housekeeping —
28. Three fields that no form could reach any more — the project's language, its box-office gross, and a streaming source separate from "Available on" — have been removed from the database. They were empty on every live project. "Available on" and its list of platforms are unchanged.
29. The leftover language filter in the catalog and in the brand's project search is gone. Its checkbox had already been removed in an earlier release; only the filtering logic survived, reading a field nothing wrote.
