import { TipoChecada } from '../models/models';

export function siguientesTipos(hoy: { tipo: TipoChecada }[]): TipoChecada[] {
  switch (hoy[hoy.length - 1]?.tipo) {
    case undefined: return ['Entrada'];
    case 'Entrada': return ['SalidaComida', 'Salida'];
    case 'SalidaComida': return ['RegresoComida'];
    case 'RegresoComida': return ['Salida'];
    default: return [];
  }
}
