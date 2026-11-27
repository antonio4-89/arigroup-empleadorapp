export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  medium: string;
  light: string;
  dark: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  heroFrom: string;
  heroTo: string;
  heroText: string;
  navBg: string;
  navText: string;
  navMuted: string;
  navActive: string;
  accent: string;
  onAccent: string;
  paper: string;
  urgent: string;
  qrInk: string;
}

/**
 * Identidad 1ari: morado #6633CD, menta #00FE97 y tinta #16152B (tomados del logotipo).
 * La menta es solo de acento (indicadores, detalles sobre fondo oscuro); nunca como texto sobre blanco.
 */
export class DesignTokens {
  static readonly prefix = 'ck';

  static readonly brand = { morado: '#6633CD', menta: '#00FE97', tinta: '#16152B' } as const;

  static readonly themes: Record<ThemeName, ThemeColors> = {
    light: {
      primary: '#6633cd',
      secondary: '#2a5db0',
      success: '#007a52',
      warning: '#9e5800',
      danger: '#c0262d',
      medium: '#5e5b73',
      light: '#efeafb',
      dark: '#16152b',
      bg: '#f4f4f8',
      surface: '#ffffff',
      text: '#16152b',
      textMuted: '#5e5b73',
      border: '#e2e1ea',
      heroFrom: '#16152b',
      heroTo: '#4a26a8',
      heroText: '#ffffff',
      navBg: '#16152b',
      navText: '#ffffff',
      navMuted: '#aeacc4',
      navActive: '#6633cd',
      accent: '#00fe97',
      onAccent: '#16152b',
      paper: '#ffffff',
      urgent: '#a3161d',
      qrInk: '#1d1233',
    },
    dark: {
      primary: '#a585ff',
      secondary: '#7fa8f0',
      success: '#3adb9a',
      warning: '#fbbf24',
      danger: '#f87171',
      medium: '#a9a7bd',
      light: '#24213f',
      dark: '#eeedf5',
      bg: '#0e0d1a',
      surface: '#17162a',
      text: '#eeedf5',
      textMuted: '#a9a7bd',
      border: '#2b2944',
      heroFrom: '#0e0d1a',
      heroTo: '#3a1f8a',
      heroText: '#ffffff',
      navBg: '#0a0913',
      navText: '#eeedf5',
      navMuted: '#a9a7bd',
      navActive: '#5b2fc0',
      accent: '#00fe97',
      onAccent: '#16152b',
      paper: '#ffffff',
      urgent: '#a3161d',
      qrInk: '#1d1233',
    },
  };

  static readonly aliases: Record<string, keyof ThemeColors> = {
    'checada-entrada': 'success',
    'checada-salida': 'danger',
    'checada-comida': 'warning',
    'validacion-valida': 'success',
    'validacion-revisar': 'warning',
    'validacion-fuera': 'danger',
    'contingencia': 'secondary',
  };

  static readonly space: Record<string, number> = { '1': 4, '2': 8, '3': 12, '4': 16, '5': 24, '6': 32, '7': 48 };
  static readonly radius: Record<string, number> = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 };
  static readonly fontSize: Record<string, number> = { xs: 12, sm: 14, md: 16, lg: 20, xl: 28, display: 48 };
  static readonly fontWeight: Record<string, number> = { regular: 400, medium: 500, semibold: 600, bold: 700 };
  static readonly lineHeight: Record<string, number> = { tight: 1.2, normal: 1.5 };
  static readonly fontFamily =
    "'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  static readonly fontFamilyDisplay =
    "'Outfit Variable', Outfit, 'Inter Variable', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

  static readonly shadow: Record<string, string> = {
    sm: '0 1px 2px rgb(22 21 43 / 0.06), 0 1px 1px rgb(22 21 43 / 0.04)',
    md: '0 8px 24px rgb(22 21 43 / 0.10), 0 2px 6px rgb(22 21 43 / 0.06)',
  };
  static readonly motion: Record<string, string> = { fast: '120ms', base: '200ms' };

  static readonly size: Record<string, number> = {
    'touch-target': 48,
    'page-max-width': 1120,
  };
}
