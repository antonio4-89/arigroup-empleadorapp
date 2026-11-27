import { Injectable, inject, signal } from '@angular/core';
import { API_URL } from '../api/http-checador-api';
import { EscenarioUbicacion } from '../models/models';
import { clave } from './almacen';

const KEY = clave('demo.escenario');
const KEY_LLEGADA = clave('demo.llegada');
const KEY_COMIDA = clave('demo.comida');
const KEY_JORNADA = clave('demo.jornada');
const KEY_UBICACION = clave('demo.ubicacion');

/** Hora de llegada simulada para mostrar la tolerancia sin depender de la hora real de la presentación. */
export type LlegadaSimulada = 'real' | 'ATiempo' | 'Tolerancia' | 'Retardo';

/** Duración simulada de la comida, relativa a la comida pactada del empleado. */
export type ComidaSimulada = 'real' | 'Normal' | 'Tolerancia' | 'Excedida' | 'Corta';

/** Minutos respecto a la hora de entrada del turno que usa cada opción simulada. */
export const DESFASE_LLEGADA: Record<Exclude<LlegadaSimulada, 'real'>, number> = { ATiempo: -6, Tolerancia: 7, Retardo: 24 };

/** Minutos respecto a la comida pactada; 'Corta' es una duración total fija (menor al mínimo legal de 30 min). */
export const DESFASE_COMIDA: Record<Exclude<ComidaSimulada, 'real' | 'Corta'>, number> = { Normal: -5, Tolerancia: 3, Excedida: 18 };
export const COMIDA_CORTA_MIN = 20;

export type OrigenUbicacion = 'simulada' | 'real';

/** Hora actual simulada respecto a la salida del turno: 'Terminada' = 20 min después de la hora de salida. */
export type JornadaSimulada = 'real' | 'Terminada';
export const MIN_DESPUES_DE_SALIDA = 20;

function leer(clave: string): string | null {
  try { return localStorage.getItem(clave); } catch { return null; }
}

function guardar(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor); } catch { }
}

@Injectable({ providedIn: 'root' })
export class DemoService {
  /** Con el backend real no hay escenarios simulados: la ubicación y la hora son las del dispositivo. */
  readonly enDemo = inject(API_URL, { optional: true }) === null;
  readonly escenario = signal<EscenarioUbicacion>((leer(KEY) as EscenarioUbicacion) || 'Sede');
  readonly llegada = signal<LlegadaSimulada>((leer(KEY_LLEGADA) as LlegadaSimulada) || 'real');
  readonly comida = signal<ComidaSimulada>((leer(KEY_COMIDA) as ComidaSimulada) || 'real');
  readonly jornada = signal<JornadaSimulada>((leer(KEY_JORNADA) as JornadaSimulada) || 'real');
  readonly origenUbicacion = signal<OrigenUbicacion>(this.enDemo ? (leer(KEY_UBICACION) as OrigenUbicacion) || 'simulada' : 'real');

  cambiar(e: EscenarioUbicacion) { this.escenario.set(e); guardar(KEY, e); }
  cambiarLlegada(l: LlegadaSimulada) { this.llegada.set(l); guardar(KEY_LLEGADA, l); }
  cambiarComida(c: ComidaSimulada) { this.comida.set(c); guardar(KEY_COMIDA, c); }
  cambiarJornada(j: JornadaSimulada) { this.jornada.set(j); guardar(KEY_JORNADA, j); }
  cambiarOrigenUbicacion(o: OrigenUbicacion) { this.origenUbicacion.set(o); guardar(KEY_UBICACION, o); }
}
