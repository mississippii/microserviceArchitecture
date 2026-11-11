---
name: Asol
description: Photo-led marketplace of verified sellers near you; a black-and-white shop shell where real product photographs are the only colour.
colors:
  cotton: "#f5f5f5"
  ink: "#0a0a0a"
  muted: "#525252"
  line: "#e5e5e5"
  white: "#ffffff"
  brand-950: "#000000"
  brand-900: "#0a0a0a"
  brand-800: "#171717"
  brand-700: "#0a0a0a"
  brand-600: "#262626"
  brand-200: "#d4d4d4"
  brand-100: "#e5e5e5"
  brand-50: "#f5f5f5"
  turmeric-800: "#0a0a0a"
  turmeric-600: "#0a0a0a"
  turmeric-500: "#0a0a0a"
  turmeric-400: "#d4d4d4"
  turmeric-100: "#f5f5f5"
  madder-800: "#0a0a0a"
  madder-700: "#0a0a0a"
  madder-600: "#262626"
  madder-100: "#e5e5e5"
  madder-50: "#f5f5f5"
  leaf-800: "#0a0a0a"
  leaf-600: "#0a0a0a"
  leaf-100: "#e5e5e5"
typography:
  display:
    fontFamily: "Space Grotesk Variable, Plus Jakarta Sans Variable, Hind Siliguri, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Space Grotesk Variable, Plus Jakarta Sans Variable, Hind Siliguri, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk Variable, Plus Jakarta Sans Variable, Hind Siliguri, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.02em"
  card-title:
    fontFamily: "Space Grotesk Variable, Plus Jakarta Sans Variable, Hind Siliguri, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans Variable, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Plus Jakarta Sans Variable, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Plus Jakarta Sans Variable, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
  price:
    fontFamily: "Plus Jakarta Sans Variable, Hind Siliguri, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  section: "40px"
  section-wide: "56px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.brand-800}"
  button-primary-active:
    backgroundColor: "{colors.brand-900}"
  button-quiet:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.brand-50}"
  button-danger:
    textColor: "{colors.madder-700}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.madder-50}"
  search-pill:
    backgroundColor: "{colors.cotton}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 96px 0 44px"
    height: "44px"
  search-pill-button:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.white}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "20px"
  product-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  category-card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.2xl}"
    padding: "12px"
  filter-panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.2xl}"
    padding: "20px"
    width: "260px"
  price:
    textColor: "{colors.ink}"
    typography: "{typography.price}"
  badge:
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-attention:
    backgroundColor: "{colors.turmeric-100}"
    textColor: "{colors.turmeric-800}"
  badge-progress:
    backgroundColor: "{colors.brand-100}"
    textColor: "{colors.brand-900}"
  badge-done:
    backgroundColor: "{colors.leaf-100}"
    textColor: "{colors.leaf-800}"
  badge-alarm:
    backgroundColor: "{colors.madder-100}"
    textColor: "{colors.madder-800}"
  announcement-bar:
    backgroundColor: "{colors.brand-800}"
    textColor: "{colors.brand-50}"
    typography: "{typography.label}"
    padding: "6px 16px"
  header:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    padding: "10px 16px"
  header-band:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.white}"
    rounded: "{rounded.3xl}"
    padding: "24px"
  seller-band:
    backgroundColor: "{colors.brand-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.3xl}"
    padding: "40px"
  segmented-active:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    height: "40px"
  bottom-tab-bar:
    backgroundColor: "{colors.white}"
    textColor: "{colors.muted}"
    height: "64px"
  bottom-sheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.3xl}"
---

# Design System: Asol

## Overview

**Creative North Star: "The Black-and-White Shopfront"**

Asol is a plain, confident shop window in black, white and grey, with the layout of a mainstream e-commerce store (the user's earlier ShopHub project): a white header with a black announcement bar, a search pill and a "Deliver to" chip; no hero, the home page opens on the catalogue; a filter column beside the product grid; a slim black seller band; a black footer. The chrome holds no hue at all. Product photographs (mangoes, sarees, sweets) are the only colour on any screen, so the merchandise is what the eye lands on.

Density is retail-standard: comfortable 12–16px card gaps, 44px touch targets everywhere. Workspaces (Seller Centre, Admin) share the same monochrome and open with a solid black header band; on phones their sections live in a bottom tab bar. Space Grotesk headings give the black-and-white a little engineered edge; Plus Jakarta Sans keeps the body friendly, with Hind Siliguri catching Bangla.

The token names `brand`, `turmeric`, `madder` and `leaf` survive from an earlier coloured world as role names only; every one resolves to black, white or a neutral grey.

**Key Characteristics:**
- Black, white and neutral grey only; product photos are the only colour.
- ShopHub storefront layout: announcement bar, search pill, no hero, filter sidebar + grid, seller band, black footer.
- Two-column catalogue with a sticky filter sidebar; filters become a bottom sheet on phones.
- Solid black header bands on Seller Centre and Admin; bottom tab bar on phones.
- Space Grotesk headings over Plus Jakarta Sans body; tabular numbers for every amount.

## Colors

A strict monochrome: one near-black, white, and a short grey ladder. State is carried by words, icons and tint steps, never by hue.

### Primary
- **Shop Black** (`brand-700`, also `brand-900`): primary buttons, the search pill's Search button, header bands, the brand mark tile, focus outlines, active tabs and segmented controls, filled count pills, radio accents.
- **Soft Black** (`brand-800`): the announcement bar, the storefront seller band, primary button hover.
- **True Black** (`brand-950`): selection text and the deepest press state.

### Neutral
- **Paper Grey** (`cotton`, `brand-50`, `turmeric-100`, `madder-50`): page background, search pill rest, hover grounds, image fallbacks, icon squares, the "choose your area" prompt, error strips, New and Pending badges.
- **Hairline Grey** (`line`, `brand-100`, `leaf-100`, `madder-100`): panel and card borders, row dividers, Accepted/Shipped/Delivered/Verified/Suspended badge grounds, success strips.
- **Mid Grey** (`brand-200`, `turmeric-400`): selection background, pending stitch thread, hover rings on tiles, image-off icon, the area prompt's ring.
- **Graphite** (`muted`): secondary text, hints, meta lines, inactive tabs.
- **Ink** (`ink`; also `madder-700/800`, `turmeric-500..800`, `leaf-600/800`): body text, headings, prices, danger text, filled rating stars, reached stitch knots.
- **White** (`white`): header, cards, panels, inputs, quiet buttons, sheets, bottom bar, initials tiles on black bands.

### Named Rules
**The Black And White Rule.** Every UI colour is black, white or neutral grey. No green, mango, red, navy or any other hue in chrome, badges, icons or charts. The only colour on a screen comes from product and category photographs.

**The Role Names Are Not Hues Rule.** `brand`, `turmeric`, `madder` and `leaf` name roles (structure, attention, danger/money, done), not colours. New code may use them for their role, but must never reintroduce a hue behind them.

**The One Black Action Rule.** Each row, offer, sheet or form has at most one filled black button. Secondary actions are quiet (white with hairline); destructive ones are borderless ink text.

**The Ink Price Rule.** Every price and total is ink, semibold and tabular, with a smaller muted "from" or "Total" prefix. Prices are never tinted.

**The Words Carry State Rule.** With no hue to lean on, every status shows its label (New, Accepted, Delivered, Suspended), messages carry an icon (alert or check), and low-stock or attention counts carry text or an aria-label. A grey tint alone never encodes meaning.

## Typography

**Display Font:** Space Grotesk Variable (h1–h3, with Plus Jakarta Sans and Hind Siliguri fallbacks)
**Body Font:** Plus Jakarta Sans Variable (with Hind Siliguri for Bangla, then system sans)

**Character:** A geometric grotesk for headings with tight −0.02em tracking and balanced wrapping, over a warm, open humanist body face. Hind Siliguri sits behind both so Bangla names render without a jump.

### Hierarchy
- **Display** (600, 34px phones / 48px sm / 56px lg, 1.1 leading, −0.025em): the storefront hero headline only; its second clause is set in `muted`.
- **Headline** (600, 24px / 30px from sm): page titles (/products, product name, auth, Orders), Seller and Admin band names at 20/24px.
- **Title** (600, 20px / 24px from sm): storefront section heads ("Shop by category"), seller band heading at 24/30px; 18px for sheet titles, offer headings, queue cards.
- **Card title** (Space Grotesk 500, 15px, two-line clamp): product names on cards, because cards use h3.
- **Body** (400–500, 15px): lists, buttons, inputs, tab labels, filter rows. Hero lede is 16/18px muted, max ~32rem.
- **Body small** (400, 14px): meta lines, subtitles, ratings, category labels (600), empty-state copy.
- **Label** (600, 12px): badges, count pills, origin pills, the announcement bar (12px, 14px from sm), "Deliver to" caption at 11px.
- **Price** (600, 18px on cards, 20px on offers, 24px on the product page, ink): with a 12–14px muted "from".

### Named Rules
**The Grotesk Heading Rule.** h1, h2 and h3 are Space Grotesk at −0.02em with balanced wrap; everything else is Plus Jakarta Sans. Do not set body copy, buttons or labels in the grotesk.

**The Tabular Rule.** Every price, quantity, stock count, score, distance and ID uses tabular numerals (`.num`).

**The Sentence Case Rule.** Headings, buttons, tabs and badges are sentence case.

## Layout

One centred container, max 72rem (1152px), 12px gutter on phones and 16px from sm. On phones panels and cards run edge to edge (no side borders, square corners) to use the full width (user decision). Main content starts 16px under the header (20px from sm) with 40px bottom padding (48px from sm); workspaces add 64px on phones for the fixed tab bar. Storefront sections stack 32px apart (40px from sm). Compact by default (user decision): 26–42px hero headline, 20–24px section titles, 14px card text, 12px radii on cards. Rhythm is a 4px base: 4/8/12 inside cards, 16–20 inside panels, 24 between catalogue regions.

**Header.** Black announcement bar on top (storefront only), then a white bar: mark and wordmark, Deliver-to chip, a search pill that fills the middle, account links. Under sm the search drops to a full-width second row.

**Home.** No hero (user decision): guests and customers land straight on the filterable catalogue (left filter column + grid), titled by delivery area; then a slim black seller band (text + one button). Trust promises live in the announcement bar and the footer.

**/products.** Title, count and area link on the left; Filters button (below lg) and Sort select on the right. From lg, a 232px sticky filter sidebar beside the grid (3 columns, 4 from xl); below lg the same filter form opens in a bottom sheet.

**Product page.** Photo (5fr) beside details (6fr) from lg; the photo is full-bleed 4:3 on phones and square at lg.

**Workspaces (Seller Centre, Admin).** `Console` shell: from lg a 220px sticky white sidebar (identity block + vertical section nav, active section black); below lg a compact identity row, top tabs on tablets and the fixed bottom bar on phones (up to 6 sections). Each section opens with a 18–20px title row and actions on the right, then KPI tiles (2 columns, 4 from lg) and white panels with hairline-divided rows. Seller product editor is a 340px column from xl; Admin catalogue a 320px column from xl.

**Public shop page (/s/:id).** White identity strip (initials tile, name, Verified seller, rating, delivery distance; never the address), then a product grid linking to the product comparison page.

**Footer.** Black. Brand, one-line promise and a Cash on delivery chip; Shop, Sell and Account link columns side by side (3 columns even on phones); 12px credits row.

Responsive behaviour:
- **Under sm (640px):** product grid is 2 columns, 10px gaps. Section tabs become the fixed bottom bar. Pickers, filters and checkout are bottom sheets. Icon-plus-label buttons that are secondary (Refresh, My orders, Log out) drop to icon-only with an aria-label.
- **sm and up:** product grid 3 columns. Top tab row. Sheets become centred dialogs (max 28rem).
- **lg (1024px) and up:** filter sidebar appears (grid 4 columns from xl, 12px gaps); workspace sidebar appears; product page splits.

## Elevation & Depth

Hybrid. Work surfaces are flat white on paper grey, separated by 1px hairlines. Photo surfaces and things that float over other surfaces lift with soft, neutral black-alpha shadows. Modals sit on a 45% black scrim. Text set on a photo always sits on a black gradient scrim.

### Shadow Vocabulary
- **Button press** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.25)`): primary black button.
- **Header seam** (`box-shadow: 0 1px 0 var(--color-line)`): sticky header bottom edge.
- **Card rest** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.08)` plus 1px `line` ring): product cards.
- **Card hover** (`box-shadow: 0 6px 20px rgb(0 0 0 / 0.12)`; 0.10 on category cards): with the photo scaling 1.04–1.05 over 500ms.
- **Filter rest** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.06)`): desktop filter sidebar.
- **Overlap tile** (`box-shadow: 0 2px 10px rgb(0 0 0 / 0.08)`): Seller Centre summary tiles over the black band.
- **Floating card** (`box-shadow: 0 10px 30px rgb(0 0 0 / 0.16)`): the white cards that hang off the hero photo's edges.
- **Auth card** (`0 1px 2px rgb(0 0 0/0.04), 0 12px 40px rgb(0 0 0/0.08)`): login and sign-up are one compact centred card (400px from sm, no photo; user decision): mark, 22px heading, 44px inputs with icons, divider, outlined switch button. Full-bleed white on phones.

### Named Rules
**The Hairline For Work Rule.** Panels, lists, offers, tables and forms separate by a 1px `line` border, never by a shadow. Only photo cards, floating hero cards, overlap tiles and the auth card lift.

**The Scrim Rule.** Text never sits directly on a photo; put a flat black overlay under it, never a gradient.

## Shapes

Rounder as things get more pictorial. 8px on controls (buttons, inputs, icon buttons, message strips, active segment); 12px on panels, thumbnails, icon squares, area buttons and the quantity stepper; 16px on product, category and offer cards, filter panel, feature items, summary tiles and floating hero cards; 24px on the hero block, hero and product photos, auth card, black bands and sheets (top corners only on phones). Full round on the search pill and its button, badges, origin pills and count pills. 6px on the header role chip. The brand mark is a 32px black tile (9px radius) with a white knot and a white dashed stitch. Photos are always `object-cover`, clipped by their container.

## Components

### Buttons
Plain and certain; one black action per row.
- **Shape:** compact (user decision, like tradebazaar): gently rounded (8px), 44px min height, 14px semibold, 12–14px sides, 6px icon gap.
- **Add actions open a form, not a page:** "+ Sale", "+ Stock", "Add product" open the form in a `Drawer` (bottom sheet on phones, right panel from sm). On phones the main add action is a floating pill (`Fab`) above the bottom bar; from sm it sits beside the page title.
- **Primary:** black fill, white text, press shadow; hover `brand-800`, active `brand-900`; disabled 50% opacity; busy state swaps the label.
- **Quiet:** white, hairline border, ink medium text; hover `brand-50` ground and `brand-200` border.
- **Danger:** borderless ink text, paper-grey hover; sits left of the primary (Cancel, Reject).
- **On black:** white fill with ink text (Open your shop), hover paper grey.
- **Focus:** global 2px black outline, 2px offset.

### Chips (badges and pills)
- **Status:** full round, 12px semibold, 2×8px. New/Pending/Lowest price on paper grey; Accepted/Shipped/Delivered/Verified/Suspended on hairline grey; Cancelled on cotton with a hairline ring and muted text. All ink text; the label is the signal.
- **Origin pill:** on a product photo, white at 95% with ink 12px text and a map-pin, top-left; on the product page a paper-grey pill "From Rajshahi".
- **Verified on black:** white badge with ink text and a shield icon.

### Cards / Containers
- **Panel:** 12px, white, hairline, no shadow, 12px padding (16px from sm): forms are compact (user decision, like CBTrading's portal).
- **Field:** outlined 44px input with the 12px muted label sitting in the top border (`Field` in `ui.jsx`), never a separate label row. Related fields pair two to a row. Money fields show ৳ inside the box (`prefix`), quantities show their unit inside (`suffix`), hint "0". Lists of choices open a `Picker` sheet (search when long), not a native dropdown.
- **Form sheet (tradebazaar):** the form is split into `FormSection`s (28px icon chip + 14px title, hairline between). The running total and the save button sit in the `Drawer` footer, pinned while the fields scroll.
- **Phone pages:** Home shows products as two-across photo tiles; Sells opens with a Today panel (today · in shop · online); Accounts is money only: shop settings live in the "My shop" sheet, expenses are added from a sheet.
- **Product Card:** 16px, white, card-rest shadow and hairline ring, square photo (`-sm` thumbnail), origin pill, two-line 15px grotesk name, ink price with muted "from", muted seller-count and distance. Without an area: "Set your area to see prices".
- **Category Card:** white 16px card, hairline ring, 12px padding, square photo at 12px radius, 14px semibold label; hover lifts and zooms the photo.
- **Feature Item:** 44px paper-grey icon square, 15px semibold title, 14px muted line; joined into one hairline-divided white bar at lg.
- **Offer Row:** 16px white with hairline ring; shop, Verified and Lowest price badges, distance, rating, stock left; ink price and compact black Buy right.
- **Summary Tile:** white 16px tile with overlap shadow, 40px grey icon square, 18px tabular value, 12px muted caption.

### Inputs / Fields
- **Style:** white, 1px hairline, 8px radius, 44px min, 15px ink text, muted placeholders ending in an ellipsis.
- **Focus:** black border and a 2px black ring at 15%.
- **Label / hint:** 14px medium label above, 12px muted hint below.
- **Error / Disabled:** paper-grey strip with ink text and an alert icon; disabled inputs take the cotton ground; a disabled fieldset drops to 50% opacity.
- **Radios:** 16px, black accent, inside 44px hover rows.

### Navigation
- **Announcement bar:** `brand-800`, centred 12/14px paper-grey text with the refund promise in white, underlined.
- **Header:** white, sticky, hairline seam. Mark plus 20px wordmark; on workspaces a paper-grey role chip (Seller Centre, Admin). Sign up is a black button; Log in, My orders, Log out are 44px ink icon buttons with labels from sm/md.
- **Deliver-to chip:** black map-pin, 11px muted "Deliver to" over the 14px semibold area name, chevron; paper-grey hover; opens the location sheet.
- **Search pill:** full-round, paper grey at rest, white with black border and ring on focus, 20px search icon left, a 36px black full-round "Search" button inset right.
- **Section tabs, phone:** fixed white bottom bar, hairline top, 64px, 24px icon over 12px label; active is black with heavier stroke and a 2px top bar. Count pills: black with white text for information, white with an ink ring for attention.
- **Section tabs, sm+:** 44px top row; active gets black text, a black count pill and a 2px underline; inactive pills are hairline grey.
- **Segmented control:** white group, hairline ring, 4px inset; active segment is a black 8px pill with white text.

### Black Bands (signature)
- **Seller band (home):** `brand-800` 24px block, white heading, grey body, white button; a photo fills the right half from lg.
- **Workspaces** no longer use a black band; identity sits in the sidebar (lg) or a compact row (phones): a 40px black initials/icon tile, semibold name, 12px muted status.

### Bottom Sheet
Location picker, catalogue filters and BuySheet: 45% black scrim, white sheet with 24px top corners (centred dialog from sm, except filters, which are phone-only), sticky title row with a 44px close, safe-area padding, max 85–90% viewport height. BuySheet: thumbnail header, quantity stepper, address, a cotton total strip with "Cash on delivery", one full-width black Place order.

### Product Image
Every photo goes through one component: lazy, async-decoded, `object-cover`, `-sm` variant for cards, tiles and thumbnails. A missing or broken image falls back to paper grey with a mid-grey image-off icon.

### Stitch Trail
Knots for steps, dashed thread between, labels under. Pending thread `brand-200`; reached knots and thread are ink; cancelled is muted. Only the newly stitched segment animates (clip-path reveal, 700ms, `cubic-bezier(0.16, 1, 0.3, 1)`, off under reduced motion). Used for orders and seller onboarding.

### Rating
A black-filled star and the 0–100 score as tabular 0.0–5.0, 14px semibold; new sellers read "New seller" in muted.

## Do's and Don'ts

### Do:
- **Do** keep every UI colour black, white or neutral grey, and let product photographs supply all colour.
- **Do** give every row, offer, sheet or form exactly one filled black primary, with quiet or ink-text secondaries.
- **Do** print every price ink, semibold and tabular, with a muted "from" or "Total" prefix.
- **Do** carry state with a word or icon (badge labels, alert/check icons, aria-labels), since tint steps alone are too close to read.
- **Do** follow the storefront layout: announcement bar, search pill with Deliver-to chip, no hero, filters + grid, black seller band.
- **Do** put catalogue filters in a 260px sticky sidebar from lg and in a bottom sheet below it.
- **Do** set h1–h3 in Space Grotesk and everything else in Plus Jakarta Sans, with tabular numerals for numbers.
- **Do** keep tap targets at least 44px and put workspace sections in the bottom tab bar on phones.
- **Do** route every image through the fallback component and load `-sm` thumbnails for cards and lists.

### Don't:
- **Don't** reintroduce green, mango, madder, navy or any other hue behind the `brand`, `turmeric`, `madder` or `leaf` tokens.
- **Don't** tint a price, or fill a primary button with anything but black (white on black bands).
- **Don't** use the running stitch as ornament; it means progress or the brand mark only.
- **Don't** put text on a photo without the black scrim, or show a broken-image glyph.
- **Don't** add shadows to panels, lists or forms; lift only photo cards, floating hero cards, overlap tiles and the auth card.
- **Don't** use decorative gradients, blur or glass; the photo scrim is the only gradient.
