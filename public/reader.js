// Lógica do Web Reader com sincronização KOReader

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar Autenticação
  const username = localStorage.getItem('koresync_user');
  const authKey = localStorage.getItem('koresync_auth_key');

  if (!username || !authKey) {
    window.location.href = 'index.html';
    return;
  }

  // 2. Obter parâmetros do livro
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  if (!bookId) {
    alert('Nenhum livro selecionado!');
    window.location.href = 'index.html';
    return;
  }

  // Elementos do DOM
  const backBtn = document.getElementById('back-btn');
  const bookTitleEl = document.getElementById('book-title');
  const bookAuthorEl = document.getElementById('book-author');
  const syncStatusEl = document.getElementById('sync-status');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const percentageIndicator = document.getElementById('percentage-indicator');
  const pageIndicator = document.getElementById('page-indicator');
  const fontDecreaseBtn = document.getElementById('font-decrease');
  const fontIncreaseBtn = document.getElementById('font-increase');
  const viewerEl = document.getElementById('viewer');
  const layoutToggleBtn = document.getElementById('layout-toggle');
  const fullscreenToggleBtn = document.getElementById('fullscreen-toggle');

  // Variáveis do Leitor
  let book = null;
  let rendition = null;
  let currentPercentage = 0;
  let currentSpineIndex = 0;
  let fontSizePercent = parseInt(localStorage.getItem('koresync_font_size')) || 100;
  let currentTheme = localStorage.getItem('koresync_theme') || 'light';
  let currentSpread = localStorage.getItem('koresync_spread') || 'none';
  if (currentSpread === 'auto') currentSpread = 'none'; // migrar valor legado
  let saveProgressTimeout = null;
  let initialLocationLoaded = false;
  let serverProgress = null;

  // Atualizar botão de layout inicial
  updateLayoutButton();

  function updateLayoutButton() {
    const iconEl = layoutToggleBtn.querySelector('.material-symbols-outlined');
    if (currentSpread === 'none') {
      iconEl.textContent = 'menu_book';
      layoutToggleBtn.title = 'Alternar para Página Dupla';
      viewerEl.classList.remove('spread-layout');
    } else {
      iconEl.textContent = 'article';
      layoutToggleBtn.title = 'Alternar para Página Única';
      viewerEl.classList.add('spread-layout');
    }
  }

  // Botão Voltar
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Configurações de Cabeçalho do Request
  const headers = {
    'Accept': 'application/vnd.koreader.v1+json',
    'x-auth-user': username,
    'x-auth-key': authKey
  };

  // Carregar dados iniciais e progresso do servidor
  try {
    showSyncStatus('cloud_sync', 'Obtendo progresso...', 'syncing');
    
    // Obter progresso
    const progRes = await fetch(`/syncs/progress/${bookId}`, { headers });
    if (progRes.ok) {
      serverProgress = await progRes.json();
    }
  } catch (err) {
    console.warn('Não foi possível obter o progresso do servidor (offline?)', err);
  }

  // 3. Inicializar e carregar o livro
  try {
    const bookUrl = `/books/${bookId}/book.epub`;
    book = ePub(bookUrl, { openAs: 'epub' });

    // Carregar metadados
    book.loaded.metadata.then(meta => {
      bookTitleEl.textContent = meta.title || 'Livro Sem Título';
      bookAuthorEl.textContent = meta.creator || 'Autor Desconhecido';
      document.title = `${meta.title} - Leitor KoreSync`;
    });

    // Configurar Rendition
    rendition = book.renderTo('viewer', {
      width: '100%',
      height: '100%',
      spread: currentSpread, // página única ou dupla configurável
      allowScriptedContent: true
    });

    // MutationObserver para monitorar e aplicar o tema instantaneamente a qualquer iframe criado ou alterado no viewer
    const observer = new MutationObserver(() => {
      applyIframeThemeDirectly(currentTheme);
    });
    observer.observe(viewerEl, { childList: true, subtree: true });

    // Registrar Temas com transparência e cores de texto com alta especificidade
    rendition.themes.register('light', {
      'body': { 'background-color': 'transparent !important', 'background': 'transparent !important', 'color': '#111111 !important', 'font-family': 'Inter, sans-serif !important', 'line-height': '1.6 !important' },
      'p': { 'color': '#111111 !important' },
      'span': { 'color': '#111111 !important' },
      'li': { 'color': '#111111 !important' },
      'h1': { 'color': '#111111 !important' },
      'h2': { 'color': '#111111 !important' },
      'h3': { 'color': '#111111 !important' },
      'h4': { 'color': '#111111 !important' },
      'h5': { 'color': '#111111 !important' },
      'h6': { 'color': '#111111 !important' },
      'a': { 'color': '#1a73e8 !important' }
    });
    rendition.themes.register('sepia', {
      'body': { 'background-color': 'transparent !important', 'background': 'transparent !important', 'color': '#5f4b32 !important', 'font-family': 'Inter, sans-serif !important', 'line-height': '1.6 !important' },
      'p': { 'color': '#5f4b32 !important' },
      'span': { 'color': '#5f4b32 !important' },
      'li': { 'color': '#5f4b32 !important' },
      'h1': { 'color': '#5f4b32 !important' },
      'h2': { 'color': '#5f4b32 !important' },
      'h3': { 'color': '#5f4b32 !important' },
      'h4': { 'color': '#5f4b32 !important' },
      'h5': { 'color': '#5f4b32 !important' },
      'h6': { 'color': '#5f4b32 !important' },
      'a': { 'color': '#805929 !important' }
    });
    rendition.themes.register('dark', {
      'body': { 'background-color': 'transparent !important', 'background': 'transparent !important', 'color': '#e0e0e0 !important', 'font-family': 'Inter, sans-serif !important', 'line-height': '1.6 !important' },
      'p': { 'color': '#e0e0e0 !important' },
      'span': { 'color': '#e0e0e0 !important' },
      'li': { 'color': '#e0e0e0 !important' },
      'h1': { 'color': '#e0e0e0 !important' },
      'h2': { 'color': '#e0e0e0 !important' },
      'h3': { 'color': '#e0e0e0 !important' },
      'h4': { 'color': '#e0e0e0 !important' },
      'h5': { 'color': '#e0e0e0 !important' },
      'h6': { 'color': '#e0e0e0 !important' },
      'a': { 'color': '#8ab4f8 !important' }
    });

    // Hook para garantir que qualquer novo capítulo carregado no iframe seja transparente e herde as cores
    rendition.hooks.content.register((contents) => {
      contents.addRules({
        "html": {
          "background": "transparent !important",
          "background-color": "transparent !important"
        },
        "body": {
          "background": "transparent !important",
          "background-color": "transparent !important"
        }
      });
      // Reaplica o tema atual no epubJS
      rendition.themes.select(currentTheme);
      
      // Injeta diretamente as regras de estilo via DOM no novo iframe
      setTimeout(() => {
        applyIframeThemeDirectly(currentTheme);
      }, 50);
    });

    // Aplicar configurações salvas
    applyTheme(currentTheme);
    applyFontSize();

    // 4. Determinar a localização inicial (Sincronizada ou Início)
    let initialLocation = undefined;
    let fragmentIndex = -1;
    let relativePath = '';

    try {
      if (serverProgress && serverProgress.percentage > 0) {
        console.log('Progresso do servidor carregado:', serverProgress);
        
        // Aguarda a espinha (spine) do livro estar completamente carregada
        if (book.loaded && book.loaded.spine) {
          await book.loaded.spine;
        }

        // Tentar resolver o progresso para um capítulo/localização
        let resolvedLocation = null;

        if (serverProgress.progress) {
          // Padrão 1: Web Reader / KOReader padrão (ex: DocFragment[6])
          const match1 = serverProgress.progress.match(/DocFragment\[(\d+)\]/i);
          // Padrão 2: KOReader simplificado (ex: _doc_fragment_(\d+)_ ou #_doc_fragment_(\d+))
          const match2 = serverProgress.progress.match(/_doc_fragment_(\d+)_/i) || serverProgress.progress.match(/_doc_fragment_(\d+)/i);
          // Padrão 3: Qualquer número sequencial associado a DocFragment
          const match3 = serverProgress.progress.match(/DocFragment(\d+)/i);

          if (match1) {
            fragmentIndex = parseInt(match1[1]) - 1;
          } else if (match2) {
            fragmentIndex = parseInt(match2[1]) - 1;
          } else if (match3) {
            fragmentIndex = parseInt(match3[1]) - 1;
          }

          // Extrair caminho relativo do XPointer após a tag body do fragmento
          const bodyMatch = serverProgress.progress.match(/\/body\/DocFragment\[\d+\]\/body(.*)/i) || 
                            serverProgress.progress.match(/\/body\/DocFragment\d+\/body(.*)/i) ||
                            serverProgress.progress.match(/_doc_fragment_\d+_(.*)/i);
          if (bodyMatch) {
            relativePath = bodyMatch[1];
          }

          if (book.spine && book.spine.spineItems && fragmentIndex >= 0 && fragmentIndex < book.spine.spineItems.length) {
            const item = book.spine.get(fragmentIndex);
            if (item) {
              resolvedLocation = item.href;
              console.log(`Localização resolvida por fragmento (capítulo): ${fragmentIndex} (${resolvedLocation}), caminho relativo: "${relativePath}"`);
            }
          }
        }

        // Fallback robusto por porcentagem aproximada (sem bloquear por geração de locations)
        if (!resolvedLocation && serverProgress.percentage > 0) {
          const estimatedIndex = Math.floor(serverProgress.percentage * (book.spine.spineItems ? book.spine.spineItems.length : 0));
          if (book.spine && book.spine.spineItems && estimatedIndex >= 0 && estimatedIndex < book.spine.spineItems.length) {
            const item = book.spine.get(estimatedIndex);
            if (item) {
              resolvedLocation = item.href;
              console.log(`Localização estimada por porcentagem (${serverProgress.percentage}): capítulo index ${estimatedIndex}`);
            }
          }
        }

        if (resolvedLocation) {
          initialLocation = resolvedLocation;
        }
      }
    } catch (syncErr) {
      console.warn('Erro ao calcular o progresso de sincronização inicial:', syncErr);
    }

    // Renderizar o livro de forma limpa exatamente uma única vez
    console.log('Renderizando o livro na localização:', initialLocation || 'início (capa)');
    await rendition.display(initialLocation);
    
    initialLocationLoaded = true;
    showSyncStatus('cloud_done', 'Sincronizado', 'done');

    // Pouso Preciso: navegar até o parágrafo/elemento exato se houver relativePath
    if (initialLocation && serverProgress && serverProgress.progress && relativePath) {
      try {
        const iframe = viewerEl.querySelector('iframe');
        if (iframe) {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc && doc.body) {
            const element = getElementByKOReaderPath(doc.body, relativePath);
            if (element && element !== doc.body) {
              console.log('Elemento de pouso preciso encontrado no DOM do iframe:', element);
              const cfiBase = book.spine.get(fragmentIndex).cfiBase;
              const cfi = book.epubcfi.generate(element, cfiBase);
              console.log('CFI gerado para pouso preciso:', cfi);
              await rendition.display(cfi);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao tentar pousar precisamente no parágrafo do XPointer:', err);
      }
    }

    // Gerar localizações em segundo plano silenciosamente
    book.ready.then(() => {
      return book.locations.generate(1024);
    }).then(() => {
      updateProgressIndicators();
    }).catch(err => {
      console.warn('Geração de localizações interrompida em segundo plano:', err);
    });

    // 5. Escutar mudança de localização para salvar progresso
    rendition.on('relocated', location => {
      if (!initialLocationLoaded) return;

      currentSpineIndex = location.start.index;
      
      if (book.locations && book.locations.length > 0) {
        currentPercentage = book.locations.percentageFromCfi(location.start.cfi);
      } else {
        // Fallback simples se localizações ainda não foram geradas
        currentPercentage = currentSpineIndex / (book.spine.spineItems ? book.spine.spineItems.length : 1);
      }

      updateProgressIndicators();
      
      // Debounce para salvar o progresso no servidor
      clearTimeout(saveProgressTimeout);
      showSyncStatus('sync', 'Salvando...', 'syncing');
      
      saveProgressTimeout = setTimeout(() => {
        saveProgressToServer(location);
      }, 1500); // Salva 1.5s após o usuário parar de mudar de página
    });

    // Garantir a injeção do tema direto quando a view terminar de renderizar
    rendition.on('rendered', (section, view) => {
      applyIframeThemeDirectly(currentTheme);
    });

  } catch (err) {
    console.error('Erro detalhado ao carregar o livro:', err);
    
    let userMsg = 'Erro desconhecido ao carregar o livro.';
    
    if (typeof ePub === 'undefined') {
      userMsg = 'A biblioteca de leitura (EpubJS) não pôde ser carregada pelo navegador.\n\n' +
                '👉 SOLUÇÃO: Como você está offline ou o cache do navegador está desatualizado, ' +
                'por favor faça um RECARREGAMENTO FORÇADO da página pressionando Ctrl + F5 ' +
                '(ou Shift + F5) no teclado para forçar o carregamento dos arquivos locais offline.';
    } else if (err.message && err.message.includes('fetch')) {
      userMsg = 'Falha ao buscar o arquivo do livro no servidor local. Verifique se o servidor está rodando ou se houve queda na conexão.';
    } else {
      userMsg = 'Erro: ' + err.message + '\n\nVerifique se o arquivo do livro EPUB importado é válido e não está corrompido.';
    }

    alert('Não foi possível abrir o livro!\n\n' + userMsg + '\n\n(Consulte o console F12 do navegador para detalhes técnicos)');
  }

  // Função para mapear localização do EpubJS para XPointer do KOReader
  function getKOReaderXPointer(location) {
    try {
      if (!location || !location.start || !location.start.cfi) {
        return `/body/DocFragment[${currentSpineIndex + 1}]/body`;
      }
      
      let element = null;

      // Usar range a partir do CFI do EpubJS (Original estável)
      const cfi = location.start.cfi;
      const range = rendition.getRange(cfi);
      if (range) {
        const startContainer = range.startContainer;
        element = startContainer.nodeType === Node.TEXT_NODE ? startContainer.parentNode : startContainer;
      }

      if (!element) {
        return `/body/DocFragment[${currentSpineIndex + 1}]/body`;
      }
      
      const paths = [];
      let current = element;
      
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        const tagName = current.tagName.toLowerCase();
        if (tagName === 'body') {
          paths.unshift('body');
          break;
        }
        
        // Contar quantos irmãos do mesmo tipo existem antes
        let index = 1;
        let sibling = current.previousSibling;
        while (sibling) {
          if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName.toLowerCase() === tagName) {
            index++;
          }
          sibling = sibling.previousSibling;
        }
        
        paths.unshift(`${tagName}[${index}]`);
        current = current.parentNode;
      }
      
      // Fallback caso não tenha conseguido rastrear até o body do iframe
      if (paths[0] !== 'body') {
        return `/body/DocFragment[${currentSpineIndex + 1}]/body`;
      }
      
      // Monta o XPath relativo ao body do subdocumento
      const relPath = paths.slice(1).join('/');
      const fullPath = `/body/DocFragment[${currentSpineIndex + 1}]/body${relPath ? '/' + relPath : ''}`;
      
      // Para p e span, adiciona /text().0 para máxima fidelidade ao CoolReader
      const currentTagName = element.tagName.toLowerCase();
      if (currentTagName === 'p' || currentTagName === 'span') {
        return `${fullPath}/text().0`;
      }
      
      return fullPath;
    } catch (err) {
      console.warn('Erro ao construir XPointer dinâmico:', err);
      return `/body/DocFragment[${currentSpineIndex + 1}]/body`;
    }
  }

  // Função para salvar progresso no servidor
  async function saveProgressToServer(location) {
    try {
      // Gerar XPointer realístico e dinâmico a partir do elemento visível
      const xpointer = getKOReaderXPointer(location);
      
      const payload = {
        document: bookId,
        percentage: currentPercentage,
        progress: xpointer,
        device: 'Web Reader',
        device_id: 'web_browser',
        timestamp: Math.floor(Date.now() / 1000)
      };

      const res = await fetch('/syncs/progress', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSyncStatus('cloud_done', 'Sincronizado', 'done');
      } else {
        showSyncStatus('cloud_off', 'Erro ao salvar', 'error');
      }
    } catch (err) {
      console.error('Erro ao conectar ao servidor para salvar progresso:', err);
      showSyncStatus('cloud_off', 'Offline (Salvo local)', 'error');
    }
  }

  // Atualizar indicadores visuais de progresso
  function updateProgressIndicators() {
    const pct = Math.round(currentPercentage * 100);
    progressBarFill.style.width = `${pct}%`;
    percentageIndicator.textContent = `${pct}%`;

    // Atualizar indicador de páginas / capítulos
    if (rendition && rendition.location) {
      const start = rendition.location.start;
      const index = start.index + 1;
      const total = book.spine.spineItems ? book.spine.spineItems.length : 0;
      pageIndicator.textContent = `Capítulo ${index} de ${total}`;
    }
  }

  // Helper para atualizar visualmente o status da sincronização
  function showSyncStatus(icon, text, className) {
    syncStatusEl.className = `sync-status ${className}`;
    syncStatusEl.querySelector('.material-symbols-outlined').textContent = icon;
    syncStatusEl.querySelector('.status-text').textContent = text;
  }

  // Controle de Navegação por Botões
  prevBtn.addEventListener('click', () => {
    if (rendition) rendition.prev();
  });

  nextBtn.addEventListener('click', () => {
    if (rendition) rendition.next();
  });

  // Navegação por Teclado (Setas Direita/Esquerda)
  document.addEventListener('keyup', e => {
    if (!rendition) return;
    if (e.key === 'ArrowLeft') {
      rendition.prev();
    } else if (e.key === 'ArrowRight') {
      rendition.next();
    }
  });

  // Controle de Tamanho da Fonte
  fontIncreaseBtn.addEventListener('click', () => {
    fontSizePercent = Math.min(fontSizePercent + 10, 200);
    applyFontSize();
    localStorage.setItem('koresync_font_size', fontSizePercent);
  });

  fontDecreaseBtn.addEventListener('click', () => {
    fontSizePercent = Math.max(fontSizePercent - 10, 60);
    applyFontSize();
    localStorage.setItem('koresync_font_size', fontSizePercent);
  });

  function applyFontSize() {
    if (rendition) {
      rendition.themes.fontSize(`${fontSizePercent}%`);
    }
  }

  // Controle de Temas
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const theme = btn.getAttribute('data-theme');
      applyTheme(theme);
      localStorage.setItem('koresync_theme', theme);
    });
  });

  function applyTheme(theme) {
    currentTheme = theme;
    
    // Atualizar botões de tema
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Atualizar cor de fundo da página e do leitor
    document.body.className = `reader-body theme-${theme}`;
    
    // Forçar aplicação direta dos estilos no iframe
    applyIframeThemeDirectly(theme);
    
    if (rendition) {
      rendition.themes.select(theme);
    }
  }

  // Função para injetar diretamente os estilos no iframe bypassando os bugs de tema do epubJS
  function applyIframeThemeDirectly(theme) {
    const themeColors = {
      light: { text: '#111111', link: '#1a73e8' },
      sepia: { text: '#5f4b32', link: '#805929' },
      dark: { text: '#e0e0e0', link: '#8ab4f8' }
    };
    
    const colors = themeColors[theme] || themeColors.light;
    const iframes = document.querySelectorAll('#viewer iframe');
    
    iframes.forEach(iframe => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;
        
        // Registrar escuta de carregamento para garantir que o estilo seja aplicado quando o iframe terminar de carregar
        if (!iframe.dataset.themedListener) {
          iframe.dataset.themedListener = 'true';
          iframe.addEventListener('load', () => {
            applyIframeThemeDirectly(currentTheme);
          });
        }
        
        let styleTag = doc.getElementById('koresync-theme-styles');
        if (!styleTag) {
          styleTag = doc.createElement('style');
          styleTag.id = 'koresync-theme-styles';
          doc.head.appendChild(styleTag);
        }
        
        styleTag.textContent = `
          html {
            background: transparent !important;
            background-color: transparent !important;
          }
          body {
            background: transparent !important;
            background-color: transparent !important;
            color: ${colors.text} !important;
            font-family: Inter, sans-serif !important;
            line-height: 1.6 !important;
          }
          /* Aumentar drasticamente a especificidade dos seletores usando o prefixo 'html body'
             para garantir o override absoluto contra qualquer estilo herdado, inline ou epubJS */
          html body,
          html body p, 
          html body span, 
          html body li, 
          html body h1, 
          html body h2, 
          html body h3, 
          html body h4, 
          html body h5, 
          html body h6, 
          html body div, 
          html body section, 
          html body article,
          html body strong,
          html body em,
          html body i,
          html body b,
          html body code,
          html body pre,
          html body blockquote {
            background-color: transparent !important;
            color: ${colors.text} !important;
          }
          html body a {
            color: ${colors.link} !important;
          }
          /* Corrigir capas e imagens esticadas (fix cover stretch) */
          img, svg {
            max-width: 100% !important;
            max-height: 82vh !important;
            height: auto !important;
            width: auto !important;
            object-fit: contain !important;
            display: block !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        `;
      } catch (err) {
        console.warn('Erro ao acessar/estilizar iframe:', err);
      }
    });
  }

  // ==========================================
  // CONTROLES DE VISUALIZAÇÃO (TELA CHEIA E LAYOUT)
  // ==========================================

  // Alternar entre Página Única e Dupla (spread)
  layoutToggleBtn.addEventListener('click', () => {
    if (!rendition) return;

    if (currentSpread === 'none') {
      currentSpread = 'always'; // 'always' = exatamente 2 colunas; 'auto' causava 3
    } else {
      currentSpread = 'none';
    }

    localStorage.setItem('koresync_spread', currentSpread);
    updateLayoutButton();
    
    // Atualiza a visualização do ePubJS
    rendition.spread(currentSpread);
    rendition.resize();
    
    // Forçar a injeção do tema direto em todos os iframes recriados após o reflow/spread
    setTimeout(() => {
      applyIframeThemeDirectly(currentTheme);
    }, 150);
  });

  // Alternar Tela Cheia nativa do navegador
  fullscreenToggleBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao ativar Tela Cheia: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Atualizar ícone de tela cheia dinamicamente
  document.addEventListener('fullscreenchange', () => {
    const iconEl = fullscreenToggleBtn.querySelector('.material-symbols-outlined');
    if (document.fullscreenElement) {
      iconEl.textContent = 'fullscreen_exit';
      fullscreenToggleBtn.title = 'Sair da Tela Cheia';
    } else {
      iconEl.textContent = 'fullscreen';
      fullscreenToggleBtn.title = 'Tela Cheia';
    }
    
    // Redimensiona o ePubJS após um pequeno delay para garantir que o DOM terminou o resize
    if (rendition) {
      setTimeout(() => {
        rendition.resize();
      }, 150);
    }
  });

  // ==========================================
  // FUNÇÕES AUXILIARES E INTERAÇÕES ADICIONAIS
  // ==========================================

  // Função para pousar no elemento exato correspondente ao XPointer do KOReader
  function getElementByKOReaderPath(bodyNode, relativePath) {
    if (!relativePath) return bodyNode;
    
    let cleanPath = relativePath.replace(/\/text\(\)\.\d+$/, '');
    cleanPath = cleanPath.replace(/^\//, '');
    if (!cleanPath) return bodyNode;
    
    const parts = cleanPath.split('/');
    let current = bodyNode;
    
    for (const part of parts) {
      if (!part) continue;
      
      const match = part.match(/^([a-zA-Z0-9:-]+)(?:\[(\d+)\])?$/);
      if (!match) continue;
      
      const tagName = match[1].toLowerCase();
      const index = match[2] ? parseInt(match[2], 10) : 1;
      
      let found = null;
      let count = 0;
      
      // Tentativa 1: Busca direta em irmãos de mesma tag
      for (let child = current.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === tagName) {
          count++;
          if (count === index) {
            found = child;
            break;
          }
        }
      }
      
      // Tentativa 2: Fallback por getElementsByTagName se não achou irmão direto
      if (!found) {
        const candidates = current.getElementsByTagName(tagName);
        if (candidates && candidates.length >= index) {
          found = candidates[index - 1];
        }
      }
      
      if (found) {
        current = found;
      } else {
        console.warn(`Parte do caminho não encontrada no DOM: ${part} dentro de`, current);
        break;
      }
    }
    
    return current;
  }

  // Lógica da Barra de Progresso Interativa (Click & Arraste)
  const progressBarContainer = document.querySelector('.reader-footer .progress-bar-container');
  let isDraggingProgressBar = false;

  function handleProgressBarInteraction(e) {
    if (!book || !rendition || !progressBarContainer) return;
    
    const rect = progressBarContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Atualização visual imediata a 60fps
    const displayPct = Math.round(pct * 100);
    progressBarFill.style.width = `${displayPct}%`;
    percentageIndicator.textContent = `${displayPct}%`;
    
    return pct;
  }

  if (progressBarContainer) {
    progressBarContainer.addEventListener('mousedown', (e) => {
      isDraggingProgressBar = true;
      handleProgressBarInteraction(e);
    });

    progressBarContainer.addEventListener('touchstart', (e) => {
      isDraggingProgressBar = true;
      handleProgressBarInteraction(e);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (!isDraggingProgressBar) return;
      handleProgressBarInteraction(e);
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDraggingProgressBar) return;
      handleProgressBarInteraction(e);
    }, { passive: true });

    const finishProgressBarDrag = (e) => {
      if (!isDraggingProgressBar) return;
      isDraggingProgressBar = false;
      
      const pct = handleProgressBarInteraction(e);
      if (pct === undefined) return;
      
      // Navegar para a porcentagem correspondente
      if (book.locations && book.locations.length > 0) {
        try {
          const cfi = book.locations.cfiFromPercentage(pct);
          rendition.display(cfi);
          console.log(`Navegando via localizações para ${Math.round(pct * 100)}%`);
        } catch (err) {
          console.warn('Erro ao navegar por CFI de localização:', err);
          fallbackPercentageNavigation(pct);
        }
      } else {
        fallbackPercentageNavigation(pct);
      }
    };

    function fallbackPercentageNavigation(pct) {
      const total = book.spine.spineItems ? book.spine.spineItems.length : 0;
      if (total > 0) {
        const idx = Math.max(0, Math.min(total - 1, Math.floor(pct * total)));
        const item = book.spine.get(idx);
        if (item) {
          rendition.display(item.href);
          console.log(`Navegando via espinha para capítulo index ${idx} (${Math.round(pct * 100)}%)`);
        }
      }
    }

    window.addEventListener('mouseup', finishProgressBarDrag);
    window.addEventListener('touchend', finishProgressBarDrag);
  }
});
