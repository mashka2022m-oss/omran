import { ComplexThemeConfig } from '../types';

export function hexToRgb(hex?: string | null): string {
  if (!hex) return '6, 78, 59';
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '6, 78, 59';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function lightenHex(hex?: string | null, percent = 0.2): string {
  if (!hex) return '#065f46';
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '#065f46';
  const r = Math.min(255, Math.floor(((num >> 16) & 255) + (255 - ((num >> 16) & 255)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 255) + (255 - ((num >> 8) & 255)) * percent));
  const b = Math.min(255, Math.floor((num & 255) + (255 - (num & 255)) * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function darkenHex(hex?: string | null, percent = 0.2): string {
  if (!hex) return '#022c22';
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '#022c22';
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * (1 - percent)));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * (1 - percent)));
  const b = Math.max(0, Math.floor((num & 255) * (1 - percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Checks if a complex theme config differs from the default natural platform emerald theme
 */
export function isCustomTheme(theme?: ComplexThemeConfig | null): boolean {
  if (!theme) return false;
  const p = (theme.primaryColor || '').trim().toLowerCase();
  const s = (theme.secondaryColor || '').trim().toLowerCase();
  const a = (theme.accentColor || '').trim().toLowerCase();
  const bg = (theme.backgroundColor || '').trim().toLowerCase();
  // If all match default emerald
  if (p === '#022c22' && s === '#064e3b' && a === '#fbbf24' && bg === '#022c22') {
    return false;
  }
  return true;
}

/**
 * Applies complex theme variables to document DOM if inside a complex,
 * or strictly resets to the natural platform emerald & gold colors if outside.
 */
export function applyComplexThemeToDOM(
  theme?: ComplexThemeConfig | null,
  isInsideComplex: boolean = false
): void {
  if (typeof document === 'undefined') return;

  if (isInsideComplex && theme) {
    const primary = theme.primaryColor || '#022c22';
    const secondary = theme.secondaryColor || '#064e3b';
    const accent = theme.accentColor || '#fbbf24';
    const bg = theme.backgroundColor || '#022c22';
    const card = theme.cardColor || theme.surfaceColor || secondary;
    const border = lightenHex(secondary, 0.22);
    const subtext = lightenHex(accent, 0.42);
    const text = theme.textColor || '#f0f9f6';

    const pRgb = hexToRgb(primary);
    const sRgb = hexToRgb(secondary);
    const aRgb = hexToRgb(accent);
    const bgRgb = hexToRgb(bg);
    const cardRgb = hexToRgb(card);
    const bRgb = hexToRgb(border);

    document.body.style.backgroundColor = bg;
    document.body.style.color = text;

    document.documentElement.setAttribute('data-complex-themed', 'true');
    document.documentElement.style.setProperty('--complex-primary', primary);
    document.documentElement.style.setProperty('--complex-primary-rgb', pRgb);
    document.documentElement.style.setProperty('--complex-secondary', secondary);
    document.documentElement.style.setProperty('--complex-secondary-rgb', sRgb);
    document.documentElement.style.setProperty('--complex-accent', accent);
    document.documentElement.style.setProperty('--complex-accent-rgb', aRgb);
    document.documentElement.style.setProperty('--complex-bg', bg);
    document.documentElement.style.setProperty('--complex-bg-rgb', bgRgb);
    document.documentElement.style.setProperty('--complex-card', card);
    document.documentElement.style.setProperty('--complex-card-rgb', cardRgb);
    document.documentElement.style.setProperty('--complex-border', border);
    document.documentElement.style.setProperty('--complex-border-rgb', bRgb);
    document.documentElement.style.setProperty('--complex-text', text);
    document.documentElement.style.setProperty('--complex-subtext', subtext);
  } else {
    // Natural platform theme (Emerald #022c22 & Gold #fbbf24) - outside complex
    document.body.style.backgroundColor = '#022c22';
    document.body.style.color = '#f0f9f6';

    document.documentElement.removeAttribute('data-complex-themed');
    document.documentElement.style.setProperty('--complex-primary', '#022c22');
    document.documentElement.style.setProperty('--complex-primary-rgb', '2, 44, 34');
    document.documentElement.style.setProperty('--complex-secondary', '#064e3b');
    document.documentElement.style.setProperty('--complex-secondary-rgb', '6, 78, 59');
    document.documentElement.style.setProperty('--complex-accent', '#fbbf24');
    document.documentElement.style.setProperty('--complex-accent-rgb', '251, 191, 36');
    document.documentElement.style.setProperty('--complex-bg', '#022c22');
    document.documentElement.style.setProperty('--complex-bg-rgb', '2, 44, 34');
    document.documentElement.style.setProperty('--complex-card', '#064e3b');
    document.documentElement.style.setProperty('--complex-card-rgb', '6, 78, 59');
    document.documentElement.style.setProperty('--complex-border', '#065f46');
    document.documentElement.style.setProperty('--complex-border-rgb', '6, 95, 70');
    document.documentElement.style.setProperty('--complex-text', '#f0f9f6');
    document.documentElement.style.setProperty('--complex-subtext', '#86efac');
  }
}
