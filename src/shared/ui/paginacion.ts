import { computed, signal } from '@angular/core';

export function crearPaginacion<T>(items: () => T[], tam = 25) {
  const pagina = signal(1);
  const total = computed(() => items().length);
  const paginas = computed(() => Math.max(1, Math.ceil(total() / tam)));
  const actual = computed(() => Math.min(pagina(), paginas()));
  const visibles = computed(() => items().slice((actual() - 1) * tam, actual() * tam));
  return {
    tam, total, paginas, pagina: actual, visibles,
    ir: (p: number) => pagina.set(Math.max(1, Math.min(p, paginas()))),
    reiniciar: () => pagina.set(1),
  };
}

export type Paginacion<T> = ReturnType<typeof crearPaginacion<T>>;
