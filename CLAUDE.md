# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run install:all       # Install deps for both extension and Angular webview
npm run compile           # Type-check, lint, and bundle extension via esbuild
npm run build:webview     # Build Angular app (production) and copy output to dist/
npm run watch             # Watch mode (esbuild + tsc)
npm run lint              # ESLint on src/
npm run check-types       # tsc --noEmit
npm run check-sync        # Verify hand-mirrored types between src/ and sigrid-ext-app/ match
npm run compile-tests     # Compile extension tests to out/
npm run test              # Run extension tests via @vscode/test-cli (runs out/test/**/*.test.js)
npm run package           # Build a .vsix with vsce
```

`pretest` runs `compile-tests`, `compile`, `lint` and `check-sync` automatically.

Webview tests live in `sigrid-ext-app/`: `cd sigrid-ext-app && npm test` (Angular `ng test`).

To run the full build: `npm run install:all && npm run build:webview && npm run compile`.

Press **F5** in VS Code to launch the Extension Development Host.

## Architecture

This is a VS Code extension with two separate npm projects:
- **`src/`** — Extension host code (TypeScript, compiled to `dist/extension.js` via esbuild)
- **`sigrid-ext-app/`** — Angular 21 webview UI (built to `dist/sigrid-ext-app/browser/`). It has its own guidelines in `sigrid-ext-app/AGENTS.md` (standalone components, signals, OnPush, `input()`/`output()`, etc.).

The two projects share no source. A few small models are mirrored by hand (e.g. `issue-finding.ts`, `fix-findings-payload.ts`, the Sigrid API message types); `scripts/check-mirrored-types.js` fails when they drift, so run `npm run check-sync` after changing them.

### Extension Host (`src/`)

**`extension.ts`** is the entry point. On activation it runs migrations (`utilities/migrations.ts`: `customer` → `portfolioName`, plaintext secrets → SecretStorage), registers the secret set/clear commands, registers the `SigridPanel` `WebviewViewProvider` (view id `sigridView`), a status bar item, and the `sigrid-vscode.showFindings` command.

**`panels/sigrid-panel.ts`** (`SigridPanel`) is the core of the extension side. It:
- Loads the Angular app HTML/JS/CSS from `dist/sigrid-ext-app/browser/` with a nonce-based CSP (`connect-src` is limited to the webview origin, so the webview cannot call external APIs itself)
- Relays VS Code events (active editor changes, config changes, secret changes, AI agent detection) to the webview via `webview.postMessage()`
- Receives messages from the webview and dispatches them to command handlers

**`commands/`** implements the command pattern: each command is a class implementing `VsCodeCommand<T>` with a single `execute(data)` method. `command-registry.ts` maps command name strings to handler instances (initialize, openFile, openUrl, sigridApiRequest, createJiraIssue, createAzureDevOpsWorkItem, fixFindingsWithAi, checkSystemOnboarded, onboardSystem, etc.). The panel deserializes incoming webview messages and routes them here.

**`utilities/`** holds the supporting logic:
- `sigrid-api-client.ts` — performs Sigrid REST API calls on behalf of the webview (allow-listed resources and methods only), authenticating with the API key from SecretStorage
- `secrets.ts`, `scoped-secrets.ts`, `secret-commands.ts` — credential storage in VS Code `SecretStorage` (API key, Jira token, Azure DevOps PAT); secrets are never put in settings or sent to the webview
- `sigrid-ci-api.ts`, `zip-workspace.ts` — system onboarding via the Sigrid CI API
- `azure-devops-api.ts`, `url-validation.ts`, `configuration.ts`, and other helpers

**`ai-agents/`** hands "fix with AI" prompts to coding agents. `AiAgentProvider` is the adapter interface; `claude-code-provider.ts` and `copilot-chat-provider.ts` implement it, `ai-agent-registry.ts` tracks availability, `fix-prompt-builder.ts` builds the prompt, and `sigrid-mcp-detection.ts` checks whether the Sigrid MCP server is configured.

### Webview UI (`sigrid-ext-app/src/app/`)

Angular 21 standalone components, no NgModule. Feature components: `maintainability/`, `security/`, `open-source-health/`, plus `shared/` (dialogs for Jira/Azure DevOps, column filters). Key services in `services/`:
- **`SigridApi`** — Typed Sigrid API calls (findings, refactoring candidates, OSH dependencies, edit finding status). It does not use `HttpClient`; it delegates to `SigridApiTransport`.
- **`SigridApiTransport`** — Sends `sigridApiRequest` messages to the extension host and resolves them when the matching `sigridApiResponse` arrives (correlated by `requestId`, 60s timeout). `FakeSigridApiTransport` is the test double.
- **`SigridData`** — Manages findings state; `FindingFilter`/`FindingSelection` handle filtering (including by active file) and selection.
- **`VsCode`** — Bridge to extension host via `acquireVsCodeApi().postMessage()`.
- **`SigridConfiguration`** — Holds the configuration delivered by the extension.
- **`FixWithAi`, `AiAgents`, `SystemOnboarding`, `UsageStatistics`, `AzureDevOpsWorkItemTypes`** — Feature services backed by extension host commands.
- **`VsCommandRegistry`** (in `commands/`) — Handles messages incoming from the extension.

### Messaging Bridge

Webview → Extension: Angular calls `acquireVsCodeApi().postMessage({ command: string, data: T })`.
Extension → Webview: `webview.postMessage({ command: string, data: T })`.

The `initialize` command is sent on webview load, delivering non-secret config (portfolio, system, URLs, Jira/Azure DevOps settings, etc.) and the webview base URI needed for constructing asset URLs. Sigrid API traffic goes through `sigridApiRequest` / `sigridApiResponse` messages, never directly from the webview.

### Configuration

All settings live under the `sigrid-vscode` namespace (defined in `package.json` `contributes.configuration`). Key settings: `portfolioName` (replaces the deprecated `customer`), `system`, `subsystem`, `sigridUrl`, `claudeCodeHandoff`, `jiraBaseUrl`, `jiraUser`, `jiraSpaceKey`, `azureDevOpsOrganizationUrl`, `azureDevOpsProjectName`.

Credentials (API key, Jira token, Azure DevOps PAT) are **not** settings; they are stored in SecretStorage and managed via the `Sigrid: Set/Clear ...` commands.

### Testing

- Extension tests: Mocha via `@vscode/test-cli`, in `src/test/*.test.ts` (one file per command/utility, helpers in `test-helpers.ts`). They are compiled to `out/` first (`npm run compile-tests`); `.vscode-test.mjs` runs `out/test/**/*.test.js`.
- Webview tests: `*.spec.ts` next to the code in `sigrid-ext-app/`, run with `cd sigrid-ext-app && npm test`.
- CI (`.github/workflows/unittests.yml`) runs `npm audit --omit=dev` and the webview tests.

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
