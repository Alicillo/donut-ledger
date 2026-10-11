package net.donutledger;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Donut SMP Sunucuya Giriş ve Otomatik Senkronizasyon Yöneticisi
 * - Sadece 'donutsmp.net' sunucusuna girildiğinde devreye girer.
 * - Başka sunucularda veya tek oyunculuda (singleplayer) tamamen sessiz kalır.
 * - Girişte şık bildirim kartı ve tıklanabilir web panel linki sunar.
 * - Otomatik olarak '/bal' komutunu çalıştırarak bakiye senkronizasyonunu başlatır.
 */
public class DonutJoinHandler {

    private static final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "DonutLedger-JoinHandler");
        t.setDaemon(true);
        return t;
    });

    private static volatile long lastJoinTimestamp = 0L;

    public static void register() {
        try {
            Class<?> eventsClass = Class.forName("net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents");
            Field joinField = eventsClass.getField("JOIN");
            Object joinEvent = joinField.get(null);

            Class<?> eventInterface = Class.forName("net.fabricmc.fabric.api.event.Event");
            Method registerEventMethod = eventInterface.getMethod("register", Object.class);
            registerEventMethod.setAccessible(true);

            Class<?> joinInterface = Class.forName("net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents$Join");
            Object joinProxy = Proxy.newProxyInstance(
                    joinInterface.getClassLoader(),
                    new Class<?>[]{joinInterface},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        if (name.equals("onPlayReady")) {
                            // args: [ClientPlayNetworkHandler handler, PacketSender sender, MinecraftClient client]
                            Object handler = args != null && args.length > 0 ? args[0] : null;
                            Object client = args != null && args.length > 2 ? args[2] : null;
                            onServerJoin(client, handler);
                            return null;
                        }
                        if (name.equals("hashCode")) return Integer.valueOf(System.identityHashCode(proxy));
                        if (name.equals("equals")) return Boolean.valueOf(args != null && args.length > 0 && proxy == args[0]);
                        if (name.equals("toString")) return "DonutLedgerJoinProxy";
                        return null;
                    }
            );

            registerEventMethod.invoke(joinEvent, joinProxy);
            System.out.println("[DonutLedger] [OK] ClientPlayConnectionEvents.JOIN dinleyicisi kuruldu.");
        } catch (Throwable t) {
            System.err.println("[DonutLedger] ClientPlayConnectionEvents.JOIN kaydedilemedi: " + t.getMessage());
        }
    }

    private static void onServerJoin(Object client, Object handler) {
        long now = System.currentTimeMillis();
        // 4 saniye içinde tekrarlanan sub-server / limbo geçişlerini filtrele
        if (now - lastJoinTimestamp < 4000L) {
            return;
        }
        lastJoinTimestamp = now;

        // 1. Oyuncu sunucuya girdiği anda (350ms) HEMEN ilk /bal komutunu gönder
        scheduler.schedule(() -> {
            try {
                if (!isDonutSmpServer(client, handler)) {
                    return;
                }
                System.out.println("[DonutLedger] Donut SMP tespit edildi! Giris aninda hemen /bal check gonderiliyor...");
                DonutChatHud.sendClientCommand("bal");
            } catch (Throwable t) {
                System.err.println("[DonutLedger] Ilk bal check hatasi: " + t.getMessage());
            }
        }, 350L, TimeUnit.MILLISECONDS);

        // 2. 2.5 saniye sonra bakiye teyidi ve şık tıklanabilir banner
        scheduler.schedule(() -> {
            try {
                if (!isDonutSmpServer(client, handler)) {
                    return;
                }

                // Gerekirse bakiye teyidi
                DonutChatHud.sendClientCommand("bal");

                String apiUrl = DonutConfig.get().apiUrl;
                if (apiUrl == null || apiUrl.trim().isEmpty()) {
                    apiUrl = "https://donut-ledger.onrender.com";
                }

                // Sadece mor renkli kalın başlık (mod ismi) ve tıklanabilir OPEN WEBSITE
                String title = "\u00A7d\u00A7lDonut SMP Economy Ledger";
                String buttonText = "\u00A7b\u00A7nOPEN WEBSITE\u00A7r";

                DonutChatHud.sendVerificationLines(title);
                DonutChatHud.sendClickableDashboardLink("", buttonText, apiUrl, "");

            } catch (Throwable inner) {
                System.err.println("[DonutLedger] Join sekansi banner hatasi: " + inner.getMessage());
            }
        }, 2500L, TimeUnit.MILLISECONDS);
    }

    /**
     * Anlık olarak Minecraft istemcisinin Donut SMP sunucusunda olup olmadığını kontrol eder.
     */
    public static boolean isCurrentlyOnDonutSmp() {
        try {
            Class<?> mcClass = Class.forName("net.minecraft.client.MinecraftClient");
            Method m = mcClass.getMethod("getInstance");
            Object client = m.invoke(null);
            return isDonutSmpServer(client, null);
        } catch (Throwable t) {
            try {
                Class<?> mcClass = Class.forName("net.minecraft.class_310");
                Method m = mcClass.getMethod("method_1551");
                Object client = m.invoke(null);
                return isDonutSmpServer(client, null);
            } catch (Throwable ignored) {}
        }
        return false;
    }

    /**
     * Oyuncunun şu anda 'donutsmp.net' sunucusunda olup olmadığını kesin doğrular.
     * Tek oyunculu (singleplayer) veya başka herhangi bir sunucuda false döner.
     */
    public static boolean isDonutSmpServer(Object client, Object handler) {
        try {
            // 1. Singleplayer kontrolü
            if (client != null) {
                for (String mName : new String[]{"isInSingleplayer", "method_1496"}) {
                    try {
                        Method m = client.getClass().getMethod(mName);
                        m.setAccessible(true);
                        Object res = m.invoke(client);
                        if (Boolean.TRUE.equals(res)) {
                            return false; // Kesinlikle tek oyunculu
                        }
                    } catch (Throwable ignored) {}
                }
            }

            // 2. ServerInfo nesnesini çek
            Object serverInfo = null;

            if (client != null) {
                for (String mName : new String[]{"getCurrentServerEntry", "method_1558"}) {
                    try {
                        Method m = client.getClass().getMethod(mName);
                        m.setAccessible(true);
                        serverInfo = m.invoke(client);
                        if (serverInfo != null) break;
                    } catch (Throwable ignored) {}
                }
            }

            if (serverInfo == null && handler != null) {
                for (String mName : new String[]{"getServerInfo", "method_45733"}) {
                    try {
                        Method m = handler.getClass().getMethod(mName);
                        m.setAccessible(true);
                        serverInfo = m.invoke(handler);
                        if (serverInfo != null) break;
                    } catch (Throwable ignored) {}
                }
            }

            if (serverInfo == null) {
                return false;
            }

            // 3. ServerInfo içindeki adres alanlarını tara
            for (Field f : serverInfo.getClass().getDeclaredFields()) {
                if (f.getType() == String.class) {
                    try {
                        f.setAccessible(true);
                        String val = (String) f.get(serverInfo);
                        if (val != null) {
                            String low = val.trim().toLowerCase();
                            if (low.contains("donutsmp.net") || low.contains("donutsmp")) {
                                return true;
                            }
                        }
                    } catch (Throwable ignored) {}
                }
            }

        } catch (Throwable t) {
            System.err.println("[DonutLedger] isDonutSmpServer kontrol hatasi: " + t.getMessage());
        }
        return false;
    }
}
