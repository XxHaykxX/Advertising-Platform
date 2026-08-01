Release v2.5 — August 2, 2026

What's new and what's fixed on igovazd.am since v2.4.

— The catalog and the project cards —
1. A project's genres are all shown now. One genre used to sit on top of the poster and the rest were pushed under the title, so a project tagged Drama and Sport looked like a drama. The badge over the poster is gone and every genre appears under the project name, with a "+N" pill when the list is long.
2. The project page lists every genre too. It was reading an older single-genre field, so no matter how many genres were ticked in the admin, only the first one ever reached the page.
3. A card no longer shows an icon with nothing next to it. A project without a country printed a lone map pin, and the same happened for format.
4. The list of places a project will be watchable now says what it is: "Available on:" above the row, instead of a bare row of names.
5. The Format filter offers only the formats the catalog actually holds. It listed all twelve, so nine of the checkboxes filtered the list down to nothing. The Language filter had the same problem and was fixed the same way. Genre and Platform already worked like this.
6. The production stage ("Filming", "Post-production") is gone from the site. It said nothing a brand could act on, and it aged badly — a project sat at "Filming" long after filming ended, because nobody had a reason to go back and change it.

— Planning dates —
7. A release date can now be as precise as it really is: an exact date, a month and a year, or just a year. The site prints exactly that and never invents the rest, so a project announced for 2027 shows "2027" instead of a made-up day in January.
8. A release date is no longer required to publish a project. Plenty of projects go to market before the date is settled, and that used to block them from reaching the catalog.
9. The deadline for offers can be marked "Ongoing" for an open-ended call. The card and the project page then show "Ongoing" instead of a date and a countdown, and the project is never treated as expired and dropped out of the catalog.

— Speed —
10. Pages are roughly half as heavy as they were. The catalog went from 507 KB to 300 KB of code, the project page from 528 to 331, the project form from 668 to 412, and the admin sign-in screen from 302 to 108. The site's own dictionary — 976 phrases in three languages — was being sent to the browser on every page and is now kept on the server; the mobile menu, the drag-and-drop editors and the image cropper load only when they are actually needed.
11. Images are resized before they are sent. Image optimisation had been switched off, so a 48-pixel cast portrait downloaded the full 800×800 original. Posters and hero art in the site's own artwork were recompressed too, cutting them from 2.59 MB to 1.05 MB with no visible difference.
12. Animated GIFs stay animated after upload. They were being frozen to their first frame while being processed.

— The project form —
13. The "What a brand sees" checklist reads like a checklist again. On the live site it was showing internal names ("completeness.item.tagline") instead of "Logline".
14. Clicking an unfilled item in that checklist takes you to the field itself, which is briefly highlighted, with the cursor already in it. It used to scroll to the section — and the General section alone holds about eight fields, so it still left you hunting.
15. Format is an editable field again, in the admin and in the creator cabinet. The catalog filters by it, but it had been dropped from the form and was only ever guessed at, so brands were filtering by something no editor controlled. It also joined the checklist, because an empty Format is worse than an empty section: the project disappears from the Format filter altogether.
16. Format now sits directly above Genre — the two answer the same question about a project. The neighbouring field, which decides whether a project is a single title or a series, was itself labelled "Format" and has been renamed "Type"; that collision is why the admin looked like it offered two formats while the catalog listed twelve.
17. Empty fields show an example of what belongs in them instead of repeating their own label, and the age rating's empty option reads "Not set" rather than a dash.

— Edit history —
18. Every save of a project, portfolio entry or partner is recorded: who changed it, when, and what the record looked like before. Until now nothing tracked this, so damaged content could not be traced to an edit or an author.
19. Any earlier version can be restored, together with everything attached to the project — cast, packages, placements, production timeline.
20. Deleted records are kept in their own section and can be brought back. This is the case that prompted the feature: three projects disappeared with no record of who removed them.
21. Each project, portfolio entry and partner has a History tab next to its editor, so you can look at the past of the record you are editing without leaving the page — and without losing an unsaved draft.
22. Deleting a file from the media library now warns instead of refusing. It lists the records using the file, and separately how many past versions still point at it, so you can see what a future restore would lose.

— Accounts and access —
23. Super-admins can change a staff member's role — publisher, moderator, translator, super-admin — which previously required a developer. The confirmation says what the person will be able to do, not just the name of the role.
24. Accounts can be deleted from the admin panel. Deleting says what goes with the account (a brand also loses its shortlist and its submitted applications), and it refuses to delete an account that still owns projects — those have to be reassigned first, so a cleanup can never take paid-for content with it.
25. The safeguards behind both: nobody can delete or demote themselves, the last active super-admin cannot be removed or demoted, and member accounts are managed through their own approval flow rather than from here.
26. The project list shows the owner's company instead of their personal name, and the owner filter now matches what the column displays.

— Content —
27. The catalog holds real projects from Kinodaran, with real cast, packages and placement opportunities in place of the demonstration entries.
28. Cast and crew members who were missing a photo now have one, on the directory and on every project page they appear on.
29. Translations continue to be filled in across the site by the content team; each page shows whatever language exists and falls back to the original.
