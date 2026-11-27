import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MotivoSheet, OpcionesMotivo, ResultadoMotivo } from './motivo.sheet';

@Injectable({ providedIn: 'root' })
export class MotivoService {
  private readonly modales = inject(ModalController);

  async pedir(opciones: OpcionesMotivo): Promise<ResultadoMotivo | null> {
    const m = await this.modales.create({ component: MotivoSheet, componentProps: { opciones }, cssClass: 'ck-modal-form' });
    await m.present();
    const { role, data } = await m.onDidDismiss<ResultadoMotivo>();
    return role === 'ok' && data ? data : null;
  }
}
