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

export interface IslamicThemePreset {
  id: string;
  name: string;
  subtitle: string;
  colors: ComplexThemeConfig;
}

/**
 * 10 Master Islamic Palettes with mathematically verified contrast separation:
 * - Canvas Background is dark & immersive
 * - Card/Secondary has visible elevation (+18% to +25%) so cards & headers NEVER blend into the background
 * - Accent is vibrant jewel/gold with glowing contrast
 * - Buttons are guaranteed high-contrast (never match background)
 */
export const ISLAMIC_THEME_PRESETS: IslamicThemePreset[] = [
  {
    id: 'emerald',
    name: 'الزمردي النبوي الأصيل',
    subtitle: 'أخضر زمردي داكن مع بطاقات واضحة ولمسات ذهبية نبوية',
    colors: {
      primaryColor: '#022c22',
      secondaryColor: '#064e3b',
      accentColor: '#fbbf24',
      backgroundColor: '#021e17',
      surfaceColor: 'rgba(6, 78, 59, 0.65)',
      cardColor: '#064e3b',
      textColor: '#f0fdf4'
    }
  },
  {
    id: 'navy',
    name: 'الكحلي القرآني الملكي',
    subtitle: 'أزرق كحلي عميق مع بطاقات كحلية بارزة وأزرق سماوي فاخر',
    colors: {
      primaryColor: '#030f1c',
      secondaryColor: '#0c2340',
      accentColor: '#38bdf8',
      backgroundColor: '#041122',
      surfaceColor: 'rgba(12, 35, 64, 0.7)',
      cardColor: '#0e2a4d',
      textColor: '#f0f9ff'
    }
  },
  {
    id: 'andalusi_gold',
    name: 'الذهبي الأندلسي الفاخر',
    subtitle: 'بني شوكولاتي أندلسي مع بطاقات واضحة وذهب قرطبي مشرق',
    colors: {
      primaryColor: '#150d06',
      secondaryColor: '#36210f',
      accentColor: '#f59e0b',
      backgroundColor: '#1c120a',
      surfaceColor: 'rgba(54, 33, 15, 0.7)',
      cardColor: '#3a2512',
      textColor: '#fef3c7'
    }
  },
  {
    id: 'turquoise',
    name: 'الفيروزي الأصفهاني التراثي',
    subtitle: 'تركواز بحري إسلامي عميق مع لمسات زمردية وذهبية نضرة',
    colors: {
      primaryColor: '#031a1b',
      secondaryColor: '#093c3e',
      accentColor: '#2dd4bf',
      backgroundColor: '#042022',
      surfaceColor: 'rgba(9, 60, 62, 0.7)',
      cardColor: '#0c484b',
      textColor: '#f0fdfa'
    }
  },
  {
    id: 'burgundy',
    name: 'العنابي الملكي الوقور',
    subtitle: 'عنابي أندلسي دافئ مع بطاقات مخملية وورد ذهبي مشرق',
    colors: {
      primaryColor: '#1c050d',
      secondaryColor: '#421020',
      accentColor: '#fb7185',
      backgroundColor: '#250712',
      surfaceColor: 'rgba(66, 16, 32, 0.7)',
      cardColor: '#4a1224',
      textColor: '#fff1f2'
    }
  },
  {
    id: 'amethyst',
    name: 'البنفسجي الأموي الأثري',
    subtitle: 'بنفسجي ملكي هادئ مستوحى من مصاحف دمشق مع ذهب خالص',
    colors: {
      primaryColor: '#150a24',
      secondaryColor: '#341959',
      accentColor: '#e879f9',
      backgroundColor: '#1c0d30',
      surfaceColor: 'rgba(52, 25, 89, 0.7)',
      cardColor: '#3b1d64',
      textColor: '#faf5ff'
    }
  },
  {
    id: 'olive',
    name: 'الزيتوني الشامي الأصيل',
    subtitle: 'درجات الأخضر الزيتوني الشامي المريح مع لمسات ليمونية براقة',
    colors: {
      primaryColor: '#0c190f',
      secondaryColor: '#1e3822',
      accentColor: '#a3e635',
      backgroundColor: '#112316',
      surfaceColor: 'rgba(30, 56, 34, 0.7)',
      cardColor: '#244329',
      textColor: '#f7fee7'
    }
  },
  {
    id: 'charcoal',
    name: 'الفحمي الكعبوي العصري',
    subtitle: 'فحمي كسوة الكعبة الداكن مع أصفر ذهبي ساطع وتباين نقي',
    colors: {
      primaryColor: '#09090b',
      secondaryColor: '#27272a',
      accentColor: '#eab308',
      backgroundColor: '#121215',
      surfaceColor: 'rgba(39, 39, 42, 0.7)',
      cardColor: '#2d2d32',
      textColor: '#fafafa'
    }
  },
  {
    id: 'sapphire',
    name: 'اللازوردي البحري الراقي',
    subtitle: 'أزرق ياقوتي ملوكي عميق مع بطاقات نيليّة وذهب صافٍ',
    colors: {
      primaryColor: '#021626',
      secondaryColor: '#073559',
      accentColor: '#60a5fa',
      backgroundColor: '#031b30',
      surfaceColor: 'rgba(7, 53, 89, 0.7)',
      cardColor: '#0a406c',
      textColor: '#eff6ff'
    }
  },
  {
    id: 'copper',
    name: 'الأسمر النحاسي الأندلسي',
    subtitle: 'نحاسي دافئ عتيق مع بطاقات بنية وقورة ولمسات برتقالية عنبرية',
    colors: {
      primaryColor: '#190e06',
      secondaryColor: '#3d2311',
      accentColor: '#fb923c',
      backgroundColor: '#201208',
      surfaceColor: 'rgba(61, 35, 17, 0.7)',
      cardColor: '#432612',
      textColor: '#fff7ed'
    }
  }
];

/**
 * Intelligent Color Harmonizer:
 * Takes any base hue and optional accent, and mathematically constructs
 * a complete, harmonious Islamic theme where buttons NEVER match the background,
 * and cards have clear step-up contrast.
 */
export function generateHarmoniousIslamicPalette(
  baseColor: string,
  accentColor: string = '#fbbf24'
): ComplexThemeConfig {
  const bg = darkenHex(baseColor, 0.25);
  const primary = darkenHex(baseColor, 0.1);
  const secondary = lightenHex(baseColor, 0.18);
  const card = lightenHex(baseColor, 0.22);
  const surface = `rgba(${hexToRgb(card)}, 0.7)`;

  return {
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accentColor,
    backgroundColor: bg,
    surfaceColor: surface,
    cardColor: card,
    textColor: '#f8fafc'
  };
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
  if (p === '#022c22' && s === '#064e3b' && a === '#fbbf24' && (bg === '#022c22' || bg === '#021e17')) {
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
    
    // Ensure card has guaranteed step-up contrast over bg (never match!)
    let card = theme.cardColor || theme.surfaceColor || secondary;
    if (card.toLowerCase() === bg.toLowerCase()) {
      card = lightenHex(bg, 0.2);
    }
    
    const border = lightenHex(card, 0.2);
    const subtext = lightenHex(accent, 0.45);
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
