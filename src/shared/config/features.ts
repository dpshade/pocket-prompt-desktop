/**
 * Feature flags for Pocket Prompt
 *
 * Local-first architecture with Turso/SQLite for storage.
 * Arweave integration is segregated in src/arweave/ for potential future reconnection.
 */

// Check if running in Tauri desktop environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const FEATURE_FLAGS = {
  /**
   * Show wallet connection UI (disabled in local-first mode)
   * Re-enable when reconnecting Arweave wallet functionality
   */
  WALLET_CONNECTION: false,

  /**
   * Show "Sync to Cloud" mockup button
   * Placeholder for future cloud sync feature
   */
  SHOW_SYNC_BUTTON: true,

  /**
   * Running as desktop app (Tauri)
   * Automatically detected based on environment
   */
  IS_DESKTOP: isTauri,

  /**
   * Enable client-side encryption
   * Requires wallet connection to derive encryption keys
   */
  ENCRYPTION_ENABLED: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
