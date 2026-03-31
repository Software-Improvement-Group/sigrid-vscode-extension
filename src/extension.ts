// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SigridPanel } from './panels/sigrid-panel';
import { EXTENSION_ID } from './extension.config';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(`Congratulations, your extension "${EXTENSION_ID}" is now active!`);

	// Register the Sigrid view provider
	const provider = new SigridPanel(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('sigridView', provider, {
		webviewOptions: { retainContextWhenHidden: true }
	}));

	// Create and show the status bar item for quick access to the Sigrid view
	context.subscriptions.push(createSigridStatusBarItem());

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand(`${EXTENSION_ID}.showFindings`, () => {
		// Focus the Sigrid view
		vscode.commands.executeCommand('sigridView.focus');
	});

	context.subscriptions.push(disposable);
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
