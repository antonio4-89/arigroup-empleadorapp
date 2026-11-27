import { InfoCodigoPostal } from '../models/models';

/**
 * Catálogo de DEMOSTRACIÓN para autocompletar el domicilio. Con el back real, `buscarCodigoPostal`
 * consulta el catálogo oficial de códigos postales (SEPOMEX) y este archivo desaparece.
 */
export const CODIGOS_POSTALES: InfoCodigoPostal[] = [
  { codigoPostal: '06000', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonias: ['Centro (Área 1)', 'Centro (Área 2)'] },
  { codigoPostal: '06600', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonias: ['Juárez'] },
  { codigoPostal: '06700', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonias: ['Roma Norte'] },
  { codigoPostal: '03100', estado: 'Ciudad de México', municipio: 'Benito Juárez', colonias: ['Del Valle Centro', 'Del Valle Norte'] },
  { codigoPostal: '03810', estado: 'Ciudad de México', municipio: 'Benito Juárez', colonias: ['Nápoles', 'Ciudad de los Deportes'] },
  { codigoPostal: '11560', estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonias: ['Polanco V Sección'] },
  { codigoPostal: '02300', estado: 'Ciudad de México', municipio: 'Azcapotzalco', colonias: ['Industrial Vallejo', 'Nueva Vallejo'] },
  { codigoPostal: '54900', estado: 'Estado de México', municipio: 'Tultitlán', colonias: ['Tultitlán Centro', 'San Pablo de las Salinas'] },
  { codigoPostal: '76000', estado: 'Querétaro', municipio: 'Querétaro', colonias: ['Centro', 'Centro Histórico'] },
  { codigoPostal: '64000', estado: 'Nuevo León', municipio: 'Monterrey', colonias: ['Monterrey Centro'] },
  { codigoPostal: '66220', estado: 'Nuevo León', municipio: 'San Pedro Garza García', colonias: ['Del Valle', 'Residencial San Agustín'] },
];
