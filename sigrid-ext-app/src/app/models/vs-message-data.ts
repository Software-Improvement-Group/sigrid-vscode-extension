export class VsMessageData {
  text: string;
  severity: VsMessageSeverity;

  constructor(text: string, severity: VsMessageSeverity = VsMessageSeverity.Info) {
    this.text = text;
    this.severity = severity;
  }
}

export enum VsMessageSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}
