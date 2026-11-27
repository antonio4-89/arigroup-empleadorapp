import { DireccionLugar } from '../models/models';

/** Domicilio en una línea: "Calle 12, Int. 3, Col. Roma Norte, Cuauhtémoc, Ciudad de México, C.P. 06700". */
export function formatearDireccion(d: DireccionLugar): string {
  const calle = `${d.calle.trim()} ${d.numeroExterior.trim()}`.trim();
  const interior = d.numeroInterior?.trim() ? `Int. ${d.numeroInterior.trim()}` : '';
  return [calle, interior, d.colonia && `Col. ${d.colonia}`, d.municipio, d.estado, d.codigoPostal && `C.P. ${d.codigoPostal}`]
    .filter(Boolean)
    .join(', ');
}
