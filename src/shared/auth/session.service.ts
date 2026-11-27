import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from '../models/models';
import { clave } from '../ui/almacen';

const KEY = clave('sesion');

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _usuario = signal<Usuario | null>(this.leer());
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);

  iniciar(u: Usuario) {
    this._usuario.set(u);
    try { sessionStorage.setItem(KEY, JSON.stringify(u)); } catch { }
  }

  cambiarRol(rol: Usuario['rol']) {
    const u = this._usuario();
    if (u) this.iniciar({ ...u, rol });
  }

  cerrar() {
    this._usuario.set(null);
    try { sessionStorage.removeItem(KEY); } catch { }
  }

  private leer(): Usuario | null {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); } catch { return null; }
  }
}
