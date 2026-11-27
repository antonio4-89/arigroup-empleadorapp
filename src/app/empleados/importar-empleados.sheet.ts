import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonContent, ModalController } from '@ionic/angular';
import { CkIconComponent, CkInputComponent, ChecadorApi, Modalidad, NuevoEmpleado, TipoJornada, Turno } from '@checador/shared';
import { FilaBruta, leerArchivo, leerCsv } from './lector-archivo';

interface Fila { linea: number; datos: Partial<NuevoEmpleado>; errores: string[] }

type Campo = 'numero' | 'nombre' | 'correo' | 'puesto' | 'departamento' | 'sede' | 'modalidad' | 'jornada' | 'turno' | 'ingreso';

/** Columnas en el orden de la plantilla, con los nombres con que se reconocen en la fila de encabezados. */
const COLUMNAS: { campo: Campo; titulo: string; ayuda: string; alias: string[] }[] = [
  { campo: 'numero', titulo: 'numero', ayuda: 'Número de colaborador, único.', alias: ['numero', 'no', 'num', 'numerodeempleado', 'id'] },
  { campo: 'nombre', titulo: 'nombre', ayuda: 'Nombre completo.', alias: ['nombre', 'nombrecompleto'] },
  { campo: 'correo', titulo: 'correo', ayuda: 'Correo donde llegará la invitación.', alias: ['correo', 'email', 'correoelectronico', 'correocorporativo'] },
  { campo: 'puesto', titulo: 'puesto', ayuda: 'Puesto o cargo.', alias: ['puesto', 'cargo'] },
  { campo: 'departamento', titulo: 'departamento', ayuda: 'Área o departamento.', alias: ['departamento', 'area'] },
  { campo: 'sede', titulo: 'sede', ayuda: 'Sede o planta donde trabaja.', alias: ['sede', 'planta'] },
  { campo: 'modalidad', titulo: 'modalidad', ayuda: 'Presencial, HomeOffice, Hibrido o Itinerante.', alias: ['modalidad'] },
  { campo: 'jornada', titulo: 'jornada', ayuda: 'Diurna, Nocturna o Mixta.', alias: ['jornada', 'tipodejornada', 'tipojornada'] },
  { campo: 'turno', titulo: 'turno', ayuda: 'Clave (t1…t7) o nombre del turno.', alias: ['turno'] },
  { campo: 'ingreso', titulo: 'ingreso', ayuda: 'Fecha de ingreso (AAAA-MM-DD o fecha de Excel).', alias: ['ingreso', 'fechadeingreso', 'fechaingreso'] },
];

const CABECERA = COLUMNAS.map((c) => c.titulo).join(',');
const EJEMPLO = [
  CABECERA,
  '9001,Ana Torres,ana.torres@grupodemo.mx,Analista de Costos,Finanzas,Sede Centro,Presencial,Diurna,t2,2026-11-02',
  '9002,Bruno Salazar,bruno.salazar@grupodemo.mx,Soldador,Producción,Planta Norte,Presencial,Mixta,t4,2026-11-09',
  '9003,Carla Ibarra,carla.ibarra,Diseñadora,Marketing,Sede Centro,HomeOffice,Diurna,t7,2026-11-16',
  '1001,Duplicado Prueba,duplicado@grupodemo.mx,Auxiliar,Sistemas,Sede Centro,Presencial,Diurna,t1,2026-11-16',
  '9004,Elena Cruz,elena.cruz@grupodemo.mx,Chofer,Logística,Planta Norte,Remoto,Diurna,t6,2026-11-23',
].join('\n');

const MODALIDADES: Record<string, Modalidad> = { presencial: 'Presencial', homeoffice: 'HomeOffice', hibrido: 'Hibrido', itinerante: 'Itinerante' };
const JORNADAS: Record<string, TipoJornada> = { diurna: 'Diurna', nocturna: 'Nocturna', mixta: 'Mixta' };

/** Minúsculas, sin acentos, espacios ni signos: "Home Office" → "homeoffice". */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Las fechas de Excel llegan como número de serie (días desde 1899-12-30). */
function aFecha(v: string): string {
  if (/^\d{4,5}(\.\d+)?$/.test(v) && +v > 20000 && +v < 80000) return new Date(Math.round((+v - 25569) * 86_400_000)).toISOString().slice(0, 10);
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v;
}

@Component({
  selector: 'app-importar-empleados',
  imports: [CkInputComponent, CkIconComponent, IonContent, IonButton],
  template: `
    <ion-content>
      <div class="ck-sheet ck-import">
        <header>
          <h2 class="ck-sheet__title">Importar colaboradores</h2>
          <p class="ck-text-muted ck-text-sm">Sube tu plantilla en Excel o CSV. Cada persona recibirá una invitación por correo para activar su cuenta.</p>
        </header>

        <ol class="ck-import__pasos">
          <li class="ck-import__paso">
            <span class="ck-import__num" aria-hidden="true">1</span>
            <div class="ck-import__cuerpo">
              <strong>Descarga la plantilla</strong>
              <span class="ck-text-sm ck-text-muted">Llénala con una fila por persona. Puedes abrirla y guardarla desde Excel.</span>
              <div class="ck-row">
                <ion-button size="small" fill="outline" (click)="plantilla()"><ck-icon slot="start" name="download" />Descargar plantilla</ion-button>
                <button type="button" class="ck-link" [attr.aria-expanded]="ayuda()" (click)="ayuda.set(!ayuda())">¿Qué lleva cada columna?</button>
              </div>
              @if (ayuda()) {
                <dl class="ck-import__columnas">
                  @for (c of columnas; track c.campo) { <div><dt>{{ c.titulo }}</dt><dd>{{ c.ayuda }}</dd></div> }
                </dl>
              }
            </div>
          </li>

          <li class="ck-import__paso">
            <span class="ck-import__num" aria-hidden="true">2</span>
            <div class="ck-import__cuerpo">
              <strong>Sube tu archivo</strong>
              <input #entrada type="file" hidden accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="elegido($event)" />
              <div class="ck-drop" role="button" tabindex="0" [class.is-over]="sobre()" [class.is-lleno]="!!archivo()" aria-label="Elegir archivo de Excel o CSV"
                (click)="entrada.click()" (keydown.enter)="entrada.click()" (keydown.space)="$event.preventDefault(); entrada.click()"
                (dragover)="$event.preventDefault(); sobre.set(true)" (dragleave)="sobre.set(false)" (drop)="soltar($event)">
                @if (archivo(); as a) {
                  <ck-icon class="ck-drop__icono" name="file-lines" />
                  <span class="ck-drop__texto"><strong>{{ a.nombre }}</strong><small>{{ filas().length }} fila(s) leída(s)</small></span>
                  <button type="button" class="ck-link" (click)="$event.stopPropagation(); entrada.click()">Cambiar</button>
                  <button type="button" class="ck-link" (click)="$event.stopPropagation(); quitar()">Quitar</button>
                } @else {
                  <ck-icon class="ck-drop__icono" name="cloud-arrow-up" />
                  <span class="ck-drop__texto"><strong>Arrastra tu archivo aquí</strong><small>o toca para elegirlo · Excel (.xlsx) o CSV</small></span>
                }
              </div>
              @if (errorLectura()) { <p class="ck-notice ck-notice--error" role="alert">{{ errorLectura() }}</p> }
              <details class="ck-import__manual">
                <summary>Pegar los datos en lugar de subir un archivo</summary>
                <ck-input aria-label="Datos de la plantilla" rows="5" [value]="texto()" variante="mono" (cambio)="pegar($event)" />
                <button type="button" class="ck-link" (click)="pegar(ejemplo)">Cargar datos de ejemplo</button>
              </details>
            </div>
          </li>

          @if (filas().length || faltantes().length) {
            <li class="ck-import__paso">
              <span class="ck-import__num" aria-hidden="true">3</span>
              <div class="ck-import__cuerpo">
                <strong>Revisa antes de importar</strong>
                @if (faltantes().length) {
                  <p class="ck-notice ck-notice--error" role="alert">Al archivo le faltan estas columnas: <strong>{{ faltantes().join(', ') }}</strong>. Usa la plantilla para ver los nombres correctos.</p>
                } @else {
                  <div class="ck-import__resumen" role="status">
                    <button type="button" class="ck-chip" role="radio" [attr.aria-checked]="filtro() === 'todas'" [attr.aria-pressed]="filtro() === 'todas'" (click)="filtro.set('todas')">Todas ({{ filas().length }})</button>
                    <span class="ck-import__ok"><ck-icon name="circle-check" /> {{ validas().length }} lista(s)</span>
                    @if (invalidas()) {
                      <button type="button" class="ck-chip ck-chip--alerta" role="radio" [attr.aria-checked]="filtro() === 'errores'" [attr.aria-pressed]="filtro() === 'errores'" (click)="filtro.set(filtro() === 'errores' ? 'todas' : 'errores')">
                        <ck-icon name="circle-exclamation" /> {{ invalidas() }} con errores
                      </button>
                    }
                  </div>
                  @if (invalidas()) { <p class="ck-text-sm ck-text-muted">Las filas con errores no se importarán. Corrígelas en tu archivo y vuelve a subirlo.</p> }
                  <div class="ck-table-wrap ck-import__tabla">
                    <table class="ck-table">
                      <thead><tr><th>Fila</th><th>Número</th><th>Nombre</th><th>Correo</th><th>Turno</th><th>Revisión</th></tr></thead>
                      <tbody>
                        @for (f of visibles(); track f.linea) {
                          <tr [class.is-error]="f.errores.length">
                            <td>{{ f.linea }}</td><td>{{ f.datos.numero }}</td><td>{{ f.datos.nombre }}</td><td>{{ f.datos.correo }}</td><td>{{ f.datos.turnoId }}</td>
                            <td>
                              @if (f.errores.length) { <span class="ck-text-danger"><ck-icon name="circle-exclamation" /> {{ f.errores.join(' · ') }}</span> }
                              @else { <span class="ck-text-success"><ck-icon name="circle-check" /> Lista</span> }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </li>
          }
        </ol>

        @if (error()) { <p class="ck-notice ck-notice--error" role="alert">{{ error() }}</p> }
        <div class="ck-import__acciones">
          <ion-button expand="block" [disabled]="validas().length === 0 || ocupado()" (click)="importar()">
            {{ validas().length ? 'Importar ' + validas().length + ' colaborador(es) y enviar invitaciones' : 'Importar colaboradores' }}
          </ion-button>
          <ion-button expand="block" fill="clear" (click)="ctrl.dismiss(null, 'cancelada')">Cancelar</ion-button>
        </div>
      </div>
    </ion-content>
  ` })
export class ImportarEmpleadosSheet {
  private readonly api = inject(ChecadorApi);
  protected readonly ctrl = inject(ModalController);
  protected readonly columnas = COLUMNAS;
  protected readonly ejemplo = EJEMPLO;

  protected readonly bruto = signal<FilaBruta[]>([]);
  protected readonly archivo = signal<{ nombre: string } | null>(null);
  protected readonly texto = signal('');
  protected readonly errorLectura = signal('');
  protected readonly error = signal('');
  protected readonly ocupado = signal(false);
  protected readonly sobre = signal(false);
  protected readonly ayuda = signal(false);
  protected readonly filtro = signal<'todas' | 'errores'>('todas');
  protected readonly existentes = signal<Set<string>>(new Set());
  protected readonly turnos = signal<Turno[]>([]);

  constructor() {
    this.api.empleados().then((e) => this.existentes.set(new Set(e.map((x) => x.numero))));
    this.api.turnos().then((t) => this.turnos.set(t));
  }

  /** Columna de cada campo: por nombre si hay fila de encabezados, o por posición si no la hay. */
  private readonly estructura = computed(() => {
    const filas = this.bruto();
    const primera = filas[0]?.celdas.map(norm) ?? [];
    const hayEncabezado = primera.includes('correo') || primera.includes('nombre') || primera.includes('email');
    const indice = {} as Record<Campo, number>;
    const faltantes: string[] = [];
    COLUMNAS.forEach((c, pos) => {
      if (!hayEncabezado) { indice[c.campo] = pos; return; }
      const i = primera.findIndex((h) => c.alias.includes(h));
      if (i < 0) faltantes.push(c.titulo); else indice[c.campo] = i;
    });
    return { datos: hayEncabezado ? filas.slice(1) : filas, indice, faltantes };
  });

  protected readonly faltantes = computed(() => this.estructura().faltantes);

  protected readonly filas = computed<Fila[]>(() => {
    const { datos, indice, faltantes } = this.estructura();
    if (faltantes.length) return [];
    const vistos = new Set<string>();
    const turnos = this.turnos();
    return datos.map(({ linea, celdas }) => {
      const v = (c: Campo) => (celdas[indice[c]] ?? '').trim();
      const errores: string[] = [];
      const numero = v('numero'), nombre = v('nombre'), correo = v('correo');
      const modalidad = MODALIDADES[norm(v('modalidad'))];
      const jornada = JORNADAS[norm(v('jornada'))];
      const turno = turnos.find((t) => norm(t.id) === norm(v('turno')) || norm(t.nombre) === norm(v('turno')));
      const ingreso = aFecha(v('ingreso'));

      if (!numero) errores.push('Falta el número');
      else if (this.existentes().has(numero) || vistos.has(numero)) errores.push('Número repetido');
      if (numero) vistos.add(numero);
      if (!nombre) errores.push('Falta el nombre');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) errores.push('Correo inválido');
      if (!modalidad) errores.push('Modalidad no válida');
      if (!jornada) errores.push('Jornada no válida');
      if (!turno) errores.push('Turno no válido');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ingreso)) errores.push('Fecha de ingreso inválida');
      return {
        linea, errores,
        datos: { numero, nombre, correo, puesto: v('puesto'), departamento: v('departamento'), sede: v('sede'), modalidad, tipoJornada: jornada, turnoId: turno?.id ?? v('turno'), fechaIngreso: ingreso } };
    });
  });

  protected readonly validas = computed(() => this.filas().filter((f) => f.errores.length === 0));
  protected readonly invalidas = computed(() => this.filas().length - this.validas().length);
  protected readonly visibles = computed(() => (this.filtro() === 'errores' ? this.filas().filter((f) => f.errores.length) : this.filas()));

  protected plantilla() {
    const blob = new Blob(['﻿' + EJEMPLO.split('\n').slice(0, 2).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plantilla-colaboradores.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  protected elegido(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (f) this.leer(f);
  }

  protected soltar(e: DragEvent) {
    e.preventDefault();
    this.sobre.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) this.leer(f);
  }

  protected quitar() {
    this.archivo.set(null);
    this.bruto.set([]);
    this.errorLectura.set('');
    this.filtro.set('todas');
  }

  protected pegar(t: string) {
    this.texto.set(t);
    this.archivo.set(null);
    this.errorLectura.set('');
    this.filtro.set('todas');
    this.bruto.set(leerCsv(t));
  }

  private async leer(f: File) {
    this.errorLectura.set('');
    this.filtro.set('todas');
    try {
      const filas = await leerArchivo(f);
      if (!filas.length) throw new Error('El archivo no tiene filas. Usa la plantilla para llenarlo.');
      this.bruto.set(filas);
      this.archivo.set({ nombre: f.name });
      this.texto.set('');
    } catch (x) {
      this.quitar();
      this.errorLectura.set((x as Error).message);
    }
  }

  protected async importar() {
    this.ocupado.set(true);
    this.error.set('');
    try {
      const n = await this.api.importarEmpleados(this.validas().map((f) => f.datos as NuevoEmpleado));
      await this.ctrl.dismiss(n, 'importado');
    } catch (e) { this.error.set((e as Error).message); } finally { this.ocupado.set(false); }
  }
}
