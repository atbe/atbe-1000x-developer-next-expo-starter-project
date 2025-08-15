# ESLint Setup for 1000x-developer Monorepo

## Overview

The monorepo uses a centralized ESLint configuration defined in `packages/tooling/eslint.config.js` that is used to lint TypeScript code across multiple packages.

## Configuration

### Main ESLint Config (`packages/tooling/eslint.config.js`)

The configuration includes:
- TypeScript support via `typescript-eslint`
- Modern ECMAScript features
- Node.js and browser globals
- Custom rules for code quality
- Special overrides for test files and logging utilities

### Key Rules

1. **TypeScript Rules:**
   - Enforces consistent type imports
   - Warns on explicit `any` usage
   - Allows unused variables with `_` prefix

2. **General Rules:**
   - Restricts console usage (except warn, error, info)
   - Enforces `const` over `let` when possible
   - Requires template literals over string concatenation
   - Enforces object shorthand syntax

3. **Special Overrides:**
   - Test files: Allows `any` and all console methods
   - Logging files: Allows all console methods

## Usage

### Running Lint

```bash
# Check for lint errors
task lint
# or
bun run lint

# Fix auto-fixable errors
task lint:fix
# or
bun run lint:fix
```

### Adding to New Packages

When adding a new package that should be linted:

1. Update `package.json` scripts to include the new package:
   ```json
   "lint": "eslint packages/api packages/tooling packages/new-package"
   ```

2. Ensure the package has `"type": "module"` in its `package.json`

3. The package will automatically use the shared ESLint configuration

## File Structure

```
/
├── eslint.config.js          # Root config that imports tooling config
├── package.json              # Contains lint scripts
├── Taskfile.yaml            # Task runner with lint commands
└── packages/
    └── tooling/
        └── eslint.config.js  # Main ESLint configuration
```