/**
 * Gerador de Capas Elegantes (Smart Covers) para o KoreSync
 * Gera capas editoriais em SVG de alta definição de forma procedural e determinística.
 */

// Paletas editoriais refinadas com tons clássicos, modernos e escuros
const PALETTES = [
  {
    name: 'Midnight Sapphire',
    bg1: '#0f172a',
    bg2: '#1e3a8a',
    accent: '#60a5fa',
    gold: '#fbbf24',
    text: '#f8fafc',
    subtext: '#94a3b8'
  },
  {
    name: 'Emerald Forest',
    bg1: '#064e3b',
    bg2: '#047857',
    accent: '#34d399',
    gold: '#fef08a',
    text: '#f0fdf4',
    subtext: '#a7f3d0'
  },
  {
    name: 'Warm Terracotta',
    bg1: '#7c2d12',
    bg2: '#c2410c',
    accent: '#fdba74',
    gold: '#fef3c7',
    text: '#fff7ed',
    subtext: '#fed7aa'
  },
  {
    name: 'Plum Velvet',
    bg1: '#4a044e',
    bg2: '#701a75',
    accent: '#e879f9',
    gold: '#fde047',
    text: '#fdf4ff',
    subtext: '#f5d0fe'
  },
  {
    name: 'Crimson Bordeaux',
    bg1: '#450a0a',
    bg2: '#881337',
    accent: '#f43f5e',
    gold: '#fef08a',
    text: '#fff1f2',
    subtext: '#fecdd3'
  },
  {
    name: 'Nordic Slate',
    bg1: '#18181b',
    bg2: '#27272a',
    accent: '#a1a1aa',
    gold: '#e4e4e7',
    text: '#fafafa',
    subtext: '#a1a1aa'
  },
  {
    name: 'Royal Indigo',
    bg1: '#1e1b4b',
    bg2: '#3730a3',
    accent: '#818cf8',
    gold: '#fde047',
    text: '#eef2ff',
    subtext: '#c7d2fe'
  },
  {
    name: 'Amber Copper',
    bg1: '#451a03',
    bg2: '#78350f',
    accent: '#f59e0b',
    gold: '#fde68a',
    text: '#fffbeb',
    subtext: '#fcd34d'
  },
  {
    name: 'Deep Teal',
    bg1: '#134e4a',
    bg2: '#0f766e',
    accent: '#2dd4bf',
    gold: '#fef08a',
    text: '#f0fdfa',
    subtext: '#99f6e4'
  },
  {
    name: 'Obsidian Gold',
    bg1: '#09090b',
    bg2: '#18181b',
    accent: '#d97706',
    gold: '#fbbf24',
    text: '#fafaf9',
    subtext: '#d6d3d1'
  }
];

// Padrões de Arte/Ornamento geométrico minimalista
const ORNAMENTS = ['circle', 'diamond', 'book', 'feather', 'sun'];

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

// Quebra inteligente de texto em linhas com limite
function wrapText(text, maxCharsPerLine = 16, maxLines = 4) {
  if (!text) return ['Sem Título'];
  const words = text.trim().split(/\s+/);
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

  // Cálculo dinâmico do tamanho de fonte do título
  const titleLines = wrapText(safeTitle, 15, 4);
  let titleFontSize = 26;
  if (titleLines.length === 1 && safeTitle.length < 12) titleFontSize = 32;
  else if (titleLines.length >= 3) titleFontSize = 22;
  else if (titleLines.length >= 4) titleFontSize = 19;

  const lineHeight = titleFontSize * 1.25;
  const startY = 320 - ((titleLines.length - 1) * lineHeight) / 2;

  // Renderizar ornamentos
  let ornamentSvg = '';
  if (ornament === 'book') {
    ornamentSvg = `
      <g transform="translate(200, 150) scale(1.4)" stroke="${palette.gold}" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-16 -8 C-8 -12 0 -8 0 8 C0 -8 8 -12 16 -8 L16 14 C8 10 0 14 0 6 C0 14 -8 10 -16 14 Z" opacity="0.9"/>
        <line x1="0" y1="-8" x2="0" y2="6" opacity="0.9"/>
      </g>
    `;
  } else if (ornament === 'diamond') {
    ornamentSvg = `
      <g transform="translate(200, 150)">
        <polygon points="0,-16 16,0 0,16 -16,0" fill="none" stroke="${palette.gold}" stroke-width="1.5" opacity="0.85"/>
        <circle cx="0" cy="0" r="4" fill="${palette.gold}" opacity="0.9"/>
      </g>
    `;
  } else if (ornament === 'sun') {
    ornamentSvg = `
      <g transform="translate(200, 150)">
        <circle cx="0" cy="0" r="12" fill="none" stroke="${palette.gold}" stroke-width="1.5" opacity="0.85"/>
        <circle cx="0" cy="0" r="5" fill="${palette.gold}" opacity="0.9"/>
      </g>
    `;
  } else {
    // Circle clássico
    ornamentSvg = `
      <g transform="translate(200, 150)">
        <circle cx="0" cy="0" r="14" fill="none" stroke="${palette.gold}" stroke-width="1.5" stroke-dasharray="2 3" opacity="0.8"/>
        <circle cx="0" cy="0" r="6" fill="${palette.gold}" opacity="0.85"/>
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

    <!-- Sombra Suave -->
    <filter id="shadow-${hash}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Fundo com Gradiente -->
  <rect width="400" height="600" fill="url(#bg-grad-${hash})"/>

  <!-- Textura da Lombada (Efeito Livro Físico) -->
  <rect x="0" y="0" width="16" height="600" fill="rgba(0,0,0,0.25)"/>
  <line x1="16" y1="0" x2="16" y2="600" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- Moldura Decorativa Externa -->
  <rect x="28" y="28" width="344" height="544" rx="4" fill="none" stroke="${palette.gold}" stroke-width="1.2" opacity="0.45"/>
  <rect x="34" y="34" width="332" height="532" rx="2" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>

  <!-- Cantos Decorativos -->
  <circle cx="28" cy="28" r="3" fill="${palette.gold}" opacity="0.6"/>
  <circle cx="372" cy="28" r="3" fill="${palette.gold}" opacity="0.6"/>
  <circle cx="28" cy="572" r="3" fill="${palette.gold}" opacity="0.6"/>
  <circle cx="372" cy="572" r="3" fill="${palette.gold}" opacity="0.6"/>

  <!-- Selo Superior (KoreSync Classics) -->
  <text x="200" y="76" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="700" fill="${palette.gold}" text-anchor="middle" letter-spacing="3" opacity="0.85">
    KORESYNC EDITION
  </text>
  <line x1="150" y1="90" x2="250" y2="90" stroke="${palette.gold}" stroke-width="0.8" opacity="0.4"/>

  <!-- Ornamento Central Superior -->
  ${ornamentSvg}

  <!-- Título do Livro -->
  <g filter="url(#shadow-${hash})">
    <text font-family="'Georgia', 'Merriweather', serif" font-size="${titleFontSize}" font-weight="700" fill="${palette.text}" text-anchor="middle" letter-spacing="0.5">
      ${titleTspans}
    </text>
  </g>

  <!-- Divisor Floral / Geométrico Inferior -->
  <g transform="translate(200, 460)">
    <line x1="-40" y1="0" x2="-8" y2="0" stroke="${palette.gold}" stroke-width="1" opacity="0.5"/>
    <circle cx="0" cy="0" r="3" fill="${palette.gold}" opacity="0.8"/>
    <line x1="8" y1="0" x2="40" y2="0" stroke="${palette.gold}" stroke-width="1" opacity="0.5"/>
  </g>

  <!-- Autor do Livro -->
  <text x="200" y="505" font-family="'Inter', -apple-system, sans-serif" font-size="12" font-weight="600" fill="${palette.subtext}" text-anchor="middle" letter-spacing="2">
    ${escapeXml(safeAuthor.toUpperCase())}
  </text>
</svg>`;
}

module.exports = {
  generateCoverSvg
};
