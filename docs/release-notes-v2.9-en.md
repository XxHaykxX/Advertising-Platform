Release v2.9 — August 7, 2026

What's new and what's fixed on igovazd.am since v2.8.

— The creator's cabinet —
1. The project form is the width it was designed for. It is the same form the admin panel uses, but the cabinet wrapped it in a 1200px container with a 240px menu beside it, leaving the working column about 540px while the admin panel rendered the identical form full width. On the two form pages the menu is no longer drawn and the page runs up to 1600px; every other page in the cabinet keeps its menu.
2. The form has a strip of section chips in its sticky bar. The form is roughly 11 000px tall and had exactly one way to move around it — the completeness checklist, which only appears when editing a saved project and only links what is still empty. Every section is now one click away, with the same scroll and two-second highlight the checklist uses. A chip carrying an amber dot is a section that still blocks publication, read live from the same set that outlines the fields themselves.
3. The save bar no longer slides under the site header. It is sticky, and in the cabinet it was sticking to the top of the window — behind the 64px header. It had never shown up in the admin panel, which has no site header.
4. A published project is read-only for its creator. Everything is still on screen, nothing is editable, and a banner points at the editors. Until now saving an edit pulled a live listing back out of the catalog until a moderator re-checked it, which brands were reading at the time. Rejected and pending projects are unaffected — they are edited and resubmitted as before.
5. The cabinet's home page and "My projects" are one page. The home page was three cards repeating the items in the left menu, so it was a stop on the way to the work rather than the work. It now opens on the projects themselves, with a greeting, one submit button and a count per status.

— Applications from brands —
6. Creators are out of the application chain. The section, its badge, the accept/decline controls, the in-app notification, the push and the e-mail are all gone from their side. The negotiation with a brand is run by the platform's own team end to end, and a creator was being handed a brand's budget and contact details to answer for a deal they do not close. Old notifications that link to the section still work — they now open the notifications list.
7. Applications are answered by super-admins and moderators. Before this it was the project's owner or a super-admin, which — once projects belong to creators — left every application waiting on one person.
8. Moderators can actually reach the applications they answer. The permission to answer had been widened without widening the door: the page itself was still gated on content editing, so a moderator got a "page not found" on the very screen their new-application notification linked to. Underneath, two separate checks had to pass and their overlap was a single role, so a moderator could not answer at all.

— Profiles —
9. The picture field on both profiles is a 96px thumbnail with the browse button beside it — round for a creator's avatar, square for a brand's logo. It used to be a full-width drop zone, a 160px preview, a button and a size hint stacked in the middle of the text fields: about 300px of chrome for one small picture.
10. Both pictures are cropped to a square before they upload. A landscape photo used to lose its sides at display time with no say in which sides.
11. Both profiles read in one order: the picture, then the editable fields, then the account's own read-only data. The separate "Account" card holding one uneditable e-mail is gone — its field now sits at the end of the form it belongs to.
12. The creator's profile shows the real status of the account. "Approved" was written into the page itself, so a blocked account was being told it was in good standing.

— Data integrity —
13. Saving a project no longer edits the platform's shared data. A creator's save was quietly adding rows to the site-wide people directory — photos included — and to the studio, country and streaming-platform dictionaries. One person's typo was permanent and visible to everyone. What is typed still lives on the project itself and still shows on its public page; only the shared lists are now staff-written.
14. An existing person's name and photo cannot be edited from a project form. Picking someone from the directory used to let a project overwrite their details for every other project they appear in. The row shows what the directory holds, with an "unlink" control that turns it back into a plain name owned by this project alone.
15. Package names from unapproved and rejected projects no longer appear as suggestions to everyone else.
16. A project's public reference (the #PP-… code) can no longer be rewritten by a hand-made request.

— Fixes —
17. Section chips and the save bar's buttons are finger-sized on phones. At 26px tall, in a strip where chips sit shoulder to shoulder, a miss landed on the neighbour.
18. The upload zone no longer prints "Accepts image/* less than 8.00MB." in English underneath Armenian copy. It was the one English string on the creator's form.
19. The section strip introduces itself to a screen reader in the reader's own language.
20. Armenian labels use the Armenian but (՝) as their separator instead of a colon, and the release label in the catalog no longer prints both at once.
