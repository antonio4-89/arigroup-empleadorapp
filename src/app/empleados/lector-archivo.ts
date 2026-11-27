/**
 * Lectura de tablas desde un archivo CSV o Excel (.xlsx) sin librerías de terceros.
 * Un .xlsx es un ZIP con XML dentro; se descomprime con `DecompressionStream`, que ya trae el navegador.
 */

/** Fila leída del archivo: `linea` es el número de fila tal como se ve en Excel o en el CSV. */
export interface FilaBruta { linea: number; celdas: string[] }

const MAX_FILAS = 1000;

export async function leerArchivo(archivo: File): Promise<FilaBruta[]> {
  const nombre = archivo.name.toLowerCase();
  let filas: FilaBruta[];
  if (nombre.endsWith('.xlsx')) filas = await leerXlsx(archivo);
  else if (nombre.endsWith('.xls')) throw new Error('Los archivos .xls antiguos no se pueden leer. Guárdalo como Excel (.xlsx) o como CSV.');
  else if (nombre.endsWith('.csv') || nombre.endsWith('.txt') || archivo.type.startsWith('text/')) filas = leerCsv(await archivo.text());
  else throw new Error('Formato no compatible. Sube un archivo Excel (.xlsx) o CSV.');
  if (filas.length > MAX_FILAS + 1) throw new Error(`El archivo tiene más de ${MAX_FILAS} filas. Divídelo en partes más pequeñas.`);
  return filas;
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/** Admite comas, punto y coma (Excel en español) o tabulaciones, y campos entre comillas. */
export function leerCsv(texto: string): FilaBruta[] {
  const t = texto.replace(/^﻿/, '');
  const primera = t.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const sep = [',', ';', '\t'].map((s) => ({ s, n: primera.split(s).length })).sort((a, b) => b.n - a.n)[0].s;

  const filas: FilaBruta[] = [];
  let celdas: string[] = [], celda = '', enComillas = false, linea = 1, inicio = 1;
  const cerrarFila = () => {
    celdas.push(celda.trim());
    if (celdas.some((c) => c)) filas.push({ linea: inicio, celdas });
    celdas = []; celda = '';
  };
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (enComillas) {
      if (c === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') enComillas = false;
      else { celda += c; if (c === '\n') linea++; }
    } else if (c === '"') enComillas = true;
    else if (c === sep) { celdas.push(celda.trim()); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      cerrarFila(); linea++; inicio = linea;
    } else celda += c;
  }
  if (celda || celdas.length) cerrarFila();
  return filas;
}

// ── Excel (.xlsx) ────────────────────────────────────────────────────────────

export async function leerXlsx(archivo: File): Promise<FilaBruta[]> {
  if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede leer Excel. Guarda el archivo como CSV y súbelo de nuevo.');
  try {
    const zip = await abrirZip(new Uint8Array(await archivo.arrayBuffer()));
    const texto = async (ruta: string) => { const d = await zip(ruta); return d ? new TextDecoder().decode(d) : null; };
    const xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');

    const compartidas: string[] = [];
    const ss = await texto('xl/sharedStrings.xml');
    if (ss) for (const si of Array.from(xml(ss).getElementsByTagName('si'))) compartidas.push(Array.from(si.getElementsByTagName('t')).map((x) => x.textContent ?? '').join(''));

    const libro = await texto('xl/workbook.xml');
    const rels = await texto('xl/_rels/workbook.xml.rels');
    let hoja = 'xl/worksheets/sheet1.xml';
    if (libro && rels) {
      const id = xml(libro).getElementsByTagName('sheet')[0]?.getAttribute('r:id');
      const destino = Array.from(xml(rels).getElementsByTagName('Relationship')).find((r) => r.getAttribute('Id') === id)?.getAttribute('Target');
      if (destino) hoja = destino.startsWith('/') ? destino.slice(1) : 'xl/' + destino.replace(/^\.\//, '');
    }
    const datos = await texto(hoja);
    if (!datos) throw new Error('sin hoja');

    const filas: FilaBruta[] = [];
    for (const row of Array.from(xml(datos).getElementsByTagName('row'))) {
      const celdas: string[] = [];
      for (const c of Array.from(row.getElementsByTagName('c'))) {
        const col = columna(c.getAttribute('r') ?? '');
        const tipo = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
        let valor = v;
        if (tipo === 's') valor = compartidas[Number(v)] ?? '';
        else if (tipo === 'inlineStr') valor = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent ?? '').join('');
        else if (tipo === 'b') valor = v === '1' ? 'Sí' : 'No';
        while (celdas.length < col) celdas.push('');
        celdas[col] = valor.trim();
      }
      if (celdas.some((c) => c)) filas.push({ linea: Number(row.getAttribute('r')) || filas.length + 1, celdas });
    }
    return filas;
  } catch {
    throw new Error('No se pudo leer el archivo de Excel. Revisa que no esté dañado o protegido con contraseña, o guárdalo como CSV.');
  }
}

/** "AB12" → 27 (índice de columna desde 0). */
function columna(ref: string): number {
  const letras = ref.replace(/[^A-Z]/gi, '').toUpperCase();
  return [...letras].reduce((n, l) => n * 26 + l.charCodeAt(0) - 64, 0) - 1;
}

async function abrirZip(z: Uint8Array): Promise<(ruta: string) => Promise<Uint8Array | null>> {
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength);
  let fin = -1;
  for (let i = z.length - 22; i >= Math.max(0, z.length - 65_557); i--) if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('zip');
  const total = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);

  const indice = new Map<string, { metodo: number; tam: number; desde: number }>();
  for (let n = 0; n < total; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
    const metodo = v.getUint16(p + 10, true), tam = v.getUint32(p + 20, true);
    const largoNombre = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), coment = v.getUint16(p + 32, true);
    const desde = v.getUint32(p + 42, true);
    indice.set(new TextDecoder().decode(z.subarray(p + 46, p + 46 + largoNombre)), { metodo, tam, desde });
    p += 46 + largoNombre + extra + coment;
  }

  return async (ruta) => {
    const e = indice.get(ruta);
    if (!e) return null;
    const inicio = e.desde + 30 + v.getUint16(e.desde + 26, true) + v.getUint16(e.desde + 28, true);
    const bytes = z.subarray(inicio, inicio + e.tam);
    if (e.metodo === 0) return bytes;
    if (e.metodo !== 8) throw new Error('zip');
    const flujo = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(flujo).arrayBuffer());
  };
}
