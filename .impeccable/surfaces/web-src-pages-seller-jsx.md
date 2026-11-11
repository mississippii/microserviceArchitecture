---
version: 1
slug: "web-src-pages-seller-jsx"
primary_target: "Web/src/pages/Seller.jsx"
related_targets: ["Web/src/pages/Admin.jsx","Web/src/App.jsx"]
---

# Seller & Admin workspace

Scope: seller dashboard (`Web/src/pages/Seller.jsx`) and admin panel (`Web/src/pages/Admin.jsx`), plus the shared shell and sign-in. Mode: Operate. Customer pages inherit the tokens but are out of focus for now (user: "currently we focus on Seller and Admin side").

Audience & job: small, often non-technical sellers on phones (keep stock right, accept → ship → deliver orders, get verified); staff at a desk (clear the verification queue, curate the catalogue). Avoid (user): too decorative. Constraints: COD only; no uploads (URLs); no invented data.

## Direction contract

THESIS: A seller back office where trust and progress are stitched visibly: verification, and every order, is a running-stitch trail that fills as work is done. Refuses the grey SaaS admin with one accent and a row of KPI cards.

OWN-WORLD: Nakshi kantha thread palette on washed-cotton white: deep indigo shell (header, active nav), madder red for the one primary action, turmeric for attention (low stock, pending), leaf green for done (verified, delivered). Hind Siliguri, tabular numerals. Running stitch = dashed round-cap line; nowhere as ornament.

STORY: Seller sees what needs doing now, does it in one tap, and watches the stitch advance. Admin decides a verification with documents, location and note in one place.

FIRST VIEWPORT: Indigo header with workspace nav. Shop line: name, status, quality score; onboarding stitch trail (Shop → Documents → Verified) until verified. Tabs: Orders (count) · Products & stock · Shop. Orders queue first: each row ID, time, items, total, stitch trail, next-step button right.

FORM: Nakshi kantha, position 4 of 7 on the grounded list. seed:3d12cdf5bf77abd6. Signature interaction: when an order advances, the new trail segment stitches in left-to-right (clip-path reveal, expo ease-out, off under reduced motion).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
