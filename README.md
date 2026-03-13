# Sigrid (Visual Studio Code)

A Visual Studio Code extension that brings Sigrid findings directly into your editor via a lightweight dashboard.

> 🚀 Use the **Sigrid: Show Findings** command to open an interactive webview panel with security, maintainability, and other findings powered by your Sigrid account.

---

## ✅ Features

- **View Sigrid findings in VS Code** without leaving your editor
- **Interactive dashboard** with filtering and navigation support
- **Deep link** from findings to the Sigrid web UI
- **Configurable Sigrid instance URL** (supports self-hosted deployments)

---

## ⚙️ Requirements

This extension requires a valid Sigrid account and API credentials.

You will need:

1. A **Sigrid API Key**
2. Your **Sigrid Customer ID**
3. Your **Sigrid System ID**

If you don’t have these values, contact your Sigrid administrator or refer to your Sigrid documentation.

---

## 🚀 Getting Started

1. Install the extension in VS Code.
2. Open **Settings** and set the following configuration values:
   - `sigrid-vscode.apiKey` – your Sigrid API key
   - `sigrid-vscode.customer` – your Sigrid customer ID
   - `sigrid-vscode.system` – your Sigrid system ID
   - `sigrid-vscode.sigridUrl` – (optional) your Sigrid instance URL. Defaults to `https://sigrid-says.com`.
3. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run:
   - **Sigrid: Show Findings**

---

## 🧩 Extension Settings

This extension contributes the following settings:

| Setting | Description |
|--------|-------------|
| `sigrid-vscode.apiKey` | Your Sigrid API Key. |
| `sigrid-vscode.customer` | Your Sigrid Customer ID. |
| `sigrid-vscode.system` | Your Sigrid System ID. |
| `sigrid-vscode.sigridUrl` | The URL of your Sigrid instance (default: `https://sigrid-says.com`). |

---

## 🛠 Development

To build and test the extension locally:

```bash
npm install
npm run build:webview
npm run compile
```

To start a watch build while developing:

```bash
npm run watch
```

To run the extension in VS Code for debugging:

1. Open this repository in VS Code.
2. Press `F5` to start the Extension Development Host.

---

## 🐞 Known Issues

- If the panel stays blank, verify that your API credentials are correct and that your network allows requests to your Sigrid instance.

---

## 📄 Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for a full history of changes.

---

## 📚 More Information

* [VS Code Extension API](https://code.visualstudio.com/api)
* [Sigrid documentation](https://sigrid-says.com)
