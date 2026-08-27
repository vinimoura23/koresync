/**
 * Gerador de Capas Elegantes (Smart Covers) para o KoreSync
 * Gera capas editoriais em SVG de alta definição de forma procedural e determinística.
 * Otimizado para alta legibilidade em qualquer tela (inclusive ThinkPad e notebooks).
 */

// Paletas editoriais refinadas com tons clássicos, modernos e profundos
const PALETTES = [
  {
    name: 'Midnight Sapphire',
    bg1: '#0a0f1d',
    bg2: '#1e3a8a',
    accent: '#60a5fa',
    gold: '#fbbf24',
    text: '#ffffff',
    subtext: '#bfdbfe'
  },
  {
    name: 'Emerald Forest',
    bg1: '#022c22',
    bg2: '#065f46',
    accent: '#34d399',
    gold: '#fef08a',
    text: '#ffffff',
    subtext: '#a7f3d0'
  },
  {
    name: 'Warm Terracotta',
    bg1: '#431407',
    bg2: '#9a3412',
    accent: '#fdba74',
    gold: '#fef3c7',
    text: '#ffffff',
    subtext: '#fed7aa'
  },
  {
    name: 'Plum Velvet',
    bg1: '#2e0233',
    bg2: '#581c87',
    accent: '#e879f9',
    gold: '#fde047',
    text: '#ffffff',
    subtext: '#f5d0fe'
  },
  {
    name: 'Crimson Bordeaux',
    bg1: '#310404',
    bg2: '#881337',
    accent: '#fb7185',
    gold: '#fef08a',
    text: '#ffffff',
    subtext: '#fecdd3'
  },
  {
    name: 'Nordic Slate',
    bg1: '#09090b',
    bg2: '#27272a',
    accent: '#cbd5e1',
    gold: '#e2e8f0',
    text: '#ffffff',
    subtext: '#cbd5e1'
  },
  {
    name: 'Royal Indigo',
    bg1: '#0f0e26',
    bg2: '#312e81',
    accent: '#818cf8',
    gold: '#fde047',
    text: '#ffffff',
    subtext: '#c7d2fe'
  },
  {
    name: 'Amber Copper',
    bg1: '#260e02',
    bg2: '#78350f',
    accent: '#fbbf24',
    gold: '#fef08a',
    text: '#ffffff',
    subtext: '#fde68a'
  },
  {
    name: 'Deep Teal',
    bg1: '#042f2e',
    bg2: '#115e59',
    accent: '#2dd4bf',
    gold: '#fef08a',
    text: '#ffffff',
    subtext: '#99f6e4'
  },
  {
    name: 'Obsidian Gold',
    bg1: '#09090b',
    bg2: '#1c1917',
    accent: '#d97706',
    gold: '#fbbf24',
    text: '#ffffff',
    subtext: '#e7e5e4'
  }
];

// Padrões de Arte/Ornamento geométrico minimalista
const ORNAMENTS = ['book', 'diamond', 'sun', 'circle', 'crest'];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

// Quebra inteligente de texto em linhas curtas com foco em palavras grandes e destaque
function wrapText(text, maxCharsPerLine = 13, maxLines = 4) {
  if (!text) return ['Sem Título'];
  
  // Limpar prefixos e sufixos desnecessários (como [Coleção X], (Z-Library), etc.)
  let cleanText = text
    .replace(/\s*\([^)]*z-library[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*z-library[^\]]*\]/gi, '')
    .trim();

  if (!cleanText) cleanText = text.trim();

  const words = cleanText.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Se ainda sobraram palavras além das linhas permitidas, adicionar reticências
  const totalWordsUsed = lines.reduce((acc, l) => acc + l.split(/\s+/).length, 0);
  if (totalWordsUsed < words.length && lines.length > 0) {
    lines[lines.length - 1] += '...';
  }

  return lines;
}

function generateCoverSvg(title, author, seedId = '') {
  const safeTitle = (title || 'Livro Sem Título').trim();
  const safeAuthor = (author || 'Autor Desconhecido').trim();
  const seed = `${safeTitle}_${safeAuthor}_${seedId}`;
  const hash = hashString(seed);

  const palette = PALETTES[hash % PALETTES.length];
  const ornament = ORNAMENTS[hash % ORNAMENTS.length];

  // Quebra de texto com limite menor para permitir fontes muito maiores
  const titleLines = wrapText(safeTitle, 13, 4);
  
  // Tipografia significativamente aumentada para ótima leitura em notebooks/ThinkPads
  let titleFontSize = 38;
  if (titleLines.length === 1) {
    titleFontSize = safeTitle.length <= 10 ? 44 : 38;
  } else if (titleLines.length === 2) {
    titleFontSize = 36;
  } else if (titleLines.length === 3) {
    titleFontSize = 30;
  } else {
    titleFontSize = 26;
  }

  const lineHeight = Math.round(titleFontSize * 1.22);
  const totalTextHeight = (titleLines.length - 1) * lineHeight;
  const startY = Math.round(300 - totalTextHeight / 2);

  // Renderizar ornamentos
  let ornamentSvg = '';
  if (ornament === 'book') {
    ornamentSvg = `
      <g transform="translate(200, 135) scale(1.6)" stroke="${palette.gold}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-16 -8 C-8 -12 0 -8 0 8 C0 -8 8 -12 16 -8 L16 14 C8 10 0 14 0 6 C0 14 -8 10 -16 14 Z" opacity="0.95"/>
        <line x1="0" y1="-8" x2="0" y2="6" opacity="0.95"/>
      </g>
    `;
  } else if (ornament === 'diamond') {
    ornamentSvg = `
      <g transform="translate(200, 135)">
        <polygon points="0,-18 18,0 0,18 -18,0" fill="none" stroke="${palette.gold}" stroke-width="2" opacity="0.9"/>
        <polygon points="0,-10 10,0 0,10 -10,0" fill="${palette.gold}" opacity="0.3"/>
        <circle cx="0" cy="0" r="3.5" fill="${palette.gold}"/>
      </g>
    `;
  } else if (ornament === 'sun') {
    ornamentSvg = `
      <g transform="translate(200, 135)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="${palette.gold}" stroke-width="1.8" opacity="0.9"/>
        <circle cx="0" cy="0" r="6" fill="${palette.gold}" opacity="0.95"/>
        <line x1="0" y1="-22" x2="0" y2="-18" stroke="${palette.gold}" stroke-width="2"/>
        <line x1="0" y1="18" x2="0" y2="22" stroke="${palette.gold}" stroke-width="2"/>
        <line x1="-22" y1="0" x2="-18" y2="0" stroke="${palette.gold}" stroke-width="2"/>
        <line x1="18" y1="0" x2="22" y2="0" stroke="${palette.gold}" stroke-width="2"/>
      </g>
    `;
  } else if (ornament === 'crest') {
    ornamentSvg = `
      <g transform="translate(200, 135)" stroke="${palette.gold}" fill="none" stroke-width="2">
        <path d="M-15,-10 L0,-20 L15,-10 L15,10 L0,20 L-15,10 Z" opacity="0.9"/>
        <circle cx="0" cy="0" r="5" fill="${palette.gold}"/>
      </g>
    `;
  } else {
    // Circle clássico com anéis
    ornamentSvg = `
      <g transform="translate(200, 135)">
        <circle cx="0" cy="0" r="18" fill="none" stroke="${palette.gold}" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.85"/>
        <circle cx="0" cy="0" r="11" fill="none" stroke="${palette.gold}" stroke-width="1.5" opacity="0.9"/>
        <circle cx="0" cy="0" r="4.5" fill="${palette.gold}"/>
      </g>
    `;
  }

  // Título renderizado linha a linha
  const titleTspans = titleLines.map((line, idx) => {
    return `<tspan x="200" y="${startY + idx * lineHeight}">${escapeXml(line)}</tspan>`;
  }).join('\n      ');

  // SVG de proporção clássica de livro 2:3 (400x600px)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <!-- Gradiente de Fundo Principal -->
    <linearGradient id="bg-grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bg1}"/>
      <stop offset="100%" stop-color="${palette.bg2}"/>
    </linearGradient>

    <!-- Gradiente Dourado Editorial -->
    <linearGradient id="gold-grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.gold}"/>
      <stop offset="100%" stop-color="${palette.accent}"/>
    </linearGradient>

    <!-- Sombra Forte para Alto Contraste do Título -->
    <filter id="shadow-${hash}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <!-- Fundo com Gradiente -->
  <rect width="400" height="600" fill="url(#bg-grad-${hash})"/>

  <!-- Textura da Lombada (Efeito Livro Físico) -->
  <rect x="0" y="0" width="18" height="600" fill="rgba(0,0,0,0.3)"/>
  <line x1="18" y1="0" x2="18" y2="600" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>

  <!-- Moldura Decorativa Externa com Cantos Chanfrados -->
  <rect x="26" y="26" width="348" height="548" rx="4" fill="none" stroke="${palette.gold}" stroke-width="1.8" opacity="0.6"/>
  <rect x="32" y="32" width="336" height="536" rx="2" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Cantos Decorativos Dourados -->
  <circle cx="26" cy="26" r="3.5" fill="${palette.gold}" opacity="0.8"/>
  <circle cx="374" cy="26" r="3.5" fill="${palette.gold}" opacity="0.8"/>
  <circle cx="26" cy="574" r="3.5" fill="${palette.gold}" opacity="0.8"/>
  <circle cx="374" cy="574" r="3.5" fill="${palette.gold}" opacity="0.8"/>

  <!-- Selo Superior (KoreSync Classics) -->
  <text x="200" y="70" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="800" fill="${palette.gold}" text-anchor="middle" letter-spacing="3.5" opacity="0.9">
    KORESYNC EDITION
  </text>
  <line x1="140" y1="84" x2="260" y2="84" stroke="${palette.gold}" stroke-width="1" opacity="0.5"/>

  <!-- Ornamento Central Superior -->
  ${ornamentSvg}

  <!-- Título do Livro em Destaque Alto -->
  <g filter="url(#shadow-${hash})">
    <text font-family="'Georgia', 'Merriweather', -apple-system, serif" font-size="${titleFontSize}" font-weight="800" fill="${palette.text}" text-anchor="middle" letter-spacing="0.5">
      ${titleTspans}
    </text>
  </g>

  <!-- Divisor Floral / Geométrico Inferior -->
  <g transform="translate(200, 480)">
    <line x1="-50" y1="0" x2="-10" y2="0" stroke="${palette.gold}" stroke-width="1.2" opacity="0.6"/>
    <circle cx="0" cy="0" r="3.5" fill="${palette.gold}" opacity="0.9"/>
    <line x1="10" y1="0" x2="50" y2="0" stroke="${palette.gold}" stroke-width="1.2" opacity="0.6"/>
  </g>

  <!-- Autor do Livro (Maior e mais visível) -->
  <text x="200" y="525" font-family="'Inter', -apple-system, sans-serif" font-size="15" font-weight="700" fill="${palette.subtext}" text-anchor="middle" letter-spacing="2.5">
    ${escapeXml(safeAuthor.toUpperCase())}
  </text>
</svg>`;
}

module.exports = {
  generateCoverSvg
};
