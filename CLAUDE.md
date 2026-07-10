# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run install:all       # Install deps for both extension and Angular webview
npm run compile           # Type-check, lint, and bundle extension via esbuild
npm run build:webview     # Build Angular app and copy output to dist/
npm run watch             # Watch mode (esbuild + tsc)
npm run lint              # ESLint on src/
npm run check-types       # tsc --noEmit
npm run test              # Run extension tests via @vscode/test-cli
npm run pretest           # Compile + lint before test run (runs automatically)
```

To run the full build: `npm run install:all && npm run build:webview && npm run compile`.

Press **F5** in VS Code to launch the Extension Development Host.

## Architecture

This is a VS Code extension with two separate npm projects:
- **`src/`** — Extension host code (TypeScript, compiled to `dist/extension.js` via esbuild)
- **`sigrid-ext-app/`** — Angular 21 webview UI (built to `dist/sigrid-ext-app/browser/`)

### Extension Host (`src/`)

**`extension.ts`** is the entry point. It registers a `WebviewViewProvider` (`SigridPanel`) and the `sigrid-vscode.showFindings` command.

**`panels/sigrid-panel.ts`** (`SigridPanel`) is the core of the extension side. It:
- Loads the Angular app HTML/JS/CSS from `dist/sigrid-ext-app/browser/`
- Relays VS Code events (active editor changes, config changes) to the webview via `webview.postMessage()`
- Receives messages from the webview and dispatches them to command handlers

**`commands/`** implements the command pattern: each command is a class implementing `VsCodeCommand<T>` with a single `execute(data)` method. `command-registry.ts` maps command name strings to handler instances. The panel deserializes incoming webview messages and routes them here.

### Webview UI (`sigrid-ext-app/src/app/`)

Angular 21 standalone components, no NgModule. Key services:
- **`SigridApi`** — HTTP calls to the Sigrid REST API (findings, refactoring candidates, OSH dependencies). Auth via Basic Auth interceptor using config from the extension.
- **`SigridData`** — Manages findings state; supports filtering by currently active file.
- **`VsCode`** — Bridge to extension host via `acquireVsCodeApi().postMessage()`.
- **`VsCommandRegistry`** — Handles messages incoming from the extension.

### Messaging Bridge

Webview → Extension: Angular calls `acquireVsCodeApi().postMessage({ command: string, data: T })`.
Extension → Webview: `webview.postMessage({ command: string, data: T })`.

The `initialize` command is sent on webview load, delivering config (API key, customer, system, etc.) and the webview base URI needed for constructing API URLs.

### Configuration

All settings live under the `sigrid-vscode` namespace (defined in `package.json` `contributes.configuration`). Key settings: `apiKey`, `customer`, `system`, `subsystem`, `sigridUrl`, `jiraBaseUrl`, `jiraUser`, `jiraToken`, `jiraSpaceKey`.

### Testing

Tests use Mocha via `@vscode/test-cli`. Currently the main test file is `src/test/create-jira-issue-command.test.ts`. There is no test-specific config file; tests are discovered via `.vscode-test.mjs`.

### Linting

ESLint 9 flat config in `eslint.config.mjs` using `typescript-eslint`. Enforces `naming-convention`, `curly`, `eqeqeq`, `no-throw-literal`, `semi`.

## Coding Standards

### 1. Method Length and Complexity
* **Rule**: Keep functions and methods short and focused.
* **Metric**: Maximum 25 lines of code per method (excluding comments and whitespace).
* **Action**: If a method exceeds this limit, refactor it by extracting smaller helper functions.
* **Principle**: Single Responsibility Principle (SRP) — each function must do only one thing.

### 2. Code Duplication
* **Rule**: Strictly adhere to the DRY (Don't Repeat Yourself) principle.
* **Action**: If the same logic is used two or more times, abstract it into a reusable function, utility class, or hook.
* **Review**: Scan the existing codebase or context before generating new helper functions to check for existing solutions.
