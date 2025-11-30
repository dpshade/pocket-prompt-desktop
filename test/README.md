# Test Files

This directory contains various test files and utilities for the Pocket Prompt UI application.

## Deep Link Testing

Located in `deep-links/` subdirectory:

| File | Purpose |
|------|---------|
| `debug-deep-link.sh` | Linux shell script for debugging deep link functionality |
| `test-deep-link-application.js` | Node.js script to test deep link parsing and application |
| `test-deep-link.html` | HTML page for testing web deep links in browser |
| `test-deep-link.js` | JavaScript test for URL parsing |

## Quick Test Commands

### macOS

```bash
# Install and register protocol handler
bun run tauri:install-macos

# Test search deep link
open "pktprmpt://search?query=test"

# Test prompt deep link
open "pktprmpt://prompt/your-prompt-id"

# Test with boolean expression
open "pktprmpt://search?query=hello&boolean=tag:example"
```

### Linux

```bash
# Install with desktop entry
bun run install-local

# Test deep links
xdg-open "pktprmpt://search?query=test"

# Debug protocol registration
./test/deep-links/debug-deep-link.sh
```

## Protocol Format

The app uses `pktprmpt://` as the deep link protocol.

Supported formats:
- `pktprmpt://search?query=...&boolean=...`
- `pktprmpt://prompt/{id}`
- `pktprmpt://collection/{id}`
- `pktprmpt://public/{txid}`
- `pktprmpt://shared/{token}`

## Documentation

For complete deep link documentation, see `docs/DEEP_LINK_TESTING_PENDING.md`.
