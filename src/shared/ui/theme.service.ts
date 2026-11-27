import { Injectable, signal } from '@angular/core';
import { clave } from './almacen';

export type Tema = 'auto' | 'light' | 'dark';
export type TamanoTexto = 'mediano' | 'grande';

const KEY = clave('tema');
const KEY_TAMANO = clave('tamano');
const ESCALA: Record<TamanoTexto, string> = { mediano: '100%', grande: '115%' };

function leer(clave: string): string | null {
  try { return localStorage.getItem(clave); } catch { return null; }
}

function guardar(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor); } catch { }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.leerTema());
  readonly tamano = signal<TamanoTexto>(this.leerTamano());

  constructor() {
    this.aplicarTema(this.tema());
    this.aplicarTamano(this.tamano());
  }

  cambiar(t: Tema) {
    this.tema.set(t);
    guardar(KEY, t);
    this.aplicarTema(t);
  }

  cambiarTamano(t: TamanoTexto) {
    this.tamano.set(t);
    guardar(KEY_TAMANO, t);
    this.aplicarTamano(t);
  }

  private aplicarTema(t: Tema) {
    const el = document.documentElement;
    if (t === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', t);
  }

  private aplicarTamano(t: TamanoTexto) { document.documentElement.style.fontSize = ESCALA[t]; }

  private leerTema(): Tema {
    const v = leer(KEY);
    return v === 'auto' || v === 'dark' ? v : 'light';
  }

  private leerTamano(): TamanoTexto {
    const v = leer(KEY_TAMANO);
    return v === 'grande' ? v : 'mediano';
  }
}
