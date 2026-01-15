import {Component, inject, OnInit, signal} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('sigrid-ext-app');
  private router = inject(Router);

  ngOnInit() {
    if (this.router.url === '/') {
      this.router.navigate(['/maintainability']);
    }
  }
}
