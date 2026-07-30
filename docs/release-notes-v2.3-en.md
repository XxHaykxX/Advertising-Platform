Release v2.3 — July 30, 2026

What's new and what's fixed on igovazd.am since v2.2.

— Renaming a project —
1. Renaming a project in Armenian now shows up everywhere at once. The name was always being saved, but the project lists kept showing the Russian one, so a rename in Armenian looked as though it had not gone through at all. Existing projects were corrected too, so nothing is left showing an old name.
2. A change to a project reaches the catalog immediately. The catalog used to hand the next visitor the previous version and only refresh itself afterwards — so right after editing you would open the site, see the old text, and reasonably conclude the edit had failed.
3. Free-slot counts on the catalog are correct straight after an offer is accepted, declined or withdrawn. A package could keep advertising a slot for several minutes after it had been taken.

— The project list in the admin panel —
4. The filters say what they filter. The first one simply read "All" with nothing indicating it controlled whether a project is published; both filters are now labelled, and the published/unpublished choice is three buttons in a row instead of a dropdown, so the current state is visible without opening anything.
5. Two new filters: show only projects with something still missing, and filter by owner. The list already marked incomplete projects but gave you no way to gather them.
6. The line above the table breaks the projects down — in the catalog, unpublished, in the archive — and each number is clickable, filtering the list to exactly what it counted.

— Editing a project —
7. The Design block is three clearly separate cards — Poster, Gallery, Video — each with a heading and one line saying where that material will be seen. Before, three identical upload areas sat one under another with nothing to tell them apart.
8. Uploads show real progress: a block that fills as the file goes out, with the percentage, how many megabytes of how many have gone, and a button to cancel. Until now a 50 MB trailer sat behind a motionless spinner with no way of telling whether anything was happening or how long was left.
9. An uploaded video gets a preview picture taken from the middle of the clip. It used to be taken from the opening second, which in most edits is black or a title card, so trailers looked like empty tiles.
10. The "Browse" buttons are now "From media library". They were never duplicates of the upload area — one uploads a new file, the other picks one already uploaded — but the label gave no hint of that, so they read as a redundant second button.
11. The language tabs are compact instead of stretching across the form, and each language carries a dot showing whether its translation is complete. You can see which language is missing something without clicking through all three.
12. "Save and leave" saves. It was closing the dialog and quietly discarding the save — nothing was sent at all — so the change was lost along with the page.
13. After choosing to leave, the browser no longer asks a second time. Its own "leave site?" prompt appeared on top of a decision you had already made.

— The project page —
14. The strip of section tabs above the content is gone, at the owner's request. The button for making an offer stays where it was.

— The catalog —
15. All filter groups look and behave the same. Genre had no arrow and could not be collapsed, unlike every other group beside it.

— Elsewhere on the site —
16. The partner cards were removed from the About page — the same one-line description was repeated under every logo. The moving strip of partner logos stays.
17. The Portfolio page is temporarily hidden, along with its links in the menu and footer. Nothing was deleted: the cases are all still there and the section can be turned back on in one step once it is ready.

— Fixes —
18. Saving a partner works. On the live site it ended with "Something went wrong", even though the change had in fact been saved — so the same edit was often made two or three times over.
19. Signing out from the account menu in the header works. The confirmation appeared but pressing "Yes, log out" did nothing.
20. The sign-out confirmation is centred on the screen. It was being drawn inside the sidebar and cut off at the left edge.
21. A visitor who is not signed in and opens a page meant for members is now simply asked to sign in, instead of being taken through a sign-out they never asked for.
22. A security fix to file uploading, found in an internal review. It was possible for an uploaded file to be written outside the folder it was meant to go in. Nothing suggests it was ever used, and no uploaded material was affected.
