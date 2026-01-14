import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'maintainability', pathMatch: 'full' },
  { path: 'maintainability', loadComponent: () => import('./maintainability/maintainability').then(m => m.Maintainability) }
];
