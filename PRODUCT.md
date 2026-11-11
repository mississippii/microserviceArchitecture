# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first responsive website, installable as a PWA. No native apps (confirmed by the user).

## Users

- **Customers (primary):** urban smartphone shoppers in Bangladesh, first city Chattogram or Dhaka. They are tired of fake products, inflated prices and scam Facebook pages, and want a guaranteed-original product from a verified seller near them, delivered fast. Mostly on phones, often on mobile data.
- **Sellers:** small shops, F-commerce (Facebook) sellers, home-based and women entrepreneurs, resellers of regional products. Often non-technical, using the site on their phones. Job: list products, keep stock right, accept and fulfil orders, get verified.
- **Admins / verifiers (staff):** approve seller verification requests, manage categories and the shared product catalogue.

## Product Purpose

A location-based multi-vendor marketplace for **any product**, where every seller is verified and the platform itself guarantees authenticity. A customer searches for a product and sees the verified sellers near them who have it in stock, compared by **nearest**, **best price** and **best quality**. Success: customers trust that what they buy is original, sellers get a free business dashboard and more sales, and repeat purchases grow.

## Positioning

The platform, not the seller, is responsible for originality ("not original → full refund"). Sellers are verified before they can list, every listing carries its batch source, and reviews come only from delivered orders. Prices from several nearby verified sellers of the *same* product sit side by side, so unfair pricing becomes visible.

## Operating Context

- Customers: search → set delivery location → compare offers → Buy now, or add to cart and check out to a saved address (one order per shop) → track each step with times → review after delivery, or report "not original / not as described" for a full refund. Account page: profile, password, saved addresses. Bell in the header for order updates.
- Sellers (Seller Centre sections: Home = inventory (every product with cost, price, stock; totals at cost and at price; low stock), Sells = record a shop sale (discount, paid now, rest on the customer's due) + one list of all sales, Orders = online orders, Stock = stock value, every product (receive, edit, remove), purchases by day (edit or delete any time), the stock register, Customers = dues to collect and statements, Accounts = profit and loss, money by method, platform balance, expenses, product profit, Day book = one day's money entry by entry. Phones show Home, Sells, Orders, Stock and a More sheet. No suppliers (user decision): sellers buy their own stock and pay for it on the spot. Cost is a weighted average updated by every receipt; profit, dues, low-stock alerts and the books are worked out automatically from what the seller records): register → open shop with location and delivery radius → submit verification documents (link; a rejection shows the reviewer's note) → once verified, manage listings (price, private cost, stock; inventory totals at cost and at price), record walk-in sales in the physical shop from the same stock (paid on the spot: cash, bKash, Nagad, Rocket or card; no platform commission; voiding one returns its stock), handle orders (accept → ship → deliver, or cancel; customer name + phone to call), see sales (online, in shop, or both), profit (sales − product cost − commission − expenses), expenses, their balance with the platform and past settlements, stock history, reviews; request a product missing from the catalogue; edit shop details; share a public shop link (`/s/:id`, no address). A seller must give: name, mobile, email, password, shop/business name, address and location, NID number, and a payout account (mobile banking, bank account, or both).
- Admins (Overview, Verification, Claims, Sellers, Orders, Catalogue): approve/reject verifications with a note, decide claims (refund in full or reject, note required), suspend/reinstate shops, see each seller's NID and payout account, record settlements (commission owed on cash-on-delivery orders), see all orders, approve product requests, set commission per category, manage category groups and products, review the audit trail. Verifiers see Verification and Sellers only.
- Currency is BDT (৳). Phone numbers are Bangladeshi mobile numbers (01XXXXXXXXX). Staff log in by email.

## Capabilities and Constraints

- Stack: React 19 + Vite 6 + Tailwind CSS 4 in `Web/`; backend Spring Boot REST API in `Marketplace/` (see `BACKEND_ARCHITECTURE.md`).
- Browsing needs no location (user decision): every visitor sees every in-stock product from verified shops, with prices, and a product lists all its sellers (cheapest first). There is no "Deliver to" picker. The catalogue API still accepts an optional lat/lng for distance filtering.
- Payments: only cash on delivery works today; bKash / Nagad / card are planned, not live. Do not present them as available.
- No image upload yet: product images and seller documents are URLs.
- Not built yet: courier tracking, SMS / push notifications (in-app only), automatic payouts, subscriptions, OTP login, claim time window and seller penalties, sales made outside the platform.
- Terminology: *product* (shared catalogue item), *listing* / *offer* (one seller's price + stock for a product), *verified seller*, *quality score* (0–100, from ratings).

## Brand Commitments

- **Name: undecided.** The UI uses a placeholder name defined in one place (`Web/src/brand.js`) so it can be replaced.
- **Language: English** interface (confirmed). Product names may contain Bangla.
- Voice: plain, trustworthy, direct. No hype.

## Evidence on Hand

- No real customers, sellers, testimonials, ratings, sales figures, press or partner logos exist yet. Never fabricate any of them.
- Business plan: `BUSINESS_PLAN.md`. Backend design: `BACKEND_ARCHITECTURE.md`.

## Product Principles

1. **Trust is the product.** Verification status, batch source and the originality guarantee must be visible where decisions are made.
2. **Honest comparison.** Distance, price and quality are shown together for the same product; never hide a cheaper or nearer verified seller.
3. **Phone-first for both sides.** Every flow must work one-handed on a small screen over a slow connection.
4. **Simple enough for non-technical sellers.** Plain words, few steps, obvious next action.
5. **Never claim what isn't built.** Unavailable payment methods, features or proof are not shown as real.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Many users are on low-end Android phones and mobile data: keep pages light, touch targets ≥ 44px, readable sizes, good contrast in bright outdoor light.
