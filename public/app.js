// MD5 Hash em JavaScript Puro para bater perfeitamente com o KOReader
function md5(string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function AddUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return (x ^ y ^ z); }
  function I(x, y, z) { return (y ^ (x | (~z))); }
  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };
  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };
  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };
  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  };
  function ConvertToWordArray(string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };
  function WordToHex(lValue) {
    var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  };
  function Utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  };
  var x = Array();
  var k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  string = Utf8Encode(string);
  x = ConvertToWordArray(string);
  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = AddUnsigned(a, AA); b = AddUnsigned(b, BB); c = AddUnsigned(c, CC); d = AddUnsigned(d, DD);
  }
  var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
  return temp.toLowerCase();
}

// Lógica de Tela da Biblioteca
document.addEventListener('DOMContentLoaded', () => {
  const authScreen = document.getElementById('auth-screen');
  const mainScreen = document.getElementById('main-screen');
  const authError = document.getElementById('auth-error');

  // Abas
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');

  // Formulário de Login
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');

  // Formulário de Cadastro
  const registerForm = document.getElementById('register-form');
  const regUsernameInput = document.getElementById('reg-username');
  const regPasswordInput = document.getElementById('reg-password');
  const regConfirmInput = document.getElementById('reg-confirm');
  const registerBtn = document.getElementById('register-btn');

  // Configurações e Avatar
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const headerAvatarImg = document.getElementById('user-avatar-img');
  const headerAvatarInitials = document.getElementById('user-avatar-initials');
  const settingsAvatarPreviewImg = document.getElementById('settings-avatar-preview-img');
  const settingsAvatarPreviewInitials = document.getElementById('settings-avatar-preview-initials');
  const settingsAvatarCircle = document.getElementById('settings-avatar-preview');
  const settingsAvatarUploadBtn = document.getElementById('settings-avatar-upload-btn');
  const settingsAvatarRemoveBtn = document.getElementById('settings-avatar-remove-btn');
  const avatarFileInput = document.getElementById('avatar-file-input');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const connectionResult = document.getElementById('connection-result');
  const settingsSyncUrl = document.getElementById('settings-sync-url');
  const settingsOpdsUrl = document.getElementById('settings-opds-url');

  // Sistema de Toast Notifications (substitui alert)
  function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    if (type === 'error') iconName = 'error';

    toast.innerHTML = `
      <span class="material-symbols-outlined">${iconName}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, duration);
  }

  // Modal de Confirmação customizado (substitui confirm)
  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const confirmOkBtn = document.getElementById('confirm-ok-btn');
  let confirmCallback = null;

  function showConfirmModal({ title = 'Confirmar ação', message = 'Tem certeza?', danger = false }, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOkBtn.className = danger ? 'btn btn-primary btn-sm btn-danger' : 'btn btn-primary btn-sm';
    confirmCallback = onConfirm;
    confirmModal.classList.remove('hidden');
  }

  confirmCancelBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    confirmCallback = null;
  });

  confirmOkBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  });

  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      confirmModal.classList.add('hidden');
      confirmCallback = null;
    }
  });

  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  const searchInput = document.getElementById('search-input');
  const bookCount = document.getElementById('book-count');
  const booksGrid = document.getElementById('books-grid');
  const emptyState = document.getElementById('empty-state');

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  
  const uploadProgress = document.getElementById('upload-progress');
  const uploadFilename = document.getElementById('upload-filename');
  const uploadPercent = document.getElementById('upload-percent');
  const uploadBarFill = document.getElementById('upload-bar-fill');
  const uploadStatusText = document.getElementById('upload-status-text');

  // URL Helpers para KOReader
  const syncUrlEl = document.getElementById('koreader-sync-url');
  const opdsUrlEl = document.getElementById('koreader-opds-url');

  let booksList = [];

  // Lógica Global do Modo Escuro (Dark Mode)
  const isGlobalDarkMode = localStorage.getItem('koresync_global_dark_mode') === 'true';
  if (isGlobalDarkMode) {
    document.body.classList.add('dark-mode');
    updateDarkModeToggleIcon(true);
  } else {
    document.body.classList.remove('dark-mode');
    updateDarkModeToggleIcon(false);
  }

  darkModeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('koresync_global_dark_mode', isDark);
    updateDarkModeToggleIcon(isDark);
  });

  function updateDarkModeToggleIcon(isDark) {
    const iconSpan = darkModeToggle.querySelector('.material-symbols-outlined');
    if (iconSpan) {
      iconSpan.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
  }

  // Lógica de Troca de Abas
  function switchTab(activeTab) {
    hideError();
    if (activeTab === 'login') {
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
      tabRegister.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'false');
      panelLogin.classList.remove('hidden');
      panelRegister.classList.add('hidden');
    } else {
      tabRegister.classList.add('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabLogin.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'false');
      panelRegister.classList.remove('hidden');
      panelLogin.classList.add('hidden');
    }
  }

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  // 1. Checar Autenticação Inicial
  const savedUser = localStorage.getItem('koresync_user');
  const savedAuthKey = localStorage.getItem('koresync_auth_key');

  if (savedUser && savedAuthKey) {
    showMainScreen(savedUser);
  } else {
    showAuthScreen();
  }

  // Ações de Autenticação
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginForm.reportValidity()) return;

    const username = loginUsernameInput.value.trim();
    const passwordHash = md5(loginPasswordInput.value);

    await handleAuth('/users/auth', username, passwordHash, false);
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!registerForm.reportValidity()) return;

    if (regPasswordInput.value !== regConfirmInput.value) {
      showError('As senhas não coincidem.');
      return;
    }

    const username = regUsernameInput.value.trim();
    const passwordHash = md5(regPasswordInput.value);

    await handleAuth('/users/create', username, passwordHash, true);
  });

  async function handleAuth(url, username, passwordHash, isRegister = false) {
    hideError();
    
    try {
      const headers = {
        'Accept': 'application/vnd.koreader.v1+json',
        'Content-Type': 'application/json'
      };
      
      // Se for apenas login, as credenciais vão nos cabeçalhos x-auth
      if (!isRegister) {
        headers['x-auth-user'] = username;
        headers['x-auth-key'] = passwordHash;
      }

      const options = {
        method: isRegister ? 'POST' : 'GET',
        headers
      };

      if (isRegister) {
        options.body = JSON.stringify({ username, password: passwordHash });
      }

      const res = await fetch(url, options);

      if (res.ok) {
        // Se for registro bem sucedido, agora loga automaticamente
        if (isRegister) {
          await handleAuth('/users/auth', username, passwordHash, false);
          return;
        }

        // Login OK
        localStorage.setItem('koresync_user', username);
        localStorage.setItem('koresync_auth_key', passwordHash);
        showMainScreen(username);
      } else {
        const errData = await res.json().catch(() => ({}));
        showError(errData.error || (isRegister ? 'Erro ao cadastrar usuário' : 'Usuário ou senha incorretos'));
      }
    } catch (err) {
      console.error(err);
      showError('Erro ao conectar ao servidor local');
    }
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('koresync_user');
    localStorage.removeItem('koresync_auth_key');
    booksList = [];
    showAuthScreen();
  });

  // Mostra Telas
  function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    loginPasswordInput.value = '';
    regPasswordInput.value = '';
    regConfirmInput.value = '';
    switchTab('login');
  }

  function showMainScreen(username) {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    userDisplay.textContent = username;
    
    // Atualizar URLs baseadas no host atual do navegador
    const currentHost = window.location.host;
    const currentProtocol = window.location.protocol;
    const baseUrl = `${currentProtocol}//${currentHost}`;
    
    syncUrlEl.textContent = baseUrl;
    opdsUrlEl.textContent = `${baseUrl}/opds`;
    if (settingsSyncUrl) settingsSyncUrl.textContent = baseUrl;
    if (settingsOpdsUrl) settingsOpdsUrl.textContent = `${baseUrl}/opds`;

    loadAvatar(username);
    loadBooks();
  }

  function showError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
  }

  function hideError() {
    authError.classList.add('hidden');
  }

  // 2. Carregar Livros da API
  async function loadBooks() {
    booksGrid.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined spinner">sync</span>
        <p>Carregando sua biblioteca...</p>
      </div>
    `;

    try {
      const username = localStorage.getItem('koresync_user');
      const authKey = localStorage.getItem('koresync_auth_key');

      const res = await fetch('/api/books', {
        headers: {
          'x-auth-user': username,
          'x-auth-key': authKey
        }
      });

      if (res.ok) {
        booksList = await res.json();
        renderBooks(booksList);
      } else {
        booksGrid.innerHTML = '<p class="error-msg">Erro ao carregar livros do servidor.</p>';
      }
    } catch (err) {
      console.error(err);
      booksGrid.innerHTML = '<p class="error-msg">Servidor desconectado.</p>';
    }
  }

  // 3. Renderizar Grid de Livros
  function renderBooks(books) {
    bookCount.textContent = `${books.length} ${books.length === 1 ? 'livro' : 'livros'}`;
    
    if (books.length === 0) {
      booksGrid.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    booksGrid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    booksGrid.innerHTML = '';
    
    books.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';
      
      // Progresso lido
      const pct = book.progress ? Math.round(book.progress.percentage * 100) : 0;
      const device = book.progress ? book.progress.device : '';
      
      // Cores harmoniosas em HSL baseadas na primeira letra do título para capas sem imagem
      const hue = (book.title.charCodeAt(0) * 12) % 360;
      const letterCoverStyle = `background: linear-gradient(135deg, hsl(${hue}, 60%, 65%), hsl(${(hue+40)%360}, 65%, 45%));`;
      
      // HTML da Capa (Capa carregada ou Capa gerada em CSS)
      const coverHtml = book.hasCover
        ? `<img class="book-cover-img" src="/books/${book.id}/cover" alt="Capa de ${book.title}" loading="lazy">`
        : `<div class="book-cover-letter" style="${letterCoverStyle}">
             <span class="cover-letter">${book.title.charAt(0).toUpperCase()}</span>
           </div>`;

      // Barra de progresso visível se já iniciado
      const progressHtml = pct > 0
        ? `<div class="book-progress-wrapper">
             <div class="progress-details">
               <span class="device-name"><span class="material-symbols-outlined dev-icon">${device.includes('Kindle') ? 'tablet_android' : 'laptop_chromebook'}</span>${device}</span>
               <span class="percent-text">${pct}%</span>
             </div>
             <div class="book-progress-bar">
               <div class="progress-bar-fill" style="width: ${pct}%;"></div>
             </div>
           </div>`
        : `<div class="book-progress-wrapper not-started">
             <span class="not-started-text">Não iniciado</span>
           </div>`;

      card.innerHTML = `
        <div class="book-cover-wrapper">
          ${coverHtml}
          <!-- Overlay de Ações Rápidas -->
          <div class="card-overlay">
            <button class="overlay-btn read-btn" title="Ler Livro">
              <span class="material-symbols-outlined">menu_book</span>
              Ler
            </button>
            <button class="overlay-btn delete-btn" title="Remover Livro">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
        <div class="book-info">
          <h3 class="book-title" title="${book.title}">${book.title}</h3>
          <p class="book-author" title="${book.author}">${book.author}</p>
          ${progressHtml}
        </div>
      `;

      // Eventos dos botões do card
      card.querySelector('.read-btn').addEventListener('click', () => {
        window.location.href = `reader.html?id=${book.id}`;
      });

      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirmModal({
          title: 'Excluir Livro',
          message: `Tem certeza de que deseja excluir "${book.title}"?`,
          danger: true
        }, async () => {
          await deleteBook(book.id);
        });
      });

      booksGrid.appendChild(card);
    });
  }

  // Remover Livro
  async function deleteBook(id) {
    const username = localStorage.getItem('koresync_user');
    const authKey = localStorage.getItem('koresync_auth_key');

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-user': username,
          'x-auth-key': authKey
        }
      });

      if (res.ok) {
        showToast('Livro excluído com sucesso!', 'success');
        loadBooks();
      } else if (res.status === 403) {
        showToast('Você não tem permissão para excluir este livro.', 'error');
      } else {
        showToast('Erro ao excluir livro do servidor.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao tentar excluir o livro.', 'error');
    }
  }

  // 4. Busca em Tempo Real
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = booksList.filter(book => 
      book.title.toLowerCase().includes(query) || 
      book.author.toLowerCase().includes(query)
    );
    renderBooks(filtered);
  });

  // 5. Upload de Arquivos (Drag & Drop + Input File)
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  // Efeitos visuais do Drag & Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('highlight');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('highlight');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  function handleFiles(files) {
    if (files.length === 0) return;

    const epubFiles = Array.from(files).filter(f => f.name.endsWith('.epub'));

    if (epubFiles.length === 0) {
      showToast('Apenas arquivos .epub são aceitos!', 'error');
      return;
    }

    if (files.length !== epubFiles.length) {
      showToast(`${files.length - epubFiles.length} arquivo(s) ignorado(s) — apenas .epub é aceito.`, 'info');
    }

    uploadFiles(epubFiles);
  }

  // Enviar Livros via AJAX com Progresso (múltiplos arquivos)
  function uploadFiles(files) {
    const username = localStorage.getItem('koresync_user');
    const authKey = localStorage.getItem('koresync_auth_key');

    const formData = new FormData();
    files.forEach(f => formData.append('book', f));

    const label = files.length === 1 ? files[0].name : `${files.length} livros`;
    uploadFilename.textContent = label;
    uploadPercent.textContent = '0%';
    uploadBarFill.style.width = '0%';
    uploadStatusText.textContent = files.length > 1 ? `Enviando ${files.length} arquivos...` : 'Enviando arquivo...';
    uploadProgress.classList.remove('hidden');

    const xhr = new XMLHttpRequest();

    // Monitorar progresso total de envio
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        uploadPercent.textContent = `${percent}%`;
        uploadBarFill.style.width = `${percent}%`;
        if (percent === 100) {
          uploadStatusText.textContent = 'Processando no servidor...';
        }
      }
    });

    // Conclusão
    xhr.addEventListener('load', () => {
      uploadProgress.classList.add('hidden');
      fileInput.value = '';

      if (xhr.status === 201 || xhr.status === 500) {
        try {
          const data = JSON.parse(xhr.responseText);
          const ok = data.results.filter(r => r.success).length;
          const fail = data.results.filter(r => !r.success).length;

          if (ok > 0) {
            const msg = ok === 1
              ? `"${data.results.find(r => r.success).filename}" adicionado com sucesso!`
              : `${ok} livro(s) adicionado(s) com sucesso!`;
            showToast(msg, 'success');
            loadBooks();
          }
          if (fail > 0) {
            showToast(`${fail} arquivo(s) falharam ao ser processados.`, 'error');
          }
        } catch {
          showToast('Erro inesperado na resposta do servidor.', 'error');
        }
      } else {
        showToast('Erro ao enviar ao servidor.', 'error');
      }
    });

    xhr.addEventListener('error', () => {
      uploadProgress.classList.add('hidden');
      showToast('Erro de conexão no envio do arquivo.', 'error');
    });

    xhr.open('POST', '/api/books');
    xhr.setRequestHeader('x-auth-user', username);
    xhr.setRequestHeader('x-auth-key', authKey);
    xhr.send(formData);
  }

  // ==========================================
  // CONFIGURAÇÕES: MODAL, AVATAR E CONEXÃO
  // ==========================================

  // Abrir / Fechar modal
  settingsBtn.addEventListener('click', () => {
    settingsSyncUrl.textContent = syncUrlEl.textContent || window.location.origin;
    settingsOpdsUrl.textContent = opdsUrlEl.textContent || `${window.location.origin}/opds`;
    connectionResult.classList.add('hidden');
    loadAvatarIntoSettings();
    settingsModal.classList.remove('hidden');
  });

  settingsCloseBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.add('hidden');
  });

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
      settingsModal.classList.add('hidden');
    }
  });

  // ---- Avatar ----

  // Exibir avatar ou inicial no header
  function loadAvatar(username) {
    const stored = localStorage.getItem('koresync_avatar');
    const initial = (username || '?').charAt(0).toUpperCase();
    if (stored) {
      headerAvatarImg.src = stored;
      headerAvatarImg.classList.remove('hidden');
      headerAvatarInitials.textContent = '';
    } else {
      headerAvatarImg.src = '';
      headerAvatarImg.classList.add('hidden');
      headerAvatarInitials.textContent = initial;
    }
  }

  // Sincronizar preview no modal de configurações
  function loadAvatarIntoSettings() {
    const stored = localStorage.getItem('koresync_avatar');
    const username = localStorage.getItem('koresync_user') || '?';
    const initial = username.charAt(0).toUpperCase();
    if (stored) {
      settingsAvatarPreviewImg.src = stored;
      settingsAvatarPreviewImg.classList.remove('hidden');
      settingsAvatarPreviewInitials.textContent = '';
    } else {
      settingsAvatarPreviewImg.src = '';
      settingsAvatarPreviewImg.classList.add('hidden');
      settingsAvatarPreviewInitials.textContent = initial;
    }
  }

  // Clicar no círculo também abre o seletor de arquivo
  settingsAvatarCircle.addEventListener('click', () => avatarFileInput.click());
  settingsAvatarUploadBtn.addEventListener('click', () => avatarFileInput.click());

  avatarFileInput.addEventListener('change', () => {
    const file = avatarFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        // Recorte centralizado + redimensionar para 200×200 (economiza espaço no localStorage)
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
        const base64 = canvas.toDataURL('image/jpeg', 0.88);
        localStorage.setItem('koresync_avatar', base64);
        loadAvatar(localStorage.getItem('koresync_user') || '');
        loadAvatarIntoSettings();
        avatarFileInput.value = '';
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });

  settingsAvatarRemoveBtn.addEventListener('click', () => {
    localStorage.removeItem('koresync_avatar');
    loadAvatar(localStorage.getItem('koresync_user') || '');
    loadAvatarIntoSettings();
  });

  // ---- Testar Conexão com o servidor ----

  testConnectionBtn.addEventListener('click', async () => {
    connectionResult.classList.add('hidden');
    connectionResult.className = 'connection-result hidden';
    testConnectionBtn.disabled = true;
    testConnectionBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Testando...';

    const lines = [];

    // 1. Ping ao servidor
    try {
      const t0 = Date.now();
      const res = await fetch('/healthcheck');
      const ms = Date.now() - t0;
      if (res.ok) {
        lines.push(`✅ Servidor KoreSync online <span class="test-latency">${ms}ms</span>`);
      } else {
        lines.push(`❌ Servidor respondeu com erro ${res.status}`);
      }
    } catch (_) {
      lines.push('❌ Servidor KoreSync não encontrado (offline?)');
    }

    // 2. Verificar autenticação
    try {
      const u = localStorage.getItem('koresync_user');
      const k = localStorage.getItem('koresync_auth_key');
      if (u && k) {
        const res = await fetch('/users/auth', { headers: { 'x-auth-user': u, 'x-auth-key': k } });
        if (res.ok) {
          lines.push(`✅ Autenticação OK — usuário <strong>${u}</strong>`);
        } else {
          lines.push('⚠️ Credenciais inválidas ou sessão expirada');
        }
      }
    } catch (_) {
      lines.push('❌ Erro ao verificar autenticação');
    }

    const allOk = lines.every(l => l.startsWith('✅'));
    connectionResult.classList.remove('hidden');
    connectionResult.classList.add(allOk ? 'ok' : 'error');
    connectionResult.innerHTML = lines.join('<br>');

    testConnectionBtn.disabled = false;
    testConnectionBtn.innerHTML = '<span class="material-symbols-outlined">wifi_find</span> Testar Conexão';
  });

  // ---- Botões de copiar URL ----

  document.querySelectorAll('.copy-btn[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-copy-target');
      const text = document.getElementById(id)?.textContent?.trim();
      if (!text || text === '—') return;

      const icon = btn.querySelector('.material-symbols-outlined');
      const done = () => {
        icon.textContent = 'check';
        setTimeout(() => { icon.textContent = 'content_copy'; }, 1600);
      };

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          legacyCopy(text); done();
        });
      } else {
        legacyCopy(text); done();
      }
    });
  });

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

});
