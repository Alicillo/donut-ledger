package net.donutledger;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Donut SMP Ekonomi Olay Ayrıştırıcısı (Regex Engine)
 * Donut SMP'nin (/ah, /pay, /sell, /shop, /orders, /bal) sohbet mesajlarını anında yakalar.
 */
public class DonutEconomyParser {

    // 1. Balance (/bal)
    // "You have $ 906,965,016", "You have $ 1.5M", "Balance: $ 50,000", "Your balance: $ 100"
    private static final Pattern PATTERN_BAL = Pattern.compile(
            "(?:You have|Balance|Bakiye|Your balance is|Your balance)[\\s:]*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );

    // 2. Donut SMP Standalone Market Satışı (/sell)
    // Donut SMP sohbet çıktısı: "$ 46K", "+$46K", "$46K", "+$ 1.2M", "$ 120,500"
    private static final Pattern PATTERN_STANDALONE_SELL = Pattern.compile(
            "^\\+?\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)$",
            Pattern.CASE_INSENSITIVE
    );

    // 3. Klasik Market Satışları (/sell)
    // "You sold 64 Blaze Rod for $ 250,000", "[Shop] You sold 64 Diamond for $ 120,000", "Sold 64 Diamond for $ 120,000"
    private static final Pattern PATTERN_SELL_1 = Pattern.compile(
            "(?:\\[Shop\\]|\\[Sell\\])?\\s*(?:You sold|Sold)\\s+(.+?)\\s+for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // "You made $ 250,000 from selling 64 Blaze Rod", "You earned $ 120,000 from selling"
    private static final Pattern PATTERN_SELL_2 = Pattern.compile(
            "(?:You made|You earned)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)\\s*(?:from|by)\\s*selling(?:\\s+(.+?))?",
            Pattern.CASE_INSENSITIVE
    );

    // 4. Donut SMP Sipariş Sistemi (/orders)
    // A) Sipariş Teslim Edip Para Kazanma: "You delivered 1 Spruce Log and received $73"
    private static final Pattern PATTERN_ORDERS_DELIVERED_RECEIVED = Pattern.compile(
            "You delivered\\s+(.+?)\\s+and received\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // B) Başka Bir Oyuncunun Siparişimizi Teslim Etmesi: "LeTaloi delivered you 1 Spruce Log"
    private static final Pattern PATTERN_ORDERS_DELIVERED_TO_YOU = Pattern.compile(
            "([a-zA-Z0-9_]+)\\s+delivered you\\s+(.+)",
            Pattern.CASE_INSENSITIVE
    );
    // C) Siparişin Tamamlanması: "Your Spruce Log order is complete!"
    private static final Pattern PATTERN_ORDERS_COMPLETE = Pattern.compile(
            "Your\\s+(.+?)\\s+order is complete!?",
            Pattern.CASE_INSENSITIVE
    );
    // D) Sipariş Oluşturma: "You ordered 1 Spruce Log", "You ordered 1 Spruce Log for $ 500"
    private static final Pattern PATTERN_ORDERS_CREATE = Pattern.compile(
            "(?:You ordered|You created an order for|Order created:?)\\s+(.+?)(?:\\s+(?:for|at)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?))?$",
            Pattern.CASE_INSENSITIVE
    );
    // E) Sipariş İptali: "You cancelled your order for 1 Spruce Log", "Order cancelled: 1 Spruce Log"
    private static final Pattern PATTERN_ORDERS_CANCEL = Pattern.compile(
            "(?:You cancelled your order for|Order cancelled:?)\\s+(.+)",
            Pattern.CASE_INSENSITIVE
    );
    // F) Diğer Sipariş Ödülleri
    private static final Pattern PATTERN_ORDERS_EARN_1 = Pattern.compile(
            "(?:\\[Orders\\])?\\s*(?:You fulfilled (?:an )?(?:order|orders)(?: for)?|Order completed:?\\s*Earned|Order reward:?)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PATTERN_ORDERS_EARN_2 = Pattern.compile(
            "You delivered\\s+(.+?)\\s+to\\s+([a-zA-Z0-9_]+)\\s+for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PATTERN_ORDERS_EARN_3 = Pattern.compile(
            "You received\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)\\s*(?:for|from)\\s*fulfilling(?:\\s+(?:an )?order)?",
            Pattern.CASE_INSENSITIVE
    );

    // 5. Auction House (/ah)
    // A) Satın Alım (Gider): "You bought 1 Ender Pearl for $ 1.1K", "[Auction] You bought 16 Netherite Ingot for $ 8,500,000"
    private static final Pattern PATTERN_AH_BOUGHT = Pattern.compile(
            "(?:\\[Auction\\]|\\[AH\\])?\\s*(?:You bought|You purchased)\\s+(.+?)\\s+for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // B) Satış Geliri (Alıcı ile): "ayaro123 bought your Totem of Undying for $47K"
    private static final Pattern PATTERN_AH_SOLD_BUYER = Pattern.compile(
            "([a-zA-Z0-9_]+)\\s+bought your\\s+(.+?)\\s+for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // C) Genel Liste Satışı: "Your listing of 16 Netherite Ingot was bought by Shadow for $ 8,500,000", "You sold 1 Elytra for $ 4,500,000"
    private static final Pattern PATTERN_AH_SOLD_LISTING = Pattern.compile(
            "(?:\\[Auction\\]|\\[AH\\])?\\s*(?:Your listing of|You sold|Someone bought your)\\s+(.+?)\\s+(?:(?:was bought by|to)\\s+[a-zA-Z0-9_]+\\s+)?for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // D) Açık Artırma Listeleme (/ah sell): "You listed 1 Totem of Undying for $ 50K", "Successfully listed ... for $..."
    private static final Pattern PATTERN_AH_LISTED = Pattern.compile(
            "(?:\\[Auction\\]|\\[AH\\])?\\s*(?:You listed|You have listed|Listed|Successfully listed|You put up)\\s+(.+?)(?:\\s+on (?:the )?auction)?\\s+for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // E) Bakiye Toplama: "You collected $ 12,000,000 from your sold auction"
    private static final Pattern PATTERN_AH_CLAIM = Pattern.compile(
            "(?:\\[Auction\\]|\\[AH\\])?\\s*(?:You collected|Collected|Claimed|You claimed)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)\\s+from (?:your )?sold auction",
            Pattern.CASE_INSENSITIVE
    );

    // 6. /pay Transferleri
    // A) Donut SMP: "Remina_0001 paid you $ 1M"
    private static final Pattern PATTERN_PAY_PAID_BY = Pattern.compile(
            "(?:\\[Payment\\]|\\[Pay\\])?\\s*([a-zA-Z0-9_]+)\\s+paid you\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PATTERN_PAY_RCV = Pattern.compile(
            "(?:\\[Payment\\]|\\[Pay\\])?\\s*([a-zA-Z0-9_]+)\\s+(?:has sent you|sent you)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    // B) Donut SMP: "You paid Remina_0001 $ 1M"
    private static final Pattern PATTERN_PAY_PAID_TO = Pattern.compile(
            "(?:\\[Payment\\]|\\[Pay\\])?\\s*You paid\\s+([a-zA-Z0-9_]+)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PATTERN_PAY_SNT = Pattern.compile(
            "(?:\\[Payment\\]|\\[Pay\\])?\\s*(?:You sent|You have sent)\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)\\s+to\\s+([a-zA-Z0-9_]+)",
            Pattern.CASE_INSENSITIVE
    );

    // 7. Market Alımı (/shop)
    // "You purchased 4 Obsidian for $ 20,000", "[Shop] You bought 4 Obsidian for $ 20,000"
    private static final Pattern PATTERN_SHOP_BUY = Pattern.compile(
            "(?:\\[Shop\\])?\\s*(?:You purchased|You bought)\\s+(.+?)\\s+(?:from (?:the )?shop\\s+)?for\\s*\\$\\s*([0-9,]+(?:\\.[0-9]+)?\\s*[kKmMbBtT]?)",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Ham mesajı temizler ve bir ekonomi olayıysa web API'sine iletir.
     */
    public static void parseAndDispatch(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) return;

        // Minecraft renk kodlarını (§a, &a vb.) temizle
        String clean = rawText.replaceAll("§[0-9a-fk-orA-FK-OR]", "")
                              .replaceAll("&[0-9a-fk-orA-FK-OR]", "")
                              .trim();

        // 1. Balance (/bal)
        Matcher mBal = PATTERN_BAL.matcher(clean);
        if (mBal.find()) {
            long bal = parseAmount(mBal.group(1));
            DonutApiClient.syncBalanceOnly(bal);
            return;
        }

        // 2. Orders: "You delivered 1 Spruce Log and received $73" (Gelir)
        Matcher mDelivRecv = PATTERN_ORDERS_DELIVERED_RECEIVED.matcher(clean);
        if (mDelivRecv.find()) {
            String item = mDelivRecv.group(1).trim();
            long amt = parseAmount(mDelivRecv.group(2));
            DonutApiClient.syncTransaction(
                    "income", "Orders System", amt,
                    "Order delivered: " + item, null
            );
            return;
        }

        // 3. Orders: "LeTaloi delivered you 1 Spruce Log" (Info)
        Matcher mDelivToYou = PATTERN_ORDERS_DELIVERED_TO_YOU.matcher(clean);
        if (mDelivToYou.find()) {
            String player = mDelivToYou.group(1).trim();
            String item = mDelivToYou.group(2).trim();
            DonutApiClient.syncTransaction(
                    "info", "Orders System", 0,
                    player + " delivered your order: " + item, null
            );
            return;
        }

        // 4. Orders: "Your Spruce Log order is complete!" (Info)
        Matcher mOrdComplete = PATTERN_ORDERS_COMPLETE.matcher(clean);
        if (mOrdComplete.find()) {
            String item = mOrdComplete.group(1).trim();
            DonutApiClient.syncTransaction(
                    "info", "Orders System", 0,
                    "Order completed: " + item, null
            );
            return;
        }

        // 5. Orders: Order Cancelled (Info)
        Matcher mOrdCancel = PATTERN_ORDERS_CANCEL.matcher(clean);
        if (mOrdCancel.find()) {
            String item = mOrdCancel.group(1).trim();
            DonutApiClient.syncTransaction(
                    "info", "Orders System", 0,
                    "Order cancelled: " + item, null
            );
            return;
        }

        // 6. Orders: "You ordered 1 Spruce Log" (Create Order)
        Matcher mOrdCreate = PATTERN_ORDERS_CREATE.matcher(clean);
        if (mOrdCreate.find()) {
            String item = mOrdCreate.group(1).trim();
            String priceStr = mOrdCreate.group(2);
            long amt = priceStr != null ? parseAmount(priceStr) : 0;
            DonutApiClient.syncTransaction(
                    amt > 0 ? "expense" : "info", "Orders System", amt,
                    "Order created: " + item, null
            );
            return;
        }

        // 7. Other Orders Revenue Formats
        Matcher mOrdEarn1 = PATTERN_ORDERS_EARN_1.matcher(clean);
        if (mOrdEarn1.find()) {
            long amt = parseAmount(mOrdEarn1.group(1));
            DonutApiClient.syncTransaction(
                    "income", "Orders System", amt,
                    "Order completed successfully (/orders)", null
            );
            return;
        }

        Matcher mOrdEarn2 = PATTERN_ORDERS_EARN_2.matcher(clean);
        if (mOrdEarn2.find()) {
            String item = mOrdEarn2.group(1).trim();
            String player = mOrdEarn2.group(2).trim();
            long amt = parseAmount(mOrdEarn2.group(3));
            DonutApiClient.syncTransaction(
                    "income", "Orders System", amt,
                    "Order delivered to " + player + ": " + item, null
            );
            return;
        }

        Matcher mOrdEarn3 = PATTERN_ORDERS_EARN_3.matcher(clean);
        if (mOrdEarn3.find()) {
            long amt = parseAmount(mOrdEarn3.group(1));
            DonutApiClient.syncTransaction(
                    "income", "Orders System", amt,
                    "Order delivery reward received (/orders)", null
            );
            return;
        }

        // 8. Donut SMP Standalone Market Sell: "$ 46K", "+$46K", "$46K" (Income)
        Matcher mStandSell = PATTERN_STANDALONE_SELL.matcher(clean);
        if (mStandSell.find()) {
            long amt = parseAmount(mStandSell.group(1));
            if (amt > 0) {
                DonutApiClient.syncTransaction(
                        "income", "Server Sell", amt,
                        "Server shop sell (/sell)", null
                );
                return;
            }
        }

        // 9. Classic Market Sells (/sell)
        Matcher mSell1 = PATTERN_SELL_1.matcher(clean);
        if (mSell1.find()) {
            String item = mSell1.group(1).trim();
            long amt = parseAmount(mSell1.group(2));
            DonutApiClient.syncTransaction(
                    "income", "Server Sell", amt,
                    "Sold to server shop: " + item + " (/sell)", null
            );
            return;
        }

        Matcher mSell2 = PATTERN_SELL_2.matcher(clean);
        if (mSell2.find()) {
            long amt = parseAmount(mSell2.group(1));
            String item = mSell2.group(2) != null ? mSell2.group(2).trim() : "Items";
            DonutApiClient.syncTransaction(
                    "income", "Server Sell", amt,
                    "Sold to server shop: " + item + " (/sell)", null
            );
            return;
        }

        // 10. AH: Buy (Expense)
        Matcher mAhBought = PATTERN_AH_BOUGHT.matcher(clean);
        if (mAhBought.find()) {
            String item = mAhBought.group(1).trim();
            long amt = parseAmount(mAhBought.group(2));
            DonutApiClient.syncTransaction(
                    "expense", "Auction House", amt,
                    "Purchased " + item + " on Auction House", null
            );
            return;
        }

        // 11. AH: Sell (With Buyer)
        Matcher mAhSoldBuyer = PATTERN_AH_SOLD_BUYER.matcher(clean);
        if (mAhSoldBuyer.find()) {
            String buyer = mAhSoldBuyer.group(1).trim();
            String item = mAhSoldBuyer.group(2).trim();
            long amt = parseAmount(mAhSoldBuyer.group(3));
            DonutApiClient.syncTransaction(
                    "income", "Auction House", amt,
                    "Sold " + item + " to " + buyer, null
            );
            return;
        }

        // 12. AH: Sell (General Listing)
        Matcher mAhSoldList = PATTERN_AH_SOLD_LISTING.matcher(clean);
        if (mAhSoldList.find()) {
            String item = mAhSoldList.group(1).trim();
            long amt = parseAmount(mAhSoldList.group(2));
            DonutApiClient.syncTransaction(
                    "income", "Auction House", amt,
                    "Sold " + item + " on Auction House", null
            );
            return;
        }

        // 13. AH: Claim Revenue (/ah claim)
        Matcher mAhClaim = PATTERN_AH_CLAIM.matcher(clean);
        if (mAhClaim.find()) {
            long amt = parseAmount(mAhClaim.group(1));
            DonutApiClient.syncTransaction(
                    "income", "Auction House", amt,
                    "Claimed auction revenue (/ah claim)", null
            );
            return;
        }

        // 14. AH: Listing (/ah sell)
        Matcher mAhList = PATTERN_AH_LISTED.matcher(clean);
        if (mAhList.find()) {
            String item = mAhList.group(1).trim();
            long amt = parseAmount(mAhList.group(2));
            DonutApiClient.syncTransaction(
                    "info", "Auction House", amt,
                    "Listed item on Auction House: " + item, null
            );
            return;
        }

        // 15a. Pay Paid By (Donut SMP Income): "Remina_0001 paid you $ 1M"
        Matcher mPayPaidBy = PATTERN_PAY_PAID_BY.matcher(clean);
        if (mPayPaidBy.find()) {
            String sender = mPayPaidBy.group(1).trim();
            long amt = parseAmount(mPayPaidBy.group(2));
            DonutApiClient.syncTransaction(
                    "income", "Player Transfer", amt,
                    "Payment received from " + sender + " (/pay)", null
            );
            return;
        }

        // 15b. Pay Received: "PlayerX sent you $ 1,500,000"
        Matcher mPayRcv = PATTERN_PAY_RCV.matcher(clean);
        if (mPayRcv.find()) {
            String sender = mPayRcv.group(1).trim();
            long amt = parseAmount(mPayRcv.group(2));
            DonutApiClient.syncTransaction(
                    "income", "Player Transfer", amt,
                    "Payment received from " + sender + " (/pay)", null
            );
            return;
        }

        // 16a. Pay Paid To (Donut SMP Expense): "You paid Remina_0001 $ 1M"
        Matcher mPayPaidTo = PATTERN_PAY_PAID_TO.matcher(clean);
        if (mPayPaidTo.find()) {
            String recipient = mPayPaidTo.group(1).trim();
            long amt = parseAmount(mPayPaidTo.group(2));
            DonutApiClient.syncTransaction(
                    "expense", "Player Transfer", amt,
                    "Payment sent to " + recipient + " (/pay)", null
            );
            return;
        }

        // 16b. Pay Sent: "You sent $ 500,000 to PlayerY"
        Matcher mPaySnt = PATTERN_PAY_SNT.matcher(clean);
        if (mPaySnt.find()) {
            long amt = parseAmount(mPaySnt.group(1));
            String recipient = mPaySnt.group(2).trim();
            DonutApiClient.syncTransaction(
                    "expense", "Player Transfer", amt,
                    "Payment sent to " + recipient + " (/pay)", null
            );
            return;
        }

        // 17. Shop Buy (/shop)
        Matcher mShopBuy = PATTERN_SHOP_BUY.matcher(clean);
        if (mShopBuy.find()) {
            String item = mShopBuy.group(1).trim();
            long amt = parseAmount(mShopBuy.group(2));
            DonutApiClient.syncTransaction(
                    "expense", "Server Shop", amt,
                    "Purchased from server shop: " + item + " (/shop)", null
            );
            return;
        }
    }

    /**
     * "$12,500,000", " 906,965,016", " 1.1K", "1.5M", "500k", "2.2B", "46K" formatlarını tam sayıya çevirir.
     */
    public static long parseAmount(String str) {
        if (str == null) return 0;
        String clean = str.replace("$", "").replace(",", "").replaceAll("\\s+", "").trim().toLowerCase();

        double multiplier = 1.0;
        if (clean.endsWith("k")) {
            multiplier = 1_000.0;
            clean = clean.substring(0, clean.length() - 1);
        } else if (clean.endsWith("m")) {
            multiplier = 1_000_000.0;
            clean = clean.substring(0, clean.length() - 1);
        } else if (clean.endsWith("b")) {
            multiplier = 1_000_000_000.0;
            clean = clean.substring(0, clean.length() - 1);
        } else if (clean.endsWith("t")) {
            multiplier = 1_000_000_000_000.0;
            clean = clean.substring(0, clean.length() - 1);
        }

        try {
            double val = Double.parseDouble(clean);
            return (long) Math.round(val * multiplier);
        } catch (Exception e) {
            return 0;
        }
    }
}
