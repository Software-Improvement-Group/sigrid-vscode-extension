import {WebviewApi} from 'vscode-webview';

class VSCodeApiWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  setState<T extends unknown | unknown>(state: T) {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(state);
    } else {
      localStorage.setItem('vscode-state', JSON.stringify(state));
      return state;
    }
  }

  getState(): unknown | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      const storedState = localStorage.getItem('vscode-state');
      return storedState ? JSON.parse(storedState) : undefined;
    }
  }
}

export const vscode = new VSCodeApiWrapper();
