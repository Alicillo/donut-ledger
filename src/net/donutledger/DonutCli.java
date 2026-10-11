package net.donutledger;

/**
 * Donut SMP Economy Ledger - Bağımsız Komut Satırı Yöneticisi (CLI)
 * Fabric arayüzlerine bağlı olmadığı için doğrudan `java -jar` ile çalıştırılabilir.
 */
public class DonutCli {

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("🍩 DONUT SMP ECONOMY LEDGER CLI v1.0.0");
        System.out.println("Web Paneli: " + DonutConfig.get().apiUrl);
        System.out.println("==================================================");

        if (args.length > 0 && args[0].equalsIgnoreCase("link")) {
            String user = args.length > 1 ? args[1] : "Cillops";
            System.out.println("[DonutLedger] Kullanıcı bağlanıyor: " + user + "...");
            DonutApiClient.autoLink(user).thenAccept(ok -> {
                if (ok) {
                    System.out.println("[✓] Hesap web sitesine bağlandı! Panel: " + DonutConfig.get().apiUrl + "/?player=" + user);
                } else {
                    System.err.println("[✗] Bağlantı kurulamadı. Web sunucusunun (npm start) açık olduğundan emin olun.");
                }
            }).join();
        } else if (args.length > 0 && args[0].equalsIgnoreCase("status")) {
            DonutConfig cfg = DonutConfig.get();
            System.out.println("Kullanıcı Adı: " + (cfg.username.isEmpty() ? "(Henüz atanmadı)" : cfg.username));
            System.out.println("API Anahtarı:  " + (cfg.apiKey.isEmpty() ? "(Bağlı değil)" : cfg.apiKey));
            System.out.println("Web URL:       " + cfg.apiUrl);
        } else if (args.length > 0 && args[0].equalsIgnoreCase("verify")) {
            DonutConfig cfg = DonutConfig.get();
            System.out.println("Oyuncu: " + cfg.username);
            System.out.println("API Anahtarı: " + cfg.apiKey);
            DonutChatHud.sendVerificationMessage(cfg.apiKey);
            System.out.println("[✓] API Anahtarı panoya kopyalandı!");
        } else if (args.length > 0 && args[0].equalsIgnoreCase("test")) {
            if (args.length < 2) {
                System.out.println("Kullanım: java -jar DonutLedger.jar test \"<chat mesaji>\"");
                return;
            }
            String msg = args[1];
            System.out.println("[DonutLedger] Test mesajı işleniyor: " + msg);
            DonutEconomyParser.parseAndDispatch(msg);
            try { Thread.sleep(1000); } catch (Exception ignored) {}
        } else {
            System.out.println("Kullanım Rehberi:");
            System.out.println("1. Bu jar dosyasını .minecraft/mods klasörüne atarak Fabric ile oynayabilirsiniz.");
            System.out.println("2. Oyuna girdiğinizde kullanıcı adınızı otomatik algılar ve web sitesine bağlar.");
            System.out.println("3. Manuel hesap bağlamak için: java -jar DonutLedger.jar link <kullanici_adi>");
            System.out.println("4. API Anahtarını almak için:  java -jar DonutLedger.jar verify");
            System.out.println("5. Durum kontrolü için:       java -jar DonutLedger.jar status");
            System.out.println("6. Chat testi için:           java -jar DonutLedger.jar test \"<chat mesaji>\"");
        }
    }
}
