package net.donutledger;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.nio.charset.StandardCharsets;

/**
 * Donut SMP Economy Ledger - Mod Konfigürasyon Yöneticisi
 * Harici bağımlılık olmadan (Zero-dependency) JSON okur ve yazar.
 */
public class DonutConfig {
    private static final File CONFIG_FILE = new File("config/donutledger.json");
    private static DonutConfig instance;

    public String username = "";
    public String apiKey = "";
    public String apiUrl = "http://localhost:3000";
    public boolean autoSync = true;

    public static synchronized DonutConfig get() {
        if (instance == null) {
            instance = new DonutConfig();
            instance.load();
        }
        return instance;
    }

    public void load() {
        if (!CONFIG_FILE.exists()) {
            return;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(CONFIG_FILE, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String content = sb.toString();

            String u = extractField(content, "username");
            if (u != null && !u.isEmpty()) this.username = u;

            String k = extractField(content, "apiKey");
            if (k != null && !k.isEmpty()) this.apiKey = k;

            String url = extractField(content, "apiUrl");
            if (url != null && !url.isEmpty()) this.apiUrl = url;

            if (content.contains("\"autoSync\": false")) {
                this.autoSync = false;
            }
        } catch (Exception e) {
            System.err.println("[DonutLedger] Config okunurken hata: " + e.getMessage());
        }
    }

    public void save() {
        try {
            File parent = CONFIG_FILE.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(CONFIG_FILE, StandardCharsets.UTF_8))) {
                writer.write("{\n");
                writer.write("  \"username\": \"" + escape(username) + "\",\n");
                writer.write("  \"apiKey\": \"" + escape(apiKey) + "\",\n");
                writer.write("  \"apiUrl\": \"" + escape(apiUrl) + "\",\n");
                writer.write("  \"autoSync\": " + autoSync + "\n");
                writer.write("}\n");
            }
        } catch (Exception e) {
            System.err.println("[DonutLedger] Config kaydedilemedi: " + e.getMessage());
        }
    }

    private String extractField(String json, String key) {
        String pattern = "\"" + key + "\":\\s*\"([^\"]*)\"";
        java.util.regex.Matcher m = java.util.regex.Pattern.compile(pattern).matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
