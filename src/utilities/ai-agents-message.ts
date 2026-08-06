import { Webview } from "vscode";
import { getAvailableAgents } from "../ai-agents/ai-agent-registry";

/** Tells the webview which AI agents it can offer a "Fix it" handoff to. */
export function postAiAgentsDetectedMessage(webview: Webview) {
    webview.postMessage({ command: "aiAgentsDetected", data: getAvailableAgents() });
}
