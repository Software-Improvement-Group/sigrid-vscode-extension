# Change Log

All notable changes to the "sigrid-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.6] - 2026-04-01

### Fixed
- Resolved Windows path compatibility issue in workspace path detection (`getActiveWorkspace`) by using `uri.fsPath` instead of `uri.path`.

## [0.0.5] - 2026-03-30

### Changed
- Converted Sigrid panel from `WebviewPanel` to `WebviewView` and added panel-compatible icon support.

## [0.0.3] - 2026-03-25

### Added

- Keyboard navigation and focus management for findings tables with row selection support.
- Unit tests for `FindingNavigator` directive covering keyboard navigation and focus behavior.

### Changed

- Restyled tables to match VS Code table styles with sticky headers and consistent styling.
- Moved all action buttons to the last table column for improved UI consistency.
- Updated status table cell alignment and styling for maintainability and security views.

## [0.0.2] - 2026-03-16

### Added

- Inline edit functionality for findings in security and maintainability components.
- Reusable dialog system and "Edit Finding" dialog.
- Unit tests for `FindingEdit`, `SigridDialog`, and utility modules.

### Changed

- Updated dialog styling and form layout to match Visual Studio Code UX patterns.
- Added refresh of findings on successful edit.

## [0.0.1] - 2026-03-13

### Added

- Usage statistics reporting from the extension.
- Auto-refresh findings every 30 minutes with cleanup on destroy.
- File filtering support based on file paths, with UI integration.
- Reusable UI components: `IconButton`, `Tooltip`, `ExternalLink`.

### Changed

- Centralized SIGRID API base URL logic in `SigridConfiguration` and made `sigridUrl` configurable.
- Refactored command handling and data structures (e.g., `InitializeCommand`, `VsCodeCommandData`).
- Improved error handling and UI feedback for on-premise URL and other error states.

### Fixed

- Addressed tooltip timing issues to prevent "User aborted a request" console errors.
- Added unit tests to improve coverage of services and components (e.g., `SigridData`, `ExternalLink`).
