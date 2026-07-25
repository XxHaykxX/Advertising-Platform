# Website Texts — Editor's Guide

You now edit **every text on the igovazd.am website** directly on the site's
admin panel, in a page called **Translations**. No spreadsheet, no GitHub,
nothing to install: just a login and a page in your browser.

## Signing in

1. Go to `igovazd.am/admin/login`.
2. Sign in with the email and password you were given.
3. You will land straight on the Translations page — it's the only thing
   your account can open, so there's no menu to get lost in. (Its own
   heading is written in Russian — «Переводы интерфейса» — that's just how
   it's labelled inside the page; ignore it.)

## Working in the table

Every row is one piece of text used somewhere on the site, shown with three
columns you can edit — Armenian (`hy`), Russian (`ru`), English (`en`) — plus
a short hint of where that text appears (e.g. "Каталог → карточка проекта").

- **Search and filters** at the top of the page narrow the list down to the
  rows you're looking for — by the text itself or by where it appears — so
  you don't have to scroll through everything.
- Type directly into any of the three language boxes for a row. There is no
  save button per row — as you type, your change is kept as a **draft**
  automatically. You can close the page and come back later; nothing is lost.
- Each row has a **colour mark** — the same idea as colouring a row in a
  spreadsheet, just built into the page:
  - 🟢 **Green** — checked, final.
  - 🔴 **Red** — a problem, or you need someone to decide something.
  - 🔵 **Blue** — in progress, come back to it later.
  - No colour — not touched yet.

  There are filters at the top to show, say, only the red rows — handy for
  finding what still needs attention.
- Each row also has a **note** field — a place to leave a comment for
  yourself or Hayk (e.g. "not sure about this one, please check").

## Faster editing

- Press **Tab** or **Enter** to move to the next row down.
- **Shift+Enter** inside a text box starts a new line within that cell,
  instead of moving on.
- **Esc** undoes whatever you just typed in the cell you're in, back to what
  it was before.
- **Ctrl+S** saves everything at once (though, as above, your edits are
  already being saved as you type).
- A small copy button next to a cell copies the text from one language into
  another — useful when, say, the Russian and English text should be the
  same and you don't want to retype it.
- The table can switch between a normal and a more compact row height, and
  sections of the site can be collapsed/expanded to shrink a long list down
  to just the part you're working on.

## Working in Excel instead, if you prefer

You don't have to edit in the table on the page — if you'd rather work in a
spreadsheet, that's still possible:

- **Download CSV** gives you the current texts, colours and notes as a file
  you can open in Excel (or Google Sheets).
- Edit it there, then use **Upload CSV** to bring it back. Before anything
  changes, you'll see a preview — "N rows will be applied, M unknown rows
  skipped" — so you can check it looks right before confirming. Nothing is
  published straight from the upload; it lands back in your drafts, same as
  typing directly in the table.

## Publishing

Your drafts stay drafts — invisible to site visitors — until you click
**«Сохранить и опубликовать»** (Save and publish) at the top of the page.

When you click it:

1. The system checks every changed row for the problems described below. If
   anything is wrong, nothing is published — you'll see exactly which rows
   and what to fix.
2. If everything passes, your changes go out, and the live site updates
   itself within a few minutes. You don't need to tell anyone or wait around
   — it happens on its own.

## What the warning messages mean

These are separate from the colour marks above — a warning is the system
telling you something is actually broken, not your own review note. If a row
is flagged, it's one of these:

- **"Пусто в …" (Empty in …)** — one of the three languages was left blank.
  Every row needs text in all three.
- **A red letter inside Armenian text** — a Russian letter that looks almost
  identical to an Armenian one got typed or pasted in by mistake (a common
  copy-paste slip). Retype that word on an Armenian keyboard.
- **"Плейсхолдеры не совпадают" (Placeholders don't match)** — some texts
  contain pieces in curly braces, like `{n}` or `{name}`; the site swaps
  these for a real number or name when the page loads. Keep them exactly as
  written, in every language, and don't translate what's inside the braces.
  - ✅ `Showing {n} projects` → `Ցուցադրվում է {n} նախագիծ`
  - ❌ `Ցուցադրվում է n նախագիծ` (braces lost — this will be rejected)

These checks only run when you publish, so you can't break the live site —
the worst case is your update is held back until the flagged rows are fixed.

## What is NOT edited here

- Film/series titles and descriptions, portfolio cases — those are edited
  elsewhere in the admin panel, not in Translations.
- The Google Sheet you may have used before is retired — everything now
  happens on this page (Excel is still fine as a side tool, via Download/Upload
  CSV above, just not the Sheet itself).
