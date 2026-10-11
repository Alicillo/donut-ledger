package net.donutledger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

/**
 * Donut SMP Web API Asenkron HTTP İstemcisi
 * İşlemleri ve bakiye hareketlerini yerel web sunucusuna (http://localhost:3000) iletir.
 */
public class DonutApiClient {
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    /**
     * Oyuncu hesabını tek adımda bağlar (Auto-Link)
     */
    public static CompletableFuture<Boolean> autoLink(String username) {
        if (username == null || username.trim().isEmpty()) {
            return CompletableFuture.completedFuture(false);
        }

        DonutConfig config = DonutConfig.get();
        String url = config.apiUrl + "/api/plugin/link";
        String existingKey = config.apiKey != null ? config.apiKey : "";
        String payload = "{\"username\":\"" + escape(username.trim()) + "\",\"apiKey\":\"" + escape(existingKey) + "\",\"initialBalance\":0}";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("X-Donut-Client-Mod", "DonutLedger-Fabric-v1")
                .timeout(Duration.ofSeconds(5))
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        return HTTP.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenApply(res -> {
                    if (res.statusCode() == 200) {
                        String body = res.body();
                        String apiKey = extractField(body, "apiKey");
                        if (apiKey != null && !apiKey.isEmpty()) {
                            config.username = username.trim();
                            config.apiKey = apiKey;
                            config.save();
                            System.out.println("[DonutLedger] [✓] Hesap bağlandı: " + username + " (API Key: " + apiKey + ")");
                            return true;
                        }
                    }
                    System.err.println("[DonutLedger] Hesap bağlama başarısız: HTTP " + res.statusCode() + " - " + res.body());
                    return false;
                })
                .exceptionally(ex -> {
                    System.err.println("[DonutLedger] Web sunucusuna bağlanılamadı (" + config.apiUrl + "): " + ex.getMessage());
                    return false;
                });
    }

    /**
     * Donut SMP para işlemini (AH, /pay, /sell, /orders) web paneline gönderir
     */
    public static void syncTransaction(String type, String category, long amount, String description, Long newBalance) {
        DonutConfig config = DonutConfig.get();

        // Eğer henüz apiKey yoksa otomatik olarak aktif kullanıcı adıyla bağlamayı dene
        if (config.apiKey == null || config.apiKey.isEmpty()) {
            if (config.username != null && !config.username.isEmpty()) {
                autoLink(config.username).thenAccept(ok -> {
                    if (ok) {
                        syncTransaction(type, category, amount, description, newBalance);
                    }
                });
            } else {
                System.out.println("[DonutLedger] Kullanıcı adı veya API Key belirlenmediği için işlem bekletiliyor.");
            }
            return;
        }

        String url = config.apiUrl + "/api/plugin/sync";
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"apiKey\":\"").append(escape(config.apiKey)).append("\",");
        if (newBalance != null) {
            sb.append("\"balance\":").append(newBalance).append(",");
        }
        sb.append("\"transaction\":{");
        sb.append("\"type\":\"").append(escape(type)).append("\",");
        sb.append("\"category\":\"").append(escape(category)).append("\",");
        sb.append("\"amount\":").append(amount).append(",");
        sb.append("\"description\":\"").append(escape(description)).append("\"");
        sb.append("}}");

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("X-API-Key", config.apiKey)
                .timeout(Duration.ofSeconds(5))
                .POST(HttpRequest.BodyPublishers.ofString(sb.toString()))
                .build();

        HTTP.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenAccept(res -> {
                    if (res.statusCode() == 200) {
                        System.out.println("[DonutLedger] [✓] İşlem senkronize edildi: " + description + " ($" + amount + ")");
                    } else if (res.statusCode() == 403 && config.username != null && !config.username.isEmpty()) {
                        System.out.println("[DonutLedger] API Anahtarı sunucuda değişmiş. Yeni anahtar çekilip işlem tekrarlanıyor...");
                        autoLink(config.username).thenAccept(ok -> {
                            if (ok) {
                                syncTransaction(type, category, amount, description, newBalance);
                            }
                        });
                    } else {
                        System.err.println("[DonutLedger] Sync HTTP " + res.statusCode() + ": " + res.body());
                    }
                })
                .exceptionally(ex -> {
                    System.err.println("[DonutLedger] Sync ağ hatası: " + ex.getMessage());
                    return null;
                });
    }

    /**
     * /bal sorgusunda güncel bakiyeyi web paneline eşitler
     */
    public static void syncBalanceOnly(long balance) {
        DonutConfig config = DonutConfig.get();
        if (config.apiKey == null || config.apiKey.isEmpty()) {
            if (config.username != null && !config.username.isEmpty()) {
                autoLink(config.username).thenAccept(ok -> {
                    if (ok) syncBalanceOnly(balance);
                });
            }
            return;
        }

        String url = config.apiUrl + "/api/plugin/sync";
        String payload = "{\"apiKey\":\"" + escape(config.apiKey) + "\",\"balance\":" + balance + "}";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("X-API-Key", config.apiKey)
                .timeout(Duration.ofSeconds(5))
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HTTP.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenAccept(res -> {
                    if (res.statusCode() == 200) {
                        System.out.println("[DonutLedger] [✓] Bakiye güncellendi: $" + balance);
                    } else if (res.statusCode() == 403 && config.username != null && !config.username.isEmpty()) {
                        System.out.println("[DonutLedger] API Anahtarı sunucuda değişmiş. Bakiye için yeni anahtar çekiliyor...");
                        autoLink(config.username).thenAccept(ok -> {
                            if (ok) syncBalanceOnly(balance);
                        });
                    }
                })
                .exceptionally(ex -> null);
    }

    private static String extractField(String json, String key) {
        String pattern = "\"" + key + "\":\\s*\"([^\"]*)\"";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (m.find()) return m.group(1);
        return null;
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
