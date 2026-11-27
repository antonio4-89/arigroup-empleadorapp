import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DesignTokens as T } from '../tokens/tokens.ts';

const out = fileURLToPath(new URL('../src/styles/_tokens-generated.scss', import.meta.url));
const P = T.prefix;

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const mix = (a, b, w) => hex(rgb(a).map((v, i) => v * (1 - w) + rgb(b)[i] * w));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const contrastOn = (bg) => (ratio(bg, '#ffffff') >= ratio(bg, '#000000') ? '#ffffff' : '#000000');
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
const rem = (px) => `${px / 16}rem`;

const ionicColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'medium', 'light', 'dark'];

function themeBlock(name, indent) {
  const c = T.themes[name];
  const l = [];
  for (const [k, v] of Object.entries(c)) l.push(`--${P}-color-${kebab(k)}: ${v};`);
  for (const [alias, target] of Object.entries(T.aliases)) l.push(`--${P}-color-${alias}: var(--${P}-color-${kebab(target)});`);
  for (const k of ionicColors) {
    const base = c[k], con = contrastOn(base);
    if (ratio(base, con) < 4.5) throw new Error(`Contraste insuficiente (${name}/${k}): ${ratio(base, con).toFixed(2)}`);
    l.push(
      `--ion-color-${k}: ${base};`,
      `--ion-color-${k}-rgb: ${rgb(base).join(', ')};`,
      `--ion-color-${k}-contrast: ${con};`,
      `--ion-color-${k}-contrast-rgb: ${rgb(con).join(', ')};`,
      `--ion-color-${k}-shade: ${mix(base, '#000000', 0.12)};`,
      `--ion-color-${k}-tint: ${mix(base, '#ffffff', 0.12)};`,
    );
  }
  l.push(
    `--${P}-color-on-primary: var(--ion-color-primary-contrast);`,
    `--${P}-gradient-hero: linear-gradient(160deg, var(--${P}-color-hero-from), var(--${P}-color-hero-to));`,
    `--ion-background-color: var(--${P}-color-bg);`,
    `--ion-text-color: var(--${P}-color-text);`,
    `--ion-toolbar-background: var(--${P}-color-surface);`,
    `--ion-card-background: var(--${P}-color-surface);`,
    `--ion-item-background: var(--${P}-color-surface);`,
    `--ion-border-color: var(--${P}-color-border);`,
  );
  return l.map((x) => indent + x).join('\n');
}

for (const name of ['light', 'dark']) {
  const c = T.themes[name];
  for (const [fg, bg] of [['text', 'bg'], ['text', 'surface'], ['textMuted', 'surface'], ['textMuted', 'bg'], ['heroText', 'heroFrom'], ['heroText', 'heroTo'], ['navText', 'navBg'], ['navMuted', 'navBg'], ['navText', 'navActive'], ['onAccent', 'accent']]) {
    const r = ratio(c[fg], c[bg]);
    if (r < 4.5) throw new Error(`Contraste insuficiente (${name}) ${fg} sobre ${bg}: ${r.toFixed(2)}`);
  }
}

const scalar = [];
for (const [k, v] of Object.entries(T.space)) scalar.push(`--${P}-space-${k}: ${rem(v)};`);
for (const [k, v] of Object.entries(T.radius)) scalar.push(`--${P}-radius-${k}: ${v >= 999 ? '999px' : rem(v)};`);
for (const [k, v] of Object.entries(T.fontSize)) scalar.push(`--${P}-font-size-${k}: ${rem(v)};`);
for (const [k, v] of Object.entries(T.fontWeight)) scalar.push(`--${P}-font-weight-${k}: ${v};`);
for (const [k, v] of Object.entries(T.lineHeight)) scalar.push(`--${P}-line-height-${k}: ${v};`);
for (const [k, v] of Object.entries(T.shadow)) scalar.push(`--${P}-shadow-${k}: ${v};`);
for (const [k, v] of Object.entries(T.motion)) scalar.push(`--${P}-motion-${k}: ${v};`);
for (const [k, v] of Object.entries(T.size)) scalar.push(`--${P}-${k}: ${rem(v)};`);
scalar.push(`--${P}-font-family: ${T.fontFamily};`, `--${P}-font-family-display: ${T.fontFamilyDisplay};`, `--ion-font-family: var(--${P}-font-family);`);
for (const [k, v] of Object.entries(T.brand)) scalar.push(`--${P}-brand-${k}: ${v};`);

const css = `:root {
${scalar.map((x) => '  ' + x).join('\n')}
${themeBlock('light', '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${themeBlock('dark', '    ')}
  }
}


:root[data-theme='dark'] {
${themeBlock('dark', '  ')}
}
`;
writeFileSync(out, css);
console.log('Tokens generados:', out);
