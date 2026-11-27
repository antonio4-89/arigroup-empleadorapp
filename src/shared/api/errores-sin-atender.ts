import { inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ErrorApi } from './http-checador-api';

/** Un error del servidor que ninguna pantalla atendió (por ejemplo, una solicitud ya resuelta) se muestra como aviso en lugar de perderse. */
export function avisarErroresDelServidor(): void {
  const avisos = inject(ToastController);
  window.addEventListener('unhandledrejection', (evento) => {
    if (!(evento.reason instanceof ErrorApi) || evento.reason.estado === 401) return;
    evento.preventDefault();
    void avisos.create({ message: evento.reason.message, duration: 5000, position: 'top', color: 'warning' }).then((t) => t.present());
  });
}
