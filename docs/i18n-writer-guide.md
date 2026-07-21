# Website Texts — Editor's Guide

You have been given access to a Google Sheet that contains **every text on the
igovazd.am website** in three languages. Whatever you write there will become
the live site text after the next update. This page explains what you may
change and what you must not touch.

## What the columns mean

| Column | What it is | Can I edit it? |
|---|---|---|
| `key` | Technical ID of the text | **No — never** |
| `Где на сайте` | Hint showing where the text appears on the site | No (it's just a hint) |
| `hy` | Armenian text | **Yes** |
| `ru` | Russian text | **Yes** |
| `en` | English text | **Yes** |

## The rules

1. **Edit only the three language columns** — `hy`, `ru`, `en`.
2. **Never edit the `key` column.** It is how the site finds each text.
3. **Do not add or delete rows**, and do not reorder or rename columns.
4. **Never leave a cell empty.** Every text must exist in all three languages.
5. **Words in curly braces stay exactly as they are.** Some texts contain
   pieces like `{n}` or `{name}` — the site replaces them with real numbers
   and names. Keep them, unchanged, in every language.
   - ✅ `Showing {n} projects` → `Ցուցադրվում է {n} նախագիծ`
   - ❌ `Ցուցադրվում է n նախագիծ` (braces lost — this will be rejected)
6. **Don't mix alphabets in the Armenian column.** A common copy-paste
   mistake is a Russian letter («о», «а») hidden inside an Armenian word —
   it looks almost identical but breaks the text. Type Armenian with the
   Armenian keyboard only.

Nothing you do in the sheet goes live instantly, and every import is checked
automatically — if a rule above is broken, the system rejects the whole
update and reports exactly which row is wrong. So you cannot break the site;
the worst case is that your update is sent back for a small fix.

## How your changes reach the website

When a batch of edits is ready, tell Hayk. He runs the import, the automatic
checks pass, and the site is updated — usually within minutes.

## What is NOT in this sheet

- Film/series titles and descriptions, portfolio cases — those are edited in
  the site's admin panel, not here.
- The admin panel itself is in English only, by design.
