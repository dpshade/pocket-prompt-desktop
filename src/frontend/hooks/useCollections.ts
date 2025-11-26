import { useState, useEffect, useCallback } from 'react';
import type { SavedSearch } from '@/shared/types/prompt';

const STORAGE_KEY = 'pktpmt_saved_searches';

interface CollectionsState {
  collections: SavedSearch[];
  isLoading: boolean;
  error: string | null;
}

export interface UseCollectionsReturn {
  collections: SavedSearch[];
  isLoading: boolean;
  isSyncing: boolean; // Always false - kept for API compatibility
  lastSyncTxId: string | null; // Always null - kept for API compatibility
  error: string | null;
  addCollection: (collection: SavedSearch) => void;
  updateCollection: (collection: SavedSearch) => void;
  deleteCollection: (id: string) => void;
  syncFromNetwork: () => Promise<void>; // No-op - kept for API compatibility
  clearError: () => void;
}

/**
 * Hook for managing collections (localStorage only)
 * Network sync is disabled - collections are stored locally
 */
export function useCollections(
  _walletAddress?: string | null,
  _arweaveWallet?: unknown,
  _onUploadStart?: (txId: string, count: number) => void,
  _onUploadComplete?: (txId: string) => void,
  _onUploadError?: (error: string) => void
): UseCollectionsReturn {
  const [state, setState] = useState<CollectionsState>({
    collections: [],
    isLoading: true,
    error: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedSearch[];
        setState(prev => ({ ...prev, collections: parsed, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[useCollections] Failed to load from localStorage:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load collections from local storage',
      }));
    }
  }, []);

  /**
   * Save collections to localStorage
   */
  const persistCollections = useCallback((collections: SavedSearch[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  }, []);

  /**
   * Add a new collection
   */
  const addCollection = useCallback(
    (collection: SavedSearch) => {
      const updated = [...state.collections, collection];
      setState(prev => ({ ...prev, collections: updated }));
      persistCollections(updated);
    },
    [state.collections, persistCollections]
  );

  /**
   * Update an existing collection
   */
  const updateCollection = useCallback(
    (collection: SavedSearch) => {
      const updated = state.collections.map(c =>
        c.id === collection.id ? collection : c
      );
      setState(prev => ({ ...prev, collections: updated }));
      persistCollections(updated);
    },
    [state.collections, persistCollections]
  );

  /**
   * Delete a collection
   */
  const deleteCollection = useCallback(
    (id: string) => {
      const updated = state.collections.filter(c => c.id !== id);
      setState(prev => ({ ...prev, collections: updated }));
      persistCollections(updated);
    },
    [state.collections, persistCollections]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * No-op sync function (kept for API compatibility)
   */
  const syncFromNetwork = useCallback(async () => {
    // Network sync disabled - collections are local only
    console.log('[useCollections] Network sync disabled');
  }, []);

  return {
    collections: state.collections,
    isLoading: state.isLoading,
    isSyncing: false, // Always false
    lastSyncTxId: null, // Always null
    error: state.error,
    addCollection,
    updateCollection,
    deleteCollection,
    syncFromNetwork,
    clearError,
  };
}
