/**
 * Arweave Storage Backend
 *
 * This file provides guidance for implementing an Arweave-compatible
 * storage backend using the shared StorageBackend interface.
 *
 * @see src/shared/interfaces/StorageBackend.ts for the interface definition
 */

export type {
  StorageBackend,
  PromptStorage,
  VersionStorage,
  TagStorage,
  SavedSearchStorage,
  SharingStorage,
  PackStorage,
  SyncStorage,
  User,
  Pack,
  ShareToken,
  SyncStatus,
  BackendConfig,
} from '@/shared/interfaces/StorageBackend';

/**
 * Implementation Notes for ArweaveBackend
 *
 * To implement an Arweave storage backend:
 *
 * 1. User identity: Use wallet address as identifier
 *    ```typescript
 *    async getOrCreateUser(walletAddress: string): Promise<User> {
 *      // Query Arweave for existing user profile
 *      // Or create new profile transaction
 *    }
 *    ```
 *
 * 2. Prompt storage: Use GraphQL queries + Turbo uploads
 *    ```typescript
 *    async createPrompt(userId, data): Promise<Prompt> {
 *      // Sign and upload via TurboFactory
 *      // Return with txId as the prompt ID
 *    }
 *    ```
 *
 * 3. Version history: Query by prompt ID tag
 *    ```typescript
 *    async getVersionHistory(promptId): Promise<PromptVersion[]> {
 *      // GraphQL query for all txs with Prompt-ID tag
 *    }
 *    ```
 *
 * 4. Sharing: Public prompts have "public" tag
 *    - No share tokens needed (txId is the share link)
 *    - Encrypted prompts require wallet signature to decrypt
 *
 * 5. Packs: Use bundle transactions
 *    - Pack metadata transaction references prompt txIds
 *    - Can use ANS-110 standard for discoverability
 *
 * 6. Sync: Arweave is eventually consistent
 *    - Local cache for pending transactions
 *    - Poll for confirmation status
 *    - No conflicts (append-only)
 */

// Re-export existing Arweave API functions for implementation reference
export * from './api/client';
export * from './api/upload';
export * from './api/collections';
export * from './config/arweave';
