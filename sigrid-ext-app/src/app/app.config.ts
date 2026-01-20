import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './auth/auth.interceptor';
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeDataGrid,
  vsCodeDataGridCell,
  vsCodeDataGridRow, vsCodePanels, vsCodePanelTab, vsCodePanelView
} from '@vscode/webview-ui-toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};

provideVSCodeDesignSystem().register(
  vsCodePanels(),
  vsCodePanelTab(),
  vsCodePanelView(),
  vsCodeButton(),
  vsCodeDataGrid(),
  vsCodeDataGridRow(),
  vsCodeDataGridCell()
);
