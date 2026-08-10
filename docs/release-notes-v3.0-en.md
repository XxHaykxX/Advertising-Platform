Release v3.0 — August 10, 2026

What's new and what's fixed on igovazd.am since v2.9.

— Advertising channels —
1. Placement now says what kind of integration it is. A brand could see that a project sells
   "product placement" but not whether the deal was a product on screen, a logo in the credits,
   a verbal mention in dialogue, or naming rights over the whole series. A placement now carries
   one of those four kinds, with the kind's meaning spelled out next to the picker in the form.
   The catalog card shows the project's kinds as their own row of chips, and the catalog gained a
   filter for them — once a project has a classified placement to filter by. Placements written
   before today have no kind, and that is a normal, sellable offer: nothing was guessed or
   backfilled.
2. A new section, `/ads`, opens all nine advertising channels the platform sells, not just film
   placement. Each channel has its own page — what it is, what can be bought, and a showcase.
   Placement and Events show the projects that already exist; the other seven channels don't have
   an inventory yet and say so plainly, with a link to get in touch, instead of showing invented
   listings.

— Internal tools —
3. The dictionary editor's section list is readable. Over half the platform's UI text — 534 of
   1002 keys — had no named section, so it fell back to raw key prefixes — entries like
   `forCreators.field.castPhoto.` sitting in a list of otherwise plain-language names. Every key
   now lands in one of 83 human-readable sections, and a new check stops an unnamed section from
   shipping again.
