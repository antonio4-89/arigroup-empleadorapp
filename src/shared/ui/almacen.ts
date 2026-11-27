/**
 * Nombre de una clave de localStorage/sessionStorage propio de cada app.
 *
 * Cada app se despliega en su propio dominio (base "/") y entonces no lleva prefijo. Si alguna vez se sirve
 * bajo una subruta del mismo dominio que otra app, el prefijo sale de su <base href> y evita que compartan
 * el almacenamiento del navegador (por ejemplo, la sesión).
 */
export function clave(nombre: string): string {
  let base = '/';
  try { base = document.querySelector('base')?.getAttribute('href') ?? '/'; } catch { }
  const app = base.replace(/^\/+|\/+$/g, '');
  return app ? `checador.${app}.${nombre}` : `checador.${nombre}`;
}
