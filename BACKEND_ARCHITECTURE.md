# Backend Architecture — Trusted Local Marketplace

> Companion to [BUSINESS_PLAN.md](BUSINESS_PLAN.md) · Code lives in [`Marketplace/`](Marketplace/) · Updated 10 Nov 2026 (claims, shop page, admin tools)

---

## 1. Overview

| Item | Choice |
|---|---|
| Style | **Modular monolith** — one Spring Boot app, one database, code split into business modules |
| Language / framework | Java 21, Spring Boot 3.5 |
| Database | PostgreSQL 16 + **PostGIS** (location search) |
| Schema management | **Flyway** SQL migrations (`db/migration/V*.sql`); Hibernate only *validates* |
| Auth | Stateless **JWT** (HS256), login with **phone or email** + password, roles in token |
| API style | REST + JSON, errors as RFC 7807 `problem+json`, docs at `/swagger-ui.html` |
| Clients | **Web only** — React (Vite + Tailwind), mobile-first, installable PWA. No native apps. |
| Tests | One end-to-end integration test on a real PostGIS container (Testcontainers) |

```
                ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
                │ Customer website │ │ Seller dashboard │ │   Admin panel    │
                │   (React, PWA)   │ │   (React, PWA)   │ │     (React)      │
                └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                         └────────────────────┼────────────────────┘
                                              │ HTTPS, JSON, "Authorization: Bearer <JWT>"
                         ┌──────────────────────▼──────────────────────┐
                         │      Spring Boot — Marketplace (one JAR)    │
                         │  ┌────────────────────────────────────────┐ │
                         │  │ Security filter: verify JWT → roles    │ │
                         │  └────────────────────────────────────────┘ │
                         │  auth │ seller │ verification │ catalog     │
                         │  order │ payment │ review │ common          │
                         └──────────────────────┬──────────────────────┘
                                                │ JDBC (HikariCP pool)
                         ┌──────────────────────▼──────────────────────┐
                         │        PostgreSQL 16 + PostGIS 3.4          │
                         └─────────────────────────────────────────────┘
```

---

## 2. Modules

Each module is one Java package: `com.marketplace.<module>`.

| Module | Responsibility | Main endpoints |
|---|---|---|
| **common** | Security config (JWT, roles), error helpers | — |
| **auth** | Register (sellers must give an email), login, profile, password | `POST /api/auth/register`, `POST /api/auth/login`, `GET`/`PUT /api/auth/me`, `POST /api/auth/password` |
| **activity** | In-app notifications for every user; audit trail of staff and account actions | `GET /api/notifications`, `POST /api/notifications/read`, admin `GET /api/audit` |
| **customer** | Saved delivery addresses, cart, checkout (one order per shop, all in one transaction) | `/api/addresses` (GET, POST, PUT, DELETE), `/api/cart` (GET, POST, PUT, DELETE), `POST /api/cart/checkout` |
| **seller** | Shop profile, location, delivery radius, status, quality score | `POST /api/sellers`, `GET`/`PUT /api/sellers/me`; staff: `GET /api/sellers`, `GET /api/sellers/{id}` (exact location, NID and payout account are owner- and staff-only); admin: `POST /api/sellers/{id}/suspension` (VERIFIED ⇄ SUSPENDED); expenses: `GET`/`POST /api/sellers/me/expenses`, `DELETE …/{id}`; counter sales (order module): `GET`/`POST /api/shop-sales`, `POST /api/shop-sales/{id}/void` |
| **verification** | Seller submits documents → admin/verifier approves → seller becomes `VERIFIED` | `POST /api/verifications`, `GET /api/verifications/me` (latest request + reviewer note), `GET /api/verifications/pending`, `POST /api/verifications/{id}/decision` |
| **catalog** | Category groups (2 levels), products, seller listings (price + stock), **nearby search**, public shop page | `GET /api/catalog/categories`, `GET /api/catalog/products?q&categoryId`, `GET /api/catalog/products/nearby?lat&lng`, `GET /api/catalog/products/{id}/offers?lat&lng&sort`, `GET /api/catalog/shops/{id}` (public, no address), `PUT /api/listings` (unit PCS/KG/LITRE/DOZEN/BOX/CRATE/BAG/PACK, price per unit, private cost, low-stock level, and either `stock` = exact count or `addStock` = goods received, added atomically; stock is NUMERIC so loose goods take fractions), `GET /api/listings/me/movements` (stock register with supplier/reason note and unit cost), `GET /api/listings/me`, `GET /api/listings/{id}/movements` (stock history); product requests: `POST /api/product-requests`, `GET …/me`, admin `GET /api/product-requests`, `POST …/{id}/decision`; admin: `POST`/`PUT` categories (with commission %) and products (optional `parentId` makes it a variety, stored as "আম - হিমসাগর" in the parent's category), `DELETE /api/catalog/products/{id}` (only if no seller stocks it and it has no varieties) |
| **order** | Place order, status lifecycle, cancel, stock reservation, **claims** ("not original" → refund) | `POST /api/orders`, `GET /api/orders/me`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel`, `GET /api/orders/seller`, `POST /api/orders/{id}/status`; admin: `GET /api/orders` (latest 300); claims: `POST /api/claims` (customer, delivered orders), admin `GET /api/claims`, `POST /api/claims/{id}/decision`; money: seller `GET /api/orders/seller/money` (balance + past settlements), admin `GET /api/orders/balances`, `POST /api/orders/settlements` |
| **payment** | Payment record per order, escrow states (hold → release / refund) | (internal, used by order) |
| **books** | The seller's own books: customers who buy on due and their payments; purchases (stock in, paid on the spot, average cost; edit or delete any time, stock never below 0); reports (day book, customer statements, P&L, money by method). Balances are summed from rows, never stored. Reports read other modules' tables read-only. No suppliers. | `/api/books/customers` (GET, POST, PUT `{id}`, GET `{id}` = statement, `POST {id}/payments`), `POST /api/books/payments/{id}/void`, `/api/books/purchases` (GET, POST, PUT `{id}`, DELETE `{id}`), `GET /api/books/ledger?from&to`, `GET /api/books/summary?from&to`; catalog: `DELETE /api/listings/{id}` (remove a product from the shop, history kept) |
| **review** | Verified-purchase reviews, updates seller quality score | `POST /api/reviews`, `GET /api/reviews/seller/{sellerId}` |

### 2.1 Inside a module (same pattern everywhere)

```
order/
 ├── Order.java              ← JPA entity (maps 1 table)
 ├── OrderItem.java
 ├── OrderRepositories.java  ← Spring Data repositories (package-private)
 ├── OrderService.java       ← business rules + @Transactional  (PUBLIC API of the module)
 └── OrderController.java    ← HTTP: validate input, read user from JWT, call service
```

### 2.2 Module rules (keep the monolith clean, so modules can be split later)

1. **Controller → Service → Repository.** Controllers never touch repositories.
2. **Other modules call a module only through its `Service`.** Repositories are package-private where possible.
3. **Entities reference other modules by ID only** (`Long sellerId`), never with `@ManyToOne` across modules.
4. **One module owns each table.** Only `order` writes `orders`; only `catalog` changes `listings.stock`.

### 2.3 Module dependency graph

```
auth            (no dependencies)
seller          → (none)
verification    → seller
catalog         → seller
payment         → (none)
order           → catalog, seller, payment, auth (customer name + phone for the seller), activity
customer        → catalog, seller, order
activity        (no dependencies; seller, verification, catalog and order call it)
review          → order, seller
books           → catalog, seller   (order's shop sales call books for the customer account)
```
No cycles. If one module ever needs its own service (e.g. search, notifications), it can be extracted without untangling.

---

## 3. Database Design

### 3.1 ER diagram

```
 ┌──────────┐ 1      1 ┌──────────┐ 1      * ┌───────────────────────┐
 │  users   │──────────│ sellers  │──────────│ verification_requests │
 │──────────│          │──────────│          └───────────────────────┘
 │ id PK    │          │ id PK    │
 │ phone UQ │          │ user_id  │ 1      * ┌──────────┐ *      1 ┌──────────┐ *    1 ┌────────────┐
 │ name     │          │ shop_name│──────────│ listings │──────────│ products │────────│ categories │
 │ password │          │ lat, lng │          │──────────│          │──────────│        └────────────┘
 │ role     │          │ location │◄─ PostGIS│ price    │          │ name     │
 └────┬─────┘          │ radius_m │          │ stock    │          │ origin   │
      │                │ status   │          │ source   │          └──────────┘
      │                │ quality  │          └────┬─────┘
      │                └────┬─────┘               │ 1
      │ 1                   │ 1                   │
      │ *                   │ *                   │ *
 ┌────▼─────────────────────▼──┐ 1          * ┌───▼─────────┐
 │           orders            │──────────────│ order_items │
 │ customer_id, seller_id      │              │ quantity    │
 │ status, total, address      │              │ unit_price  │ ← price snapshot
 └──────┬───────────────┬──────┘              └─────────────┘
        │ 1             │ 1
        │ 1             │ 0..1
 ┌──────▼─────┐   ┌─────▼──────┐
 │  payments  │   │  reviews   │
 │ method     │   │ rating 1-5 │
 │ status     │   │ comment    │
 │ amount     │   └────────────┘
 └────────────┘
```

### 3.2 Tables

| Table | Purpose | Key columns & rules |
|---|---|---|
| `users` | Every person who logs in | `phone` UNIQUE, `email` UNIQUE (case-insensitive), at least one of them required, `role` ∈ CUSTOMER/SELLER/ADMIN/VERIFIER, bcrypt `password_hash` |
| `sellers` | A shop (1 per seller user) | `lat`,`lng` + generated PostGIS `location` (GIST index), `delivery_radius_m` 100–100,000, `status` PENDING/VERIFIED/SUSPENDED, `quality_score` 0–100, `nid_number` UNIQUE (10/13/17 digits, locked once verified), payout account: mobile banking (bKash/Nagad/Rocket + number) and/or bank account (name, holder, number, branch); CHECK that at least one exists |
| `verification_requests` | Trust: documents a seller submits | `status` PENDING/APPROVED/REJECTED, `reviewer_id` |
| `categories` | Groups (Food) and categories (Fruits) | `name` UNIQUE, `parent_id` → a group (max 2 levels), `image_url` |
| `products` | The shared, comparable item ("Rajshahi Mango – Himsagar 1kg") | `category_id`, `origin_region` |
| `listings` | **One seller's offer of one product** | `price` > 0, `stock` ≥ 0, `source_note` (batch origin), UNIQUE(`seller_id`,`product_id`) |
| `orders` | One order = one seller | `status` PLACED/ACCEPTED/SHIPPED/DELIVERED/CANCELLED, `total` > 0 |
| `order_items` | Lines of an order | `quantity` > 0, `unit_price` = snapshot at order time |
| `payments` | One per order, escrow state | `method` COD/BKASH/NAGAD/CARD, `status` PENDING/HELD/RELEASED/REFUNDED, UNIQUE(`order_id`) |
| `reviews` | Verified-purchase review | UNIQUE(`order_id`) → one review per delivered order, `rating` 1–5 |
| `addresses` | Customer's saved delivery addresses | one default per customer (partial unique index) |
| `cart_items` | Customer's cart | UNIQUE(`user_id`,`listing_id`), quantity 1–1000 |
| `order_events` | Order timeline: status, who, when | one row per status change; feeds tracking |
| `payouts` | A settlement between platform and seller, recorded when money moved | signed `amount` (+ platform paid seller, − seller paid platform), `reference` required; `orders.payout_id` marks settled orders |
| `stock_movements` | Every stock change of a listing | `reason` RESTOCK/ADJUSTMENT/SALE/CANCELLED; `listings.stock` is the balance |
| `expenses` | Seller's business costs | category, amount > 0, date |
| `shop_sales`, `shop_sale_items` | Walk-in sales in the physical shop (no commission, outside settlement) | payment method, agreed unit price + cost snapshot, `voided_at` |
| `product_requests` | Seller asks for a missing catalogue product | PENDING/APPROVED/REJECTED; approval creates the product |
| `notifications` | In-app messages per user | `read_at` null = unread |
| `audit_log` | Who did what to which record | append-only |
| `claims` | "Not original? Full refund" report on a delivered order | UNIQUE(`order_id`), `reason` NOT_ORIGINAL/NOT_AS_DESCRIBED/DAMAGED, `status` OPEN/REFUNDED/REJECTED, `resolved_at` set exactly when decided; REFUNDED sets the payment to REFUNDED even after release |

### 3.3 Design decisions

| Decision | Why |
|---|---|
| **Product vs Listing split** | Many sellers sell the *same* product → customers compare price/distance/quality on one screen. |
| **Rules as DB constraints** (CHECK, UNIQUE, FK) | No code path, script or future bug can create negative stock, a 6-star rating or two reviews per order. |
| **`location` is a generated column** | App only sends `lat`/`lng`; PostGIS point is always in sync, no mapping library needed. |
| **GIST index on `location`** | "Sellers within X km" stays fast with thousands of sellers. |
| **Money = `NUMERIC(12,2)` / `BigDecimal`** | Never use `double` for money (rounding errors). |
| **Price snapshot in `order_items`** | Seller changing price later doesn't change past orders. |
| **One order per seller** | Each seller ships separately; a multi-seller cart becomes multiple orders. |
| **Flyway owns the schema** | Every change is a versioned SQL file → same schema on every laptop, test and server. `ddl-auto: validate` fails fast if code and DB disagree. |

### 3.4 Changing the schema
Never edit `V1__init.sql` after it has run anywhere. Add a new file:
```
src/main/resources/db/migration/V2__add_product_images_table.sql
```
Flyway applies it automatically on next startup.

---

## 4. Data Flow: Frontend → Backend → Database

### 4.1 Generic request lifecycle

```
 React (browser)
   │  fetch("/api/orders", { method:"POST", headers:{Authorization:"Bearer eyJ..."}, body: JSON })
   ▼
 ① Security filter     — verifies JWT signature + expiry → user id (sub) + role. Invalid → 401
   ▼
 ② @PreAuthorize       — role allowed for this endpoint? (e.g. hasRole('CUSTOMER')). No → 403
   ▼
 ③ Controller          — JSON → Java record, @Valid checks (phone format, qty ≥ 1 …). Bad → 400
   ▼
 ④ Service             — business rules inside @Transactional (ownership, status, stock). Broken → 404/409
   ▼
 ⑤ Repository / JPA    — SQL via Hibernate / Spring Data → PostgreSQL
   ▼
 ⑥ PostgreSQL          — constraints are the last guard; COMMIT or ROLLBACK everything
   ▼
 ⑦ Response            — Java object → JSON (200/201) or problem+json error
```

Error response example:
```json
{ "type": "about:blank", "title": "Conflict", "status": 409,
  "detail": "not enough stock for listing 7", "instance": "/api/orders" }
```

### 4.2 Flow: login
```
Browser ──POST /api/auth/login {login,password}──► AuthController     (login = phone or email)
     AuthService: login has '@' ? findByEmail : findByPhone → bcrypt.matches → JwtEncoder (sub=userId, roles=[SELLER], exp=24h)
Browser ◄── { "token": "eyJ..." } ──  (React keeps token in memory/localStorage, sends it in every request header)
```

### 4.3 Flow: seller onboarding → verified
```
1. POST /api/auth/register {role:SELLER}         → users row
2. POST /api/sellers {shopName, lat, lng, radius} → sellers row (status = PENDING)
3. POST /api/verifications {documentUrl}          → verification_requests row (PENDING)
4. Admin: GET /api/verifications/pending
5. Admin: POST /api/verifications/{id}/decision {approve:true}
          → request APPROVED + sellers.status = VERIFIED   (same transaction)
6. Seller: PUT /api/listings {productId, price, stock, sourceNote}   ← only allowed when VERIFIED
```

### 4.4 Flow: customer finds the best nearby seller
```
GET /api/catalog/products?q=mango                         → product list
GET /api/catalog/products/1/offers?lat=22.34&lng=91.81&sort=PRICE
        │
        ▼  one SQL query (PostGIS):
   listings JOIN sellers
   WHERE product = 1 AND stock > 0 AND seller VERIFIED
     AND ST_DWithin(seller.location, customer point, seller.delivery_radius_m)
   ORDER BY distance
        │
        ▼  then sort in Java by NEAREST | PRICE | QUALITY
[ {listingId, shopName, price, stock, sourceNote, qualityScore, distanceM}, ... ]
```

### 4.5 Flow: place order (most important — money + stock)
```
POST /api/orders { items:[{listingId:7, quantity:2}], deliveryAddress, paymentMethod:"COD" }
 └─ OrderService.place()  ─── ONE DATABASE TRANSACTION ───────────────────────────┐
     for each item:                                                                │
       load listing → all items same seller? else 400                             │
       UPDATE listings SET stock = stock - 2 WHERE id = 7 AND stock >= 2          │
         → 0 rows updated = not enough stock → 409, ROLLBACK everything            │
       snapshot unit_price, add to total                                          │
     seller still VERIFIED? else 409                                               │
     INSERT orders (status PLACED, total)                                          │
     INSERT order_items                                                            │
     INSERT payments (status PENDING)                                              │
 └─ COMMIT ────────────────────────────────────────────────────────────────────────┘
```
The conditional `UPDATE … WHERE stock >= qty` is **atomic in PostgreSQL**: two customers buying the last item at the same moment → exactly one succeeds. No overselling, no locks in Java.

### 4.5b Commission and settlement
```
At order time:  commission_amount = Σ line total × category.commission_rate %   (stored on the order, never recalculated)
Delivered order, cash on delivery:  the seller holds the cash  → seller owes the commission
                                    refunded by a claim        → seller owes the whole order total
Delivered order, prepaid (later):   platform holds the money   → platform owes total − commission (0 if refunded)
Orders with an OPEN claim wait. Admin "Settle" sums a seller's delivered, unsettled orders into one payouts row
(signed amount + payment reference) and stamps orders.payout_id.
```

### 4.6 Order lifecycle (state machine)
```
            seller            seller           seller
 PLACED ───────────► ACCEPTED ──────► SHIPPED ──────► DELIVERED ──► payment RELEASED
   │                    │                                │
   │ customer/seller    │ seller                         └──► customer may review (once)
   ▼                    ▼
 CANCELLED ◄────────────┘  → stock returned + payment REFUNDED
```
Illegal jumps (e.g. PLACED → DELIVERED) return **409**. Customers can cancel only while `PLACED`.

### 4.7 Flow: review → quality score
```
POST /api/reviews {orderId, rating}
  order belongs to this customer? (else 404)  → order DELIVERED? (else 409)  → not reviewed yet? (else 409)
  INSERT review → seller.quality_score = avg(rating) × 20   → affects sort=QUALITY in search
```

---

## 5. Security

| Concern | How it's handled |
|---|---|
| Passwords | BCrypt hash, never stored or returned in plain text |
| Authentication | JWT HS256 signed with `JWT_SECRET` (env var, ≥ 32 chars), 24 h expiry |
| Authorization | Role in token + `@PreAuthorize` per endpoint |
| Ownership | Services always filter by the logged-in user (seller sees only own orders; customer only own orders → others get 404) |
| Self-promotion | Register accepts only CUSTOMER/SELLER; ADMIN/VERIFIER are promoted by an admin |
| Input validation | Bean Validation on every request record (BD phone regex, ranges, sizes) |
| SQL injection | Only parameterised queries (Spring Data / `:params`) |
| Public endpoints | Only `/api/auth/**`, `GET /api/catalog/**`, Swagger |

**Creating admins** (never through the API): either promote an existing user
```sql
UPDATE users SET role = 'ADMIN' WHERE phone = '01XXXXXXXXX';
```
or insert an email-only staff account with a **BCrypt hash** (never a plain password):
```sql
INSERT INTO users (email, name, password_hash, role) VALUES ('admin@example.com', 'Admin', '$2a$10$...', 'ADMIN');
```

---

## 6. Project Structure

```
Marketplace/
├── pom.xml
├── docker-compose.yml                  ← PostgreSQL 16 + PostGIS
└── src/
    ├── main/java/com/marketplace/
    │   ├── MarketplaceApplication.java
    │   ├── common/        SecurityConfig, Errors
    │   ├── auth/          User, UserRepository, AuthService, AuthController
    │   ├── seller/        Seller, SellerRepository, SellerService, SellerController
    │   ├── verification/  VerificationRequest, VerificationRepository, VerificationService, VerificationController
    │   ├── catalog/       Category, Product, Listing, NearbyOffer, CatalogRepositories, CatalogService, CatalogController
    │   ├── order/         Order, OrderItem, OrderRepositories, OrderService, OrderController
    │   ├── payment/       Payment, PaymentRepository, PaymentService
    │   └── review/        Review, ReviewRepository, ReviewService, ReviewController
    ├── main/resources/
    │   ├── application.yml
    │   └── db/migration/
    │       ├── V1__init.sql             ← initial schema
    │       ├── V2__user_email_login.sql ← email login for users
    │       ├── V3__category_image.sql   ← category photos
    │       ├── V4__category_groups.sql  ← category groups (parent_id)
    │       ├── V5__claims.sql           ← "not original" claims
    │       └── V6__business_tables.sql  ← seller NID + payout account, addresses, cart, order timeline, commission, settlements, stock history, expenses, product requests, notifications, audit log
    │       └── V7__shop_sales.sql       ← walk-in (offline) sales, SHOP_SALE stock reasons
    │       └── V8__stock_units.sql      ← listing unit + low-stock level, decimal stock, register note/unit cost
    │       └── V9__product_varieties.sql ← products.parent_id: a variety (আম → হিমসাগর) is a product one level under another
    └── test/
        ├── java/com/marketplace/MarketplaceFlowTest.java
        └── resources/docker-java.properties   ← lets Testcontainers talk to Docker 29+
```

---

## 7. Running Locally

```bash
cd Marketplace
docker compose up -d          # PostgreSQL + PostGIS on localhost:5432 (db/user/pass: marketplace)
mvn spring-boot:run           # app on http://localhost:8080, Flyway creates tables on first start
# API docs:  http://localhost:8080/swagger-ui.html
mvn test                      # full flow test on a throw-away PostGIS container
```

Environment variables (all have dev defaults): `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `PORT`.

---

## 8. Not Built Yet (add when needed)

| Feature | Add when |
|---|---|
| bKash / Nagad / SSLCommerz gateway + callback (`PENDING → HELD`) | First online-paying customers |
| Courier API booking (Pathao / Steadfast / RedX) | Sellers stop self-delivering |
| Image / document upload (Cloudflare R2 / S3) | Before public seller onboarding |
| Phone OTP login, refresh tokens | Before public launch |
| SMS + browser Web Push on new order | Marketplace launch (Phase 2) |
| Claim window (e.g. 7 days), seller penalties, claims in the quality score | Policy is decided (Phase 3) |
| Automatic payouts through bKash/bank APIs (settlements are recorded by hand today) | Online payments go live |
| Subscriptions and the Free plan's product limit; several typed verification documents; favourites | Plans can be paid for / verification team asks |
| Sales made outside the platform (shop counter, Facebook) in the seller's stock and profit | Sellers ask to run their whole shop here |
| Full-text search / Meilisearch | Catalogue > ~10k products |
| Redis cache, rate limiting | Real traffic shows the need |
