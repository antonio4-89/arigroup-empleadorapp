import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ckHora' })
export class HoraPipe implements PipeTransform {
  transform(iso?: string | null): string {
    return iso ? new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—';
  }
}

@Pipe({ name: 'ckFecha' })
export class FechaPipe implements PipeTransform {
  transform(valor?: string | null, formato: 'corta' | 'larga' = 'corta'): string {
    if (!valor) return '—';
    const d = valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor);
    return formato === 'larga'
      ? d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });
  }
}

@Pipe({ name: 'ckHoras' })
export class HorasPipe implements PipeTransform {
  transform(h?: number | null): string {
    if (h == null) return '—';
    const t = Math.round(h * 60);
    return `${Math.floor(t / 60)}h ${String(t % 60).padStart(2, '0')}m`;
  }
}
