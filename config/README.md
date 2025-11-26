# Configuration Files

This directory contains all configuration files for the Pocket Prompt UI application.

## Files

### Application Configuration
- `arweave.config.json` - Arweave network configuration including upload tags, query filters, and collection settings
- `arweave.config.schema.json` - JSON schema for validating arweave.config.json
- `.env.example` - Environment variables template

### Build & Development Configuration
- `eslint.config.js` - ESLint configuration for code linting
- `postcss.config.js` - PostCSS configuration with Tailwind CSS and Autoprefixer
- `tailwind.config.js` - Tailwind CSS configuration
- `vite.config.ts` - Vite build tool configuration
- `vitest.config.ts` - Vitest testing framework configuration

### TypeScript Configuration
- `tsconfig.json` - Root TypeScript configuration (references other configs)
- `tsconfig.app.json` - TypeScript configuration for application code
- `tsconfig.node.json` - TypeScript configuration for Node.js/build scripts

### Deployment Configuration
- `vercel.json` - Vercel deployment configuration

## Usage

These configuration files are imported by:
- `src/backend/config/arweave.ts` - Loads Arweave upload and query configuration
- `src/backend/api/collections.ts` - Uses configuration for collections upload
- Build scripts reference TypeScript and Vite configurations
- ESLint uses the linting configuration

## Schema Validation

The `arweave.config.schema.json` file provides validation rules for the Arweave configuration file. Use it with JSON schema validators to ensure configuration correctness.