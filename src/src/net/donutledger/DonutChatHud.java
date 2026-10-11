package net.donutledger;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URI;
import java.util.concurrent.Executor;

/**
 * Minecraft İstemci Sohbet Enjektörü (In-Game Chat Injector)
 * Yarn ve Intermediary sınıf adlarını destekleyerek oyuncunun ekranına doğrudan chat mesajı basar.
 * - Render iş parçacığında (Render Thread / MinecraftClient.execute) çalışarak ekran senkronizasyonunu garanti eder.
 * - Karakter bozulmalarını önlemek için standart \u00A7 renk kodlarını ve güvenli karakterleri kullanır.
 * - Tıklanabilir (ClickEvent.Action.OPEN_URL) ve Hover destekli butonları basar.
 * - İstemci komutlarını (/bal vb.) sunucuya doğrudan iletir.
 */
public class DonutChatHud {

    /**
     * Minecraft Render Thread üzerinde kod çalıştırır.
     */
    public static void runOnRenderThread(Runnable action) {
        if (action == null) return;
        try {
            Class<?> mcClass = findClass("net.minecraft.client.MinecraftClient", "net.minecraft.class_310");
            if (mcClass != null) {
                Object mcInstance = getStaticInstance(mcClass, "getInstance", "method_1551");
                if (mcInstance instanceof Executor) {
                    ((Executor) mcInstance).execute(action);
                    return;
                }
            }
        } catch (Throwable ignored) {}
        // Fallback: doğrudan çalıştır
        try {
            action.run();
        } catch (Throwable ignored) {}
    }

    public static void sendVerificationLines(String... lines) {
        if (lines == null || lines.length == 0) return;
        runOnRenderThread(() -> {
            boolean delivered = false;
            for (String line : lines) {
                if (injectChatLine(line)) {
                    delivered = true;
                }
            }
            if (!delivered) {
                System.out.println("[DonutLedger] ==================================================");
                for (String line : lines) {
                    System.out.println("[DonutLedger] " + line.replaceAll("\u00A7[0-9a-fk-or]", ""));
                }
                System.out.println("[DonutLedger] ==================================================");
            }
        });
    }

    public static void sendVerificationMessage(String apiKey) {
        DonutCommands.copyToClipboard(apiKey);

        String line1 = "\u00A7d\u00A7m---------------------------------------------";
        String line2 = "\u00A76\u00A7l[DonutLedger] \u00A7a\u00A7lKEY: \u00A7e\u00A7ldnt_sec_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 \u00A77(Masked)";
        String line3 = "\u00A77(Panoya kopyalandi! Web sitesinde Ctrl+V yapin)";
        String line4 = "\u00A7bWeb Panel: \u00A7f" + (DonutConfig.get().apiUrl != null ? DonutConfig.get().apiUrl : "https://donut-ledger.onrender.com");
        String line5 = "\u00A7d\u00A7m---------------------------------------------";

        sendVerificationLines(line1, line2, line3, line4, line5);
    }

    /**
     * Tıklanabilir Web Paneli Linkini Chat'e basar.
     */
    public static void sendClickableDashboardLink(String prefix, String buttonText, String url, String suffix) {
        runOnRenderThread(() -> {
            try {
                Class<?> mcClass = findClass("net.minecraft.client.MinecraftClient", "net.minecraft.class_310");
                if (mcClass == null) return;

                Object mcInstance = getStaticInstance(mcClass, "getInstance", "method_1551");
                if (mcInstance == null) return;

                Class<?> textClass = findClass("net.minecraft.text.Text", "net.minecraft.class_2561");
                if (textClass == null) return;

                // 1. Buton metni
                Object buttonTextObj = invokeStatic(textClass, buttonText, "literal", "method_43470");

                // 2. ClickEvent & HoverEvent
                Object clickEvent = createClickEvent(url);
                Object hoverEvent = createHoverEvent(textClass, "\u00A7dDonut SMP Economy Ledger\n\u00A77Click to open website");

                // 3. Style nesnesine bağla
                Object style = buildStyle(clickEvent, hoverEvent);
                if (style != null && buttonTextObj != null) {
                    applyStyle(buttonTextObj, style);
                }

                // 4. Prefix / Suffix (varsa) bağla
                Object fullText = buttonTextObj;
                if (prefix != null && !prefix.isEmpty()) {
                    Object prefixText = invokeStatic(textClass, prefix, "literal", "method_43470");
                    if (prefixText != null && buttonTextObj != null) {
                        appendComponent(prefixText, buttonTextObj);
                        fullText = prefixText;
                    }
                }
                if (suffix != null && !suffix.isEmpty() && fullText != null) {
                    Object suffixText = invokeStatic(textClass, suffix, "literal", "method_43470");
                    if (suffixText != null) {
                        appendComponent(fullText, suffixText);
                    }
                }

                // 7. Gönder: Önce player.sendMessage, sonra chatHud.addMessage
                if (deliverComponent(mcInstance, textClass, fullText)) {
                    return;
                }

            } catch (Throwable t) {
                System.err.println("[DonutLedger] sendClickableDashboardLink hatasi: " + t.getMessage());
            }

            // Fallback: Düz URL satırı bas
            injectChatLine(prefix + "\u00A7b\u00A7n" + url + "\u00A7r" + suffix);
        });
    }

    /**
     * İstemci üzerinden sunucuya otomatik komut gönderir (örn: 'bal').
     */
    public static boolean sendClientCommand(String command) {
        if (command == null || command.trim().isEmpty()) return false;
        String clean = command.trim();
        if (clean.startsWith("/")) {
            clean = clean.substring(1).trim();
        }

        try {
            Class<?> mcClass = findClass("net.minecraft.client.MinecraftClient", "net.minecraft.class_310");
            if (mcClass == null) return false;

            Object mcInstance = getStaticInstance(mcClass, "getInstance", "method_1551");
            if (mcInstance == null) return false;

            Object networkHandler = invokeMethod(mcInstance, "getNetworkHandler", "method_1562", "R");
            if (networkHandler == null) {
                Object player = getFieldOrMethod(mcInstance, "player", "field_1724");
                if (player != null) {
                    networkHandler = getFieldOrMethod(player, "networkHandler", "field_3944");
                }
            }

            if (networkHandler != null) {
                for (String mName : new String[]{"sendChatCommand", "method_45730", "d"}) {
                    try {
                        Method m = networkHandler.getClass().getMethod(mName, String.class);
                        m.setAccessible(true);
                        m.invoke(networkHandler, clean);
                        System.out.println("[DonutLedger] [AutoBal] Komut basariyla iletildi: /" + clean);
                        return true;
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable t) {
            System.err.println("[DonutLedger] sendClientCommand hatasi: " + t.getMessage());
        }
        return false;
    }

    private static boolean deliverComponent(Object mcInstance, Class<?> textClass, Object textInstance) {
        if (mcInstance == null || textInstance == null) return false;

        // 1. client.player.sendMessage(text, false) / method_43496
        try {
            Object player = getFieldOrMethod(mcInstance, "player", "field_1724");
            if (player != null) {
                for (String mn : new String[]{"sendMessage", "method_43496"}) {
                    try {
                        Method m = player.getClass().getMethod(mn, textClass);
                        m.setAccessible(true);
                        m.invoke(player, textInstance);
                        return true;
                    } catch (Throwable ignored) {}
                }
                for (String mn : new String[]{"sendMessage", "method_7353"}) {
                    try {
                        Method m = player.getClass().getMethod(mn, textClass, boolean.class);
                        m.setAccessible(true);
                        m.invoke(player, textInstance, Boolean.FALSE);
                        return true;
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {}

        // 2. inGameHud.getChatHud().addMessage(text) / method_1812
        try {
            Object inGameHud = getFieldOrMethod(mcInstance, "inGameHud", "field_1705");
            if (inGameHud != null) {
                Object chatHud = invokeMethod(inGameHud, "getChatHud", "method_1743");
                if (chatHud != null) {
                    return invokeMethodWithArg(chatHud, textInstance, "addMessage", "method_1812");
                }
            }
        } catch (Throwable ignored) {}

        return false;
    }

    private static boolean injectChatLine(String messageText) {
        try {
            Class<?> mcClass = findClass("net.minecraft.client.MinecraftClient", "net.minecraft.class_310");
            if (mcClass == null) return false;

            Object mcInstance = getStaticInstance(mcClass, "getInstance", "method_1551");
            if (mcInstance == null) return false;

            Class<?> textClass = findClass("net.minecraft.text.Text", "net.minecraft.class_2561");
            if (textClass == null) return false;

            Object textInstance = invokeStatic(textClass, messageText, "literal", "method_43470");
            if (textInstance == null) return false;

            return deliverComponent(mcInstance, textClass, textInstance);
        } catch (Throwable t) {
            return false;
        }
    }

    private static Object createClickEvent(String url) {
        // 1. Minecraft 1.21+ (ClickEvent.OpenUrl Record: yf$f / class_2558$class_10608)
        Class<?> openUrlClass = findClass(
                "net.minecraft.text.ClickEvent$OpenUrl",
                "net.minecraft.class_2558$class_10608",
                "yf$f"
        );
        if (openUrlClass != null) {
            try {
                URI uri = URI.create(url);
                for (Constructor<?> c : openUrlClass.getConstructors()) {
                    if (c.getParameterCount() == 1 && c.getParameterTypes()[0] == URI.class) {
                        c.setAccessible(true);
                        return c.newInstance(uri);
                    }
                }
            } catch (Throwable ignored) {}
        }

        // 2. Minecraft 1.19 / 1.20 (ClickEvent(Action.OPEN_URL, url))
        Class<?> clickEventClass = findClass("net.minecraft.text.ClickEvent", "net.minecraft.class_2558", "yf");
        if (clickEventClass != null) {
            try {
                Class<?> actionClass = findClass("net.minecraft.text.ClickEvent$Action", "net.minecraft.class_2558$class_2559", "yf$a");
                Object openUrlAction = null;
                if (actionClass != null) {
                    for (Field f : actionClass.getFields()) {
                        if (f.getName().equalsIgnoreCase("OPEN_URL") || f.getName().equals("field_11749") || f.getName().equals("a")) {
                            openUrlAction = f.get(null);
                            break;
                        }
                    }
                }
                if (openUrlAction != null) {
                    for (Constructor<?> c : clickEventClass.getConstructors()) {
                        if (c.getParameterCount() == 2 && c.getParameterTypes()[0].isInstance(openUrlAction) && c.getParameterTypes()[1] == String.class) {
                            c.setAccessible(true);
                            return c.newInstance(openUrlAction, url);
                        }
                    }
                }
            } catch (Throwable ignored) {}
        }
        return null;
    }

    private static Object createHoverEvent(Class<?> textClass, String hoverContent) {
        try {
            Object hoverText = invokeStatic(textClass, hoverContent, "literal", "method_43470");
            if (hoverText == null) return null;

            // 1. Minecraft 1.21+ (HoverEvent.ShowText Record: yo$e / class_2568$class_10610)
            Class<?> showTextClass = findClass(
                    "net.minecraft.text.HoverEvent$ShowText",
                    "net.minecraft.class_2568$class_10610",
                    "yo$e"
            );
            if (showTextClass != null) {
                for (Constructor<?> c : showTextClass.getConstructors()) {
                    if (c.getParameterCount() == 1 && c.getParameterTypes()[0].isAssignableFrom(hoverText.getClass())) {
                        c.setAccessible(true);
                        return c.newInstance(hoverText);
                    }
                }
            }

            // 2. Minecraft 1.19 / 1.20 (HoverEvent(Action.SHOW_TEXT, Text))
            Class<?> hoverEventClass = findClass("net.minecraft.text.HoverEvent", "net.minecraft.class_2568", "yo");
            if (hoverEventClass != null) {
                Class<?> actionClass = findClass("net.minecraft.text.HoverEvent$Action", "net.minecraft.class_2568$class_5247", "yo$a");
                Object showAction = null;
                if (actionClass != null) {
                    for (Field f : actionClass.getFields()) {
                        if (f.getName().equalsIgnoreCase("SHOW_TEXT") || f.getName().equals("field_24342") || f.getName().equals("a")) {
                            showAction = f.get(null);
                            break;
                        }
                    }
                }
                if (showAction != null) {
                    for (Constructor<?> c : hoverEventClass.getConstructors()) {
                        if (c.getParameterCount() == 2 && c.getParameterTypes()[0].isInstance(showAction)) {
                            c.setAccessible(true);
                            return c.newInstance(showAction, hoverText);
                        }
                    }
                }
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private static Object buildStyle(Object clickEvent, Object hoverEvent) {
        Class<?> styleClass = findClass("net.minecraft.text.Style", "net.minecraft.class_2583", "zf");
        if (styleClass == null) return null;

        Object style = null;
        for (String fn : new String[]{"EMPTY", "field_24360", "a"}) {
            try {
                Field f = styleClass.getField(fn);
                style = f.get(null);
                if (style != null) break;
            } catch (Throwable ignored) {}
        }
        if (style == null) return null;

        // ClickEvent ekle
        if (clickEvent != null) {
            for (Method m : styleClass.getMethods()) {
                if (m.getParameterCount() == 1
                        && m.getParameterTypes()[0].isAssignableFrom(clickEvent.getClass())
                        && m.getReturnType() == styleClass) {
                    try {
                        m.setAccessible(true);
                        style = m.invoke(style, clickEvent);
                        break;
                    } catch (Throwable ignored) {}
                }
            }
        }

        // HoverEvent ekle
        if (hoverEvent != null) {
            for (Method m : styleClass.getMethods()) {
                if (m.getParameterCount() == 1
                        && m.getParameterTypes()[0].isAssignableFrom(hoverEvent.getClass())
                        && m.getReturnType() == styleClass) {
                    try {
                        m.setAccessible(true);
                        style = m.invoke(style, hoverEvent);
                        break;
                    } catch (Throwable ignored) {}
                }
            }
        }

        // Altı çizili yap
        for (Method m : styleClass.getMethods()) {
            if ((m.getName().equals("withUnderline") || m.getName().equals("method_10982") || m.getName().equals("a"))
                    && m.getParameterCount() == 1
                    && (m.getParameterTypes()[0] == Boolean.class || m.getParameterTypes()[0] == boolean.class)
                    && m.getReturnType() == styleClass) {
                try {
                    m.setAccessible(true);
                    style = m.invoke(style, Boolean.TRUE);
                    break;
                } catch (Throwable ignored) {}
            }
        }

        return style;
    }

    private static void applyStyle(Object mutableText, Object style) {
        if (mutableText == null || style == null) return;
        for (Method m : mutableText.getClass().getMethods()) {
            if ((m.getName().equals("setStyle") || m.getName().equals("method_10862") || m.getName().equals("b"))
                    && m.getParameterCount() == 1
                    && m.getParameterTypes()[0].isAssignableFrom(style.getClass())) {
                try {
                    m.setAccessible(true);
                    m.invoke(mutableText, style);
                    return;
                } catch (Throwable ignored) {}
            }
        }
    }

    private static void appendComponent(Object parent, Object child) {
        if (parent == null || child == null) return;
        for (Method m : parent.getClass().getMethods()) {
            if ((m.getName().equals("append") || m.getName().equals("method_10852") || m.getName().equals("b"))
                    && m.getParameterCount() == 1) {
                try {
                    m.setAccessible(true);
                    m.invoke(parent, child);
                    return;
                } catch (Throwable ignored) {}
            }
        }
    }

    private static Class<?> findClass(String... names) {
        for (String name : names) {
            try {
                return Class.forName(name);
            } catch (ClassNotFoundException ignored) {}
        }
        return null;
    }

    private static Object getStaticInstance(Class<?> clazz, String... methodNames) {
        for (String name : methodNames) {
            try {
                Method m = clazz.getMethod(name);
                m.setAccessible(true);
                return m.invoke(null);
            } catch (Throwable ignored) {}
        }
        return null;
    }

    private static Object getFieldOrMethod(Object target, String fieldName, String intermediaryField) {
        Class<?> cur = target.getClass();
        while (cur != null && cur != Object.class) {
            for (String fn : new String[]{fieldName, intermediaryField}) {
                try {
                    Field f = cur.getDeclaredField(fn);
                    f.setAccessible(true);
                    return f.get(target);
                } catch (Throwable ignored) {}
            }
            cur = cur.getSuperclass();
        }

        return invokeMethod(target, fieldName, intermediaryField);
    }

    private static Object invokeMethod(Object target, String... methodNames) {
        for (String name : methodNames) {
            for (Method m : target.getClass().getMethods()) {
                if (m.getName().equals(name) && m.getParameterCount() == 0) {
                    try {
                        m.setAccessible(true);
                        return m.invoke(target);
                    } catch (Throwable ignored) {}
                }
            }
        }
        return null;
    }

    private static Object invokeStatic(Class<?> clazz, String arg, String... methodNames) {
        for (String name : methodNames) {
            for (Method m : clazz.getMethods()) {
                if (m.getName().equals(name) && m.getParameterCount() == 1 && m.getParameterTypes()[0] == String.class) {
                    try {
                        m.setAccessible(true);
                        return m.invoke(null, arg);
                    } catch (Throwable ignored) {}
                }
            }
        }
        return null;
    }

    private static boolean invokeMethodWithArg(Object target, Object arg, String... methodNames) {
        for (String name : methodNames) {
            for (Method m : target.getClass().getMethods()) {
                if (m.getName().equals(name) && m.getParameterCount() == 1) {
                    try {
                        m.setAccessible(true);
                        m.invoke(target, arg);
                        return true;
                    } catch (Throwable ignored) {}
                }
            }
        }
        return false;
    }
}
