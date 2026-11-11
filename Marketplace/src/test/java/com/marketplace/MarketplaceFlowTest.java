package com.marketplace;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** End-to-end happy path + the rules that protect money, stock and trust. Needs Docker. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class MarketplaceFlowTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>(
            DockerImageName.parse("postgis/postgis:16-3.4").asCompatibleSubstituteFor("postgres"));

    @Autowired TestRestTemplate http;
    @Autowired JdbcTemplate jdbc;

    @Test
    void fullOrderFlow() {
        register("01711111111", "SELLER");
        register("01722222222", "CUSTOMER");
        register("01733333333", "CUSTOMER");
        jdbc.update("update users set role = 'ADMIN' where phone = '01733333333'"); // admins are promoted, not self-registered
        var seller = login("01711111111");
        var customer = login("01722222222");
        var admin = login("01733333333");

        // Email login (staff accounts): created directly in DB, case-insensitive match
        jdbc.update("update users set email = 'Staff@Example.com' where phone = '01733333333'");
        assertThat(login("staff@example.com")).isNotNull();

        // Seller opens a shop in Chattogram (5 km delivery radius)
        var shopBody = new java.util.HashMap<String, Object>(Map.of(
                "shopName", "Ctg Mango House", "address", "GEC, Chattogram",
                "lat", 22.3590, "lng", 91.8210, "deliveryRadiusM", 5000, "nidNumber", "1234567890"));
        // A shop needs an NID and somewhere to be paid: mobile banking, a bank account, or both
        assertThat(call(HttpMethod.POST, "/api/sellers", seller, shopBody).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        shopBody.put("bankAccountNumber", "1002003004"); // bank account without bank name
        assertThat(call(HttpMethod.POST, "/api/sellers", seller, shopBody).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        shopBody.remove("bankAccountNumber");
        shopBody.put("mobileBankingProvider", "BKASH");
        shopBody.put("mobileBankingNumber", "01711111111");
        var shop = call(HttpMethod.POST, "/api/sellers", seller, shopBody);
        assertThat(shop.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Admin creates catalog
        var group = call(HttpMethod.POST, "/api/catalog/categories", admin, Map.of("name", "Food"));
        var cat = call(HttpMethod.POST, "/api/catalog/categories", admin, Map.of("name", "Fruits", "parentId", id(group)));
        assertThat(((Number) cat.getBody().get("parentId")).longValue()).isEqualTo(id(group));
        // only two levels: a category can't be put under a category that is itself inside a group
        assertThat(call(HttpMethod.POST, "/api/catalog/categories", admin, Map.of("name", "Mango", "parentId", id(cat)))
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        var product = call(HttpMethod.POST, "/api/catalog/products", admin, Map.of(
                "categoryId", id(cat), "name", "Rajshahi Mango - Himsagar 1kg", "originRegion", "Rajshahi"));
        var productId = id(product);
        // Varieties: one level under a product, stored with the full name, in the product's category
        var mango = call(HttpMethod.POST, "/api/catalog/products", admin, Map.of("categoryId", id(group), "name", "আম"));
        var himsagar = call(HttpMethod.POST, "/api/catalog/products", admin, Map.of("categoryId", id(group), "parentId", id(mango), "name", "হিমসাগর"));
        assertThat(himsagar.getBody().get("name")).isEqualTo("আম - হিমসাগর");
        assertThat(((Number) himsagar.getBody().get("categoryId")).longValue()).isEqualTo(id(group));
        assertThat(call(HttpMethod.POST, "/api/catalog/products", admin, Map.of("categoryId", id(cat), "parentId", id(himsagar), "name", "x"))
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        // Remove: a product with varieties can't go until they do; an unused variety can
        assertThat(call(HttpMethod.DELETE, "/api/catalog/products/" + id(mango), admin, null).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(call(HttpMethod.DELETE, "/api/catalog/products/" + id(himsagar), admin, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(call(HttpMethod.DELETE, "/api/catalog/products/" + id(mango), admin, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        var listingBody = Map.of("productId", productId, "price", 150.00, "stock", 2, "sourceNote", "Batch from Bagha orchard", "costPrice", 100.00);

        // Unverified seller cannot list
        assertThat(call(HttpMethod.PUT, "/api/listings", seller, listingBody).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // Verification: seller submits, admin approves
        var req = call(HttpMethod.POST, "/api/verifications", seller, Map.of("documentUrl", "https://example.com/trade-license.pdf"));
        call(HttpMethod.POST, "/api/verifications/" + id(req) + "/decision", admin, Map.of("approve", true));
        assertThat(call(HttpMethod.GET, "/api/verifications/me", seller, null).getBody().get("status")).isEqualTo("APPROVED");

        var listing = call(HttpMethod.PUT, "/api/listings", seller, listingBody);
        assertThat(call(HttpMethod.DELETE, "/api/catalog/products/" + productId, admin, null).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(listing.getStatusCode()).isEqualTo(HttpStatus.OK);
        var listingId = id(listing);

        // Nearby customer (~2 km) sees the offer; customer in Dhaka does not
        assertThat(offers(productId, 22.3400, 91.8150)).hasSize(1);
        var nearby = http.getForObject("/api/catalog/products/nearby?lat=22.34&lng=91.815&q=mango", List.class);
        assertThat(nearby).hasSize(1);
        assertThat(((Number) ((Map<?, ?>) nearby.get(0)).get("minPrice")).doubleValue()).isEqualTo(150.0);
        assertThat(http.getForObject("/api/catalog/products/nearby?lat=23.81&lng=90.41", List.class)).isEmpty();
        assertThat(offers(productId, 23.8103, 90.4125)).isEmpty();
        // No location needed: everyone sees every in-stock product and its sellers, with price
        var everywhere = http.getForObject("/api/catalog/products/nearby", List.class);
        assertThat(everywhere).hasSize(1);
        assertThat(((Map<?, ?>) everywhere.get(0)).get("nearestM")).isNull();
        assertThat(http.getForObject("/api/catalog/products/" + productId + "/offers", List.class)).hasSize(1);
        assertThat(http.getForEntity("/api/catalog/products/nearby?lat=22.3", String.class).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Cannot oversell: ordering 3 with stock 2 fails and stock stays 2
        var tooMany = call(HttpMethod.POST, "/api/orders", customer, order(listingId, 3));
        assertThat(tooMany.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(stock(listingId)).isEqualTo(2);

        var placed = call(HttpMethod.POST, "/api/orders", customer, order(listingId, 2));
        assertThat(placed.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var orderMap = (Map<?, ?>) placed.getBody().get("order");
        var orderId = ((Number) orderMap.get("id")).longValue();
        assertThat(((Number) orderMap.get("total")).doubleValue()).isEqualTo(300.0);
        assertThat(stock(listingId)).isZero();

        // Review before delivery is rejected (verified purchases only)
        var early = call(HttpMethod.POST, "/api/reviews", customer, Map.of("orderId", orderId, "rating", 5));
        assertThat(early.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // Seller cannot skip steps
        assertThat(status(seller, orderId, "DELIVERED").getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        for (var s : List.of("ACCEPTED", "SHIPPED", "DELIVERED")) {
            assertThat(status(seller, orderId, s).getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        assertThat(jdbc.queryForObject("select status from payments where order_id = ?", String.class, orderId))
                .isEqualTo("RELEASED");

        // Review after delivery updates seller quality score; second review rejected
        var review = call(HttpMethod.POST, "/api/reviews", customer, Map.of("orderId", orderId, "rating", 4));
        assertThat(review.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(jdbc.queryForObject("select quality_score from sellers", Double.class)).isEqualTo(80.0);
        assertThat(call(HttpMethod.POST, "/api/reviews", customer, Map.of("orderId", orderId, "rating", 1))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // Seller sees payment + customer contact on orders; edits shop; admin sees all orders and shops
        var sellerOrders = http.exchange("/api/orders/seller", HttpMethod.GET, auth(seller), List.class).getBody();
        var first = (Map<?, ?>) sellerOrders.get(0);
        assertThat(((Map<?, ?>) first.get("customer")).get("phone")).isEqualTo("01722222222");
        assertThat(((Map<?, ?>) first.get("payment")).get("status")).isEqualTo("RELEASED");
        shopBody.put("shopName", "Ctg Mango House 2");
        shopBody.put("deliveryRadiusM", 8000);
        shopBody.put("bankName", "Islami Bank");
        shopBody.put("bankAccountName", "Test Seller");
        shopBody.put("bankAccountNumber", "1002003004");
        var edited = call(HttpMethod.PUT, "/api/sellers/me", seller, shopBody);
        assertThat(edited.getBody().get("deliveryRadiusM")).isEqualTo(8000);
        assertThat(edited.getBody().get("bankAccountNumber")).isEqualTo("1002003004");
        // the verified NID can't be changed any more
        shopBody.put("nidNumber", "9999999999");
        assertThat(call(HttpMethod.PUT, "/api/sellers/me", seller, shopBody).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        shopBody.put("nidNumber", "1234567890");

        // Commission (8% of 300) is fixed on the order; the seller holds the COD cash, so they owe it
        assertThat(jdbc.queryForObject("select commission_amount from orders where id = ?", Double.class, orderId)).isEqualTo(24.0);
        var money = call(HttpMethod.GET, "/api/orders/seller/money", seller, null).getBody();
        assertThat(((Number) ((Map<?, ?>) money.get("balance")).get("amount")).doubleValue()).isEqualTo(-24.0);
        // Timeline has one event per step; cost price is visible to the seller, hidden from the customer
        assertThat((List<?>) first.get("events")).hasSize(4);
        assertThat(((Number) ((Map<?, ?>) ((List<?>) first.get("items")).get(0)).get("unitCost")).doubleValue()).isEqualTo(100.0);
        // Stock history: +2 restock, -2 failed attempt rolled back (not recorded), -2 sale
        var moves = http.exchange("/api/listings/" + listingId + "/movements", HttpMethod.GET, auth(seller), List.class).getBody();
        assertThat(moves).hasSize(2);
        // Expenses
        var expense = call(HttpMethod.POST, "/api/sellers/me/expenses", seller, Map.of("category", "TRANSPORT", "amount", 50, "spentOn", java.time.LocalDate.now().toString()));
        assertThat(expense.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(http.exchange("/api/sellers/me/expenses", HttpMethod.GET, auth(seller), List.class).getBody()).hasSize(1);
        // Seller got notifications (new order, verified…); customer was told about each step
        assertThat(http.exchange("/api/notifications", HttpMethod.GET, auth(seller), List.class).getBody()).isNotEmpty();
        assertThat(http.exchange("/api/notifications", HttpMethod.GET, auth(customer), List.class).getBody()).hasSize(3);
        // Product request: seller asks, admin approves, product exists
        var wish = call(HttpMethod.POST, "/api/product-requests", seller, Map.of("name", "Rajshahi Mango - Fazli 1kg", "categoryId", id(cat)));
        assertThat(wish.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var approved = call(HttpMethod.POST, "/api/product-requests/" + id(wish) + "/decision", admin, Map.of("approve", true));
        assertThat(approved.getBody().get("productId")).isNotNull();
        assertThat(http.exchange("/api/orders", HttpMethod.GET, auth(admin), List.class).getBody()).hasSize(1);
        assertThat(http.exchange("/api/orders", HttpMethod.GET, auth(seller), Map.class).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(http.exchange("/api/sellers", HttpMethod.GET, auth(admin), List.class).getBody()).hasSize(1);

        // Customer's orders carry product name + shop name
        var mine = (Map<?, ?>) http.exchange("/api/orders/me", HttpMethod.GET, auth(customer), List.class).getBody().get(0);
        assertThat(mine.get("shopName")).isEqualTo("Ctg Mango House 2");
        assertThat(((Map<?, ?>) ((List<?>) mine.get("items")).get(0)).get("productName")).isEqualTo("Rajshahi Mango - Himsagar 1kg");
        assertThat(((Map<?, ?>) ((List<?>) mine.get("items")).get(0)).get("unitCost")).isNull();

        // Customer dashboard: profile, saved address, cart → checkout makes an order with the recipient copied in
        assertThat(call(HttpMethod.GET, "/api/auth/me", customer, null).getBody().get("phone")).isEqualTo("01722222222");
        var address = call(HttpMethod.POST, "/api/addresses", customer, Map.of(
                "label", "Home", "recipientName", "Rahim", "phone", "01744444444", "address", "Nasirabad, Chattogram"));
        assertThat(address.getBody().get("default")).isEqualTo(true); // first address becomes the default
        call(HttpMethod.PUT, "/api/listings", seller, listingBody); // restock 2
        assertThat(call(HttpMethod.POST, "/api/cart", customer, Map.of("listingId", listingId, "quantity", 3)).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        var headers = new HttpHeaders();
        headers.setBearerAuth(customer);
        headers.setContentType(MediaType.APPLICATION_JSON);
        var cartNow = http.exchange("/api/cart", HttpMethod.POST, new HttpEntity<>(Map.of("listingId", listingId, "quantity", 1), headers), List.class);
        assertThat(cartNow.getBody()).hasSize(1);
        var checkout = call(HttpMethod.POST, "/api/cart/checkout", customer, Map.of("addressId", id(address), "paymentMethod", "COD"));
        assertThat(checkout.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var cartOrderId = ((Number) ((List<?>) checkout.getBody().get("orderIds")).get(0)).longValue();
        assertThat(jdbc.queryForObject("select recipient_phone from orders where id = ?", String.class, cartOrderId)).isEqualTo("01744444444");
        assertThat(http.exchange("/api/cart", HttpMethod.GET, auth(customer), List.class).getBody()).isEmpty();
        assertThat(stock(listingId)).isEqualTo(1);

        // Counter sale (walk-in customer) takes the same stock; short stock rolls back; void puts it back
        var counter = Map.of("items", List.of(Map.of("listingId", listingId, "quantity", 2, "unitPrice", 140)), "paymentMethod", "CASH");
        assertThat(call(HttpMethod.POST, "/api/shop-sales", seller, counter).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(call(HttpMethod.POST, "/api/shop-sales", customer, counter).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        var shopSale = call(HttpMethod.POST, "/api/shop-sales", seller, Map.of(
                "items", List.of(Map.of("listingId", listingId, "quantity", 0.5, "unitPrice", 280)), "paymentMethod", "BKASH", "buyerPhone", "01755555555"));
        assertThat(shopSale.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var saleId = ((Number) ((Map<?, ?>) shopSale.getBody().get("sale")).get("id")).longValue();
        assertThat(jdbc.queryForObject("select total from shop_sales where id = ?", Double.class, saleId)).isEqualTo(140.0);
        assertThat(jdbc.queryForObject("select stock from listings where id = ?", Double.class, listingId)).isEqualTo(0.5);
        assertThat(call(HttpMethod.POST, "/api/shop-sales/" + saleId + "/void", seller, null).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(call(HttpMethod.POST, "/api/shop-sales/" + saleId + "/void", seller, null).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(stock(listingId)).isEqualTo(1);
        // An online sale needs the buyer; the phone fills in a registered buyer's name
        assertThat(call(HttpMethod.POST, "/api/shop-sales", seller, Map.of("items", List.of(Map.of("listingId", listingId, "quantity", 1, "unitPrice", 140)),
                "paymentMethod", "CASH", "channel", "ONLINE", "buyerPhone", "01722222222")).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(call(HttpMethod.GET, "/api/shop-sales/buyer?phone=01722222222", seller, null).getBody().get("name")).isEqualTo("Test CUSTOMER");
        assertThat(call(HttpMethod.GET, "/api/shop-sales/buyer?phone=01799999999", seller, null).getBody().get("name")).isNull();

        // Goods received are added on top of the current count
        assertThat(((Number) call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00, "addStock", 4, "note", "Bagha orchard"))
                .getBody().get("stock")).doubleValue()).isEqualTo(5.0);
        assertThat(stock(listingId)).isEqualTo(5);
        // The unit can't change while there is stock counted in the old one
        assertThat(call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00, "unit", "KG", "addStock", 1))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        var register = http.exchange("/api/listings/me/movements", HttpMethod.GET, auth(seller), List.class).getBody();
        assertThat(((Map<?, ?>) register.get(0)).get("note")).isEqualTo("Bagha orchard");
        // Price and settings alone leave the count as it is; a count and a receipt together are refused
        assertThat(((Number) call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00)).getBody().get("stock")).doubleValue()).isEqualTo(5.0);
        assertThat(call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00, "stock", 1, "addStock", 1)).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00, "stock", 1, "costPrice", 100.00));

        // ----- The seller's books: buy stock, sell on due, collect; the accounts work themselves out -----
        // Buy 4 at ৳120 for ৳480 cash: average cost (1×100 + 4×120) / 5 = 116
        var bought = call(HttpMethod.POST, "/api/books/purchases", seller, Map.of(
                "items", List.of(Map.of("productId", productId, "quantity", 4, "unitCost", 120)), "paymentMethod", "CASH", "note", "Bagha orchard"));
        assertThat(bought.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(stock(listingId)).isEqualTo(5);
        assertThat(jdbc.queryForObject("select cost_price from listings where id = ?", Double.class, listingId)).isEqualTo(116.0);
        // Sell 2 to a new customer: ৳300 − ৳20 discount = ৳280, pays ৳100, owes ৳180; the account is opened from the phone
        call(HttpMethod.PUT, "/api/listings", seller, Map.of("productId", productId, "price", 150.00, "reorderLevel", 4)); // low at 4
        var dueLine = List.of(Map.of("listingId", listingId, "quantity", 2, "unitPrice", 150));
        assertThat(call(HttpMethod.POST, "/api/shop-sales", seller, Map.of("items", dueLine, "paymentMethod", "CASH", "paid", 0))
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST); // a due needs the customer
        assertThat(call(HttpMethod.POST, "/api/shop-sales", seller, Map.of("items", dueLine, "paymentMethod", "CASH", "discount", 20, "paid", 100,
                "buyerPhone", "01788888888", "buyerName", "Karim")).getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(stock(listingId)).isEqualTo(3);
        assertThat(call(HttpMethod.GET, "/api/shop-sales/buyer?phone=01788888888", seller, null).getBody().get("customerId")).isNotNull();
        var customers = http.exchange("/api/books/customers", HttpMethod.GET, auth(seller), List.class).getBody();
        assertThat(customers).hasSize(1);
        var karim = (Map<?, ?>) customers.get(0);
        assertThat(((Number) karim.get("balance")).doubleValue()).isEqualTo(180.0);
        var karimId = ((Number) karim.get("id")).longValue();
        var collected = call(HttpMethod.POST, "/api/books/customers/" + karimId + "/payments", seller, Map.of("amount", 80, "paymentMethod", "BKASH"));
        assertThat(collected.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        // Statement: newest first, each line with the balance after it
        var statement = call(HttpMethod.GET, "/api/books/customers/" + karimId, seller, null).getBody();
        var lines = (List<?>) statement.get("lines");
        assertThat(lines).hasSize(2);
        assertThat(((Number) ((Map<?, ?>) lines.get(0)).get("balance")).doubleValue()).isEqualTo(100.0);
        assertThat(call(HttpMethod.GET, "/api/books/customers/" + karimId, customer, null).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        // A purchase can be edited any time, even after some of it sold: 4 → 5 at ৳120 (৳600). Stock 3 → 4, cost (3×116 − 4×120 + 5×120) / 4 = 117
        var purchaseId = ((Number) ((Map<?, ?>) bought.getBody().get("purchase")).get("id")).longValue();
        var itemId = ((Map<?, ?>) ((List<?>) bought.getBody().get("items")).get(0)).get("id");
        var editedBuy = call(HttpMethod.PUT, "/api/books/purchases/" + purchaseId, seller, Map.of(
                "items", List.of(Map.of("id", itemId, "quantity", 5, "unitCost", 120)), "paymentMethod", "CASH"));
        assertThat(((Number) ((Map<?, ?>) editedBuy.getBody().get("purchase")).get("total")).doubleValue()).isEqualTo(600.0);
        assertThat(stock(listingId)).isEqualTo(4);
        assertThat(jdbc.queryForObject("select cost_price from listings where id = ?", Double.class, listingId)).isEqualTo(117.0);
        // The low-stock alert came on its own when the sale took stock from 5 to 3, below its level of 4
        assertThat(http.exchange("/api/notifications", HttpMethod.GET, auth(seller), List.class).getBody().toString()).contains("Low stock");

        // Today's summary. Sales: ৳300 online + ৳280 in the shop (the voided sale doesn't count).
        // Cost: 2 × 100 online + 2 × 116 in the shop = ৳432. Count corrections at cost: +2 found (−200), −4 lost (+400) = ৳200 loss.
        // Profit: 580 − 432 − 24 commission − 50 expenses − 200 stock loss = −126.
        var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Dhaka"));
        var summary = call(HttpMethod.GET, "/api/books/summary?from=" + today + "&to=" + today, seller, null).getBody();
        assertThat(((Number) summary.get("sales")).doubleValue()).isEqualTo(580.0);
        assertThat(((Number) summary.get("discounts")).doubleValue()).isEqualTo(20.0);
        assertThat(((Number) summary.get("costOfGoods")).doubleValue()).isEqualTo(432.0);
        assertThat(((Number) summary.get("stockLoss")).doubleValue()).isEqualTo(200.0);
        assertThat(((Number) summary.get("netProfit")).doubleValue()).isEqualTo(-126.0);
        assertThat(((Number) summary.get("soldOnCredit")).doubleValue()).isEqualTo(180.0);
        assertThat(((Number) summary.get("customersOwe")).doubleValue()).isEqualTo(100.0);
        // Money by method: cash in = ৳100 at the counter + ৳300 COD; cash out = ৳600 stock + ৳50 expense; bKash in ৳80
        var methods = new java.util.HashMap<Object, Map<?, ?>>();
        ((List<?>) summary.get("byMethod")).forEach(m -> methods.put(((Map<?, ?>) m).get("method"), (Map<?, ?>) m));
        assertThat(((Number) methods.get("CASH").get("moneyIn")).doubleValue()).isEqualTo(400.0);
        assertThat(((Number) methods.get("CASH").get("moneyOut")).doubleValue()).isEqualTo(650.0);
        assertThat(((Number) methods.get("BKASH").get("moneyIn")).doubleValue()).isEqualTo(80.0);
        var ledger = http.exchange("/api/books/ledger?from=" + today + "&to=" + today, HttpMethod.GET, auth(seller), List.class).getBody();
        assertThat(ledger.stream().map(e -> ((Map<?, ?>) e).get("kind")).distinct().toList())
                .contains("SALE", "ORDER", "RECEIVED", "PURCHASE", "EXPENSE");
        // A payment entered by mistake is voided and the due comes back
        call(HttpMethod.POST, "/api/books/payments/" + id(collected) + "/void", seller, null);
        var after = (Map<?, ?>) call(HttpMethod.GET, "/api/books/customers/" + karimId, seller, null).getBody().get("customer");
        assertThat(((Number) after.get("balance")).doubleValue()).isEqualTo(180.0);
        // A shipment carries its own costs (counted as expenses) and can reprice its products
        var withCost = call(HttpMethod.POST, "/api/books/purchases/" + purchaseId + "/costs", seller, Map.of("category", "TRANSPORT", "amount", 30, "paymentMethod", "CASH"));
        assertThat(withCost.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((List<?>) withCost.getBody().get("costs")).hasSize(1);
        var repriced = http.exchange("/api/books/purchases/" + purchaseId + "/prices", HttpMethod.PUT,
                new HttpEntity<>(List.of(Map.of("listingId", listingId, "price", 160)), auth(seller).getHeaders()), Map.class);
        assertThat(((Number) ((Map<?, ?>) ((List<?>) repriced.getBody().get("items")).get(0)).get("price")).doubleValue()).isEqualTo(160.0);
        assertThat(call(HttpMethod.POST, "/api/books/purchases/" + purchaseId + "/costs", customer, Map.of("category", "TRANSPORT", "amount", 30, "paymentMethod", "CASH"))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        // Deleting a purchase is always allowed: its 5 come off stock, which stops at 0 (4 were left), and its money stops counting
        assertThat(call(HttpMethod.DELETE, "/api/books/purchases/" + purchaseId, seller, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(stock(listingId)).isZero();
        assertThat(http.exchange("/api/books/purchases", HttpMethod.GET, auth(seller), List.class).getBody()).isEmpty();
        assertThat(jdbc.queryForObject("select count(*) from expenses where purchase_id = ?", Integer.class, purchaseId)).isZero(); // its costs went with it
        // A product can be removed from the shop (history stays) and comes back when stocked again
        assertThat(call(HttpMethod.DELETE, "/api/listings/" + listingId, seller, null).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(http.exchange("/api/listings/me", HttpMethod.GET, auth(seller), List.class).getBody()).isEmpty();
        assertThat(call(HttpMethod.DELETE, "/api/listings/" + listingId, customer, null).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        call(HttpMethod.PUT, "/api/listings", seller, listingBody);
        assertThat(http.exchange("/api/listings/me", HttpMethod.GET, auth(seller), List.class).getBody()).hasSize(1);
        assertThat(stock(listingId)).isEqualTo(2);

        // "Not original? Full refund": customer claims, admin refunds even though the payment was already released
        var claim = call(HttpMethod.POST, "/api/claims", customer, Map.of("orderId", orderId, "reason", "NOT_ORIGINAL",
                "details", "Tastes like a different variety", "evidenceUrl", "https://example.com/photo.jpg"));
        assertThat(claim.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(call(HttpMethod.POST, "/api/claims", customer, Map.of("orderId", orderId, "reason", "DAMAGED", "details", "again"))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(call(HttpMethod.POST, "/api/claims/" + id(claim) + "/decision", seller, Map.of("refund", true, "note", "x"))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(call(HttpMethod.POST, "/api/claims/" + id(claim) + "/decision", admin, Map.of("refund", true, "note", "Batch not Himsagar"))
                .getBody().get("status")).isEqualTo("REFUNDED");
        assertThat(jdbc.queryForObject("select status from payments where order_id = ?", String.class, orderId)).isEqualTo("REFUNDED");
        var sellerViews = http.exchange("/api/orders/seller", HttpMethod.GET, auth(seller), List.class).getBody();
        var sellerView = (Map<?, ?>) sellerViews.get(sellerViews.size() - 1);
        assertThat(((Map<?, ?>) sellerView.get("claim")).get("status")).isEqualTo("REFUNDED");

        // Settlement: we refunded a COD order whose cash the seller holds, so the seller now owes all ৳300
        var balances = http.exchange("/api/orders/balances", HttpMethod.GET, auth(admin), List.class).getBody();
        assertThat(((Number) ((Map<?, ?>) balances.get(0)).get("amount")).doubleValue()).isEqualTo(-300.0);
        var settled = call(HttpMethod.POST, "/api/orders/settlements", admin, Map.of("sellerId", id(shop), "reference", "TRX123"));
        assertThat(((Number) settled.getBody().get("amount")).doubleValue()).isEqualTo(-300.0);
        assertThat(call(HttpMethod.POST, "/api/orders/settlements", admin, Map.of("sellerId", id(shop), "reference", "TRX124"))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT); // nothing left to settle
        assertThat(http.exchange("/api/audit", HttpMethod.GET, auth(admin), List.class).getBody()).isNotEmpty();

        // Public shop page: no login, no address or coordinates; exact location is staff-only
        var page = http.getForObject("/api/catalog/shops/" + id(shop), Map.class);
        assertThat(page.get("shopName")).isEqualTo("Ctg Mango House 2");
        assertThat(page).doesNotContainKeys("address", "lat", "lng");
        assertThat(call(HttpMethod.GET, "/api/sellers/" + id(shop), customer, null).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        // Suspension hides the shop from customers; reinstating brings it back; a pending shop can't be reinstated
        var shopId = id(shop);
        assertThat(call(HttpMethod.POST, "/api/sellers/" + shopId + "/suspension", seller, Map.of("suspended", true))
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(call(HttpMethod.POST, "/api/sellers/" + shopId + "/suspension", admin, Map.of("suspended", true))
                .getBody().get("status")).isEqualTo("SUSPENDED");
        assertThat(http.getForObject("/api/catalog/products/nearby?lat=22.34&lng=91.815", List.class)).isEmpty();
        assertThat(http.getForEntity("/api/catalog/shops/" + shopId, Map.class).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(call(HttpMethod.POST, "/api/sellers/" + shopId + "/suspension", admin, Map.of("suspended", false))
                .getBody().get("status")).isEqualTo("VERIFIED");
        assertThat(call(HttpMethod.POST, "/api/sellers/" + shopId + "/suspension", admin, Map.of("suspended", false))
                .getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // Another customer's token can't see this order
        assertThat(call(HttpMethod.GET, "/api/orders/" + orderId, admin, null).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN); // admin lacks CUSTOMER role
    }

    // ---------- helpers ----------

    private void register(String phone, String role) {
        var body = new java.util.HashMap<String, Object>(Map.of("phone", phone, "name", "Test " + role, "password", "password123", "role", role));
        if (role.equals("SELLER")) {
            // a seller account needs an email
            assertThat(call(HttpMethod.POST, "/api/auth/register", null, body).getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            body.put("email", "seller" + phone + "@example.com");
        }
        var r = call(HttpMethod.POST, "/api/auth/register", null, body);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    private String login(String phone) {
        var r = call(HttpMethod.POST, "/api/auth/login", null, Map.of("login", phone, "password", "password123"));
        return (String) r.getBody().get("token");
    }

    private Map<String, Object> order(long listingId, int qty) {
        return Map.of("items", List.of(Map.of("listingId", listingId, "quantity", qty)),
                "deliveryAddress", "Nasirabad, Chattogram", "paymentMethod", "COD");
    }

    private ResponseEntity<Map> status(String token, long orderId, String status) {
        return call(HttpMethod.POST, "/api/orders/" + orderId + "/status", token, Map.of("status", status));
    }

    private List<?> offers(long productId, double lat, double lng) {
        return http.getForObject("/api/catalog/products/{id}/offers?lat={lat}&lng={lng}", List.class, productId, lat, lng);
    }

    private int stock(long listingId) {
        return jdbc.queryForObject("select stock from listings where id = ?", Integer.class, listingId);
    }

    private static long id(ResponseEntity<Map> r) {
        return ((Number) r.getBody().get("id")).longValue();
    }

    private static HttpEntity<Void> auth(String token) {
        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    private ResponseEntity<Map> call(HttpMethod method, String url, String token, Object body) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) headers.setBearerAuth(token);
        return http.exchange(url, method, new HttpEntity<>(body, headers), Map.class);
    }
}
