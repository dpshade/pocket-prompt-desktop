/**
 * Deep Linking Utilities
 * Manages URL parameters for sharing app state
 */

import type { BooleanExpression } from '@/shared/types/prompt';
import { expressionToString, parseBooleanExpression } from '@/core/search/boolean';
import { generateProtocolUrl } from './protocolLinks';
import { isTauriEnvironment } from './tauri-deep-link-loader';

export interface DeepLinkParams {
  /** Search query text */
  q?: string;
  /** Boolean expression filter */
  expr?: string;
  /** Collection/saved search ID */
  collection?: string;
  /** Specific prompt ID to view */
  prompt?: string;
  /** Show archived prompts */
  archived?: boolean;
  /** Show duplicates only */
  duplicates?: boolean;
  /** Public prompt Arweave TxID (no wallet required) */
  txid?: string;
}

/**
 * Parse URL search parameters into DeepLinkParams
 */
export function parseDeepLink(): DeepLinkParams {
  const params = new URLSearchParams(window.location.search);

  return {
    q: params.get('q') || undefined,
    expr: params.get('expr') || undefined,
    collection: params.get('collection') || undefined,
    prompt: params.get('prompt') || undefined,
    archived: params.get('archived') === 'true',
    duplicates: params.get('duplicates') === 'true',
    txid: params.get('txid') || undefined,
  };
}

/**
 * Update URL with current app state (without page reload)
 */
export function updateDeepLink(params: DeepLinkParams): void {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams();

  // Add parameters if they exist
  if (params.q) searchParams.set('q', params.q);
  if (params.expr) searchParams.set('expr', params.expr);
  if (params.collection) searchParams.set('collection', params.collection);
  if (params.prompt) searchParams.set('prompt', params.prompt);
  if (params.archived) searchParams.set('archived', 'true');
  if (params.duplicates) searchParams.set('duplicates', 'true');
  if (params.txid) searchParams.set('txid', params.txid);

  // Update URL without reload
  const newUrl = searchParams.toString()
    ? `${url.pathname}?${searchParams.toString()}`
    : url.pathname;

  window.history.replaceState({}, '', newUrl);
}

/**
 * Clear all deep link parameters from URL
 */
export function clearDeepLink(): void {
  const url = new URL(window.location.href);
  window.history.replaceState({}, '', url.pathname);
}

/**
 * Generate a shareable URL for the current state
 */
export function generateShareableUrl(params: DeepLinkParams): string {
  const url = new URL(window.location.origin);
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.expr) searchParams.set('expr', params.expr);
  if (params.collection) searchParams.set('collection', params.collection);
  if (params.prompt) searchParams.set('prompt', params.prompt);
  if (params.archived) searchParams.set('archived', 'true');
  if (params.duplicates) searchParams.set('duplicates', 'true');
  if (params.txid) searchParams.set('txid', params.txid);

  return searchParams.toString()
    ? `${url.origin}/?${searchParams.toString()}`
    : url.origin;
}

/**
 * Convert BooleanExpression to URL-safe string
 */
export function expressionToUrlParam(expression: BooleanExpression): string {
  return encodeURIComponent(expressionToString(expression));
}

/**
 * Parse URL-safe string back to BooleanExpression
 */
export function urlParamToExpression(param: string): BooleanExpression | null {
  console.log('[DeepLinks] Parsing expression from URL param:', param);
  
  try {
    if (!param || typeof param !== 'string') {
      console.error('[DeepLinks] Invalid expression parameter:', typeof param);
      return null;
    }

    const decoded = decodeURIComponent(param);
    console.log('[DeepLinks] URL-decoded expression:', decoded);
    
    const expression = parseBooleanExpression(decoded);
    console.log('[DeepLinks] Successfully parsed expression:', expression);
    return expression;
  } catch (error) {
    console.error('[DeepLinks] Failed to parse expression from URL:', error, 'Original param:', param);
    return null;
  }
}

/**
 * Get a shareable link for a specific prompt
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getPromptShareLink(promptId: string, archived = false): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({ type: 'prompt', id: promptId, archived });
  }
  return generateShareableUrl({ prompt: promptId, archived });
}

/**
 * Get a shareable link for a search query
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getSearchShareLink(query: string, expression?: BooleanExpression): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({
      type: 'search',
      query,
      expression: expression ? expressionToString(expression) : undefined,
    });
  }
  return generateShareableUrl({
    q: query,
    expr: expression ? expressionToString(expression) : undefined,
  });
}

/**
 * Get a shareable link for a boolean expression filter
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getExpressionShareLink(expression: BooleanExpression): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({ type: 'search', expression: expressionToString(expression) });
  }
  return generateShareableUrl({ expr: expressionToString(expression) });
}

/**
 * Get a shareable link for a collection
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getCollectionShareLink(collectionId: string): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({ type: 'collection', id: collectionId });
  }
  return generateShareableUrl({ collection: collectionId });
}

/**
 * Get a public shareable link for a prompt by Arweave TxID
 * This link works without wallet connection for public prompts
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getPublicPromptShareLink(txId: string): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({ type: 'public', id: txId });
  }
  return generateShareableUrl({ txid: txId });
}

/**
 * Get a shareable link for a Turso shared prompt
 * Returns pktprmpt:// URL in Tauri, web URL otherwise
 */
export function getTursoSharedPromptLink(shareToken: string): string {
  if (isTauriEnvironment()) {
    return generateProtocolUrl({ type: 'shared', id: shareToken });
  }
  const url = new URL(window.location.origin);
  url.searchParams.set('share', shareToken);
  return url.toString();
}
