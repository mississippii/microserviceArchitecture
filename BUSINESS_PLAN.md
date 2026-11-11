# Trusted Local Marketplace — Business Plan (Bangladesh)

> Working document · Prepared 10 Nov 2026 · All costs in BDT, estimates only (verify current prices before budgeting)

---

## 1. Interpretation of the Idea

### 1.1 One-line pitch
**"Original products from verified sellers near you, at a fair price — guaranteed by us."**

### 1.2 The problem
| Problem | Who suffers |
|---|---|
| Fake / adulterated products (cosmetics, food, clothing, electronics, regional goods) | Customers |
| Unfair, inflated prices with no easy way to compare | Customers |
| Scam pages, no accountability, weak refund culture | Customers |
| Slow delivery (3–5+ days) on national marketplaces | Customers |
| Small sellers run business on notebooks + Facebook Messenger, no tools | Sellers |
| Honest sellers can't prove they are honest | Sellers |

### 1.3 The solution
A **location-based multi-vendor marketplace** where:

1. **Any product** can be sold — but only by **verified sellers**.
2. A customer searches for a product (e.g. "Rajshahi mango", "panjabi", "original sunscreen").
3. The platform shows **nearby sellers** who have it in stock, ranked by:
   - **Nearest** (distance to delivery address)
   - **Best price**
   - **Best quality** (ratings, fulfilment rate, complaint history, verification level)
4. The order is delivered **locally and fast** (same day / next day).
5. **The platform is responsible for authenticity.** If a product is not original → full refund, seller penalised or removed.
6. Every seller gets a free **web-based business dashboard** (inventory, stock, orders, sales, accounts).
7. **Web only — no native mobile apps.** A mobile-first responsive website, installable on the phone home screen as a PWA (no Play Store / App Store needed).

### 1.4 What makes it different
| Typical marketplace / F-commerce | This platform |
|---|---|
| "Seller is responsible" | **Platform guarantees originality** |
| Shows products, not distance | Shows **nearest verified sellers** |
| Price comparison is hard | Same product, side-by-side local prices → fair pricing |
| Reviews can be fake | Only **verified-purchase** reviews |
| Seller gets a shop page | Seller gets a **full business system** |

### 1.5 Core principles
- **Trust first, scale second.** 20 strictly verified sellers > 200 unchecked ones.
- **Category-by-category expansion.** A category opens only when its verification process is defined.
- **Transparency over price control.** We don't set prices; we make unfair prices visible.

### 1.6 Target users
- **Customers:** urban, middle-income, smartphone users (18–45) who are tired of fakes; gift buyers; families.
- **Sellers:** Facebook/F-commerce sellers, small shops, home-based and women entrepreneurs, resellers of regional products, local producers.

---

## 2. Tools & Technology

**Guiding rule:** one team, one backend, boring proven tech. Build a **modular monolith**, not microservices — split only when real load demands it.

### 2.1 Recommended stack

| Layer | Choice | Why |
|---|---|---|
| **Backend API** | Java 21 + **Spring Boot 3** (modular monolith) | Team already knows it; mature, secure, fast enough for years |
| **Database** | **PostgreSQL + PostGIS** | One DB for everything; PostGIS gives "nearest seller" in a single SQL query |
| **Cache / queues** | **Redis** | Sessions, rate limiting, simple job queue, OTP storage |
| **Search** | PostgreSQL full-text search → **Meilisearch** later | Start free inside Postgres; add Meilisearch when catalogue grows (Bangla-friendly, light) |
| **Web (customer site, seller dashboard, admin panel)** | **React + Vite + Tailwind**, mobile-first, installable **PWA** | Already used in this repo; one codebase works on phone and desktop browsers; no app-store fees or review delays |
| **Maps & geocoding** | **Barikoi** (Bangladesh) → Google Maps as fallback | Better local addresses, much cheaper than Google for BD |
| **Payments** | **bKash PGW, Nagad**, **SSLCommerz** (cards, banks) + Cash on Delivery | Covers almost all BD customers |
| **Escrow / settlement** | Payment held by gateway/merchant account, released to seller after delivery confirmation (T+3 to T+7) | Required for the trust guarantee; follow Digital Commerce Guidelines |
| **Delivery** | Courier APIs: **Pathao Courier, Steadfast, RedX** + seller self-delivery option | No need to own a fleet at the start |
| **Notifications** | **SMS gateway** (e.g. SSL Wireless / BulkSMSBD) + browser **Web Push** (via FCM) | Instant order alerts, OTP; SMS works even when the site is closed |
| **File / image storage** | **Cloudflare R2** or AWS S3 + CDN | Cheap image hosting, no egress fees on R2 |
| **Auth** | Spring Security + JWT, phone-number OTP login | BD users prefer phone over email |
| **Hosting** | **DigitalOcean / AWS (Singapore or Mumbai region)**, Docker | Low latency to BD, simple ops |
| **CI/CD** | GitHub Actions → Docker → server | Free for small teams |
| **Monitoring** | Sentry (errors) + Uptime Kuma / Grafana | Free tiers are enough initially |
| **API docs** | Swagger / OpenAPI (springdoc) | Already integrated in this repo |
| **Design** | Figma | Standard |
| **Project management** | GitHub Projects or Jira (free tier) | |

### 2.2 High-level architecture

```
 [Customer Website]  [Seller Dashboard]  [Admin Panel]   (all React web / PWA)
        \             |             |            /
         \____________|_____________|___________/
                          | HTTPS / REST (JWT)
                 [ Spring Boot Modular Monolith ]
   ┌──────────┬──────────┬──────────┬──────────┬──────────┐
   │ Auth &   │ Catalog &│ Orders & │ Payments │ Verifi-  │
   │ Users    │ Inventory│ Delivery │ & Escrow │ cation & │
   │          │          │          │          │ Reviews  │
   └──────────┴──────────┴──────────┴──────────┴──────────┘
        |            |            |                |
   [PostgreSQL+PostGIS]  [Redis]  [R2/S3 images]  [External APIs:
                                                  bKash, Nagad, SSLCommerz,
                                                  Barikoi, Couriers, SMS, FCM]
```

### 2.3 Key modules
1. **Auth & Users** — customer, seller, admin, verifier roles; phone OTP.
2. **Seller onboarding & Verification** — NID, trade license, DBID, product source documents, category licences (BSTI, import docs), field visit reports, verification level badge.
3. **Catalog & Inventory** — products, variants, stock, low-stock alerts, batch/source info.
4. **Location & Ranking** — seller location + delivery radius; ranking by distance / price / quality.
5. **Orders & Delivery** — order lifecycle, courier booking, tracking.
6. **Payments & Escrow** — gateway integration, hold & release, commission deduction, seller payouts.
7. **Reviews & Reputation** — verified-purchase reviews, seller score.
8. **Disputes & Guarantee** — "not original" claims, evidence upload, refund, seller penalties.
9. **Seller Business Tools** — sales reports, accounts (income/expense/profit), stock reports.
10. **Admin panel** — approvals, category rules, disputes, payouts, analytics.

### 2.4 "Nearest / best price / best quality" — how it works
```sql
-- Sellers within 10 km that have the product in stock, nearest first
SELECT s.id, s.name, p.price, s.quality_score,
       ST_Distance(s.location, :customer_point) AS distance_m
FROM seller s
JOIN listing p ON p.seller_id = s.id
WHERE p.product_id = :productId
  AND p.stock > 0
  AND s.verified = true
  AND ST_DWithin(s.location, :customer_point, 10000)
ORDER BY distance_m          -- or p.price, or s.quality_score DESC
LIMIT 20;
```
**Quality score** (0–100) = weighted mix of: average rating, on-time fulfilment rate, complaint/refund rate, verification level, account age. Start with fixed weights; tune with real data later.

### 2.5 Build phases
| Phase | Duration | Deliverables |
|---|---|---|
| **Phase 1 – Seller Dashboard (MVP, web)** | Months 1–4 | Seller registration & verification flow, products, inventory, stock alerts, orders, sales & accounts, shareable store link, admin panel |
| **Phase 2 – Customer Marketplace** | Months 4–7 | Customer website, location search, ranking, cart & checkout, bKash/Nagad/SSLCommerz + COD, courier integration, reviews |
| **Phase 3 – Trust Layer** | Months 7–10 | Escrow & settlement, dispute/guarantee flow, verified badges, batch/source tracking, seller penalties |
| **Phase 4 – Growth** | Month 10+ | New categories & cities, promotions, featured listings, seller subscriptions, analytics, Meilisearch |

---

## 3. Business Model

### 3.1 Business Model Canvas

| Block | Content |
|---|---|
| **Customer segments** | Urban online shoppers who want original products; gift buyers; small sellers, F-commerce sellers, local producers, women entrepreneurs |
| **Value proposition** | *Customers:* original guaranteed, nearest seller, fair price, fast delivery. *Sellers:* free business tools, verified badge = more trust = more sales, access to local customers |
| **Channels** | Website (mobile-first PWA), Facebook/TikTok/YouTube marketing, seller onboarding events, local market associations, referral programme |
| **Customer relationships** | Originality guarantee, verified reviews, responsive support (phone/WhatsApp/in-app), seller success team |
| **Revenue streams** | Commission, seller subscriptions, verification fee, featured listings/ads, delivery margin (see 3.2) |
| **Key resources** | Platform tech, verified seller network, verification team, brand trust, payment & courier partnerships |
| **Key activities** | Seller verification & audits, platform development, marketing, dispute handling, quality monitoring |
| **Key partners** | bKash, Nagad, SSLCommerz, courier companies, Barikoi, BSTI/authorised distributors, SME Foundation, women-entrepreneur NGOs, district producer associations |
| **Cost structure** | Development team, verification field staff, customer support, cloud & SMS, payment gateway fees, marketing, refund reserve, legal |

### 3.2 Revenue streams

| Stream | Model | Suggested pricing |
|---|---|---|
| **1. Commission** (main) | % of each completed order | 5–12% by category (e.g. electronics 5%, clothing 10%, cosmetics 10%, food/regional 8%) |
| **2. Seller subscription** | Monthly plans | **Free:** up to 20 products, basic tools, standard commission<br>**Pro – ৳499/mo:** unlimited products, full accounts & reports, −2% commission<br>**Business – ৳1,499/mo:** multi-branch, staff accounts, priority support, −3% commission |
| **3. Verification fee** | One-time + yearly renewal | ৳500–1,000 per seller (field visit cost recovery) |
| **4. Featured listings / ads** | Pay to appear on top (clearly marked "Sponsored") | ৳50–300/day per product or CPC |
| **5. Delivery margin** | Small margin on negotiated courier rates | ৳5–15 per order |
| **6. Future** | Seller micro-loans (with bank/MFS partner), bulk sourcing (B2B), gift boxes, corporate orders | Later |

> **Rule:** sponsored listings must never override the trust filter — only verified sellers can advertise.

### 3.3 Unit economics (per order, example)

| Item | BDT |
|---|---|
| Average order value | 1,200 |
| Commission (avg 8%) | **+96** |
| Delivery margin | **+10** |
| Payment gateway fee (~1.5–2%, on prepaid orders) | −20 |
| Refund / guarantee reserve (~1%) | −12 |
| Verification & support cost per order | −10 |
| **Contribution per order** | **≈ ৳64** |

Subscriptions and verification fees come on top and do not depend on order volume.

### 3.4 Break-even (rough)
- Post-launch monthly operating cost (lean scenario): **≈ ৳2.0 lakh/month**
- Subscription income target (Year 1 end): 250 Pro sellers × ৳499 ≈ **৳1.25 lakh/month**
- Remaining ৳0.75 lakh ÷ ৳64 per order ≈ **~1,200 orders/month (~40/day)**

Without subscriptions: ≈ 3,100 orders/month (~100/day). These are achievable in one city within 12–18 months if seller density is good.

### 3.5 Key metrics to track
- Verified active sellers per area
- Orders per day, GMV (total order value)
- Repeat purchase rate (trust indicator)
- "Not original" complaint rate (target < 0.5%)
- Refund rate, on-time delivery rate
- Seller retention, Pro subscription conversion
- Customer acquisition cost (CAC) vs lifetime value (LTV)

### 3.6 Go-to-market
1. **One city first** (Dhaka or Chattogram), **3–4 categories** where fakes hurt most: cosmetics & skincare, clothing (panjabi, sarees), regional & specialty foods, mobile accessories.
2. **Onboard sellers before customers:** give the seller dashboard free; recruit existing F-commerce sellers.
3. **Launch the marketplace on a seasonal peak** (Eid, mango season, Puja, winter pitha season).
4. **Trust marketing:** show the verification process publicly (videos of source checks), publish the guarantee, highlight refunds honoured.
5. **Referral:** customer ৳100 off / seller free month of Pro.

### 3.7 Legal & compliance checklist (Bangladesh)
- Company registration (RJSC – Private Ltd), Trade License, e-TIN, BIN (VAT)
- **DBID / UBID** registration for digital commerce; seller DBID requirement
- Compliance with **Digital Commerce Operation Guidelines** (delivery timelines, refund rules, escrow, advance-payment rules)
- Consumer Rights Protection Act obligations (DNCRP complaints)
- Food categories: seller BSTI / food licences, Bangladesh Food Safety Authority rules
- Seller agreement: authenticity liability, penalties, indemnity
- Terms of Service, Privacy Policy, Refund & Guarantee Policy
- Trademark registration for the brand name

---

## 4. Estimated Cost

> Two scenarios. Salaries are typical Dhaka market ranges; adjust to your team. 1 lakh = ৳100,000.

### 4.1 Scenario A — Lean (founders build the product)
Founders write the backend and the web frontend; hire only what they can't do.

| Item | Calculation | Year-1 cost (BDT) |
|---|---|---|
| UI/UX designer (part-time / freelance) | ~৳25k × 6 months | 1,50,000 |
| Cloud hosting, DB, storage, CDN | ~৳12k/month × 12 | 1,44,000 |
| SMS (OTP, order alerts) | ~৳6k/month × 12 | 72,000 |
| Maps API, domain, email, misc SaaS | ~৳5k/month × 12 | 60,000 |
| Company registration, licences, trademark, lawyer | | 1,50,000 |
| Verification field staff (1 person, from month 5) | ৳25k × 8 | 2,00,000 |
| Customer support (1 person, from month 6) | ৳20k × 7 | 1,40,000 |
| Marketing (seller onboarding + launch campaigns) | | 4,00,000 |
| Refund / guarantee reserve fund | | 1,50,000 |
| Co-working / office, internet, travel | ~৳15k/month × 12 | 1,80,000 |
| Devices / test phones | | 60,000 |
| **Subtotal** | | **20,06,000** |
| Contingency (15%) | | 3,01,000 |
| **Total Year 1 (Lean)** | | **≈ ৳23 lakh** |

### 4.2 Scenario B — Funded team (hired developers)

**Team (monthly):**
| Role | Count | Monthly (BDT) |
|---|---|---|
| Backend developer (Spring Boot), mid-level | 2 | 1,40,000 |
| React web developer | 1 | 65,000 |
| UI/UX designer | 1 | 50,000 |
| QA engineer | 1 | 40,000 |
| **Tech team total** | 5 | **2,95,000** |

| Item | Calculation | Year-1 cost (BDT) |
|---|---|---|
| Tech team | ৳2.95 lakh × 12 | 35,40,000 |
| Cloud, SMS, maps, SaaS (higher usage) | ~৳35k/month × 12 | 4,20,000 |
| Devices / test phones | | 60,000 |
| Legal, registration, trademark, lawyer retainer | | 2,50,000 |
| Verification team (3, from month 5) | ৳25k × 3 × 8 | 6,00,000 |
| Customer support (3, from month 6) | ৳20k × 3 × 7 | 4,20,000 |
| Operations / seller success manager (from month 4) | ৳45k × 9 | 4,05,000 |
| Marketing | | 12,00,000 |
| Refund / guarantee reserve | | 3,00,000 |
| Office, utilities, internet, travel | ~৳60k/month × 12 | 7,20,000 |
| **Subtotal** | | **79,15,000** |
| Contingency (15%) | | 11,87,000 |
| **Total Year 1 (Funded)** | | **≈ ৳91 lakh** |

### 4.3 Summary

| | Lean (A) | Funded (B) |
|---|---|---|
| Year-1 total | **≈ ৳23 lakh** | **≈ ৳91 lakh** |
| Time to MVP (seller dashboard) | 4–5 months | 3 months |
| Time to marketplace launch | 8–10 months | 6–7 months |
| Monthly burn after launch | ≈ ৳2 lakh | ≈ ৳6.5–7.5 lakh |
| Best for | Bootstrapping, proving the idea | After seed funding / investor |

**Recommendation:** start with **Scenario A**. Build Phase 1 (seller dashboard) yourselves, prove sellers use it and the first city's trust model works, then raise seed funding to move to Scenario B.

### 4.4 Possible funding sources
- Founders / friends & family
- **Startup Bangladesh Ltd.**, ICT Division / iDEA project grants
- **SME Foundation** loans (especially for women-entrepreneur impact)
- Local angel networks and accelerators
- Impact investors / NGO partnerships (women entrepreneurship, rural producers)

---

## 5. Key Risks & Mitigation

| Risk | Mitigation |
|---|---|
| A fake product slips through → brand damage | Strict onboarding, random mystery shopping, instant refund, zero-tolerance seller removal, public transparency |
| Too few sellers per area | One city, few categories, seller-dashboard-first strategy |
| Customers/sellers bypass platform | Guarantee + refunds only on-platform, escrow, loyalty points, seller tools tied to platform |
| Competition from large marketplaces | Compete on trust + locality + speed, not catalogue size |
| Cash-on-delivery fraud / fake orders | Phone OTP, COD limits for new users, partial advance for high-value orders |
| Regulatory changes | Lawyer retainer, follow Digital Commerce Guidelines from day one |
| High verification cost | Verification fee, tiered verification levels, use data (complaint rates) to focus audits |

---

## 6. Next Steps
1. Finalise brand name and register company.
2. Interview 30–50 sellers and 50–100 customers in the launch city to validate pain points and pricing.
3. Define verification checklist for the first 3–4 categories.
4. Design Phase 1 seller dashboard (Figma, mobile-first web) → build MVP.
5. Onboard first 20–50 verified sellers; run a closed pilot.
6. Launch customer marketplace on a seasonal peak.
