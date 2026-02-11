import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', redirectTo: 'maintainability', pathMatch: 'full'},
  {
    path: 'maintainability',
    loadComponent: () => import('./maintainability/maintainability').then(m => m.Maintainability)
  },
  {
    path: 'security',
    loadComponent: () => import('./security/security').then(c => c.Security)
  },
  {
    path: 'open-source-health',
    loadComponent: () => import('./open-source-health/open-source-health').then(o => o.OpenSourceHealth)
  },
];
