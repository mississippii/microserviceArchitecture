# Features

Every feature of the marketplace, by role: what is built, what is partly built, and what still has to be built.
Checked against the code on 13 Nov 2026 (backend `Marketplace/`, web `Web/`).

**Legend:** ✅ built and working · 🟡 partly built (the gap is named) · ⬜ not built yet

---

## 1. Everyone (visitors and all roles)

### 1.1 Accounts and sign-in
| | Feature | Notes |
|---|---|---|
| ✅ | Sign up as a customer | Name, Bangladeshi mobile number (01XXXXXXXXX), password; email optional |
| ✅ | Sign up as a seller | Same form with the seller choice; email is required for sellers |
| ✅ | Log in | By phone, or by email (staff log in by email) |
| ✅ | Stay logged in | JWT token kept in the browser |
| ✅ | Log out | Back gesture after logging out does not reopen the private area |
| ✅ | Seller swiping back out of the Seller Centre | Asks "Do you want to log out?" instead of showing the customer site; Cancel stays in the Seller Centre |
| ✅ | Signed-in users skip the login page | Opening `/login` or `/register` while signed in goes to your own area; swiping back after login skips the login form |
| ✅ | Each role lands in its own area | Customer → shop, seller → Seller Centre, admin / verifier → Admin |
| ✅ | Edit profile | Name and email (a seller must keep an email) |
| ✅ | Change password | |
| ⬜ | Forgot password / reset by SMS or email | No way to recover an account today |
| ⬜ | Phone OTP login and OTP at sign-up | Planned in the business plan; also a guard against fake COD orders |
| ⬜ | Delete account / export my data | |

### 1.2 Notifications
| | Feature | Notes |
|---|---|---|
| ✅ | In-app bell with unread count | Header, every role |
| ✅ | Mark all as read; tap opens the related page | |
| ✅ | Events sent today | New order (seller), order status changes (customer), order cancelled by customer (seller), low stock (seller), new issue (seller + admins), claim decided (customer + seller), verification decided (seller), shop suspended / reinstated (seller), product request decided (seller), settlement recorded (seller) |
| ⬜ | SMS notifications | Needs an SMS gateway account (SSL Wireless / BulkSMSBD) |
| ⬜ | Web push notifications | Needs FCM / Web Push |
| ⬜ | Email notifications | |

### 1.3 Site-wide
| | Feature | Notes |
|---|---|---|
| ✅ | Mobile-first layout | Designed at 390px first, then desktop |
| ✅ | Black-and-white design system | Tokens in `Web/src/index.css`; one blue exception (Start shopping button) |
| ✅ | Compact header with search | Person icon at the far right on phones |
| ✅ | Black announcement bar | "Verified sellers only · Not original? Full refund" |
| ✅ | Compact footer | Shop / Sell / Account links; hidden in Seller Centre and Admin |
| ✅ | Installable app manifest and icons | `manifest.webmanifest`, 192/512 icons |
| 🟡 | PWA | Manifest only; no service worker, so no offline mode or install prompt control |
| ✅ | Accessibility basics | Skip link, labelled controls, 44px touch targets, reduced-motion respected |
| 🟡 | Brand name | Placeholder "Asol" in `Web/src/brand.js`; real name undecided |
| ⬜ | Bangla interface | English only (user decision); product names can be Bangla |
| ⬜ | Image upload | Product photos and seller documents are URLs only |

---

## 2. Customer

### 2.1 Home page
| | Feature | Notes |
|---|---|---|
| ✅ | Category tiles ("Shop by category") | Photo tiles, 4 across on phones; groups with stock first; photos fill the tile |
| ✅ | Category photos | All from the owner's photos: Fruits, Vegetables, Grocery, Spices, Baby Care, Meat & Fish, Artisan Craft, Fashion. A group shows once it has products or a photo |
| ✅ | One product row per category group | Sideways row on phones, grid on desktop, "See all" link |
| ✅ | One card per product, not per variety | আম shows once with its lowest price and "N varieties"; the varieties show after a tap |
| ✅ | Floating "Start shopping" button (phones) | Facebook blue, continuous ripple, hides at the footer; opens the catalogue with the filter panel open |
| ✅ | "Sell your original products" band | Links to seller sign-up |
| ⬜ | Promotions / offers / featured listings | Business plan phase 4 |
| ⬜ | Recently viewed, recommendations | |

### 2.2 Catalogue (`/products`)
| | Feature | Notes |
|---|---|---|
| ✅ | Browse every in-stock product from verified shops | No location needed (user decision) |
| 🟡 | One card per product | Home groups varieties under their product; this page still lists each variety (আম - হিমসাগর, আম - ল্যাংড়া) as its own card |
| ✅ | Search by product name | From the header search |
| ✅ | Filter by category and sub-category | Desktop: left column; phones: half-screen panel from the left, desktop-size text |
| ✅ | Filter by origin district | Shown when products carry an origin |
| ✅ | Filter by price range | Min / Max |
| ✅ | "Sold by 2+ sellers" filter | |
| ✅ | Active filter chips with clear-all | |
| ✅ | Sort | Most sellers, price low → high, price high → low, name A–Z |
| ✅ | Product cards with photo, price from, sellers | 109 of 137 products have photos; the rest show a placeholder |
| 🟡 | Distance / nearest seller | API still accepts lat/lng, UI no longer asks for a location (user decision) |
| ⬜ | Full-text / Bangla-friendly search (Meilisearch) | Planned when the catalogue grows |
| ⬜ | Search suggestions / autocomplete | |

### 2.3 Product page (`/p/:id`)
| | Feature | Notes |
|---|---|---|
| ✅ | Product details, origin, photo | |
| ✅ | Varieties of a product | A product with varieties lists the ones in stock ("from ৳…"); each opens its own sellers, with a link back to the product |
| ✅ | All sellers of the product side by side | Price, quality score, stock, batch source |
| ✅ | Sort offers by best price or best quality | |
| ✅ | Buy now (one offer) | Quantity, delivery address, cash on delivery |
| ✅ | Add to cart | |
| ✅ | Link to each seller's shop page | |
| ⬜ | Product reviews per product | Reviews are per seller today |
| ⬜ | Several photos per product | One photo URL |

### 2.4 Shop page (`/s/:id`)
| | Feature | Notes |
|---|---|---|
| ✅ | Public shop page | Shop name, quality score, delivery radius, its in-stock products; no address shown |
| ✅ | Seller reviews | |

### 2.5 Cart and checkout
| | Feature | Notes |
|---|---|---|
| ✅ | Cart: add, change quantity, remove | |
| ✅ | Checkout to a saved address | One order per shop; the cart says how many separate deliveries |
| ✅ | Cash on delivery | The only live payment method |
| ⬜ | bKash / Nagad / card / SSLCommerz payments | Payment table already has methods and HELD / RELEASED / REFUNDED states; no gateway connected |
| ⬜ | Delivery fee | Orders have no delivery charge today |
| ⬜ | Coupons / discount codes | |
| ⬜ | COD limits for new users, advance for big orders | Fraud guard from the business plan |

### 2.6 Orders (`/orders`)
| | Feature | Notes |
|---|---|---|
| ✅ | My orders list | |
| ✅ | Order progress with times | Placed → Accepted → Shipped → Delivered |
| ✅ | Cancel an order | While Placed or Accepted |
| ✅ | Review the seller after delivery | 1–5 stars + comment; updates the seller's quality score |
| ✅ | Report a problem ("claim") after delivery | Not original, not as described, damaged; admin decides full refund or reject |
| ✅ | See claim status and decision note | |
| ⬜ | Courier tracking | Pathao / Steadfast / RedX integration not built |
| ⬜ | Claim time window | Claims have no deadline yet |
| ⬜ | Invoice / receipt download | |
| ⬜ | Reorder | |

### 2.7 Account (`/account`)
| | Feature | Notes |
|---|---|---|
| ✅ | Profile | Name, email |
| ✅ | Password | |
| ✅ | Saved addresses | Add, edit, delete |
| ⬜ | Wishlist / saved products | |
| ⬜ | Loyalty points | Mentioned in the business plan as a retention idea |

---

## 3. Seller (Seller Centre, `/seller`)

Phones: bottom bar with Home, Sells, Orders, Stock and More (Customers, Accounts, Day book). Desktop: left sidebar. No page titles at the top (the tab names the page); content starts right under the header.

### 3.1 Opening a shop
| | Feature | Notes |
|---|---|---|
| ✅ | Shop form | Shop name, address, map location, delivery radius, NID number, payout account (bKash / Nagad / Rocket and/or bank) |
| ✅ | Submit verification documents | Document link; status pending / verified / rejected with the reviewer's note |
| ✅ | Listing allowed only after verification | |
| ✅ | Edit shop details later | Accounts → My shop |
| ✅ | Share a public shop link | `/s/:id` |
| ✅ | Suspended-shop banner | Explains what to do |
| ⬜ | Upload documents as files (NID photo, trade licence) | Link only today |
| ⬜ | Verification fee | Revenue stream in the business plan |

### 3.2 Home (inventory)
| | Feature | Notes |
|---|---|---|
| ✅ | Product tiles grouped by product | Varieties sit under their product (আম → হিমসাগর, ল্যাংড়া); tile shows photo, "N varieties", lowest price, total stock, LOW / OUT badge |
| ✅ | Search by product or variety name | |
| ✅ | Product filter beside the search | Small dropdown card: All products, then each product the shop holds |
| ✅ | Tap a product → its varieties | Small sheet: each variety with price, stock, **Sell** badge and a restock button |
| ✅ | Tap a variety → sell form, prefilled | Product photo, price, stock, average cost, margin, the shipments it came in; 1 unit already in the sale |
| ✅ | Out-of-stock variety → restock form | |
| ✅ | Desktop table | Product, cost, price, stock; name opens the varieties |
| ✅ | "+ Stock" floating button | Opens the new-shipment form |

### 3.3 Stock (shipments)
| | Feature | Notes |
|---|---|---|
| ✅ | Shipment list as photo tiles | Named product + date, e.g. খেজুর_11_Nov (two products: আম+লিচু_11_Nov); varieties underneath; total with extra costs |
| ✅ | New shipment ("+ Stock"): one product, many varieties | Group → product, then "Add items" (as CBTrading's shipment form): Variety, Qty, Unit, **+ Add** puts the line in the Items list (✕ removes it). Cost, Sell unit, Price and Expiry sit behind "Cost and price" and can be left for later. One purchase; opens the new shipment |
| ✅ | One photo per shipment | The product's own photo on the tile and the shipment page; varieties are listed by name |
| ✅ | Fill in a shipment later | Tap a product on the shipment page: Cost, Sell unit (defaults to the unit it was received in; changing it asks e.g. "kg per crate" and recounts the stock), Price, Expiry, photos, video, description, ingredients in one sheet. Rows say "Add cost · Add price" until they are set |
| ✅ | No price = not on sale | A product received without a price is in stock and can be sold at the counter, but customers don't see it until it has a price |
| ✅ | Receive by the crate, price by the kg, per line | Unit ≠ Sell unit asks "kg per crate"; stock and cost are stored in the sell unit; the seller sets any price |
| ✅ | Paid by + note on a shipment | Cash, bKash, Nagad, Rocket, Card, Bank |
| ✅ | New price on an existing product applied on receive | |
| ✅ | Request a missing product | Link inside the new-shipment form; admin approves |
| ✅ | Shipment page (its own page, back gesture works) | Photo header with name, date, payment and total; Goods, Extra costs, Total cost, Worth at price; product lines with qty × cost, price, margin, stock now |
| ✅ | ⋮ menu on the shipment | Small card: Add cost, Change prices, Edit, Delete |
| ✅ | Add cost to a shipment | Transport, Packaging, Labour, Other; counted as an expense in the accounts |
| ✅ | Change selling prices from a shipment | Per product, with live margin |
| ✅ | Edit a shipment any time | Quantities, costs, payment, note; stock and average cost follow |
| ✅ | Delete a shipment any time | Goods come off stock (never below 0); its costs are removed |
| ✅ | Weighted average cost | Every receipt averages in automatically |
| ✅ | Low-stock alert | Notification when stock crosses the product's level (default 5) |
| ✅ | Restock / correct one product | Receive more, or set the counted stock with a reason (gain or loss at cost) |
| ✅ | Repack units | Buy by the crate, sell by the kg |
| ✅ | Recount existing stock in another unit | Edit a product → Sell unit → "kg per crate": 10 crates become 200 kg, cost and history follow, price is typed again per kg. Refused while the product has open online orders |
| ✅ | Remove a product from the shop | History kept; it comes back when stocked again |
| ✅ | Shop-only products | "Sell online" switch per product |
| 🟡 | Remove a shipment's extra cost | Only from Accounts → Expenses (the section was removed from the shipment page) |
| 🟡 | Stock register (every movement) | Recorded by the backend; the screen was removed (user decision) |
| ✅ | Batch tracking (oldest goods sell first) | Every receipt is its own batch; a sale records which batch it took from; a cancelled or voided sale goes back to the same batch |
| ✅ | Sold-through per shipment | Shipment page and tile: % sold, left and sold per product, Sales, Profit so far (sales − cost of what sold − the shipment's extra costs; refunded orders earn nothing) |
| ✅ | Expiry dates | Optional per shipment line (new shipment, single restock, edit); shown on the shipment and the sell form; "Expiring" badge on Home within 3 days |
| ✅ | Expiry alerts | Notification every morning (09:00 Dhaka) 3 days before and on the day |
| ✅ | Expired goods are never sold | Sellable up to and including the expiry date. After it, a shop sale or online order that would need them is refused; just after midnight (Dhaka) they come off stock as a loss at cost and the seller is notified |
| ✅ | Seller's product details | Edit a product → Details: up to 6 photos and one video (uploaded from the phone), description, ingredients; customers open them with "Details" on the seller's offer |
| ⬜ | Barcode / SKU | |

### 3.4 Sells
| | Feature | Notes |
|---|---|---|
| ✅ | Record a shop sale | Search products, quantity, price per line, discount, paid now |
| ✅ | Offline (walk-in) or online (known buyer) sale | |
| ✅ | Sell on due | Unpaid rest goes on the customer's account; phone + name required |
| ✅ | Buyer filled in from the phone number | Existing customer, registered user, or past buyer |
| ✅ | Payment method | Cash, bKash, Nagad, Rocket, Card, Bank |
| ✅ | Today's totals | Today, in shop, online |
| ✅ | One list of all sales | All / Online / In shop |
| ✅ | Void a shop sale | Stock comes back |
| ✅ | Receipt for a shop sale | Printer button on the sale → slip → Print (or save as PDF from the print dialog) |
| ⬜ | Receipt by SMS | |
| ⬜ | Returns of part of a sale | Only full void today |

### 3.5 Orders (online)
| | Feature | Notes |
|---|---|---|
| ✅ | Orders list | Open / Delivered / Cancelled / All, search |
| ✅ | Accept → Mark shipped → Mark delivered | |
| ✅ | Cancel | While Placed or Accepted; stock returns |
| ✅ | Customer name and phone to call | |
| ✅ | Order progress trail | |
| ⬜ | Book a courier from the order | |
| ✅ | Invoice / packing slip print | Printer button on the order: shop, customer, address, lines, total |

### 3.6 Customers (dues)
| | Feature | Notes |
|---|---|---|
| ✅ | Customer list with what each owes | |
| ✅ | Add / edit a customer | Name, phone, address, opening balance |
| ✅ | Statement | Every sale and payment with the running balance |
| ✅ | Take a payment | Any method; paying more becomes an advance |
| ✅ | Void a payment entered by mistake | |
| ⬜ | Due reminders by SMS | |
| ⬜ | Credit limit per customer | |

### 3.7 Accounts
| | Feature | Notes |
|---|---|---|
| ✅ | Profit and loss for a period | Sales − cost of goods − commission − expenses − stock loss |
| ✅ | Money by method | In / out for cash, bKash, Nagad, Rocket, card, bank |
| ✅ | Platform balance and settlements | Commission owed on COD orders, past settlements |
| ✅ | Expenses | Add (category, paid by, date, note), delete; shipment costs appear here too |
| ✅ | Profit per product | |
| ✅ | Dues: what customers owe | |
| ✅ | My shop (edit shop details) | |
| ✅ | Export to CSV (opens in Excel) | Accounts (profit and loss, money by method, product profit), Day book, customer statement |
| ⬜ | Export to PDF | |
| ⬜ | Charts over time | |

### 3.8 Day book
| | Feature | Notes |
|---|---|---|
| ✅ | One day's money entry by entry | Sales, online orders, payments received, purchases, expenses, settlements |

### 3.9 Not built for sellers
| | Feature | Notes |
|---|---|---|
| ⬜ | Subscriptions (Free / Pro ৳499 / Business ৳1,499) | Business plan revenue stream |
| ⬜ | Staff accounts and multiple branches | Business plan "Business" tier |
| ⬜ | Featured listings / ads | |
| ⬜ | Automatic payouts | Settlements are recorded by hand by an admin |
| ⬜ | Seller penalties for upheld claims | |
| ⬜ | Seller micro-loans, bulk sourcing (B2B) | Future ideas in the business plan |

---

## 4. Admin (`/admin`)

Tabs: Overview, Verification, Issues, Sellers, Orders, Catalogue.

| | Feature | Notes |
|---|---|---|
| ✅ | Overview | Verified shops (and suspended), waiting verification, open issues, delivered sales with delivered/open counts |
| ✅ | Verification queue | Approve or reject with a note (note required to reject) |
| ✅ | Issues (claims) | Refund in full or reject, note required; shown to customer and seller |
| ✅ | Sellers | Filter, search by name or area, NID and payout account, suspend / reinstate |
| ✅ | Record a settlement | Commission owed on COD orders, or what the platform owes on prepaid |
| ✅ | All orders | Filter and search by order #, shop or customer |
| ✅ | Categories | Groups and sub-categories, photo, commission % per category |
| ✅ | Products | Add, edit, delete; varieties under a product; origin, description, photo URL |
| ✅ | Product requests from sellers | Approve (choose category / name) or reject |
| ✅ | Audit trail | Staff actions |
| ⬜ | Create / manage staff accounts (admin, verifier) | Staff accounts are added straight in the database today |
| ⬜ | Customer management (block a fraudulent buyer) | |
| ⬜ | Platform reports (GMV, commission, cohorts) | Only the overview figures today |
| ⬜ | Refund payout to the customer's wallet / bKash | A refund is a status today; no money moves |
| ⬜ | Banners / promotions management | |
| ⬜ | Bulk product import (CSV) | |

## 5. Verifier (`/admin`, limited)

| | Feature | Notes |
|---|---|---|
| ✅ | Verification queue | Approve / reject with a note |
| ✅ | Sellers list (read only) | Cannot suspend |
| ⬜ | Field-visit checklist / photos | |

---

## 6. Backend and operations

| | Feature | Notes |
|---|---|---|
| ✅ | Spring Boot 3.5 / Java 21 modular monolith | Modules: auth, catalog, customer, order, payment, review, seller, books, verification, activity |
| ✅ | PostgreSQL + PostGIS, Flyway migrations V1–V21 | |
| ✅ | Role-based security on every endpoint | CUSTOMER, SELLER, ADMIN, VERIFIER |
| ✅ | Balances computed from rows, never stored | Dues, stock value, profit |
| ✅ | Integration test of the whole flow | `MarketplaceFlowTest` (Testcontainers) |
| ⬜ | Production deployment, backups, monitoring | |
| ⬜ | Rate limiting (Redis) | |
| 🟡 | File storage for images and documents | Product photos and videos upload to the server's disk (`UPLOADS_DIR`, served at `/uploads/`); no resizing; removed files stay on disk; verification documents are still links. Move to R2 / S3 before production |
| ⬜ | Maps / address lookup (Barikoi) | |
| ⬜ | Legal pages (terms, privacy, refund policy) | Checklist in the business plan |

---

## 7. What to build next (suggested order)

1. **Object storage (R2 / S3) with thumbnails**, and file upload for the catalogue photo, shop and verification documents.
2. **Forgot password** and **phone OTP** (sign-up, login, COD fraud guard).
3. **Online payments**: bKash / Nagad / SSLCommerz, holding the money until delivery.
4. **Delivery fee and courier booking / tracking** (Pathao, Steadfast, RedX).
5. **SMS notifications** for orders, dues and low stock.
6. **Staff account management** in Admin.
7. **Claim time window and seller penalties.**
8. **Returns of part of a sale** and a **credit limit** per customer.
9. **Barcode / SKU.**
10. **Seller subscriptions, featured listings, promotions** (growth phase).
