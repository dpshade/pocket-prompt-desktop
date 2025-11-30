# Archived Documentation

This directory contains documentation that is no longer applicable to the current version of Pocket Prompt but is preserved for historical reference.

## Why These Are Archived

Pocket Prompt pivoted from a cloud-sync Arweave-based architecture to a **local-first** desktop app using Turso (embedded libSQL). The Arweave integration code is preserved in `src/arweave/` but is not compiled into production builds.

## Archived Files

### NORTH_STAR.md
**Original purpose**: Business plan and product vision

**Why archived**: 
- References old name "Prompt Vault" (now "Pocket Prompt")
- Describes app as "Idea Phase" but we're at v0.1.8
- Revenue model has evolved

### UPLOAD_STRATEGIES.md
**Original purpose**: Comparison of Arweave batch upload strategies

**Why archived**: 
- Arweave integration is no longer in the active build
- Details signature requirements and wallet prompts that don't apply to local-first model

### FILE_SIZE_AND_FREE_TIER.md
**Original purpose**: Turbo SDK free tier optimization guide

**Why archived**: 
- Specific to Arweave/Turbo uploads
- Free tier concerns don't apply to local-only storage

## Current Documentation

For up-to-date documentation, see:
- **README.md** - Project overview, features, quick start
- **docs/AGENTS.md** - Development guidelines and architecture
- **docs/DEEP_LINK_TESTING_PENDING.md** - Deep link implementation
- **docs/ENCRYPTION_UI_GUIDE.md** - Encryption documentation
- **docs/MANUAL_TESTING.md** - Testing procedures

## Reconnecting Arweave

If Arweave integration is reactivated in the future, these documents may become relevant again. See `src/arweave/README.md` for reconnection steps.

