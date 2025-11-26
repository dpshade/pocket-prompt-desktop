/**
 * Protocol URL Handler for Tauri Deep Links
 * Parses `promptvault://` URLs into app state parameters
 */

export interface ProtocolLinkParams {
  type: 'prompt' | 'collection' | 'search' | 'public' | 'shared' | 'home';
  id?: string;
  query?: string;
  expression?: string;
  archived?: boolean;
  duplicates?: boolean;
}

/**
 * Parse a promptvault:// protocol URL into structured parameters
 */
export function parseProtocolUrl(url: string): ProtocolLinkParams {
  console.log('[ProtocolLinks] Parsing URL:', url);
  
  try {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      console.error('[ProtocolLinks] Invalid URL format:', typeof url);
      return { type: 'home' };
    }

    if (!url.startsWith('promptvault://') && !url.startsWith('promptvault:')) {
      console.error('[ProtocolLinks] URL does not start with promptvault protocol:', url.substring(0, 20));
      return { type: 'home' };
    }

    console.log('[ProtocolLinks] URL validation passed, attempting to parse with URL constructor...');
    const parsed = new URL(url);
    console.log('[ProtocolLinks] URL parsed successfully:', {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search
    });

    // Handle both promptvault://path and promptvault:path formats
    // Check both pathname and hostname for path segments (URL constructor puts first segment in hostname)
    const pathname = parsed.pathname.replace(/^\/\//, '').replace(/^\//, '');
    const hostnameSegment = parsed.hostname !== 'search' ? parsed.hostname : '';
    const allSegments = [hostnameSegment, ...pathname.split('/').filter(Boolean)];
    const segments = allSegments.filter(Boolean);
    const params = new URLSearchParams(parsed.search);

    console.log('[ProtocolLinks] Extracted path segments:', segments);
    console.log('[ProtocolLinks] Extracted search params:', Object.fromEntries(params.entries()));

    // promptvault://prompt/{id}
    if (segments[0] === 'prompt' && segments[1]) {
      const result = {
        type: 'prompt' as const,
        id: segments[1],
        archived: params.get('archived') === 'true',
      };
      console.log('[ProtocolLinks] Parsed prompt URL:', result);
      return result;
    }

    // promptvault://collection/{id}
    if (segments[0] === 'collection' && segments[1]) {
      const result = { type: 'collection' as const, id: segments[1] };
      console.log('[ProtocolLinks] Parsed collection URL:', result);
      return result;
    }

    // promptvault://search?query=...&boolean=... (support both old and new parameter names)
    if (segments[0] === 'search' || params.has('q') || params.has('query') || params.has('expr') || params.has('boolean')) {
      const result = {
        type: 'search' as const,
        query: params.get('query') || params.get('q') || undefined,
        expression: params.get('boolean') || params.get('expr') || undefined,
        archived: params.get('archived') === 'true',
        duplicates: params.get('duplicates') === 'true',
      };
      console.log('[ProtocolLinks] Parsed search URL:', result);
      return result;
    }

    // promptvault://public/{txid}
    if (segments[0] === 'public' && segments[1]) {
      const result = { type: 'public' as const, id: segments[1] };
      console.log('[ProtocolLinks] Parsed public URL:', result);
      return result;
    }

    // promptvault://shared/{token}
    if (segments[0] === 'shared' && segments[1]) {
      const result = { type: 'shared' as const, id: segments[1] };
      console.log('[ProtocolLinks] Parsed shared URL:', result);
      return result;
    }

    console.log('[ProtocolLinks] No matching pattern found, defaulting to home');
    return { type: 'home' };
  } catch (error) {
    console.error('[ProtocolLinks] Failed to parse protocol URL:', error, 'URL was:', url);
    return { type: 'home' };
  }
}

/**
 * Generate a promptvault:// protocol URL from parameters
 */
export function generateProtocolUrl(params: ProtocolLinkParams): string {
  const base = 'promptvault://';
  const searchParams = new URLSearchParams();

  switch (params.type) {
    case 'prompt':
      if (params.archived) searchParams.set('archived', 'true');
      return `${base}prompt/${params.id}${searchParams.toString() ? '?' + searchParams : ''}`;
    case 'collection':
      return `${base}collection/${params.id}`;
    case 'search':
      if (params.query) searchParams.set('query', params.query);
      if (params.expression) searchParams.set('boolean', params.expression);
      if (params.archived) searchParams.set('archived', 'true');
      if (params.duplicates) searchParams.set('duplicates', 'true');
      return `${base}search?${searchParams}`;
    case 'public':
      return `${base}public/${params.id}`;
    case 'shared':
      return `${base}shared/${params.id}`;
    default:
      return base;
  }
}

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
