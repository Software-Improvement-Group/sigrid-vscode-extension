import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {SigridConfiguration} from '../services/sigrid-configuration';
import {SIGRID_API_BASE_URL} from '../utilities/constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(SIGRID_API_BASE_URL)) {
    const configuration = inject(SigridConfiguration);
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
