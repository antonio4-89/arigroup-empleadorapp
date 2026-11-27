import { Component, computed, input } from '@angular/core';

// Alias heredados (nombres tipo Ionicons) → nombre del ícono propio definido en shared/styles/_icons.scss.
const MAPA: Record<string, string> = {
  'add-circle-outline': 'circle-plus', 'alert-circle-outline': 'circle-exclamation', 'bandage-outline': 'bandage', 'business-outline': 'building',
  'calendar-outline': 'calendar-days', 'car-outline': 'car', 'checkmark-circle': 'circle-check', 'chevron-forward': 'chevron-right',
  'close-circle': 'circle-xmark', 'cloud-offline-outline': 'cloud', 'document-text-outline': 'file-lines', 'flame-outline': 'fire',
  'help-circle-outline': 'circle-question', 'home-outline': 'house', 'location-outline': 'location-dot', 'medkit-outline': 'briefcase-medical',
  'navigate-outline': 'location-arrow', 'notifications-outline': 'bell', 'person-outline': 'user', 'phone-portrait-outline': 'mobile-screen',
  'shield-checkmark-outline': 'shield-halved', 'stopwatch-outline': 'stopwatch', 'swap-horizontal-outline': 'right-left', 'time-outline': 'clock',
  warning: 'triangle-exclamation', 'wifi-outline': 'wifi', 'megaphone-outline': 'bullhorn', 'menu-outline': 'bars', 'close-outline': 'xmark',
  'desktop-outline': 'desktop', 'chevron-down-outline': 'chevron-down', 'map-outline': 'map', 'lock-closed-outline': 'lock', 'key-outline': 'key',
  'qr-code-outline': 'qrcode', 'download-outline': 'download', 'log-out-outline': 'right-from-bracket', 'text-outline': 'font',
  'cloud-upload-outline': 'cloud-arrow-up', 'arrow-back': 'arrow-left',
};

@Component({
  selector: 'ck-icon',
  host: { class: 'ck-icon', 'aria-hidden': 'true' },
  template: `<i [class]="clase()"></i>`,
})
export class CkIconComponent {
  readonly name = input.required<string>();
  protected readonly clase = computed(() => `ck-i ck-i-${MAPA[this.name()] ?? this.name()}`);
}
