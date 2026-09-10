export interface SystemOnboardStatusData {
  status: 'onboarded' | 'not-onboarded' | 'error';
  message?: string;
}
