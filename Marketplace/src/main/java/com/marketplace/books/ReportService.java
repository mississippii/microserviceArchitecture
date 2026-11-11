package com.marketplace.books;

import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The seller's accounts, worked out from what already happened: sales, orders, purchases, customer payments,
 * expenses, stock corrections and platform settlements. The seller never enters a ledger line by hand.
 * Reports only read other modules' tables (never write them), so they can sum across the whole shop in one query.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    /** Days start and end in Bangladesh time. */
    static final ZoneId ZONE = ZoneId.of("Asia/Dhaka");
    private static final OffsetDateTime BEGINNING = OffsetDateTime.parse("2000-01-01T00:00:00Z");
    private static final OffsetDateTime END = OffsetDateTime.parse("2100-01-01T00:00:00Z");

    private final NamedParameterJdbcTemplate db;
    private final SellerService sellerService;
    private final BooksService books;

    private static OffsetDateTime startOf(LocalDate d) {
        return d.atStartOfDay(ZONE).toOffsetDateTime();
    }

    private static BigDecimal dec(ResultSet rs, String col) throws SQLException {
        var v = rs.getBigDecimal(col);
        return v == null ? BigDecimal.ZERO : v;
    }

    // ---------- the day book: every money event of the shop ----------

    /**
     * kind: SALE (in the shop), ORDER (online, cash collected on delivery), RECEIVED (a customer paid their due),
     * PURCHASE (stock bought), EXPENSE, SETTLEMENT (with the platform).
     * amount = value of the event; moneyIn / moneyOut = what actually moved, by method (null method = through the platform).
     */
    public record Entry(OffsetDateTime at, String kind, Long refId, Long customerId, String label,
                        BigDecimal amount, BigDecimal moneyIn, BigDecimal moneyOut, String method) {}

    private static final String LEDGER = """
            SELECT * FROM (
              SELECT s.created_at AS at, 'SALE' AS kind, s.id AS ref_id, s.customer_id AS customer_id,
                     COALESCE(c.name, s.buyer_name, 'Walk-in') AS label, s.total AS amount, s.paid AS money_in, 0 AS money_out, s.payment_method AS method
              FROM shop_sales s LEFT JOIN customers c ON c.id = s.customer_id
              WHERE s.seller_id = :seller AND s.voided_at IS NULL
              UNION ALL
              SELECT e.created_at, 'ORDER', o.id, NULL, COALESCE(o.recipient_name, u.name), o.total, o.total, 0, 'CASH'
              FROM orders o
              JOIN order_events e ON e.order_id = o.id AND e.status = 'DELIVERED'
              JOIN payments p ON p.order_id = o.id AND p.method = 'COD'
              LEFT JOIN users u ON u.id = o.customer_id
              WHERE o.seller_id = :seller
              UNION ALL
              SELECT cp.created_at, 'RECEIVED', cp.id, c.id, c.name, cp.amount, cp.amount, 0, cp.payment_method
              FROM customer_payments cp JOIN customers c ON c.id = cp.customer_id
              WHERE cp.seller_id = :seller AND cp.voided_at IS NULL
              UNION ALL
              SELECT pu.created_at, 'PURCHASE', pu.id, NULL, COALESCE(pu.note, 'Stock'), pu.total, 0, pu.total, pu.payment_method
              FROM purchases pu
              WHERE pu.seller_id = :seller AND pu.cancelled_at IS NULL
              UNION ALL
              SELECT (ex.spent_on::timestamp AT TIME ZONE 'Asia/Dhaka'), 'EXPENSE', ex.id, NULL, ex.category, ex.amount, 0, ex.amount, ex.payment_method
              FROM expenses ex WHERE ex.seller_id = :seller
              UNION ALL
              SELECT py.created_at, 'SETTLEMENT', py.id, NULL, py.reference, abs(py.amount), greatest(py.amount, 0), greatest(-py.amount, 0), NULL
              FROM payouts py WHERE py.seller_id = :seller
            ) x
            WHERE x.at >= :from AND x.at < :to AND (CAST(:customer AS bigint) IS NULL OR x.customer_id = CAST(:customer AS bigint))
            ORDER BY x.at DESC, x.ref_id DESC
            LIMIT 2000
            """;

    private List<Entry> entries(Long sellerId, OffsetDateTime from, OffsetDateTime to, Long customerId) {
        var params = new MapSqlParameterSource().addValue("seller", sellerId).addValue("from", from).addValue("to", to).addValue("customer", customerId);
        return db.query(LEDGER, params, (rs, i) -> new Entry(rs.getObject("at", OffsetDateTime.class), rs.getString("kind"),
                rs.getLong("ref_id"), (Long) rs.getObject("customer_id", Long.class), rs.getString("label"),
                dec(rs, "amount"), dec(rs, "money_in"), dec(rs, "money_out"), rs.getString("method")));
    }

    /** Every money event between two days (inclusive), newest first. */
    public List<Entry> ledger(Long userId, LocalDate from, LocalDate to) {
        return entries(sellerService.myShop(userId).getId(), startOf(from), startOf(to.plusDays(1)), null);
    }

    // ---------- customer accounts: what each customer owes the shop ----------

    /** balance > 0: the customer owes the shop. balance < 0: paid in advance. */
    public record CustomerBalance(Long id, String name, String phone, String address, BigDecimal openingBalance,
                                  BigDecimal balance, OffsetDateTime lastActivity) {}

    private static final String BALANCES = """
            SELECT c.id, c.name, c.phone, c.address, c.opening_balance,
                   c.opening_balance
                     + COALESCE((SELECT SUM(s.total - s.paid) FROM shop_sales s WHERE s.customer_id = c.id AND s.voided_at IS NULL), 0)
                     - COALESCE((SELECT SUM(cp.amount) FROM customer_payments cp WHERE cp.customer_id = c.id AND cp.voided_at IS NULL), 0) AS balance,
                   GREATEST((SELECT MAX(s.created_at) FROM shop_sales s WHERE s.customer_id = c.id AND s.voided_at IS NULL),
                            (SELECT MAX(cp.created_at) FROM customer_payments cp WHERE cp.customer_id = c.id AND cp.voided_at IS NULL)) AS last_activity
            FROM customers c
            WHERE c.seller_id = :seller AND (CAST(:id AS bigint) IS NULL OR c.id = CAST(:id AS bigint))
            ORDER BY balance DESC, c.name
            """;

    private List<CustomerBalance> balances(Long sellerId, Long id) {
        var params = new MapSqlParameterSource().addValue("seller", sellerId).addValue("id", id);
        return db.query(BALANCES, params, (rs, i) -> new CustomerBalance(rs.getLong("id"), rs.getString("name"),
                rs.getString("phone"), rs.getString("address"), dec(rs, "opening_balance"), dec(rs, "balance"),
                rs.getObject("last_activity", OffsetDateTime.class)));
    }

    public List<CustomerBalance> customers(Long userId) {
        return balances(sellerService.myShop(userId).getId(), null);
    }

    /** One line of an account statement, with the balance after it. */
    public record StatementLine(Entry entry, BigDecimal balance) {}

    public record Statement(CustomerBalance customer, List<StatementLine> lines) {}

    /** The whole history of one customer, newest first, each line with the running due. */
    public Statement statement(Long userId, Long customerId) {
        var sellerId = sellerService.myShop(userId).getId();
        books.get(sellerId, customerId); // 404 unless it's this shop's
        var customer = balances(sellerId, customerId).get(0);
        var rows = new ArrayList<>(entries(sellerId, BEGINNING, END, customerId));
        Collections.reverse(rows); // oldest first to run the balance
        var running = customer.openingBalance();
        var lines = new ArrayList<StatementLine>();
        for (var e : rows) {
            // a sale adds what was left unpaid; a payment takes off what was paid
            running = running.add(e.kind().equals("SALE") ? e.amount() : BigDecimal.ZERO).subtract(e.moneyIn());
            lines.add(new StatementLine(e, running));
        }
        Collections.reverse(lines);
        return new Statement(customer, lines);
    }

    // ---------- the summary: profit and loss, money by method, what is owed, what is on the shelf ----------

    public record MethodRow(String method, BigDecimal moneyIn, BigDecimal moneyOut) {}

    public record ProductRow(Long productId, String name, String unit, BigDecimal quantity, BigDecimal sales, BigDecimal cost, BigDecimal profit) {}

    public record Summary(LocalDate from, LocalDate to,
                          // profit and loss
                          BigDecimal sales, BigDecimal shopSales, BigDecimal onlineSales, long saleCount, BigDecimal discounts,
                          BigDecimal costOfGoods, boolean costMissing, BigDecimal grossProfit,
                          BigDecimal commission, BigDecimal expenses, Map<String, BigDecimal> expensesByCategory,
                          BigDecimal stockLoss, BigDecimal netProfit,
                          // money
                          BigDecimal soldOnCredit, BigDecimal purchases, List<MethodRow> byMethod, BigDecimal moneyIn, BigDecimal moneyOut,
                          // standing today
                          BigDecimal customersOwe, BigDecimal stockAtCost, BigDecimal stockAtPrice, long stockWithoutCost,
                          List<ProductRow> products) {}

    private static final String SALE_LINES = """
            WITH lines AS (
              SELECT l.product_id, l.unit, i.quantity, i.quantity * i.unit_price AS sales, i.quantity * i.unit_cost AS cost
              FROM shop_sale_items i JOIN shop_sales s ON s.id = i.sale_id JOIN listings l ON l.id = i.listing_id
              WHERE s.seller_id = :seller AND s.voided_at IS NULL AND s.created_at >= :from AND s.created_at < :to
              UNION ALL
              SELECT l.product_id, l.unit, i.quantity, i.quantity * i.unit_price, i.quantity * i.unit_cost
              FROM order_items i JOIN orders o ON o.id = i.order_id JOIN listings l ON l.id = i.listing_id
              JOIN order_events e ON e.order_id = o.id AND e.status = 'DELIVERED'
              JOIN payments p ON p.order_id = o.id AND p.status <> 'REFUNDED'
              WHERE o.seller_id = :seller AND e.created_at >= :from AND e.created_at < :to
            )
            SELECT p.id, p.name, lines.unit, SUM(quantity) AS quantity, SUM(sales) AS sales,
                   SUM(COALESCE(cost, 0)) AS cost, BOOL_OR(cost IS NULL) AS cost_missing
            FROM lines JOIN products p ON p.id = lines.product_id
            GROUP BY p.id, p.name, lines.unit
            ORDER BY sales DESC
            """;

    public Summary summary(Long userId, LocalDate from, LocalDate to) {
        var sellerId = sellerService.myShop(userId).getId();
        var start = startOf(from);
        var end = startOf(to.plusDays(1));
        var p = new MapSqlParameterSource().addValue("seller", sellerId).addValue("from", start).addValue("to", end)
                .addValue("fromDay", from).addValue("toDay", to);

        var shop = db.queryForMap("""
                SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS sales, COALESCE(SUM(discount), 0) AS discounts, COALESCE(SUM(total - paid), 0) AS credit
                FROM shop_sales WHERE seller_id = :seller AND voided_at IS NULL AND created_at >= :from AND created_at < :to
                """, p);
        var online = db.queryForMap("""
                SELECT COUNT(*) AS n, COALESCE(SUM(o.total), 0) AS sales, COALESCE(SUM(o.commission_amount), 0) AS commission
                FROM orders o
                JOIN order_events e ON e.order_id = o.id AND e.status = 'DELIVERED'
                JOIN payments pay ON pay.order_id = o.id AND pay.status <> 'REFUNDED'
                WHERE o.seller_id = :seller AND e.created_at >= :from AND e.created_at < :to
                """, p);

        var products = new ArrayList<ProductRow>();
        var costMissing = new boolean[1];
        db.query(SALE_LINES, p, rs -> {
            var sales = dec(rs, "sales");
            var cost = dec(rs, "cost");
            costMissing[0] |= rs.getBoolean("cost_missing");
            products.add(new ProductRow(rs.getLong("id"), rs.getString("name"), rs.getString("unit"), dec(rs, "quantity"), sales, cost, sales.subtract(cost)));
        });
        var cogs = products.stream().map(ProductRow::cost).reduce(BigDecimal.ZERO, BigDecimal::add);

        var byCategory = new LinkedHashMap<String, BigDecimal>();
        db.query("""
                SELECT category, SUM(amount) AS amount FROM expenses
                WHERE seller_id = :seller AND spent_on >= :fromDay AND spent_on <= :toDay
                GROUP BY category ORDER BY amount DESC
                """, p, rs -> { byCategory.put(rs.getString("category"), dec(rs, "amount")); });
        var expenses = byCategory.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        // Count corrections at the average cost: goods lost or damaged are a cost, goods found give it back.
        var stockLoss = db.queryForObject("""
                SELECT COALESCE(-SUM(m.change * COALESCE(m.unit_cost, 0)), 0)
                FROM stock_movements m JOIN listings l ON l.id = m.listing_id
                WHERE l.seller_id = :seller AND m.reason = 'ADJUSTMENT' AND m.created_at >= :from AND m.created_at < :to
                """, p, BigDecimal.class);

        var stock = db.queryForMap("""
                SELECT COALESCE(SUM(stock * COALESCE(cost_price, 0)), 0) AS at_cost, COALESCE(SUM(stock * price), 0) AS at_price,
                       COUNT(*) FILTER (WHERE stock > 0 AND cost_price IS NULL) AS no_cost
                FROM listings WHERE seller_id = :seller
                """, p);

        // money by method, from the day book
        var methods = new LinkedHashMap<String, BigDecimal[]>();
        for (var m : com.marketplace.common.PayMethod.values()) methods.put(m.name(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        var purchases = BigDecimal.ZERO;
        for (var e : entries(sellerId, start, end, null)) {
            var row = methods.computeIfAbsent(e.method() == null ? "PLATFORM" : e.method(), k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            row[0] = row[0].add(e.moneyIn());
            row[1] = row[1].add(e.moneyOut());
            if (e.kind().equals("PURCHASE")) purchases = purchases.add(e.amount());
        }
        var byMethod = methods.entrySet().stream()
                .filter(m -> m.getKey().equals("CASH") || m.getValue()[0].signum() != 0 || m.getValue()[1].signum() != 0)
                .map(m -> new MethodRow(m.getKey(), m.getValue()[0], m.getValue()[1])).toList();
        var moneyIn = byMethod.stream().map(MethodRow::moneyIn).reduce(BigDecimal.ZERO, BigDecimal::add);
        var moneyOut = byMethod.stream().map(MethodRow::moneyOut).reduce(BigDecimal.ZERO, BigDecimal::add);

        var customersOwe = balances(sellerId, null).stream().map(CustomerBalance::balance).filter(b -> b.signum() > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var shopSales = (BigDecimal) shop.get("sales");
        var onlineSales = (BigDecimal) online.get("sales");
        var sales = shopSales.add(onlineSales);
        var commission = (BigDecimal) online.get("commission");
        var gross = sales.subtract(cogs);
        var net = gross.subtract(commission).subtract(expenses).subtract(stockLoss);
        return new Summary(from, to, sales, shopSales, onlineSales,
                ((Number) shop.get("n")).longValue() + ((Number) online.get("n")).longValue(), (BigDecimal) shop.get("discounts"),
                cogs, costMissing[0], gross, commission, expenses, byCategory, stockLoss, net,
                (BigDecimal) shop.get("credit"), purchases, byMethod, moneyIn, moneyOut,
                customersOwe, (BigDecimal) stock.get("at_cost"), (BigDecimal) stock.get("at_price"), ((Number) stock.get("no_cost")).longValue(),
                products);
    }
}
