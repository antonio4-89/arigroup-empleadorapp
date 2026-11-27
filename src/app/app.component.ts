import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { ThemeService } from '@checador/shared';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly tema = inject(ThemeService);


}
