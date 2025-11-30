/**
 * Lazy loader for Tauri deep link plugin
 * Prevents WebKit module resolution issues by bundling statically
 * but loading lazily
 */

let deepLinkPlugin: typeof import('@tauri-apps/plugin-deep-link') | null = null;
let tauriApi: typeof import('@tauri-apps/api/event') | null = null;
let tauriCore: typeof import('@tauri-apps/api/core') | null = null;

export async function getDeepLinkPlugin() {
  if (!deepLinkPlugin) {
    try {
      deepLinkPlugin = await import('@tauri-apps/plugin-deep-link');
    } catch (error) {
      console.error('[TauriLoader] Failed to load deep-link plugin:', error);
      return null;
    }
  }
  return deepLinkPlugin;
}

export async function getTauriApi() {
  if (!tauriApi) {
    try {
      tauriApi = await import('@tauri-apps/api/event');
    } catch (error) {
      console.error('[TauriLoader] Failed to load Tauri API:', error);
      return null;
    }
  }
  return tauriApi;
}

export async function getTauriCore() {
  if (!tauriCore) {
    try {
      tauriCore = await import('@tauri-apps/api/core');
    } catch (error) {
      console.error('[TauriLoader] Failed to load Tauri Core:', error);
      return null;
    }
  }
  return tauriCore;
}

/**
 * Check if we're in a Tauri environment
 * Checks for both Tauri v2 (__TAURI_INTERNALS__) and legacy (__TAURI__)
 */
export function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}


