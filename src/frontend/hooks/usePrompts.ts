import { create } from 'zustand';
import type { Prompt, PromptMetadata, BooleanExpression, SavedSearch } from '@/shared/types/prompt';
import { getCachedPrompts, cachePrompt, addPromptToProfile, archivePrompt as archivePromptStorage, restorePrompt as restorePromptStorage } from '@/core/storage/cache';
import { indexPrompts, addToIndex, removeFromIndex } from '@/core/search';
import { getDeviceId } from '@/core/identity/device';
import * as tursoQueries from '@/backend/api/turso-queries';

// Notification callbacks for upload tracking
export type UploadStartCallback = (txId: string, title: string) => void;
export type UploadCompleteCallback = (txId: string) => void;

interface PromptsState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedTags: string[];
  booleanExpression: BooleanExpression | null;
  activeSavedSearch: SavedSearch | null;
  onUploadStart?: UploadStartCallback;
  onUploadComplete?: UploadCompleteCallback;

  loadPrompts: (password?: string) => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>, password?: string) => Promise<boolean>;
  updatePrompt: (id: string, updates: Partial<Prompt>, password?: string) => Promise<boolean>;
  archivePrompt: (id: string, password?: string) => Promise<void>;
  restorePrompt: (id: string, password?: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  setBooleanExpression: (expression: BooleanExpression | null, textQuery?: string) => void;
  loadSavedSearch: (search: SavedSearch) => void;
  clearBooleanSearch: () => void;
  setUploadCallbacks: (onStart?: UploadStartCallback, onComplete?: UploadCompleteCallback) => void;
}

export const usePrompts = create<PromptsState>((set, get) => ({
  prompts: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedTags: [],
  booleanExpression: null,
  activeSavedSearch: null,
  onUploadStart: undefined,
  onUploadComplete: undefined,

  loadPrompts: async (_password?: string) => {
    return loadPromptsFromTurso(set, get);
  },

  addPrompt: async (promptData, _password?: string) => {
    return addPromptToTurso(set, get, promptData);
  },

  updatePrompt: async (id, updates, _password?: string) => {
    return updatePromptInTurso(set, get, id, updates);
  },

  archivePrompt: async (id, _password?: string) => {
    return archivePromptInTurso(set, get, id);
  },

  restorePrompt: async (id, _password?: string) => {
    return restorePromptInTurso(set, get, id);
  },

  setSearchQuery: (query) => {
    console.log('[UsePrompts] Setting search query:', query, 'previous query:', get().searchQuery);
    set({ searchQuery: query });
    console.log('[UsePrompts] Search query updated, new state:', { 
      query: get().searchQuery, 
      hasExpression: !!get().booleanExpression,
      promptsCount: get().prompts.length 
    });
    console.log('[UsePrompts] setSearchQuery completed, state should trigger re-render');
  },

  toggleTag: (tag) => {
    set(state => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter(t => t !== tag)
        : [...state.selectedTags, tag],
    }));
  },

  clearFilters: () => {
    set({ searchQuery: '', selectedTags: [], booleanExpression: null, activeSavedSearch: null });
  },

  setBooleanExpression: (expression, textQuery) => {
    console.log('[UsePrompts] Setting boolean expression:', expression, 'text query:', textQuery);
    const previousState = {
      expression: get().booleanExpression,
      query: get().searchQuery,
      tags: get().selectedTags
    };
    
    set({
      booleanExpression: expression,
      searchQuery: textQuery || '',
      selectedTags: [], // Clear simple tag filters when using boolean
      activeSavedSearch: null, // Clear active saved search if manually setting expression
    });
    
    console.log('[UsePrompts] Boolean expression updated:', {
      previous: previousState,
      new: {
        expression: get().booleanExpression,
        query: get().searchQuery,
        tags: get().selectedTags,
        activeSavedSearch: get().activeSavedSearch
      }
    });
    console.log('[UsePrompts] setBooleanExpression completed, state should trigger re-render');
  },

  loadSavedSearch: (search) => {
    set({
      booleanExpression: search.expression,
      searchQuery: search.textQuery || '',
      selectedTags: [], // Clear simple tag filters
      activeSavedSearch: search,
    });
  },

  clearBooleanSearch: () => {
    set({ booleanExpression: null, activeSavedSearch: null });
  },

  setUploadCallbacks: (onStart, onComplete) => {
    set({ onUploadStart: onStart, onUploadComplete: onComplete });
  },
}));

// =============================================================================
// Turso Backend Implementation
// =============================================================================

type SetState = (partial: Partial<PromptsState> | ((state: PromptsState) => Partial<PromptsState>)) => void;
type GetState = () => PromptsState;

async function loadPromptsFromTurso(set: SetState, _get: GetState): Promise<void> {
  set({ loading: true, error: null });

  try {
    const deviceId = getDeviceId();
    const user = await tursoQueries.getOrCreateUser(deviceId);

    console.log('Loading prompts from Turso for user:', user.id);

    // Fetch all prompts (including archived for now, filter in UI)
    const prompts = await tursoQueries.getPromptsByUserId(user.id, { includeArchived: true });

    console.log(`Loaded ${prompts.length} prompts from Turso`);

    // Cache locally for offline access
    prompts.forEach(p => cachePrompt(p));

    // Index for search
    indexPrompts(prompts);

    set({ prompts, loading: false });
  } catch (error) {
    console.error('Load prompts error (Turso):', error);

    // Fall back to cache on error
    const cached = getCachedPrompts();
    const cachedPrompts = Object.values(cached);
    indexPrompts(cachedPrompts);

    set({
      prompts: cachedPrompts,
      loading: false,
      error: 'Failed to sync with server. Showing cached data.',
    });
  }
}

async function addPromptToTurso(
  set: SetState,
  get: GetState,
  promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>
): Promise<boolean> {
  try {
    const deviceId = getDeviceId();
    const user = await tursoQueries.getOrCreateUser(deviceId);

    const prompt = await tursoQueries.createPrompt(user.id, {
      title: promptData.title,
      description: promptData.description,
      content: promptData.content,
      tags: promptData.tags,
    });

    // Cache locally
    cachePrompt(prompt);

    // Update profile metadata
    const metadata: PromptMetadata = {
      id: prompt.id,
      title: prompt.title,
      tags: prompt.tags,
      currentTxId: prompt.currentTxId,
      updatedAt: prompt.updatedAt,
      isArchived: false,
    };
    addPromptToProfile(metadata);

    // Add to index and state
    addToIndex(prompt);
    set(state => ({ prompts: [prompt, ...state.prompts] }));

    // Notify if callback set (for UI feedback)
    const { onUploadStart } = get();
    if (onUploadStart) {
      onUploadStart(prompt.id, prompt.title);
    }

    return true;
  } catch (error) {
    console.error('Add prompt error (Turso):', error);
    set({ error: 'Failed to create prompt' });
    return false;
  }
}

async function updatePromptInTurso(
  set: SetState,
  get: GetState,
  id: string,
  updates: Partial<Prompt>
): Promise<boolean> {
  try {
    const state = get();
    const existingPrompt = state.prompts.find(p => p.id === id);
    if (!existingPrompt) {
      throw new Error('Prompt not found');
    }

    const changeNote = updates.content !== existingPrompt.content
      ? 'Content updated'
      : 'Metadata updated';

    const updatedPrompt = await tursoQueries.updatePrompt(id, {
      title: updates.title,
      description: updates.description,
      content: updates.content,
      tags: updates.tags,
    }, changeNote);

    if (!updatedPrompt) {
      throw new Error('Update failed');
    }

    // Cache locally
    cachePrompt(updatedPrompt);

    // Update profile metadata
    const metadata: PromptMetadata = {
      id: updatedPrompt.id,
      title: updatedPrompt.title,
      tags: updatedPrompt.tags,
      currentTxId: updatedPrompt.currentTxId,
      updatedAt: updatedPrompt.updatedAt,
      isArchived: updatedPrompt.isArchived,
    };
    addPromptToProfile(metadata);

    // Update index and state
    addToIndex(updatedPrompt);
    set(state => ({
      prompts: state.prompts.map(p => p.id === id ? updatedPrompt : p),
    }));

    return true;
  } catch (error) {
    console.error('Update prompt error (Turso):', error);
    set({ error: 'Failed to update prompt' });
    return false;
  }
}

async function archivePromptInTurso(set: SetState, get: GetState, id: string): Promise<void> {
  const prompt = get().prompts.find(p => p.id === id);
  if (!prompt) return;

  // Optimistically update UI
  archivePromptStorage(id);
  removeFromIndex(id);
  set(state => ({
    prompts: state.prompts.map(p =>
      p.id === id ? { ...p, isArchived: true } : p
    ),
  }));

  try {
    await tursoQueries.archivePrompt(id);
  } catch (error) {
    console.error('Failed to archive prompt in Turso:', error);
    // UI already updated optimistically
  }
}

async function restorePromptInTurso(set: SetState, get: GetState, id: string): Promise<void> {
  const prompt = get().prompts.find(p => p.id === id);
  if (!prompt) return;

  // Optimistically update UI
  restorePromptStorage(id);
  addToIndex({ ...prompt, isArchived: false });
  set(state => ({
    prompts: state.prompts.map(p =>
      p.id === id ? { ...p, isArchived: false } : p
    ),
  }));

  try {
    await tursoQueries.restorePrompt(id);
  } catch (error) {
    console.error('Failed to restore prompt in Turso:', error);
    // UI already updated optimistically
  }
}

