const fs = require('fs');
const path = require('path');

/**
 * Busca e baixa capas oficiais de alta resolução em serviços públicos de livros
 * (Apple Books, Open Library e Google Books) sem necessidade de chaves de API pagas.
 */

// Limpa strings de títulos removendo tags de releases e caracteres desnecessários
function cleanSearchQuery(title, author) {
  let cleanTitle = (title || '')
    .replace(/\s*\([^)]*z-library[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*z-library[^\]]*\]/gi, '')
    .replace(/\s*\([^)]*coleção[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*coleção[^\]]*\]/gi, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let cleanAuthor = (author || '')
    .replace(/\s*\([^)]*\)/gi, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (cleanAuthor.toLowerCase().includes('desconhecido')) {
    cleanAuthor = '';
  }

  return { cleanTitle, cleanAuthor };
}

// 1. Busca no Apple Books (iTunes Search API)
async function searchAppleBooks(cleanTitle, cleanAuthor) {
  try {
    const term = cleanAuthor ? `${cleanTitle} ${cleanAuthor}` : cleanTitle;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=ebook&country=BR&limit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      if (match.artworkUrl100) {
        // Obter capa de alta resolução (800x800 ou 1200x1200)
        const hdUrl = match.artworkUrl100.replace('100x100bb', '800x800bb');
        return {
          source: 'Apple Books',
          imageUrl: hdUrl,
          title: match.trackName,
          author: match.artistName
        };
      }
    }
  } catch (_) {}
  return null;
}

// 2. Busca no Open Library (Internet Archive)
async function searchOpenLibrary(cleanTitle, cleanAuthor) {
  try {
    const q = cleanAuthor ? `${cleanTitle} ${cleanAuthor}` : cleanTitle;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KoreSync/1.0 (https://github.com/vinimoura23/koresync)' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.docs && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.cover_i) {
          return {
            source: 'Open Library',
            imageUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
            title: doc.title,
            author: doc.author_name ? doc.author_name[0] : ''
          };
        }
      }
    }
  } catch (_) {}
  return null;
}

// 3. Busca no Google Books API (Fallback)
async function searchGoogleBooks(cleanTitle, cleanAuthor) {
  try {
    const q = cleanAuthor ? `intitle:${cleanTitle} inauthor:${cleanAuthor}` : cleanTitle;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        const info = item.volumeInfo || {};
        if (info.imageLinks) {
          let img = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail;
          if (img) {
            img = img.replace(/^http:/, 'https:').replace('&edge=curl', '');
            return {
              source: 'Google Books',
              imageUrl: img,
              title: info.title,
              author: info.authors ? info.authors[0] : ''
            };
          }
        }
      }
    }
  } catch (_) {}
  return null;
}

// Busca unificada com fallback em cascata
async function findOnlineCover(title, author) {
  const { cleanTitle, cleanAuthor } = cleanSearchQuery(title, author);
  if (!cleanTitle) return null;

  // Prioridade 1: Apple Books (Excelente precisão em PT-BR e alta resolução)
  let match = await searchAppleBooks(cleanTitle, cleanAuthor);
  if (match) return match;

  // Prioridade 2: Open Library (Base global aberta)
  match = await searchOpenLibrary(cleanTitle, cleanAuthor);
  if (match) return match;

  // Prioridade 3: Google Books (Fallback)
  match = await searchGoogleBooks(cleanTitle, cleanAuthor);
  if (match) return match;

  return null;
}

// Baixa uma imagem e salva no disco
async function downloadCoverImage(imageUrl, destPath) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (KoreSync)' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return false;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validação mínima de tamanho (mais de 1KB para garantir que não é pixel transparente)
    if (buffer.length < 1000) return false;

    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.warn('Erro ao baixar imagem de capa:', err.message);
    return false;
  }
}

// Busca e aplica capa oficial a um livro no banco
async function fetchAndApplyCover(book, coversDir) {
  if (!book || !book.id) return { success: false, error: 'Livro inválido' };

  const match = await findOnlineCover(book.title, book.author);
  if (!match || !match.imageUrl) {
    return { success: false, error: 'Nenhuma capa encontrada online para este livro' };
  }

  const ext = '.jpg';
  const coverFilename = `${book.id}_cover${ext}`;
  const coverPath = path.join(coversDir, coverFilename);

  const downloaded = await downloadCoverImage(match.imageUrl, coverPath);
  if (!downloaded) {
    return { success: false, error: 'Falha ao baixar o arquivo da capa' };
  }

  return {
    success: true,
    coverFilename,
    source: match.source,
    matchedTitle: match.title
  };
}

module.exports = {
  findOnlineCover,
  downloadCoverImage,
  fetchAndApplyCover
};
