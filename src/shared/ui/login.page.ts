import { CkIconComponent } from './ck-icon.component';
import { CkLogoComponent } from './ck-logo.component';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { APP_ROL, ChecadorApi } from '../api/checador-api';
import { CODIGO_2FA_DUMMY } from '../api/mock-checador-api';
import { SessionService } from '../auth/session.service';
import { CkInputComponent } from './ck-input.component';

@Component({
  selector: 'ck-login',
  imports: [CkInputComponent, CkIconComponent, CkLogoComponent, IonContent, IonButton],
  template: `
    <ion-content>
      <div class="ck-auth">
        <section class="ck-auth__brand ck-brand-deco">
          <ck-logo class="ck-auth__logo" tono="claro" />
          <span class="ck-auth__product">{{ rol === 'empleado' ? 'Checador' : 'Checador · Portal RH' }}</span>
          <h1 class="ck-auth__name">{{ rol === 'empleado' ? 'Tu jornada, registrada con certeza.' : 'Registro electrónico de jornada laboral.' }}</h1>
          <p class="ck-auth__tagline">{{ rol === 'empleado' ? 'Registra tu entrada y salida, consulta tus horas y confirma tu constancia mensual.' : 'Control de asistencia, evidencia íntegra y cumplimiento para Recursos Humanos.' }}</p>
          <ul class="ck-auth__points">
            <li><ck-icon name="shield-checkmark-outline" aria-hidden="true" /><span>Registro conforme al art. 132, fr. XXXIV de la LFT</span></li>
            <li><ck-icon name="lock-closed-outline" aria-hidden="true" /><span>Cada checada sellada y verificable</span></li>
            <li><ck-icon name="phone-portrait-outline" aria-hidden="true" /><span>Acceso protegido con doble autenticación</span></li>
          </ul>
          <span class="ck-auth__legal">© 1ari · Demostración con datos ficticios</span>
        </section>

        <section class="ck-auth__panel">
          <div class="ck-auth__card">
            <span class="ck-auth__step">Paso {{ paso() }} de 2</span>

            @if (paso() === 1) {
              <h2 class="ck-auth__title">Inicia sesión</h2>
              <p class="ck-text-muted ck-text-sm ck-auth__lead">{{ rol === 'empleado' ? 'Usa tu número de colaborador o correo corporativo.' : 'Acceso exclusivo para RH, supervisores, administración y auditoría.' }}</p>
              <form class="ck-stack" (submit)="$event.preventDefault(); entrar()">
                <ck-input label="Usuario" autocomplete="username" autocapitalize="none" [value]="usuario()" (cambio)="usuario.set($event)" />
                <ck-input label="Contraseña" type="password" autocomplete="current-password" [value]="password()" (cambio)="password.set($event)" />
                @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
                <ion-button expand="block" size="large" type="submit" [disabled]="ocupado()">Continuar</ion-button>
              </form>
            } @else {
              <h2 class="ck-auth__title">Verificación en dos pasos</h2>
              <p class="ck-text-muted ck-text-sm">Ingresa el código de 6 dígitos de tu app autenticadora.</p>
              <form class="ck-stack" (submit)="$event.preventDefault(); verificar()">
                <ck-input placeholder="000000" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-label="Código de verificación" [value]="codigo()" variante="codigo" (cambio)="codigo.set($event)" />
                @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
                <ion-button expand="block" size="large" type="submit" [disabled]="ocupado()">Verificar y entrar</ion-button>
                <ion-button expand="block" fill="clear" (click)="paso.set(1); error.set('')">Volver</ion-button>
              </form>
            }

            <p class="ck-auth__demo">Versión de prueba · cualquier usuario y contraseña · código {{ codigoDummy }}</p>
          </div>
        </section>
      </div>
    </ion-content>
  ` })
export class LoginPage {
  private readonly api = inject(ChecadorApi);
  private readonly sesion = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly rol = inject(APP_ROL);
  protected readonly codigoDummy = CODIGO_2FA_DUMMY;

  protected readonly paso = signal<1 | 2>(1);
  protected readonly usuario = signal('');
  protected readonly password = signal('');
  protected readonly codigo = signal('');
  protected readonly error = signal('');
  protected readonly ocupado = signal(false);

  protected async entrar() {
    await this.ejecutar(async () => {
      await this.api.login(this.usuario(), this.password());
      this.paso.set(2);
    });
  }

  protected async verificar() {
    await this.ejecutar(async () => {
      this.sesion.iniciar(await this.api.verificar2fa(this.codigo()));
      await this.router.navigateByUrl('/');
    });
  }

  private async ejecutar(fn: () => Promise<void>) {
    this.error.set('');
    this.ocupado.set(true);
    try { await fn(); } catch (e) { this.error.set((e as Error).message); } finally { this.ocupado.set(false); }
  }
}
