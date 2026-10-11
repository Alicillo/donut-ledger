package net.donutledger;

import java.awt.Toolkit;
import java.awt.datatransfer.StringSelection;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * Donut SMP Dinamik İstemci Komut ve Mesaj Yakalama Motoru
 * 1. Brigadier Client Commands: /verify ve /donut için istemcide gerçek TAB tamamlama.
 * 2. ClientSendMessageEvents.ALLOW_COMMAND: /verify komutunu sunucuya gitmeden yakalar ve engeller.
 * 3. ClientSendMessageEvents.ALLOW_CHAT: Chat'e 'verify' yazıldığında sunucuya gitmeden yakalar.
 * 4. API anahtarını hem ekrana renkli basar hem de Windows panosuna otomatik kopyalar.
 * Tüm Proxy nesneleri hashCode, equals ve toString metotlarını güvenli şekilde yönetir.
 */
public class DonutCommands {

    public static void register() {
        registerBrigadier();
        registerMessageEvents();
    }

    private static void registerBrigadier() {
        try {
            Class<?> callbackClass = Class.forName("net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback");
            Field eventField = callbackClass.getField("EVENT");
            Object eventInstance = eventField.get(null);

            Class<?> eventInterface = Class.forName("net.fabricmc.fabric.api.event.Event");
            Method registerEventMethod = eventInterface.getMethod("register", Object.class);
            registerEventMethod.setAccessible(true);

            Class<?> commandClass = Class.forName("com.mojang.brigadier.Command");
            Class<?> managerClass = Class.forName("net.fabricmc.fabric.api.client.command.v2.ClientCommandManager");
            Method literalMethod = managerClass.getMethod("literal", String.class);

            // Command Callback Proxy (Brigadier run)
            Object verifyCommandProxy = Proxy.newProxyInstance(
                    commandClass.getClassLoader(),
                    new Class<?>[]{commandClass},
                    (p, m, args) -> {
                        String name = m.getName();
                        if (name.equals("run")) {
                            if (!DonutJoinHandler.isCurrentlyOnDonutSmp()) {
                                return Integer.valueOf(0);
                            }
                            executeVerifyCommand(args != null && args.length > 0 ? args[0] : null);
                            return Integer.valueOf(1);
                        }
                        if (name.equals("hashCode")) {
                            return Integer.valueOf(System.identityHashCode(p));
                        }
                        if (name.equals("equals")) {
                            return Boolean.valueOf(args != null && args.length > 0 && p == args[0]);
                        }
                        if (name.equals("toString")) {
                            return "DonutLedgerVerifyCommand";
                        }
                        return Integer.valueOf(1);
                    }
            );

            // ClientCommandRegistrationCallback Proxy
            Object listenerProxy = Proxy.newProxyInstance(
                    callbackClass.getClassLoader(),
                    new Class<?>[]{callbackClass},
                    (p, m, args) -> {
                        String name = m.getName();
                        if (name.equals("register")) {
                            Object dispatcher = args[0];

                            // 1. /verify
                            Object verifyLiteral = literalMethod.invoke(null, "verify");
                            attachExecutes(verifyLiteral, verifyCommandProxy);
                            registerToDispatcher(dispatcher, verifyLiteral);

                            // 2. /donut
                            Object donutLiteral = literalMethod.invoke(null, "donut");
                            Object donutVerify = literalMethod.invoke(null, "verify");
                            attachExecutes(donutVerify, verifyCommandProxy);
                            Object donutKey = literalMethod.invoke(null, "key");
                            attachExecutes(donutKey, verifyCommandProxy);

                            attachThen(donutLiteral, donutVerify);
                            attachThen(donutLiteral, donutKey);
                            registerToDispatcher(dispatcher, donutLiteral);

                            System.out.println("[DonutLedger] [OK] /verify ve /donut Brigadier komut agacina basariyla kaydedildi (TAB tamamlama devrede).");
                            return null;
                        }
                        if (name.equals("hashCode")) {
                            return Integer.valueOf(System.identityHashCode(p));
                        }
                        if (name.equals("equals")) {
                            return Boolean.valueOf(args != null && args.length > 0 && p == args[0]);
                        }
                        if (name.equals("toString")) {
                            return "DonutLedgerRegistrationCallback";
                        }
                        return null;
                    }
            );

            registerEventMethod.invoke(eventInstance, listenerProxy);
            System.out.println("[DonutLedger] [OK] Brigadier ClientCommandRegistrationCallback aktif.");

        } catch (Throwable t) {
            System.err.println("[DonutLedger] Brigadier kaydi basarisiz (Mesaj yakalayici devrede): " + t.getMessage());
        }
    }

    private static void registerMessageEvents() {
        try {
            Class<?> eventInterface = Class.forName("net.fabricmc.fabric.api.event.Event");
            Method registerEventMethod = eventInterface.getMethod("register", Object.class);
            registerEventMethod.setAccessible(true);

            Class<?> msgEventsClass = Class.forName("net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents");

            // 1. ALLOW_COMMAND Interceptor (Sunucuya paket gitmeden iptal eder)
            try {
                Field allowCmdField = msgEventsClass.getField("ALLOW_COMMAND");
                Object allowCmdEvent = allowCmdField.get(null);

                Class<?> allowCmdInterface = Class.forName("net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents$AllowCommand");
                Object allowCmdProxy = Proxy.newProxyInstance(
                        allowCmdInterface.getClassLoader(),
                        new Class<?>[]{allowCmdInterface},
                        (p, m, args) -> {
                            String name = m.getName();
                            if (name.equals("allowSendCommandMessage")) {
                                String cmd = args != null && args.length > 0 ? (String) args[0] : null;
                                if (cmd != null) {
                                    String clean = cmd.trim();
                                    if (clean.equalsIgnoreCase("verify") || clean.toLowerCase().startsWith("verify ")
                                            || clean.equalsIgnoreCase("donut verify") || clean.equalsIgnoreCase("donut key")) {
                                        if (!DonutJoinHandler.isCurrentlyOnDonutSmp()) {
                                            return Boolean.TRUE; // Başka sunucudayken dokunma!
                                        }
                                        executeVerifyCommand(null);
                                        return Boolean.FALSE; // Sunucuya gonderme!
                                    }
                                }
                                return Boolean.TRUE;
                            }
                            if (name.equals("hashCode")) {
                                return Integer.valueOf(System.identityHashCode(p));
                            }
                            if (name.equals("equals")) {
                                return Boolean.valueOf(args != null && args.length > 0 && p == args[0]);
                            }
                            if (name.equals("toString")) {
                                return "DonutLedgerAllowCommand";
                            }
                            return Boolean.TRUE;
                        }
                );

                registerEventMethod.invoke(allowCmdEvent, allowCmdProxy);
                System.out.println("[DonutLedger] [OK] ClientSendMessageEvents.ALLOW_COMMAND devrede (/verify sunucuya gitmeden yakalanacak).");
            } catch (Throwable t) {
                System.err.println("[DonutLedger] ALLOW_COMMAND kurulamadi: " + t.getMessage());
            }

            // 2. ALLOW_CHAT Interceptor (Chat'e / koymadan verify yazarsa)
            try {
                Field allowChatField = msgEventsClass.getField("ALLOW_CHAT");
                Object allowChatEvent = allowChatField.get(null);

                Class<?> allowChatInterface = Class.forName("net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents$AllowChat");
                Object allowChatProxy = Proxy.newProxyInstance(
                        allowChatInterface.getClassLoader(),
                        new Class<?>[]{allowChatInterface},
                        (p, m, args) -> {
                            String name = m.getName();
                            if (name.equals("allowSendChatMessage")) {
                                String chat = args != null && args.length > 0 ? (String) args[0] : null;
                                if (chat != null) {
                                    String clean = chat.trim();
                                    if (clean.equalsIgnoreCase("verify") || clean.toLowerCase().startsWith("verify ")
                                            || clean.equalsIgnoreCase("/verify") || clean.toLowerCase().startsWith("/verify ")) {
                                        if (!DonutJoinHandler.isCurrentlyOnDonutSmp()) {
                                            return Boolean.TRUE; // Başka sunucudayken dokunma!
                                        }
                                        executeVerifyCommand(null);
                                        return Boolean.FALSE; // Genel chate yayma!
                                    }
                                }
                                return Boolean.TRUE;
                            }
                            if (name.equals("hashCode")) {
                                return Integer.valueOf(System.identityHashCode(p));
                            }
                            if (name.equals("equals")) {
                                return Boolean.valueOf(args != null && args.length > 0 && p == args[0]);
                            }
                            if (name.equals("toString")) {
                                return "DonutLedgerAllowChat";
                            }
                            return Boolean.TRUE;
                        }
                );

                registerEventMethod.invoke(allowChatEvent, allowChatProxy);
                System.out.println("[DonutLedger] [OK] ClientSendMessageEvents.ALLOW_CHAT devrede (chatten verify korundu).");
            } catch (Throwable t) {
                System.err.println("[DonutLedger] ALLOW_CHAT kurulamadi: " + t.getMessage());
            }

        } catch (Throwable t) {
            System.err.println("[DonutLedger] Mesaj dinleyici kurulumu basarisiz: " + t.getMessage());
        }
    }

    private static void attachExecutes(Object literalBuilder, Object commandProxy) {
        for (Method m : literalBuilder.getClass().getMethods()) {
            if (m.getName().equals("executes") && m.getParameterCount() == 1) {
                try {
                    m.setAccessible(true);
                    m.invoke(literalBuilder, commandProxy);
                    return;
                } catch (Throwable ignored) {}
            }
        }
    }

    private static void attachThen(Object parentLiteral, Object childLiteral) {
        for (Method m : parentLiteral.getClass().getMethods()) {
            if (m.getName().equals("then") && m.getParameterCount() == 1) {
                try {
                    m.setAccessible(true);
                    m.invoke(parentLiteral, childLiteral);
                    return;
                } catch (Throwable ignored) {}
            }
        }
    }

    private static void registerToDispatcher(Object dispatcher, Object literal) {
        for (Method m : dispatcher.getClass().getMethods()) {
            if (m.getName().equals("register") && m.getParameterCount() == 1) {
                try {
                    m.setAccessible(true);
                    m.invoke(dispatcher, literal);
                    return;
                } catch (Throwable ignored) {}
            }
        }
    }

    public static void executeVerifyCommand(Object commandContext) {
        if (!DonutJoinHandler.isCurrentlyOnDonutSmp()) {
            return; // Donut SMP sunucusu haricinde verify komutu devre disidir
        }
        DonutConfig cfg = DonutConfig.get();
        // Web sunucusundan en güncel geçerli anahtarı sorgula ve senkronize et
        DonutApiClient.autoLink(cfg.username).thenAccept(ok -> {
            DonutConfig.get().load();
            sendFeedback(commandContext, DonutConfig.get().apiKey);
        }).exceptionally(ex -> {
            cfg.load();
            sendFeedback(commandContext, cfg.apiKey);
            return null;
        });
    }

    private static void sendFeedback(Object commandContext, String apiKey) {
        // 1. Panoya kopyala ve ses çal (GLFW Native + AWT + Windows fallback)
        copyToClipboard(apiKey);

        String line1 = "§d§m---------------------------------------------";
        String line2 = "§6§l[DonutLedger] §a🔑 YOUR API KEY:";
        String line3 = "§e§ldnt_sec_•••••••••••••••••••• §7(Masked)";
        String line4 = "§7(Copied to clipboard! Press Ctrl+V on website)";
        String line5 = "§bWeb Panel: §f" + (DonutConfig.get().apiUrl != null ? DonutConfig.get().apiUrl : "https://donut-ledger.onrender.com");
        String line6 = "§d§m---------------------------------------------";

        boolean sentViaBrigadier = false;
        if (commandContext != null) {
            sentViaBrigadier = trySendViaCommandSource(commandContext, line1, line2, line3, line4, line5, line6);
        }

        if (!sentViaBrigadier) {
            DonutChatHud.sendVerificationLines(line1, line2, line3, line4, line5, line6);
        }
    }

    private static boolean trySendViaCommandSource(Object commandContext, String... lines) {
        try {
            Method getSourceM = commandContext.getClass().getMethod("getSource");
            getSourceM.setAccessible(true);
            Object source = getSourceM.invoke(commandContext);

            Class<?> textClass = findTextClass();
            if (textClass == null) return false;

            Method createTextM = null;
            for (Method m : textClass.getMethods()) {
                if ((m.getName().equals("literal") || m.getName().equals("method_43470"))
                        && m.getParameterCount() == 1 && m.getParameterTypes()[0] == String.class) {
                    createTextM = m;
                    createTextM.setAccessible(true);
                    break;
                }
            }
            if (createTextM == null) return false;

            Method sendFeedbackM = null;
            for (Method m : source.getClass().getMethods()) {
                if ((m.getName().equals("sendFeedback") || m.getName().equals("method_9257")) && m.getParameterCount() == 1) {
                    sendFeedbackM = m;
                    sendFeedbackM.setAccessible(true);
                    break;
                }
            }
            if (sendFeedbackM == null) return false;

            for (String line : lines) {
                Object textObj = createTextM.invoke(null, line);
                sendFeedbackM.invoke(source, textObj);
            }
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    private static Class<?> findTextClass() {
        String[] candidates = {"net.minecraft.text.Text", "net.minecraft.class_2561"};
        for (String c : candidates) {
            try {
                return Class.forName(c);
            } catch (ClassNotFoundException ignored) {}
        }
        return null;
    }

    public static void copyToClipboard(String text) {
        boolean copied = false;

        // 1. Minecraft GLFW Native Keyboard (Oyunda pencere içi anında çalışır)
        try {
            Class<?> mcClass = Class.forName("net.minecraft.client.MinecraftClient");
            Object mc = mcClass.getMethod("getInstance").invoke(null);
            Field kf = mcClass.getField("keyboard");
            Object keyboard = kf.get(mc);
            Method setClip = keyboard.getClass().getMethod("setClipboard", String.class);
            setClip.invoke(keyboard, text);
            copied = true;
        } catch (Throwable ignored) {
            try {
                Class<?> mcClass = Class.forName("net.minecraft.class_310");
                Method gm = mcClass.getMethod("method_1551");
                Object mc = gm.invoke(null);
                for (Field f : mcClass.getDeclaredFields()) {
                    if (f.getName().equals("field_1690") || f.getType().getName().contains("class_309") || f.getType().getName().contains("Keyboard")) {
                        f.setAccessible(true);
                        Object keyboard = f.get(mc);
                        if (keyboard != null) {
                            for (Method m : keyboard.getClass().getMethods()) {
                                if ((m.getName().equals("setClipboard") || m.getName().equals("method_1455"))
                                        && m.getParameterCount() == 1 && m.getParameterTypes()[0] == String.class) {
                                    m.setAccessible(true);
                                    m.invoke(keyboard, text);
                                    copied = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (copied) break;
                }
            } catch (Throwable ignored2) {}
        }

        // 2. Java AWT System Clipboard
        try {
            StringSelection sel = new StringSelection(text);
            java.awt.datatransfer.Clipboard cb = Toolkit.getDefaultToolkit().getSystemClipboard();
            for (int i = 0; i < 5; i++) {
                try {
                    cb.setContents(sel, sel);
                    copied = true;
                    break;
                } catch (Throwable t) {
                    try { Thread.sleep(40); } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {}

        // 3. Windows PowerShell Native Fallback
        if (!copied) {
            try {
                new ProcessBuilder("powershell", "-NoProfile", "-Command", "Set-Clipboard -Value '" + text + "'").start();
            } catch (Throwable ignored) {}
        }

        try { Toolkit.getDefaultToolkit().beep(); } catch (Throwable ignored) {}
    }
}
