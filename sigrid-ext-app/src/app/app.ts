import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {SigridConfiguration} from './services/sigrid-configuration';
import {WebviewMessage} from './models/webview-message';
import {VsCommandRegistry} from './commands/vs-command-registry';
import {SelectButton} from './shared/select-button/select-button';
import {SigridData} from './services/sigrid-data';
import {FileFilterMode} from './models/file-filter-mode';
import {IconButton} from './shared/icon-button/icon-button';
import {TooltipDirective} from 'ngx-smart-tooltip';
import {REFRESH_INTERVAL} from './utilities/constants';
import {VsCode} from './services/vs-code';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SelectButton, IconButton, TooltipDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private router = inject(Router);
  private sigridConfig = inject(SigridConfiguration);
  private commandRegistry = inject(VsCommandRegistry);
  private sigridData = inject(SigridData);
  private vscode = inject(VsCode);
  protected readonly isConfigValid = this.sigridConfig.isConfigurationValid;
  protected fileFilterOptions = [
    {label: 'All', value: FileFilterMode.All},
    {label: 'Active', value: FileFilterMode.Active},
  ];
  protected readonly activeFilePath = this.sigridData.activeFilePath;
  protected readonly displayActivePath = this.sigridData.displayActivePath;
  protected readonly refreshButtonDisabled = this.sigridData.isRefreshing;
  private intervalId: any;

  constructor() {
    window.addEventListener('message', this.onMessageReceived.bind(this));
  }

  ngOnInit() {
    if (this.router.url === '/') {
      this.router.navigate(['/maintainability']);
    }

    this.intervalId = setInterval(() => {
      if (this.isConfigValid() && !this.sigridData.isRefreshing()) {
        this.refresh().then();
      }
    }, REFRESH_INTERVAL);

    this.vscode.initialize();
  }

  onMessageReceived(message: MessageEvent<WebviewMessage>) {
    let command = message.data.command ?? '';
    this.commandRegistry.execute(command, message.data.data);
  }

  protected onFileFilterChange(mode: FileFilterMode) {
    this.sigridData.setFileFilter(mode);
  }

  protected async refresh() {
    await this.sigridData.loadAllFindings();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }
}
