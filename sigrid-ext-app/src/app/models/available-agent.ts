/** An AI coding agent the extension host detected and can hand findings to. */
export interface AvailableAgent {
  id: string;
  label: string;
  mcpDetected: boolean;
}
