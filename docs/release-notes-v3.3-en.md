Release v3.3 — August 14, 2026

What's new and what's fixed on igovazd.am since v3.2.

The headline is that the catalogue and the advertising section became one thing: a
single listing with one page per channel, filtered by what that channel actually
sells. The rest comes out of a review of the live site — twenty-four findings, most
of them on the pages a visitor sees first.

— Advertising and the catalogue —
1. The catalogue now lives inside Advertising. The header used to carry "Catalogue"
   and "Advertising" side by side, and only one of them could filter anything:
   /ads was nine marketing tiles, each leading to a page of four paragraphs and six
   teaser cards that sent you back to the catalogue anyway — where billboards sat
   mixed in with films. Advertising is now the listing itself, and each channel is
   the same listing narrowed to that channel. The old catalogue address still works
   and forwards, keeping whatever was in the link.
2. Each of the nine channels filters on its own terms. A billboard is chosen by
   structure type, lighting and which side of the traffic it faces; a radio slot by
   station format, daypart and spot length; an event by city, date and category.
   Before, every channel was offered the same seven film-shaped filters. A filter
   only appears once listings carry the answer, so a channel nobody has published to
   yet shows a "coming soon" note instead of an empty filter panel.
3. Event sponsorship can be searched by city and date at all. A project carried
   neither, so "what is happening in Yerevan in September" was a question the site
   could not answer. Organisers can now fill in the city, the date and the event
   category, and buyers can filter and sort on them.
4. The channel marketing pages are gone. Picking a channel takes you straight to
   what is for sale in it, not to a description of what the channel is.
5. The page stopped describing itself as a film catalogue. Four lines survived the
   move saying what the section used to be — the headline offered "film and TV
   productions", the search box promised "genre, market", a channel page's button
   said "Browse projects" above a list of billboards, and the footer tagline said
   "film and TV" on every page of the site.

— The project page —
6. A project link shared in a messenger finally unfurls as that project. Every
   project page inherited the home page's tags, so the tab read "iGovazd — Brand
   Placement Marketplace" and a link pasted into Telegram or WhatsApp previewed the
   home page. It now carries its own title, description, address and preview image —
   the project poster. This is the one sharing path the product is built around.
7. The "Format" row says what the project is. It showed only the runtime ("1 hr
   40 min") while the catalogue card and the comparison table both showed the type,
   so the page with all the detail was the one page that never said whether this was
   a feature film or a series. It now reads "Feature film · 1 hr 40 min", and drops
   the type when it would merely repeat the genre.
8. Platforms are translated on the project page. The Russian page said "Cinema"
   where the card two clicks earlier said "Кинотеатры". Brand names such as
   "Kinodaran" are left as they are, on purpose.
9. A project can be saved to favourites from its own page. The heart was on every
   catalogue card and then vanished the moment you opened the project — the page
   where you actually decide. It now sits in the toolbar next to Share.

— The catalogue —
10. A filtered result can be sent as a link. Filters lived only in the browser's
    memory, so the address bar never changed: an agency could not share "these four
    projects" with a client, and Back did not undo a filter. Filters are in the
    address now, and typing in the search box still does not flood the history.

— Signing in —
11. A rejected sign-in points at the fields that were rejected. The error was a
    filled red box under the password while both inputs stayed in their normal
    state — the part of the form that was wrong looked fine. Both fields now take
    the same red outline a missing required field draws, the message is a plain red
    line with an inline (!), and the outline clears on the first keystroke.
12. The four other account forms — register, finish registration, forgot password,
    reset password — stopped drawing their failures in the brand purple, which read
    as a notice rather than a refusal.
13. Signing out of your account no longer ends a staff session in another tab, and
    the public header stops greeting an editor by name from their admin session.
    The public side of the site now reads only the member's own session.

— When something goes wrong —
14. A broken link lands on a real page. Before, it was the framework's bare
    "404: This page could not be found." — no header, no footer, no language
    switcher, no way back. There is now a proper 404 in all three languages.
15. The error screen speaks the site's language. It was hardcoded in Russian on a
    site whose default is Armenian.
16. A refusal from the project form no longer looks like an announcement. "Enter a
    title in at least one language" was drawn in the same purple banner that the
    previous release removed from the sign-in forms.
17. The confirmation screen of an application offered "Cancel" as its only button,
    directly after the application had been sent.

— The home page —
18. The Russian and English home pages are a translation of the Armenian one again.
    They were left on the old launch template and promised a Russian visitor
    "100,000+ scripts analysed" and "100+ countries covered" — from a platform with
    nine Armenian projects. Both now say what the Armenian page says: a secure deal
    and the real number of partners.

— Uploading pictures —
19. Uploading a picture shows you the crop before it is saved. Every upload was
    silently cropped to 16:9 by the server, irreversibly — which is what ate the
    studio logo off the bottom of a project poster. The crop frame now appears
    first, so the editor decides what survives instead of discovering it afterwards.
20. The crop applies everywhere a picture is chosen, not only to posters. Cast and
    crew photos were the ones that mattered: they went straight through the picker
    and were squared by the server with no dialog and no warning. The frame offered
    is the one the file's destination will actually keep — square for a headshot,
    16:9 for a poster, gallery image or ad space photo — and logos are still padded
    rather than cut, so nothing is trimmed off a wide wordmark.
21. Choosing the same file twice reopens the crop dialog. Cancelling a crop and then
    picking the very same file again did nothing at all, and the only workaround was
    to rename the file.

— Forms —
22. The phone field in an application can no longer be filled backwards. With the
    caret placed before the pre-filled "+374", typing a local number produced a
    valid Russian number that the form accepted.
23. Sign-in, registration, password recovery, Terms and Privacy each have their own
    page title and address. All six were still declaring themselves to be the home
    page.

— Staff tools —
24. The dashboard counts members. Its only user tile counted staff, so the brands
    and creators using the platform appeared nowhere on the overview. It is now two
    tiles: Members and Staff.
25. An application no longer prints the brand's phone number twice in a row.

— Under the hood —
26. Adding a new filter to a channel is now a small, safe change rather than a
    rebuild, so the filter set can keep growing as media owners ask for it. The set
    shipped here comes from a survey of what outdoor, broadcast, digital, placement
    and sponsorship marketplaces offer elsewhere.
27. Four automated checks now run against the live site itself, without touching any
    data, and cover exactly the findings above that stay invisible until they break:
    a project link's preview, the Russian and English home pages making no claim the
    Armenian one doesn't, and a 404 that still has the site around it.
28. Deliberately left for later: a map with radius search, numeric ranges, an
    event-date filter and audience segments. Seven of the nine channels carry no
    listings in production yet, so most of those filters would have nothing to act
    on until media owners publish.
