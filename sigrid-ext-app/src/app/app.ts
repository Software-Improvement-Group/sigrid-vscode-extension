import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {SigridConfiguration} from './services/sigrid-configuration';
import {Configuration} from './models/configuration';
import {WebviewMessage} from './models/webview-message';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private router = inject(Router);
  private sigridConfig = inject(SigridConfiguration);
  protected readonly isConfigValid = this.sigridConfig.isConfigurationValid;

  constructor() {
    window.addEventListener('message', this.onMessageReceived.bind(this));
  }

  ngOnInit() {
    if (this.router.url === '/') {
      this.router.navigate(['/maintainability']);
    }
  }

  onMessageReceived(message: MessageEvent<WebviewMessage>) {
    let command = message.data.command ?? '';

    if (command === 'init') {
      const configuration = message.data.data as Configuration;

      this.sigridConfig.setConfiguration(configuration)
    }
  }
}
