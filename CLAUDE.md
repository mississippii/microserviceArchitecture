# Project rules

- `Marketplace/` — Spring Boot backend (modular monolith). Design: `BACKEND_ARCHITECTURE.md`.
- `Web/` — React + Vite + Tailwind web app (web only, no native apps). Product truth: `PRODUCT.md`.
- Business context: `BUSINESS_PLAN.md`.

## Web UI rules (Web/)

1. Design system
   - Read `DESIGN.md` and `PRODUCT.md` before creating or changing any UI.
   - Tokens are the single source of truth: `Web/src/index.css` (`@theme`). Never hard-code a colour, radius or spacing; add a token if one is missing.
   - Colours: black and white only (user decision: "Dark black and white only"). Every token is black, white or neutral grey; the token names (brand, turmeric, madder, leaf) only mark roles. No navy, no green, no accent hues. Product photos are the only colour. One exception (user decision): the floating Start shopping button on the home page is Facebook blue #0866FF (`--color-accent`); use it nowhere else without asking.
   - Look: the old E-commerce-Web (ShopHub) layout (user decision): white header with search pill and black announcement bar, no hero; home opens on category tiles, then a product row per category group, then the promises (user decision, structure like chaldal.com); sort, filter sidebar + grid only on /products, Plus Jakarta Sans text with Space Grotesk headings. Photo-led content. The running stitch is used only for real progress trails.
   - Icons come from lucide-react. The brand name is a placeholder in `Web/src/brand.js`.

2. Mobile first
   - Most users are on phones. Design at 390px first, then desktop.
   - Touch targets are at least 44px (`min-h-11`). Never disable zoom.
   - Section tabs become the fixed bottom bar on phones (`Tabs` in `Web/src/ui.jsx`): at most 5 cells; more sections go behind a fifth "More" cell that opens a sheet (user decision, like CBTrading).
   - Keep pages clean (user decision): no descriptive subtitles or explanatory hints; empty states are a title only. Field labels are one or two words (Qty, Unit, Price ৳/kg, Note), never sentences or "(optional)" (user decision, like the tradebazaar app). Keep text that prevents mistakes (errors, rules like "required when rejecting").

3. No AI slop (skills: impeccable, design-taste-frontend)
   - No gradients or glass as decoration, no emoji as icons, no cards nested in cards, no coloured side stripes, no eyebrow labels above headings.
   - Finish UI work with `/impeccable audit` and `/impeccable polish` on the changed section.

4. UX and accessibility (skill: web-design-guidelines)
   - Async buttons are disabled while pending and show progress ("Saving…").
   - Destructive actions need confirmation; errors say how to fix them.

5. Checks before calling UI work done
   - `cd Web && npm run build` passes.
   - Browser check (Playwright MCP): backend `cd Marketplace && docker compose up -d && mvn spring-boot:run` (:8080), web `cd Web && npm run dev` (http://localhost:5173, `/api` is proxied).
     Screenshot the changed page at 390px and desktop widths; fix overflow, sideways scroll or overlapping text.
   - Backend changes: `cd Marketplace && mvn test` passes.
