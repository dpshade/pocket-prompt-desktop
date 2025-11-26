/**
 * Storage Backend Interfaces
 *
 * These interfaces define the contracts for storage backends in Pocket Prompt.
 * The app supports multiple storage strategies:
 *
 * 1. Local-first (current): Turso SQLite for offline-capable storage
 * 2. Cloud sync (future): Turso cloud with automatic sync
 * 3. Arweave (segregated): Permanent, decentralized storage
 *
 * All backends should implement these interfaces for seamless switching.
 */

import type { Prompt, PromptVersion, SavedSearch } from '@/shared/types/prompt';

// =============================================================================
// Core Types
// =============================================================================

export interface User {
  id: string;
  /** Wallet address (Arweave) or device ID (Turso) */
  identifier: string;
  /** Display name (optional) */
  displayName?: string;
  /** Email for cloud sync (optional) */
  email?: string;
  createdAt: number;
  lastSeenAt: number;
}

export interface SyncStatus {
  /** Whether sync is currently in progress */
  syncing: boolean;
  /** Last successful sync timestamp */
  lastSyncAt: number | null;
  /** Number of pending local changes */
  pendingChanges: number;
  /** Any sync error message */
  error: string | null;
}

export interface ConflictResolution {
  /** Which version to keep: local, remote, or merge */
  strategy: 'local' | 'remote' | 'merge';
  /** For merge strategy: the merged content */
  mergedContent?: string;
}

// =============================================================================
// Prompt Operations
// =============================================================================

export interface CreatePromptData {
  id?: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

export interface UpdatePromptData {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
}

export interface PromptStorage {
  /** Get all prompts for a user */
  getPromptsByUserId(userId: string, options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Prompt[]>;

  /** Get a single prompt by ID */
  getPromptById(promptId: string): Promise<Prompt | null>;

  /** Create a new prompt */
  createPrompt(userId: string, data: CreatePromptData): Promise<Prompt>;

  /** Update an existing prompt */
  updatePrompt(promptId: string, updates: UpdatePromptData, changeNote?: string): Promise<Prompt | null>;

  /** Archive a prompt (soft delete) */
  archivePrompt(promptId: string): Promise<void>;

  /** Restore an archived prompt */
  restorePrompt(promptId: string): Promise<void>;

  /** Permanently delete a prompt */
  deletePrompt(promptId: string): Promise<void>;

  /** Search prompts by text query */
  searchPrompts?(userId: string, query: string): Promise<Prompt[]>;
}

// =============================================================================
// Version History
// =============================================================================

export interface VersionStorage {
  /** Get version history for a prompt */
  getVersionHistory(promptId: string): Promise<PromptVersion[]>;

  /** Get content of a specific version */
  getVersionContent(versionId: string): Promise<string | null>;

  /** Restore a prompt to a specific version */
  restoreVersion(promptId: string, versionId: string): Promise<Prompt | null>;
}

// =============================================================================
// Tags
// =============================================================================

export interface TagStorage {
  /** Get tags for a prompt */
  getTagsByPromptId(promptId: string): Promise<string[]>;

  /** Set tags for a prompt (replaces existing) */
  setPromptTags(promptId: string, tags: string[]): Promise<void>;

  /** Get all unique tags for a user */
  getAllUserTags(userId: string): Promise<string[]>;

  /** Rename a tag across all prompts */
  renameTag?(userId: string, oldName: string, newName: string): Promise<number>;

  /** Delete a tag from all prompts */
  deleteTag?(userId: string, tagName: string): Promise<number>;
}

// =============================================================================
// Saved Searches (Collections)
// =============================================================================

export interface SavedSearchStorage {
  /** Get all saved searches for a user */
  getSavedSearches(userId: string): Promise<SavedSearch[]>;

  /** Save a search (create or update) */
  saveSavedSearch(userId: string, search: SavedSearch): Promise<void>;

  /** Delete a saved search */
  deleteSavedSearch(searchId: string): Promise<void>;
}

// =============================================================================
// Sharing
// =============================================================================

export interface ShareToken {
  token: string;
  promptId: string;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  /** Whether the shared version is a snapshot or live */
  isSnapshot: boolean;
}

export interface SharingStorage {
  /** Generate a share token for a prompt */
  generateShareToken(promptId: string, options?: {
    expiresIn?: number; // milliseconds
    isSnapshot?: boolean;
  }): Promise<string>;

  /** Get a prompt by its share token */
  getPromptByShareToken(shareToken: string): Promise<Prompt | null>;

  /** Get share token metadata */
  getShareToken(promptId: string): Promise<ShareToken | null>;

  /** Remove share token (make private) */
  removeShareToken(promptId: string): Promise<void>;

  /** List all shared prompts for a user */
  getSharedPrompts?(userId: string): Promise<Prompt[]>;
}

// =============================================================================
// Packs (Prompt Collections/Bundles)
// =============================================================================

export interface Pack {
  id: string;
  name: string;
  description: string;
  /** User who created the pack */
  ownerId: string;
  /** IDs of prompts in this pack */
  promptIds: string[];
  /** Pack visibility */
  visibility: 'private' | 'shared' | 'public';
  /** Share token if shared */
  shareToken?: string;
  /** Tags for categorizing packs */
  tags: string[];
  /** Cover image URL */
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePackData {
  name: string;
  description: string;
  promptIds: string[];
  tags?: string[];
  visibility?: 'private' | 'shared' | 'public';
  coverImage?: string;
}

export interface PackStorage {
  /** Get all packs for a user */
  getPacksByUserId(userId: string): Promise<Pack[]>;

  /** Get a single pack by ID */
  getPackById(packId: string): Promise<Pack | null>;

  /** Create a new pack */
  createPack(userId: string, data: CreatePackData): Promise<Pack>;

  /** Update a pack */
  updatePack(packId: string, updates: Partial<CreatePackData>): Promise<Pack | null>;

  /** Delete a pack (doesn't delete prompts) */
  deletePack(packId: string): Promise<void>;

  /** Add prompts to a pack */
  addPromptsToPack(packId: string, promptIds: string[]): Promise<void>;

  /** Remove prompts from a pack */
  removePromptsFromPack(packId: string, promptIds: string[]): Promise<void>;

  /** Share a pack */
  sharePack(packId: string): Promise<string>; // Returns share token

  /** Get a pack by share token */
  getPackByShareToken(shareToken: string): Promise<Pack | null>;

  /** Import a shared pack (copy prompts to user's library) */
  importPack(userId: string, shareToken: string): Promise<Pack>;

  /** Unshare a pack */
  unsharePack(packId: string): Promise<void>;
}

// =============================================================================
// Cloud Sync
// =============================================================================

export interface SyncStorage {
  /** Get current sync status */
  getSyncStatus(): SyncStatus;

  /** Trigger a manual sync */
  sync(): Promise<void>;

  /** Enable/disable auto-sync */
  setAutoSync(enabled: boolean): void;

  /** Handle sync conflicts */
  resolveConflict(promptId: string, resolution: ConflictResolution): Promise<void>;

  /** Get list of conflicts needing resolution */
  getConflicts(): Promise<Array<{
    promptId: string;
    localVersion: Prompt;
    remoteVersion: Prompt;
  }>>;

  /** Subscribe to sync status changes */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void;
}

// =============================================================================
// Combined Backend Interface
// =============================================================================

export interface StorageBackend extends
  PromptStorage,
  VersionStorage,
  TagStorage,
  SavedSearchStorage {

  /** Initialize the storage backend */
  initialize(): Promise<void>;

  /** Check if the backend is ready */
  isReady(): boolean;

  /** Get or create a user */
  getOrCreateUser(identifier: string): Promise<User>;

  /** Update user's last seen timestamp */
  updateLastSeen(userId: string): Promise<void>;

  /** Sharing operations (optional) */
  sharing?: SharingStorage;

  /** Pack operations (optional) */
  packs?: PackStorage;

  /** Cloud sync operations (optional) */
  sync?: SyncStorage;

  /** Clean up resources */
  dispose?(): Promise<void>;
}

// =============================================================================
// Backend Factory
// =============================================================================

export type BackendType = 'turso-local' | 'turso-cloud' | 'arweave';

export interface BackendConfig {
  type: BackendType;
  /** Turso database URL for cloud sync */
  tursoUrl?: string;
  /** Turso auth token */
  tursoToken?: string;
  /** Arweave gateway URL */
  arweaveGateway?: string;
  /** Enable offline support */
  offlineSupport?: boolean;
}

/**
 * Factory function to create a storage backend
 * based on configuration
 */
export function createStorageBackend(config: BackendConfig): StorageBackend {
  switch (config.type) {
    case 'turso-local':
      // Return local Turso backend (current implementation)
      throw new Error('Use turso-queries directly for local backend');

    case 'turso-cloud':
      // Future: Return cloud-synced Turso backend
      throw new Error('Turso cloud backend not yet implemented');

    case 'arweave':
      // Future: Return Arweave backend (from src/arweave/)
      throw new Error('Arweave backend segregated - see src/arweave/README.md');

    default:
      throw new Error(`Unknown backend type: ${config.type}`);
  }
}
