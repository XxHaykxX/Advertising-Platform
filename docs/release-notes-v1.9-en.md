Release v1.9 — July 26, 2026

What's new and what's fixed on igovazd.am.

— Interface translations —
1. New "Translations" section in the admin panel. All 855 interface texts — menus, buttons, forms, catalog labels, report labels — are edited in one table in Armenian, Russian and English.
2. New "Translator" role. The content writer signs in with her own login and sees only the Translations page; the rest of the admin panel stays closed to her.
3. Automatic saving. Every edit is stored as a draft the moment it is typed, so nothing is lost if the page is closed or reloaded.
4. Separate "Save" and "Publish" buttons. Save pushes anything that has not reached the server yet and reports how many keys it saved; Publish puts the texts on the live site, and the site updates a couple of minutes later.
5. Colour marks on rows: green (checked), red (needs a decision), blue (in progress), plus a filter for each colour. This replaces highlighting rows in a spreadsheet.
6. Notes on any text. A remark stays attached to the key and is visible only inside the admin panel.
7. Search and filters: by key or by text, by section of the site, and quick filters for "empty / problem" and "changed" rows.
8. Spreadsheet-style table. The header row and the key column stay in place while scrolling, rows come in compact or roomy mode, sections collapse and expand, and any row opens up for long texts.
9. Keyboard shortcuts. Enter moves down a column, Shift+Enter adds a line break, Esc undoes the current cell, Ctrl+S saves everything.
10. Copy from another language in one click, as a starting point for a translation.
11. Excel round-trip. Download the whole table as a CSV file, edit it in Excel and upload it back; before anything is applied you see how many keys will change and exactly what changes.
12. Undo and redo. Back and Forward buttons plus Ctrl+Z / Ctrl+Shift+Z, covering texts, colour marks and notes; a whole CSV upload is undone in one step.
13. The list loads as you scroll, with a "Show all" button for when you need to search the entire table.
14. Checks before publishing: empty cells, Russian letters left inside Armenian words, missing {name} placeholders, over-long texts and invisible characters. A problem appears in red on the row and stops the publish until it is fixed.
15. The Google Sheet is no longer part of the process — translating and publishing both happen in the admin panel.

— Fixes —
16. The mouse wheel now scrolls lists inside a page — dropdowns such as cast roles, the media library and the catalog filters. Smooth page scrolling was swallowing the wheel.
17. The green "saved" tick on a row disappears after a couple of seconds instead of staying there for good.
18. Admin sections are now closed to staff roles that have no business in them.
19. A custom platform typed in by a creator now reaches the shared list of platforms.
20. Internal security and performance improvements.
