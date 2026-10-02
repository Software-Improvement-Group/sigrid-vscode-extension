import {ApplicationConfig, provideBrowserGlobalErrorListeners, CSP_NONCE} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {provide: CSP_NONCE, useValue: document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')}
  ]
};
