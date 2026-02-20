export interface MenuItem {
  label: string;
  description?: string;
  action: () => void;
}
