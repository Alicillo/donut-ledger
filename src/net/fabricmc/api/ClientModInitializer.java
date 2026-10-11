package net.fabricmc.api;

/**
 * Compile-time stub for Fabric Knot loader.
 * Excluded from final JAR to allow Fabric's Knot classloader to provide runtime definition.
 */
public interface ClientModInitializer {
    void onInitializeClient();
}
