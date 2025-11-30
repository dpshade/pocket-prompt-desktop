# Deep Link Implementation

## Status: ✅ COMPLETE

## Last Updated: 2025-11-30

## Protocol

The app uses `pktprmpt://` as the deep link protocol scheme.

## Supported Deep Link Formats

| Type | Format | Example |
|------|--------|---------|
| Search | `pktprmpt://search?query=...&boolean=...` | `pktprmpt://search?query=test&boolean=tag:important` |
| Prompt | `pktprmpt://prompt/{id}` | `pktprmpt://prompt/abc123` |
| Collection | `pktprmpt://collection/{id}` | `pktprmpt://collection/my-saved-search` |
| Public | `pktprmpt://public/{txid}` | `pktprmpt://public/arweave-tx-id` |
| Shared | `pktprmpt://shared/{token}` | `pktprmpt://shared/share-token` |

### Query Parameters

For search deep links:
- `query` or `q` - Text search query
- `boolean` or `expr` - Boolean expression filter (e.g., `tag:example`)
- `archived=true` - Show archived prompts
- `duplicates=true` - Show duplicates only

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `src/frontend/utils/tauri-deep-link-loader.ts` | Lazy plugin loader for Tauri modules |
| `src/frontend/utils/protocolLinks.ts` | URL parsing and generation |
| `src/frontend/utils/deepLinks.ts` | Share link generation utilities |
| `src/frontend/App.tsx` | Deep link setup and application logic |
| `src-tauri/src/lib.rs` | Rust-side protocol handling |
| `src-tauri/tauri.conf.json` | Protocol scheme registration |

### Implementation Details

1. **Lazy Plugin Loading**: Tauri plugins are loaded lazily to avoid WebKit module resolution issues in the bundled app.

2. **setTimeout(0) Pattern**: The Tauri environment check is deferred using `setTimeout(0)` to ensure the Tauri runtime has initialized before checking for `__TAURI_INTERNALS__`.

3. **Mounting Guards**: All async operations check a `mounted` flag to prevent race conditions during component unmounting.

4. **Tauri v2 Detection**: Checks for both `__TAURI_INTERNALS__` (Tauri 2.x) and `__TAURI__` (legacy) globals.

5. **Immediate Search Application**: Search deep links are applied immediately without waiting for prompts to load, providing instant feedback.

## Testing

### macOS

```bash
# Build, install, and register protocol handler
bun run tauri:install-macos

# Test deep links
open "pktprmpt://search?query=test"
open "pktprmpt://prompt/some-id"
open "pktprmpt://search?query=hello&boolean=tag:example"
```

### Linux

```bash
# Build and install with desktop entry
bun run install-local

# Test deep links
xdg-open "pktprmpt://search?query=test"
```

### Debugging

Check LaunchServices registration on macOS:
```bash
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -B1 "pktprmpt:"
```

Unregister stale app builds:
```bash
lsregister -u "/path/to/old/Pocket Prompt.app"
```

### Console Log Prefixes

- `[App]` - Main app deep link handling
- `[ProtocolLinks]` - URL parsing
- `[TauriLoader]` - Plugin loading
- `[DeepLink]` - Rust-side logging

## Troubleshooting

### Deep links not working

1. **Check Tauri detection**: Look for `[App] Deep link setup - Tauri check:` in console
2. **Verify protocol registration**: Run `lsregister -dump | grep pktprmpt`
3. **Kill stale processes**: `pkill -f 'Pocket Prompt'` before reinstalling
4. **Rebuild and reinstall**: `bun run tauri:install-macos`

### Search not filtering

Search deep links apply immediately but filtering happens when prompts load. If prompts haven't loaded yet, the search query will be visible but results will appear once loading completes.

### Cold start vs warm start

- **Cold start**: App launched via deep link - handled by `getCurrent()` and `frontend_ready` command
- **Warm start**: App already running - handled by `onOpenUrl()` listener
