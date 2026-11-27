import { Component, inject, signal } from '@angular/core';
import { IonBadge, IonButton } from '@ionic/angular';
import { MotivoService } from '../comun/motivo.service';
import { CLR_ESTADO_ARCO, ChecadorApi, CkPageComponent, ETQ_ARCO, ETQ_ESTADO_ARCO, FechaPipe, PuedeDirective, SolicitudArco, fechaLocal } from '@checador/shared';

interface FilaDato { dato: string; uso: string; cuando: string; conservacion: string }

@Component({
  selector: 'app-privacidad',
  imports: [CkPageComponent, IonBadge, IonButton, FechaPipe, PuedeDirective],
  templateUrl: './privacidad.page.html',
})
export class PrivacidadPage {
  private readonly api = inject(ChecadorApi);
  private readonly motivo = inject(MotivoService);
  protected readonly lista = signal<SolicitudArco[]>([]);
  protected readonly etq = ETQ_ARCO;
  protected readonly etqEstado = ETQ_ESTADO_ARCO;
  protected readonly clrEstado = CLR_ESTADO_ARCO;
  protected readonly hoy = fechaLocal();

  protected readonly datos: FilaDato[] = [
    { dato: 'Checadas (hora oficial, tipo, lugar)', uso: 'Registro de asistencia', cuando: 'Cada checada', conservacion: 'Relación laboral + 5 años' },
    { dato: 'Coordenadas GPS exactas', uso: 'Validar que estás en un lugar aprobado', cuando: 'Solo al checar', conservacion: '12 meses; después solo lugar y resultado' },
    { dato: 'IP y señales (VPN, hora, equipo)', uso: 'Detectar manipulaciones', cuando: 'Solo al checar', conservacion: '12 meses' },
    { dato: 'Huella del dispositivo', uso: 'Comprobar el equipo vinculado', cuando: 'Al vincular y al checar', conservacion: 'Mientras el equipo esté vinculado + 12 meses' },
    { dato: 'Bitácora de acciones del panel', uso: 'Auditoría y seguridad', cuando: 'Cada acción', conservacion: '5 años' },
    { dato: 'Biometría (huella o rostro)', uso: 'No se recolecta por ahora', cuando: 'Futuro, con consentimiento aparte', conservacion: 'No aplica' },
  ];

  constructor() { this.cargar(); }
  ionViewWillEnter() { this.cargar(); }
  private async cargar() { this.lista.set(await this.api.arco()); }

  protected vencida(a: SolicitudArco) { return a.estado !== 'Atendida' && a.limite < this.hoy; }

  protected async atender(a: SolicitudArco) {
    const r = await this.motivo.pedir({
      titulo: 'Responder solicitud', subtitulo: `${a.empleado} · ${this.etq[a.derecho]}`, detalle: [a.detalle],
      sugerencias: ['Te enviamos tus datos por correo', 'Dato corregido', 'No es posible por obligación legal'], obligatorio: true, textoPrincipal: 'Responder', etiqueta: 'Respuesta',
    });
    if (!r) return;
    await this.api.atenderArco(a.id, r.texto);
    await this.cargar();
  }
}
