/**
 * Arweave Integration Module (SEGREGATED)
 *
 * This module is intentionally excluded from the main build.
 * It contains all Arweave-specific code for permanent storage.
 *
 * To reconnect Arweave functionality:
 * 1. Add Arweave packages back to dependencies
 * 2. Include this directory in tsconfig.json
 * 3. Implement StorageBackend interface (see src/core/interfaces/)
 * 4. Enable via feature flag
 *
 * @see /docs/ARWEAVE_RECONNECTION.md for full instructions
 */

// API exports
export * from './api/client';
export * from './api/collections';
export * from './api/upload';

// Config exports
export * from './config/arweave';

// Wallet connectors
export * from './services/wallets';

// Migration utilities
export * from './migration/arweave-to-turso';
