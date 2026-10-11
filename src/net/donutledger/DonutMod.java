package net.donutledger;

import net.fabricmc.api.ClientModInitializer;

/**
 * Donut SMP Economy Ledger - Fabric İstemci Modu Giriş Noktası
 * Minecraft başlatıldığında Fabric Knot tarafından çağrılır.
 */
public class DonutMod implements ClientModInitializer {

    @Override
    public void onInitializeClient() {
        System.out.println("==================================================");
        System.out.println("🍩 DONUT SMP ECONOMY LEDGER MOD v1.0.0");
        System.out.println("Sunucu: Donut SMP (donutsmp.net)");
        System.out.println("Web Panel: " + DonutConfig.get().apiUrl);
        System.out.println("==================================================");

        // 1. Ayarları yükle
        DonutConfig config = DonutConfig.get();

        // 2. Arka plan log ve chat dinleme motorunu başlat
        DonutLogEngine.start();

        // 3. İstemci komutlarını (/verify, /donut) kaydet (TAB tamamlama için)
        DonutCommands.register();

        // 4. Donut SMP sunucusuna giriş dinleyicisini başlat (Otomatik /bal & Şık bildirim linki)
        DonutJoinHandler.register();

        System.out.println("[DonutLedger] Mod başarıyla hazırlandı. /ah, /pay, /sell, /orders ve /bal otomatik senkronize edilecek.");
    }
}
