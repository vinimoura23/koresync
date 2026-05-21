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

    // 3. Tentar extrair a capa do EPUB
    let coverFilename = null;
    let coverSavedPath = null;
    
    try {
      let coverHref = null;

      // Método A: Procurar <meta name="cover" content="id-da-capa" />
      const coverMetaMatch = opfXml.match(/<meta[^>]+name=["']cover["'][^>]+content=["']([^"']+)["']/i) || 
                             opfXml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']cover["']/i);
      
      if (coverMetaMatch) {
        const coverId = coverMetaMatch[1];
        // Buscar o item no manifest com esse ID
        const itemRegex = new RegExp(`<item[^>]+id=["']${escapeRegExp(coverId)}["'][^>]+href=["']([^"']+)["']`, 'i');
        const itemMatch = opfXml.match(itemRegex);
        if (itemMatch) {
          coverHref = itemMatch[1];
        }
      }

      // Método B: Se não achou, procurar no manifest itens com properties="cover-image"
      if (!coverHref) {
        const propertyCoverMatch = opfXml.match(/<item[^>]+properties=["']cover-image["'][^>]+href=["']([^"']+)["']/i) ||
                                   opfXml.match(/<item[^>]+href=["']([^"']+)["'][^>]+properties=["']cover-image["']/i);
        if (propertyCoverMatch) {
          coverHref = propertyCoverMatch[1];
        }
      }

      // Método C: Fallback para itens com id ou href que contenham "cover"
      if (!coverHref) {
        const fallbackCoverMatch = opfXml.match(/<item[^>]+id=["'][^"']*cover[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
                                   opfXml.match(/<item[^>]+href=["']([^"']+)["'][^>]+id=["'][^"']*cover[^"']*["']/i);
        if (fallbackCoverMatch) {
          coverHref = fallbackCoverMatch[1];
        }
      }

      // Se encontrou uma capa, extrair do ZIP
      if (coverHref) {
        // Descodificar URL-encode no href da capa (ex: %20 -> espaço)
        coverHref = decodeURIComponent(coverHref);
        
        // Resolver o caminho da capa em relação ao diretório do OPF
        const fullCoverPath = opfDir === '.' ? coverHref : path.posix.join(opfDir, coverHref);
        
        const coverEntry = zip.getEntry(fullCoverPath);
        if (coverEntry) {
          const fileExt = path.extname(coverHref) || '.jpg';
          // Gerar nome único baseado no arquivo EPUB
          const baseName = path.basename(epubFilePath, path.extname(epubFilePath));
          coverFilename = `${baseName}_cover${fileExt}`;
          coverSavedPath = path.join(coversOutputDir, coverFilename);
          
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
