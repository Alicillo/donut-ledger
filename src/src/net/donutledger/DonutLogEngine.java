package net.donutledger;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Donut SMP Arka Plan Günlük Takip Motoru
 * logs/latest.log dosyasını anlık olarak izler.
 * Aktif kullanıcıyı otomatik algılar, chatteki para akışını yakalar ve in-game verify komutunu yönetir.
 */
public class DonutLogEngine {
    private static volatile boolean running = false;
    private static Thread workerThread;

    private static final Pattern USER_SET_PATTERN = Pattern.compile("Setting user:\\s*([a-zA-Z0-9_]{3,16})");
    private static final Pattern DONUT_CMD_PATTERN = Pattern.compile("/donut\\s+(link|seturl|status|verify|key)(?:\\s+([^\\s]+))?", Pattern.CASE_INSENSITIVE);

    public static synchronized void start() {
        if (running) return;
        running = true;

        workerThread = new Thread(() -> {
            File logFile = new File("logs/latest.log");
            long lastPointer = 0;

            // Log dosyası oluşana kadar kısa aralıklarla bekle
            int waitCount = 0;
            while (running && !logFile.exists() && waitCount < 30) {
                try {
                    Thread.sleep(500);
                    waitCount++;
                } catch (InterruptedException e) {
                    return;
                }
            }

            // Dosya varsa baştan tarayarak kullanıcı adını bulmaya çalış
            if (logFile.exists()) {
                scanForInitialUsername(logFile);
                lastPointer = logFile.length();
            }

            System.out.println("[DonutLedger] LogEngine aktif. Donut SMP chat akışı dinleniyor...");

            while (running) {
                try {
                    if (logFile.exists()) {
                        long curLen = logFile.length();

                        // Log sıfırlandıysa (yeni oyun başlatıldıysa)
                        if (curLen < lastPointer) {
                            lastPointer = 0;
                            scanForInitialUsername(logFile);
                        }

                        if (curLen > lastPointer) {
                            try (RandomAccessFile raf = new RandomAccessFile(logFile, "r")) {
                                raf.seek(lastPointer);
                                String rawLine;
                                while ((rawLine = raf.readLine()) != null) {
                                    // ISO-8859-1'den UTF-8'e çevir
                                    String line = new String(rawLine.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
                                    processLogLine(line);
                                }
                                lastPointer = raf.getFilePointer();
                            }
                        }
                    }

                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    try { Thread.sleep(1000); } catch (Exception ignored) {}
                }
            }
        }, "DonutLedger-LogEngine");

        workerThread.setDaemon(true);
        workerThread.start();
    }

    private static void scanForInitialUsername(File logFile) {
        DonutConfig cfg = DonutConfig.get();
        if (cfg.username != null && !cfg.username.isEmpty() && cfg.apiKey != null && !cfg.apiKey.isEmpty()) {
            return; // Zaten kayıtlı ve bağlı
        }

        try (RandomAccessFile raf = new RandomAccessFile(logFile, "r")) {
            long toRead = Math.min(raf.length(), 16384);
            raf.seek(0);
            byte[] buf = new byte[(int) toRead];
            raf.readFully(buf);
            String head = new String(buf, StandardCharsets.UTF_8);

            Matcher m = USER_SET_PATTERN.matcher(head);
            if (m.find()) {
                String detectedUser = m.group(1);
                System.out.println("[DonutLedger] Aktif Minecraft kullanıcısı tespit edildi: " + detectedUser);
                cfg.username = detectedUser;
                cfg.save();
                DonutApiClient.autoLink(detectedUser);
            }
        } catch (Exception ignored) {}
    }

    private static void processLogLine(String line) {
        if (line == null) return;

        // 1. Kullanıcı değişimi tespiti (Setting user: ...)
        Matcher mUser = USER_SET_PATTERN.matcher(line);
        if (mUser.find()) {
            String detectedUser = mUser.group(1);
            DonutConfig cfg = DonutConfig.get();
            if (!detectedUser.equalsIgnoreCase(cfg.username) || cfg.apiKey.isEmpty()) {
                System.out.println("[DonutLedger] Yeni kullanıcı girişi tespit edildi: " + detectedUser);
                cfg.username = detectedUser;
                cfg.save();
                DonutApiClient.autoLink(detectedUser);
            }
        }

        // 2. Chat satırını ayıkla
        String chatMessage = extractChatMessage(line);
        if (chatMessage != null && !chatMessage.isEmpty()) {
            // A) Verify / API Key sorgusu (oyunda verify yazınca ve sadece Donut SMP'deyse)
            if (isVerifyCommand(chatMessage) && DonutJoinHandler.isCurrentlyOnDonutSmp()) {
                DonutConfig cfg = DonutConfig.get();
                DonutApiClient.autoLink(cfg.username).thenAccept(ok -> {
                    DonutChatHud.sendVerificationMessage(DonutConfig.get().apiKey);
                }).exceptionally(ex -> {
                    DonutChatHud.sendVerificationMessage(DonutConfig.get().apiKey);
                    return null;
                });
                return;
            }

            // B) /donut komut kontrolü
            Matcher mCmd = DONUT_CMD_PATTERN.matcher(chatMessage);
            if (mCmd.find()) {
                handleInGameCommand(mCmd.group(1), mCmd.group(2));
                return;
            }

            // C) Donut SMP ekonomi olayını ayrıştır
            DonutEconomyParser.parseAndDispatch(chatMessage);
        }
    }

    private static boolean isVerifyCommand(String msg) {
        if (msg == null) return false;
        String m = msg.trim().toLowerCase();
        if (m.startsWith("<") && m.contains(">")) {
            m = m.substring(m.indexOf(">") + 1).trim();
        }
        return m.equals("verify") || m.equals("/verify") || m.startsWith("/verify ")
            || m.equals("!verify") || m.equals(".verify")
            || m.equals("#verify") || m.equals("apikey") || m.equals("api")
            || m.equals("key") || m.startsWith("/donut verify") || m.startsWith("/donut key");
    }

    private static String extractChatMessage(String line) {
        int chatIdx = line.indexOf("[CHAT]");
        if (chatIdx != -1) {
            return line.substring(chatIdx + 6).trim();
        }

        // Render thread/INFO sonrası chat mesajları
        int infoIdx = line.indexOf("[Render thread/INFO]:");
        if (infoIdx != -1) {
            String rest = line.substring(infoIdx + 21).trim();
            if (rest.startsWith("<") || rest.startsWith("[") || rest.toLowerCase().contains("balance") 
                    || rest.toLowerCase().contains("sold") || rest.toLowerCase().contains("bought")
                    || rest.toLowerCase().contains("ordered") || rest.toLowerCase().contains("delivered")
                    || rest.toLowerCase().contains("paid") || rest.contains("$") || rest.toLowerCase().contains("verify")) {
                return rest;
            }
        }
        return null;
    }

    private static void handleInGameCommand(String subcmd, String arg) {
        if (subcmd == null) return;
        DonutConfig cfg = DonutConfig.get();

        switch (subcmd.toLowerCase()) {
            case "verify":
            case "key":
                DonutChatHud.sendVerificationMessage(cfg.apiKey);
                break;
            case "link":
                String userToLink = (arg != null && !arg.isEmpty()) ? arg : cfg.username;
                if (userToLink != null && !userToLink.isEmpty()) {
                    System.out.println("[DonutLedger] /donut link çalıştırılıyor: " + userToLink);
                    DonutApiClient.autoLink(userToLink).thenAccept(ok -> {
                        DonutChatHud.sendVerificationMessage(DonutConfig.get().apiKey);
                    });
                }
                break;
            case "seturl":
                if (arg != null && !arg.isEmpty()) {
                    cfg.apiUrl = arg;
                    cfg.save();
                    System.out.println("[DonutLedger] Web URL güncellendi: " + arg);
                }
                break;
            case "status":
                System.out.println("[DonutLedger] Durum: Kullanıcı=" + cfg.username + ", API=" + cfg.apiUrl + ", Bağlı=" + (!cfg.apiKey.isEmpty()));
                break;
        }
    }

    public static synchronized void stop() {
        running = false;
        if (workerThread != null) {
            workerThread.interrupt();
        }
    }
}
