# Arweave Integration (Segregated)

This directory contains all Arweave-specific code, intentionally excluded from the main build.

## Why Segregated?

The app has pivoted to local-first architecture using Turso (SQLite). Arweave code is preserved here for potential future reconnection but is not compiled into the production bundle.

## Directory Structure

```
src/arweave/
├── api/
│   ├── client.ts        # GraphQL queries, Turbo uploads, wallet ops
│   ├── collections.ts   # Saved searches sync
│   └── upload.ts        # Bundle-based uploads
├── config/
│   ├── arweave.ts       # Tag configuration helpers
│   └── arweave.config.json
├── services/
│   └── wallets/         # Wallet connectors (Wander, ArweaveApp, Keyfile, Beacon)
├── migration/
│   └── arweave-to-turso.ts  # Legacy data migration
└── index.ts             # Barrel export
```

## Reconnection Steps

1. **Add packages to dependencies:**
   ```bash
   bun add arweave @ardrive/turbo-sdk arweave-wallet-connector graphql graphql-request
   ```

2. **Include in build (config/tsconfig.app.json):**
   Remove `"../src/arweave/**/*"` from the exclude array.

3. **Implement StorageBackend interface:**
   See `src/arweave/StorageBackend.ts` for the interface definition.
   ```typescript
   import { StorageBackend } from '@/arweave/StorageBackend';

   class ArweaveBackend implements StorageBackend {
     // Implement all required methods
   }
   ```

4. **Enable feature flags:**
   ```typescript
   // In src/shared/config/features.ts
   FEATURE_FLAGS.WALLET_CONNECTION = true
   ```

5. **Restore wallet components:**
   - Copy back full implementations from src/arweave/frontend/
   - Restore ConnectWalletModal with wallet connector imports
   - Restore PublicPromptView with Arweave fetchPrompt

6. **Wire up backend switching:**
   ```typescript
   // In usePrompts.ts or App.tsx
   const backend = FEATURE_FLAGS.WALLET_CONNECTION
     ? new ArweaveBackend()
     : tursoQueries;
   ```

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `api/client.ts` | Main Arweave operations | ~960 |
| `api/collections.ts` | Collections sync | ~230 |
| `api/upload.ts` | Bundle uploads | ~300 |
| `services/wallets/*` | 4 wallet connectors | ~600 |
| `migration/arweave-to-turso.ts` | Data migration | ~300 |

## Dependencies Required

```json
{
  "arweave": "^1.15.7",
  "arweave-wallet-connector": "^1.0.2",
  "@ardrive/turbo-sdk": "^1.31.1"
}
```
