// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SigridPanel } from './panels/sigrid-panel';
import { MetadataTreeProvider } from './tree-views/metadata-tree-provider';
import { EXTENSION_ID } from './extension.config';
import { migrateCustomerToPortfolioName } from './utilities/migrations';
import { clearStalePromptFiles, setStorageUri } from './utilities/extension-storage';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	migrateCustomerToPortfolioName();

	setStorageUri(context.globalStorageUri);
	clearStalePromptFiles();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(`Congratulations, your extension "${EXTENSION_ID}" is now active!`);

	// Register the Sigrid view provider
	const provider = new SigridPanel(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('sigridView', provider, {
		webviewOptions: { retainContextWhenHidden: true }
	}));

	// Register metadata tree provider
	const config = vscode.workspace.getConfiguration('sigrid-vscode');
	const apiKey = config.get<string>('apiKey');
	const sigridUrl = config.get<string>('sigridUrl') || 'https://sigrid-says.com';
	const portfolio = config.get<string>('portfolioName') || config.get<string>('customer');
	const system = config.get<string>('system');

	const metadataProvider = new MetadataTreeProvider(apiKey, sigridUrl, portfolio, system);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('sigridMetadataView', metadataProvider)
	);

	// Load metadata on startup if configuration is valid
	if (apiKey && portfolio && system) {
		metadataProvider.refresh();
	}

	// Create and show the status bar item for quick access to the Sigrid view
	context.subscriptions.push(createSigridStatusBarItem());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const showFindingsDisposable = vscode.commands.registerCommand(`${EXTENSION_ID}.showFindings`, () => {
		// Focus the Sigrid view
		vscode.commands.executeCommand('sigridView.focus');
	});

	context.subscriptions.push(showFindingsDisposable);

	// Metadata commands
	const showMetadataDisposable = vscode.commands.registerCommand(`${EXTENSION_ID}.showMetadata`, () => {
		metadataProvider.refresh();
		vscode.commands.executeCommand('sigridMetadataView.focus');
	});

	const refreshMetadataDisposable = vscode.commands.registerCommand(`${EXTENSION_ID}.refreshMetadata`, () => {
		metadataProvider.refresh();
	});

	const openMetadataEditorDisposable = vscode.commands.registerCommand(`${EXTENSION_ID}.openMetadataEditor`, () => {
		const editorConfig = vscode.workspace.getConfiguration('sigrid-vscode');
		const editorPortfolio = editorConfig.get<string>('portfolioName') || editorConfig.get<string>('customer');
		const editorSystem = editorConfig.get<string>('system');
		const editorSigridUrl = editorConfig.get<string>('sigridUrl') || 'https://sigrid-says.com';

		if (!editorPortfolio || !editorSystem) {
			vscode.window.showErrorMessage('Portfolio and system must be configured to open metadata editor.');
			return;
		}

		const url = `${editorSigridUrl}/${editorPortfolio}/${editorSystem}/-/settings/metadata`;
		vscode.env.openExternal(vscode.Uri.parse(url));
	});

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('sigrid-vscode.apiKey') ||
			e.affectsConfiguration('sigrid-vscode.portfolioName') ||
			e.affectsConfiguration('sigrid-vscode.customer') ||
			e.affectsConfiguration('sigrid-vscode.system') ||
			e.affectsConfiguration('sigrid-vscode.sigridUrl')) {
			const newConfig = vscode.workspace.getConfiguration('sigrid-vscode');
			const newApiKey = newConfig.get<string>('apiKey');
			const newSigridUrl = newConfig.get<string>('sigridUrl') || 'https://sigrid-says.com';
			const newPortfolio = newConfig.get<string>('portfolioName') || newConfig.get<string>('customer');
			const newSystem = newConfig.get<string>('system');
			metadataProvider.updateConfiguration(newApiKey, newSigridUrl, newPortfolio, newSystem);
			metadataProvider.refresh();
		}
	});

	context.subscriptions.push(showMetadataDisposable, refreshMetadataDisposable, openMetadataEditorDisposable, configChangeDisposable);
}

function createSigridStatusBarItem() {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
	statusBarItem.text = 'Sigrid';
	statusBarItem.tooltip = 'Show Sigrid Findings';
	statusBarItem.command = `${EXTENSION_ID}.showFindings`;
	statusBarItem.show();

	return statusBarItem;
}

// This method is called when your extension is deactivated
export function deactivate() { }
