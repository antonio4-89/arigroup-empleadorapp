export function hashCorto(texto: string): string {
  let a = 0x811c9dc5;
  let b = 0xcbf29ce4;
  for (let i = 0; i < texto.length; i++) {
    const c = texto.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ (c + i), 0x01000193) >>> 0;
  }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

export const VENTANA_KIOSCO_MS = 30_000;

export function codigoKiosco(kioscoId: string, ahora = Date.now()): string {
  const ventana = Math.floor(ahora / VENTANA_KIOSCO_MS);
  const n = parseInt(hashCorto(`${kioscoId}:${ventana}`).slice(0, 8), 16) % 1_000_000;
  return String(n).padStart(6, '0');
}

export function segundosParaCambio(ahora = Date.now()): number {
  return Math.ceil((VENTANA_KIOSCO_MS - (ahora % VENTANA_KIOSCO_MS)) / 1000);
}
