import {ApplicationConfig, provideBrowserGlobalErrorListeners, CSP_NONCE} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {provide: CSP_NONCE, useValue: document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')}
  ]
};
