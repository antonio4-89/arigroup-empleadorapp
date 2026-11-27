import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ConfirmarSheet, OpcionesConfirmar, ResultadoConfirmar } from './ck-confirmar.sheet';

@Injectable({ providedIn: 'root' })
export class ConfirmarService {
  private readonly modales = inject(ModalController);

  async pedir(opciones: OpcionesConfirmar): Promise<ResultadoConfirmar | null> {
    const m = await this.modales.create({ component: ConfirmarSheet, componentProps: { opciones }, cssClass: 'ck-modal-form' });
    await m.present();
    const { role, data } = await m.onDidDismiss<ResultadoConfirmar>();
    return role === 'ok' && data ? data : null;
  }
}
