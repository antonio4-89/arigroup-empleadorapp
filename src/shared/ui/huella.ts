import { DispositivoActual, PlataformaDispositivo } from '../models/models';

export async function huellaDispositivo(): Promise<DispositivoActual> {
  const n = navigator;
  const ua = n.userAgent;
  const plataforma: PlataformaDispositivo = /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'Web';

  let canvas = '';
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (ctx) { ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillText('Checador·huella', 2, 2); canvas = c.toDataURL(); }
  } catch { }

  const base = [
    ua, n.language, n.platform, n.hardwareConcurrency, (n as unknown as { deviceMemory?: number }).deviceMemory,
    screen.width, screen.height, screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone, canvas,
  ].join('|');

  const bytes = new TextEncoder().encode(base);
  let hex: string;
  try {
    const h = await crypto.subtle.digest('SHA-256', bytes);
    hex = Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    hex = Array.from(bytes).reduce((a, b) => ((a * 31 + b) >>> 0), 7).toString(16).padStart(8, '0').repeat(2);
  }

  const navegador = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Navegador';
  const so = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : 'equipo';
  return { huella: hex.slice(0, 16), plataforma, nombre: plataforma === 'Web' ? `${navegador} en ${so}` : `${so} (${navegador})` };
}
