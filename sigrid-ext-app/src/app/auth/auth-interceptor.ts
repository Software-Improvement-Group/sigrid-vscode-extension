import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const configuration = inject(SigridConfiguration);
  if (req.url.startsWith(configuration.getSigridApiBaseUrl())) {
    const token = configuration.getConfiguration()()?.apiKey ?? '';
    if (token) {
      let request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(request);
    }

    return next(req);
  } else {
    return next(req);
  }
};
