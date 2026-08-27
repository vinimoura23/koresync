const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Extrai metadados (Título, Autor) e Capa de um arquivo EPUB
function parseEpub(epubFilePath, coversOutputDir) {
  try {
    if (!fs.existsSync(coversOutputDir)) {
      fs.mkdirSync(coversOutputDir, { recursive: true });
    }

    const zip = new AdmZip(epubFilePath);
    
    // 1. Ler META-INF/container.xml para descobrir onde fica o arquivo .opf
    const containerEntry = zip.getEntry('META-INF/container.xml');
    if (!containerEntry) {
      throw new Error('Não é um arquivo EPUB válido (falta container.xml)');
    }

    const containerXml = containerEntry.getData().toString('utf8');
    const rootfileMatch = containerXml.match(/rootfile\s+full-path="([^"]+)"/i);
    if (!rootfileMatch) {
      throw new Error('Caminho do rootfile (.opf) não encontrado no container.xml');
    }

    const opfPath = rootfileMatch[1];
    const opfEntry = zip.getEntry(opfPath);
    if (!opfEntry) {
      throw new Error(`Arquivo .opf não encontrado em: ${opfPath}`);
    }

    const opfXml = opfEntry.getData().toString('utf8');
    
    // Obter diretório base do OPF (para resolver caminhos relativos da capa)
    const opfDir = path.dirname(opfPath);

    // 2. Extrair Título e Autor usando Expressões Regulares (robusto contra namespaces)
    let title = 'Título Desconhecido';
    const titleMatch = opfXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i) || opfXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = decodeXmlEntities(titleMatch[1].trim());
    }

    let author = 'Autor Desconhecido';
    const authorMatch = opfXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i) || opfXml.match(/<creator[^>]*>([\s\S]*?)<\/creator>/i);
    if (authorMatch) {
      author = decodeXmlEntities(authorMatch[1].trim());
    }

    // 3. Tentar extrair a capa do EPUB (com validação estrita de imagens)
    let coverFilename = null;
    const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

    try {
      let coverEntry = null;

      // Helper para buscar entrada no ZIP por caminho relativo ao OPF ou absoluto no ZIP
      const findZipEntry = (href) => {
        if (!href) return null;
        const decoded = decodeURIComponent(href.trim());
        const fullPath = opfDir === '.' ? decoded : path.posix.join(opfDir, decoded);
        return zip.getEntry(fullPath) || zip.getEntry(decoded);
      };

      // Helper para extrair imagem de uma página XHTML de capa
      const extractImageFromHtml = (htmlContent, htmlEntryPath) => {
        if (!htmlContent) return null;
        const htmlDir = path.dirname(htmlEntryPath);
        // Procurar <img src="..."> ou <image xlink:href="..."> / <image href="...">
        const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                         htmlContent.match(/<image[^>]+xlink:href=["']([^"']+)["']/i) ||
                         htmlContent.match(/<image[^>]+href=["']([^"']+)["']/i);
        if (imgMatch) {
          const imgHref = decodeURIComponent(imgMatch[1].trim());
          const fullImgPath = htmlDir === '.' ? imgHref : path.posix.join(htmlDir, imgHref);
          return zip.getEntry(fullImgPath) || zip.getEntry(imgHref);
        }
        return null;
      };

      // Método 1: <item properties="cover-image" ... />
      const propMatch = opfXml.match(/<item[^>]+properties=["'][^"']*cover-image[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
                        opfXml.match(/<item[^>]+href=["']([^"']+)["'][^>]+properties=["'][^"']*cover-image[^"']*["']/i);
      if (propMatch) {
        coverEntry = findZipEntry(propMatch[1]);
      }

      // Método 2: <meta name="cover" content="id-da-capa" />
      if (!coverEntry) {
        const metaMatch = opfXml.match(/<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i) ||
                          opfXml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']cover["']/i);
        if (metaMatch) {
          const coverId = metaMatch[1];
          const itemRegex = new RegExp(`<item[^>]+id=["']${escapeRegExp(coverId)}["'][^>]+href=["']([^"']+)["'][^>]*>`, 'i');
          const itemMatch = opfXml.match(itemRegex);
          if (itemMatch) {
            const candidateEntry = findZipEntry(itemMatch[1]);
            if (candidateEntry) {
              const ext = path.extname(candidateEntry.entryName).toLowerCase();
              if (validImageExts.includes(ext)) {
                coverEntry = candidateEntry;
              } else if (['.html', '.xhtml', '.xml', '.htm'].includes(ext)) {
                // É um documento HTML que encapsula a capa -> extrair a imagem interna
                coverEntry = extractImageFromHtml(candidateEntry.getData().toString('utf8'), candidateEntry.entryName);
              }
            }
          }
        }
      }

      // Método 3: Itens no manifesto com media-type="image/*" contendo "cover" no id ou href
      if (!coverEntry) {
        const allItems = opfXml.match(/<item\b[^>]+>/gi) || [];
        for (const itemTag of allItems) {
          const hrefMatch = itemTag.match(/href=["']([^"']+)["']/i);
          const typeMatch = itemTag.match(/media-type=["']([^"']+)["']/i);
          const idMatch = itemTag.match(/id=["']([^"']+)["']/i);

          if (hrefMatch && typeMatch && typeMatch[1].toLowerCase().startsWith('image/')) {
            const href = hrefMatch[1];
            const id = idMatch ? idMatch[1] : '';
            if (/cover/i.test(href) || /cover/i.test(id)) {
              coverEntry = findZipEntry(href);
              if (coverEntry) break;
            }
          }
        }
      }

      // Método 4: Varredura direta no arquivo ZIP por imagens nomeadas como cover.*
      if (!coverEntry) {
        const zipEntries = zip.getEntries();
        const coverCandidates = zipEntries.filter(e => {
          const name = path.basename(e.entryName).toLowerCase();
          return /(^|\b)(cover|capa|portada|frontcover|titlepage)\.(jpe?g|png|webp)$/i.test(name);
        });
        if (coverCandidates.length > 0) {
          // Ordenar pelo menor caminho ou maior tamanho (capas reais costumam ter mais de 20KB)
          coverCandidates.sort((a, b) => b.header.size - a.header.size);
          coverEntry = coverCandidates[0];
        }
      }

      // Se encontrou uma entrada de imagem válida no ZIP
      if (coverEntry && coverEntry.header.size > 100) {
        const ext = path.extname(coverEntry.entryName).toLowerCase() || '.jpg';
        if (validImageExts.includes(ext)) {
          const baseName = path.basename(epubFilePath, path.extname(epubFilePath));
          coverFilename = `${baseName}_cover${ext}`;
          const coverSavedPath = path.join(coversOutputDir, coverFilename);
          fs.writeFileSync(coverSavedPath, coverEntry.getData());
        }
      }
    } catch (coverErr) {
      console.warn('Erro ao tentar extrair a capa do EPUB:', coverErr.message);
    }

    return {
      title,
      author,
      coverFilename
    };

  } catch (err) {
    console.error('Erro ao analisar arquivo EPUB:', err);
    // Retornar metadados padrão se falhar por completo
    return {
      title: path.basename(epubFilePath, path.extname(epubFilePath)),
      author: 'Autor Desconhecido',
      coverFilename: null
    };
  }
}

// Auxiliares simples
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

module.exports = {
  parseEpub
};
