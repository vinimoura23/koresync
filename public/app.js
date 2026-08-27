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
  const authTabs = document.getElementById('auth-tabs');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin = document.getElementById('panel-login');
  const panelRegister = document.getElementById('panel-register');

  // Painel de Perfil Salvo (Login Rápido estilo Facebook)
  const panelSavedProfile = document.getElementById('panel-saved-profile');
  const savedProfileAvatar = document.getElementById('saved-profile-avatar');
  const savedProfileAvatarImg = document.getElementById('saved-profile-avatar-img');
  const savedProfileAvatarInitials = document.getElementById('saved-profile-avatar-initials');
  const savedProfileName = document.getElementById('saved-profile-name');
  const savedProfileSubname = document.getElementById('saved-profile-subname');
  const savedProfileForm = document.getElementById('saved-profile-form');
  const savedProfilePasswordInput = document.getElementById('saved-profile-password');
  const switchAccountBtn = document.getElementById('switch-account-btn');
  const forgetAccountBtn = document.getElementById('forget-account-btn');

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

  // Edição de Perfil
  const profileEditForm = document.getElementById('profile-edit-form');
  const profileUsernameInput = document.getElementById('profile-username-input');
  const profileNewPasswordInput = document.getElementById('profile-new-password-input');
  const profileConfirmPasswordInput = document.getElementById('profile-confirm-password-input');
  const profileSaveBtn = document.getElementById('profile-save-btn');
  const profileResult = document.getElementById('profile-result');
  const presetAvatarsList = document.getElementById('preset-avatars-list');

  // Filtros de Catálogo & Tags
  const hideUnreadToggle = document.getElementById('hide-unread-toggle');
  const tagsBar = document.getElementById('tags-bar');
  const tagsChipsContainer = document.getElementById('tags-chips-container');

  // Modal de Edição de Livro
  const editBookModal = document.getElementById('edit-book-modal');
  const editBookForm = document.getElementById('edit-book-form');
  const editBookIdInput = document.getElementById('edit-book-id');
  const editTitleInput = document.getElementById('edit-title-input');
  const editAuthorInput = document.getElementById('edit-author-input');
  const editTagsInput = document.getElementById('edit-tags-input');
  const editCoverPreview = document.getElementById('edit-cover-preview');
  const editCoverPreviewImg = document.getElementById('edit-cover-preview-img');
  const editCoverPlaceholder = document.getElementById('edit-cover-placeholder');
  const editCoverInput = document.getElementById('edit-cover-input');
  const editCoverBtn = document.getElementById('edit-cover-btn');
  const editBookCloseBtn = document.getElementById('edit-book-close-btn');
  const editBookCancelBtn = document.getElementById('edit-book-cancel-btn');
  const editBookSaveBtn = document.getElementById('edit-book-save-btn');

  // Helper para escapar HTML e prevenir vulnerabilidades XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
  let currentSort = 'date-desc'; // padrão: mais recentes primeiro
  let activeTagFilter = null;
  let hideUnread = false;

  // ---- Funções de Ordenação ----
  function sortBooks(books, sort) {
    const sorted = [...books];
    switch (sort) {
      case 'title-asc':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
      case 'title-desc':
        return sorted.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'pt-BR'));
      case 'progress-desc':
        return sorted.sort((a, b) => {
          const pA = a.progress ? a.progress.percentage : -1;
          const pB = b.progress ? b.progress.percentage : -1;
          return pB - pA;
        });
      case 'progress-asc':
        return sorted.sort((a, b) => {
          const pA = a.progress ? a.progress.percentage : 2;
          const pB = b.progress ? b.progress.percentage : 2;
          return pA - pB;
        });
      case 'date-asc':
        return sorted.sort((a, b) => a.addedAt - b.addedAt);
      case 'date-desc':
      default:
        return sorted.sort((a, b) => b.addedAt - a.addedAt);
    }
  }

  // Filtragem unificada de livros (Busca + Tags + Ocultar não lidos)
  function getFilteredBooks() {
    let list = [...booksList];

    // 1. Busca textual
    const query = searchInput.value.toLowerCase().trim();
    if (query) {
      list = list.filter(b =>
        (b.title && b.title.toLowerCase().includes(query)) ||
        (b.author && b.author.toLowerCase().includes(query)) ||
        (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    // 2. Filtro de Coleções / Tags
    if (activeTagFilter) {
      list = list.filter(b =>
        Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase() === activeTagFilter.toLowerCase())
      );
    }

    // 3. Ocultar livros não iniciados
    if (hideUnread) {
      list = list.filter(b => b.progress && b.progress.percentage > 0);
    }

    return sortBooks(list, currentSort);
  }

  // Renderizar a barra de tags / coleções
  function renderTagsBar() {
    if (!tagsBar || !tagsChipsContainer) return;

    const tagCountMap = {};
    booksList.forEach(b => {
      if (Array.isArray(b.tags)) {
        b.tags.forEach(t => {
          const norm = String(t).trim();
          if (norm) {
            tagCountMap[norm] = (tagCountMap[norm] || 0) + 1;
          }
        });
      }
    });

    const tags = Object.keys(tagCountMap).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    if (tags.length === 0) {
      tagsBar.classList.add('hidden');
      activeTagFilter = null;
      return;
    }

    tagsBar.classList.remove('hidden');
    tagsChipsContainer.innerHTML = '';

    // Chip "Todas"
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `tag-chip ${activeTagFilter === null ? 'active' : ''}`;
    allChip.innerHTML = `Todas <span class="tag-chip-count">${booksList.length}</span>`;
    allChip.addEventListener('click', () => {
      activeTagFilter = null;
      updateCatalogView();
    });
    tagsChipsContainer.appendChild(allChip);

    // Chips de cada Tag
    tags.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isActive = activeTagFilter && activeTagFilter.toLowerCase() === tag.toLowerCase();
      chip.className = `tag-chip ${isActive ? 'active' : ''}`;
      chip.innerHTML = `${escapeHtml(tag)} <span class="tag-chip-count">${tagCountMap[tag]}</span>`;
      chip.addEventListener('click', () => {
        activeTagFilter = isActive ? null : tag;
        updateCatalogView();
      });
      tagsChipsContainer.appendChild(chip);
    });
  }

  // Atualizar visualização do catálogo
  function updateCatalogView() {
    renderTagsBar();
    renderBooks(getFilteredBooks());
  }

  // Eventos dos botões de ordenação
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.getAttribute('data-sort');
      renderBooks(getFilteredBooks());
    });
  });

  // Evento do botão de ocultar não lidos
  if (hideUnreadToggle) {
    hideUnreadToggle.addEventListener('click', () => {
      hideUnread = !hideUnread;
      hideUnreadToggle.classList.toggle('active', hideUnread);
      const icon = hideUnreadToggle.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = hideUnread ? 'visibility' : 'visibility_off';
      }
      hideUnreadToggle.querySelector('.filter-label').textContent = hideUnread ? 'Mostrando em andamento' : 'Ocultar não lidos';
      renderBooks(getFilteredBooks());
    });
  }

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
        localStorage.setItem('koresync_saved_profile', username);
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

  // Helper para carregar avatar na tela de login de perfil salvo
  function loadSavedProfileAvatar(username) {
    if (!savedProfileAvatarImg || !savedProfileAvatarInitials) return;
    const avatarData = localStorage.getItem(`koresync_avatar_${username.toLowerCase()}`);
    if (avatarData) {
      savedProfileAvatarImg.src = avatarData;
      savedProfileAvatarImg.classList.remove('hidden');
      savedProfileAvatarInitials.classList.add('hidden');
      if (savedProfileAvatar) savedProfileAvatar.classList.add('has-custom-img');
    } else {
      savedProfileAvatarImg.src = '';
      savedProfileAvatarImg.classList.add('hidden');
      savedProfileAvatarInitials.textContent = (username || '?').slice(0, 2).toUpperCase();
      savedProfileAvatarInitials.classList.remove('hidden');
      if (savedProfileAvatar) savedProfileAvatar.classList.remove('has-custom-img');
    }
  }

  // Ações do Formulário de Perfil Salvo (Login Rápido estilo Facebook)
  if (savedProfileForm) {
    savedProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!savedProfileForm.reportValidity()) return;
      const username = localStorage.getItem('koresync_saved_profile');
      if (!username) {
        showAuthScreen(true);
        return;
      }
      const passwordHash = md5(savedProfilePasswordInput.value);
      await handleAuth('/users/auth', username, passwordHash, false);
    });
  }

  if (switchAccountBtn) {
    switchAccountBtn.addEventListener('click', () => {
      showAuthScreen(true);
    });
  }

  if (forgetAccountBtn) {
    forgetAccountBtn.addEventListener('click', () => {
      localStorage.removeItem('koresync_saved_profile');
      showAuthScreen(true);
      showToast('Conta removida deste dispositivo.', 'info', 3000);
    });
  }

  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('koresync_user');
    localStorage.removeItem('koresync_auth_key');
    booksList = [];
    showAuthScreen();
  });

  // Mostra Telas
  function showAuthScreen(forceSwitch = false) {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    loginPasswordInput.value = '';
    regPasswordInput.value = '';
    regConfirmInput.value = '';
    if (savedProfilePasswordInput) savedProfilePasswordInput.value = '';

    const savedProfile = localStorage.getItem('koresync_saved_profile');

    if (savedProfile && !forceSwitch && panelSavedProfile) {
      // Mostrar Painel de Perfil Salvo (Facebook / Google style)
      if (authTabs) authTabs.classList.add('hidden');
      panelLogin.classList.add('hidden');
      panelRegister.classList.add('hidden');
      panelSavedProfile.classList.remove('hidden');

      if (savedProfileName) savedProfileName.textContent = savedProfile;
      if (savedProfileSubname) savedProfileSubname.textContent = savedProfile;

      loadSavedProfileAvatar(savedProfile);

      setTimeout(() => {
        if (savedProfilePasswordInput) savedProfilePasswordInput.focus();
      }, 100);
    } else {
      // Mostrar tela de login/cadastro padrão
      if (panelSavedProfile) panelSavedProfile.classList.add('hidden');
      if (authTabs) authTabs.classList.remove('hidden');
      switchTab('login');
      setTimeout(() => {
        loginUsernameInput.focus();
      }, 100);
    }
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
        updateCatalogView();
      } else {
        booksGrid.innerHTML = '<p class="error-msg">Erro ao carregar livros do servidor.</p>';
      }
    } catch (err) {
      console.error(err);
      booksGrid.innerHTML = '<p class="error-msg">Servidor desconectado.</p>';
    }
  }

  // Helper para formatar data de timestamp (segundos ou ms)
  function formatDate(ts) {
    if (!ts) return null;
    // timestamps de progresso estão em segundos, addedAt em ms
    const date = new Date(ts > 1e10 ? ts : ts * 1000);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
      const rawTitle = book.title || 'Livro';
      const hue = (rawTitle.charCodeAt(0) * 12) % 360;
      const letterCoverStyle = `background: linear-gradient(135deg, hsl(${hue}, 60%, 65%), hsl(${(hue+40)%360}, 65%, 45%));`;
      
      // HTML da Capa (Capa real ou Smart Cover elegante gerada em SVG)
      const coverUrl = `/books/${book.id}/cover?t=${book.coverFilename || book.addedAt || ''}`;
      const coverHtml = `<img class="book-cover-img" src="${coverUrl}" alt="Capa de ${escapeHtml(rawTitle)}" loading="lazy">`;

      // Tags / Coleções Pills
      const tagsHtml = (Array.isArray(book.tags) && book.tags.length > 0)
        ? `<div class="book-tags-list">
             ${book.tags.map(t => `<span class="book-tag-pill" title="Coleção: ${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('')}
           </div>`
        : '';

      // Barra de progresso visível se já iniciado
      const progressHtml = pct > 0
        ? `<div class="book-progress-wrapper">
             <div class="progress-details">
               <span class="device-name"><span class="material-symbols-outlined dev-icon">${device.includes('Kindle') ? 'tablet_android' : 'laptop_chromebook'}</span>${escapeHtml(device)}</span>
               <span class="percent-text">${pct}%</span>
             </div>
             <div class="book-progress-bar">
               <div class="progress-bar-fill" style="width: ${pct}%;"></div>
             </div>
           </div>`
        : `<div class="book-progress-wrapper not-started">
             <span class="not-started-text">Não iniciado</span>
           </div>`;

      // Estatísticas
      const addedStr  = formatDate(book.addedAt);
      const startStr  = book.progress?.startedAt   ? formatDate(book.progress.startedAt)   : null;
      const lastStr   = book.progress?.timestamp    ? formatDate(book.progress.timestamp)    : null;
      const doneStr   = book.progress?.completedAt  ? formatDate(book.progress.completedAt)  : null;

      let statsLines = [];
      if (addedStr)  statsLines.push(`<span title="Adicionado à biblioteca"><span class="material-symbols-outlined stat-icon">library_add</span>${addedStr}</span>`);
      if (startStr)  statsLines.push(`<span title="Começou a ler"><span class="material-symbols-outlined stat-icon">play_circle</span>${startStr}</span>`);
      if (doneStr)   statsLines.push(`<span title="Concluído" class="stat-done"><span class="material-symbols-outlined stat-icon">check_circle</span>${doneStr}</span>`);
      else if (lastStr && startStr && lastStr !== startStr)
                     statsLines.push(`<span title="Última leitura"><span class="material-symbols-outlined stat-icon">update</span>${lastStr}</span>`);

      const statsHtml = statsLines.length
        ? `<div class="book-stats">${statsLines.join('')}</div>`
        : '';

      card.innerHTML = `
        <div class="book-cover-wrapper">
          ${coverHtml}
          <!-- Overlay de Ações Rápidas -->
          <div class="card-overlay">
            <button class="overlay-btn read-btn" title="Ler Livro">
              <span class="material-symbols-outlined">menu_book</span>
              Ler
            </button>
            <button class="overlay-btn edit-btn" title="Editar Livro">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="overlay-btn delete-btn" title="Remover Livro">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
        <div class="book-info">
          <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <p class="book-author" title="${escapeHtml(book.author)}">${escapeHtml(book.author)}</p>
          ${tagsHtml}
          ${progressHtml}
          ${statsHtml}
        </div>
      `;

      // Eventos dos botões do card
      card.querySelector('.read-btn').addEventListener('click', () => {
        window.location.href = `reader.html?id=${book.id}`;
      });

      card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditBookModal(book);
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

  // 4. Busca em Tempo Real (mantém filtros e ordenação ativos)
  searchInput.addEventListener('input', () => {
    renderBooks(getFilteredBooks());
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
  // BACKUP E RESTAURAÇÃO
  // ==========================================

  const backupDownloadBtn  = document.getElementById('backup-download-btn');
  const backupRestoreInput = document.getElementById('backup-restore-input');
  const backupResult       = document.getElementById('backup-result');

  function showBackupResult(msg, type) {
    if (!backupResult) return;
    backupResult.className = `connection-result ${type === 'ok' ? 'ok' : 'error'}`;
    backupResult.textContent = msg;
    backupResult.classList.remove('hidden');
  }

  if (backupDownloadBtn) {
    backupDownloadBtn.addEventListener('click', async () => {
      const username = localStorage.getItem('koresync_user');
      const authKey  = localStorage.getItem('koresync_auth_key');

      backupDownloadBtn.disabled = true;
      backupDownloadBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Gerando...';
      backupResult && backupResult.classList.add('hidden');

      try {
        const res = await fetch('/api/backup', {
          headers: { 'x-auth-user': username, 'x-auth-key': authKey }
        });

        if (!res.ok) throw new Error('Erro no servidor');

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href     = url;
        a.download = `koresync_backup_${date}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showBackupResult('✅ Backup exportado com sucesso!', 'ok');
      } catch (err) {
        console.error(err);
        showBackupResult('❌ Erro ao gerar o backup.', 'error');
      } finally {
        backupDownloadBtn.disabled = false;
        backupDownloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> Exportar Backup';
      }
    });
  }

  if (backupRestoreInput) {
    backupRestoreInput.addEventListener('change', async () => {
      const file = backupRestoreInput.files[0];
      if (!file) return;
      backupRestoreInput.value = '';

      showConfirmModal({
        title: 'Restaurar Backup',
        message: `Isso substituirá TODOS os dados atuais pelo conteúdo de "${file.name}". Tem certeza?`,
        danger: true
      }, async () => {
        const username = localStorage.getItem('koresync_user');
        const authKey  = localStorage.getItem('koresync_auth_key');

        const label = document.getElementById('backup-restore-label');
        if (label) { label.style.pointerEvents = 'none'; label.style.opacity = '0.6'; }
        backupResult && backupResult.classList.add('hidden');

        const formData = new FormData();
        formData.append('backup', file);

        try {
          const res  = await fetch('/api/restore', {
            method: 'POST',
            headers: { 'x-auth-user': username, 'x-auth-key': authKey },
            body: formData
          });
          const data = await res.json();

          if (res.ok && data.success) {
            showToast('Backup restaurado! Recarregando...', 'success', 2000);
            setTimeout(() => window.location.reload(), 2000);
          } else {
            showBackupResult(`❌ ${data.error || 'Erro ao restaurar'}`, 'error');
          }
        } catch (err) {
          console.error(err);
          showBackupResult('❌ Erro de conexão ao restaurar backup.', 'error');
        } finally {
          if (label) { label.style.pointerEvents = ''; label.style.opacity = ''; }
        }
      });
    });
  }

  // ==========================================
  // CONFIGURAÇÕES: MODAL, AVATAR E CONEXÃO
  // ==========================================

  // Abrir / Fechar modal
  settingsBtn.addEventListener('click', () => {
    settingsSyncUrl.textContent = syncUrlEl.textContent || window.location.origin;
    settingsOpdsUrl.textContent = opdsUrlEl.textContent || `${window.location.origin}/opds`;
    connectionResult.classList.add('hidden');
    if (profileResult) profileResult.classList.add('hidden');
    if (profileUsernameInput) {
      profileUsernameInput.value = localStorage.getItem('koresync_user') || '';
    }
    if (profileNewPasswordInput) profileNewPasswordInput.value = '';
    if (profileConfirmPasswordInput) profileConfirmPasswordInput.value = '';
    loadAvatarIntoSettings();
    settingsModal.classList.remove('hidden');
  });

  // ---- Edição de Perfil (Usuário e Senha) ----
  function showProfileResult(msg, type) {
    if (!profileResult) return;
    profileResult.className = `connection-result ${type === 'ok' ? 'ok' : 'error'}`;
    profileResult.textContent = msg;
    profileResult.classList.remove('hidden');
  }

  if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentUsername = localStorage.getItem('koresync_user');
      const currentAuthKey = localStorage.getItem('koresync_auth_key');
      const newUsername = profileUsernameInput.value.trim();
      const newPassword = profileNewPasswordInput.value;
      const confirmPassword = profileConfirmPasswordInput.value;

      if (!newUsername) {
        showProfileResult('O nome de usuário não pode ficar vazio.', 'error');
        return;
      }

      if (newPassword) {
        if (newPassword.length < 3) {
          showProfileResult('A nova senha deve ter pelo menos 3 caracteres.', 'error');
          return;
        }
        if (newPassword !== confirmPassword) {
          showProfileResult('As senhas digitadas não coincidem.', 'error');
          return;
        }
      }

      const isUsernameChanged = newUsername.toLowerCase() !== currentUsername.toLowerCase();
      const isPasswordChanged = !!newPassword;

      if (!isUsernameChanged && !isPasswordChanged) {
        showProfileResult('Nenhuma alteração foi realizada.', 'ok');
        return;
      }

      profileSaveBtn.disabled = true;
      profileSaveBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Salvando...';
      if (profileResult) profileResult.classList.add('hidden');

      try {
        const payload = {};
        if (isUsernameChanged) payload.newUsername = newUsername;
        if (isPasswordChanged) payload.newPassword = md5(newPassword);

        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-user': currentUsername,
            'x-auth-key': currentAuthKey
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          if (isUsernameChanged) {
            localStorage.setItem('koresync_user', data.username);
            localStorage.setItem('koresync_saved_profile', data.username);
            userNameDisplay.textContent = data.username;
          }
          if (isPasswordChanged) {
            localStorage.setItem('koresync_auth_key', md5(newPassword));
          }

          loadAvatar(data.username || currentUsername);
          loadAvatarIntoSettings();

          profileNewPasswordInput.value = '';
          profileConfirmPasswordInput.value = '';

          showProfileResult('✅ Perfil atualizado com sucesso!', 'ok');
          showToast('Perfil atualizado com sucesso!', 'success');

          if (isUsernameChanged) {
            loadBooks();
          }
        } else {
          showProfileResult(`❌ ${data.error || 'Erro ao atualizar perfil.'}`, 'error');
        }
      } catch (err) {
        console.error(err);
        showProfileResult('❌ Erro de conexão ao atualizar perfil.', 'error');
      } finally {
        profileSaveBtn.disabled = false;
        profileSaveBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Alterações';
      }
    });
  }

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

  // ---- Avatares Padrão Minimalistas ----
  const PRESET_AVATARS = [
    {
      id: 'cat-black',
      name: 'Gato Preto',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#2b2d42"/><polygon points="28,42 20,20 42,28" fill="#1b1c28"/><polygon points="72,42 80,20 58,28" fill="#1b1c28"/><circle cx="50" cy="54" r="30" fill="#1b1c28"/><ellipse cx="40" cy="50" rx="4" ry="6" fill="#81c784"/><ellipse cx="60" cy="50" rx="4" ry="6" fill="#81c784"/><polygon points="50,58 46,63 54,63" fill="#ffb4a2"/><path d="M44,67 Q50,71 56,67" stroke="#ffb4a2" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    {
      id: 'cat-orange',
      name: 'Gato Laranja',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#f4a261"/><polygon points="28,42 20,20 42,28" fill="#e76f51"/><polygon points="72,42 80,20 58,28" fill="#e76f51"/><circle cx="50" cy="54" r="30" fill="#e76f51"/><ellipse cx="40" cy="50" rx="4" ry="6" fill="#264653"/><ellipse cx="60" cy="50" rx="4" ry="6" fill="#264653"/><polygon points="50,58 46,63 54,63" fill="#ffffff"/><path d="M44,67 Q50,71 56,67" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    {
      id: 'fox',
      name: 'Raposa',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#e76f51"/><polygon points="25,40 18,18 42,26" fill="#b23a22"/><polygon points="75,40 82,18 58,26" fill="#b23a22"/><circle cx="50" cy="54" r="30" fill="#b23a22"/><polygon points="50,42 30,70 70,70" fill="#ffffff"/><circle cx="40" cy="52" r="4" fill="#264653"/><circle cx="60" cy="52" r="4" fill="#264653"/><circle cx="50" cy="62" r="4" fill="#264653"/></svg>`
    },
    {
      id: 'owl',
      name: 'Coruja Leitora',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#3d5a80"/><circle cx="50" cy="55" r="30" fill="#293241"/><circle cx="38" cy="48" r="12" fill="#e0fbfc" stroke="#ee6c4d" stroke-width="2.5"/><circle cx="62" cy="48" r="12" fill="#e0fbfc" stroke="#ee6c4d" stroke-width="2.5"/><line x1="50" y1="48" x2="50" y2="48" stroke="#ee6c4d" stroke-width="3"/><circle cx="38" cy="48" r="5" fill="#293241"/><circle cx="62" cy="48" r="5" fill="#293241"/><polygon points="50,54 45,64 55,64" fill="#ee6c4d"/></svg>`
    },
    {
      id: 'book',
      name: 'Livro Mágico',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#1a73e8"/><path d="M50,40 Q35,32 24,36 L24,70 Q35,66 50,74 Q65,66 76,70 L76,36 Q65,32 50,40 Z" fill="#ffffff"/><line x1="50" y1="40" x2="50" y2="74" stroke="#1a73e8" stroke-width="2.5"/><circle cx="50" cy="24" r="3" fill="#ffe082"/><polygon points="40,22 41,25 44,26 41,27 40,30 39,27 36,26 39,25" fill="#ffe082"/><polygon points="60,22 61,25 64,26 61,27 60,30 59,27 56,26 59,25" fill="#ffe082"/></svg>`
    },
    {
      id: 'astronaut',
      name: 'Astronauta',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#5e503f"/><circle cx="50" cy="50" r="28" fill="#eae0d5"/><rect x="32" y="38" width="36" height="24" rx="12" fill="#0a0908"/><ellipse cx="44" cy="45" rx="6" ry="3" fill="rgba(255,255,255,0.4)"/></svg>`
    },
    {
      id: 'coffee',
      name: 'Café & Leitura',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#8d6e63"/><rect x="32" y="46" width="36" height="26" rx="6" fill="#ffffff"/><path d="M68,52 C74,52 76,62 68,64" stroke="#ffffff" stroke-width="3.5" fill="none"/><path d="M40,38 Q42,34 40,30" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M50,38 Q52,34 50,30" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M60,38 Q62,34 60,30" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`
    },
    {
      id: 'ghost',
      name: 'Fantasminha',
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#2a9d8f"/><path d="M50,22 C36,22 30,36 30,52 L30,76 Q35,70 40,76 Q45,70 50,76 Q55,70 60,76 Q65,70 70,76 L70,52 C70,36 64,22 50,22 Z" fill="#ffffff"/><circle cx="44" cy="46" r="3.5" fill="#264653"/><circle cx="56" cy="46" r="3.5" fill="#264653"/><ellipse cx="50" cy="55" rx="3" ry="4" fill="#264653"/></svg>`
    }
  ];

  function renderPresetAvatars() {
    if (!presetAvatarsList) return;
    presetAvatarsList.innerHTML = '';
    PRESET_AVATARS.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-avatar-btn';
      btn.title = item.name;
      btn.innerHTML = item.svg;
      btn.addEventListener('click', () => {
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(item.svg)}`;
        localStorage.setItem('koresync_avatar', dataUrl);
        loadAvatar(localStorage.getItem('koresync_user') || '');
        loadAvatarIntoSettings();
        showToast(`Avatar "${item.name}" selecionado!`, 'success');
      });
      presetAvatarsList.appendChild(btn);
    });
  }

  renderPresetAvatars();

  // ==========================================
  // MODAL DE EDIÇÃO DE LIVRO
  // ==========================================
  let selectedNewCoverFile = null;

  function openEditBookModal(book) {
    if (!editBookModal) return;
    editBookIdInput.value = book.id;
    editTitleInput.value = book.title || '';
    editAuthorInput.value = book.author || '';
    editTagsInput.value = (Array.isArray(book.tags) && book.tags.length > 0) ? book.tags.join(', ') : '';
    selectedNewCoverFile = null;
    if (editCoverInput) editCoverInput.value = '';

    editCoverPreviewImg.src = `/books/${book.id}/cover?t=${book.coverFilename || Date.now()}`;
    editCoverPreviewImg.classList.remove('hidden');
    editCoverPlaceholder.classList.add('hidden');

    editBookModal.classList.remove('hidden');
    editTitleInput.focus();
  }

  function closeEditBookModal() {
    if (editBookModal) editBookModal.classList.add('hidden');
    selectedNewCoverFile = null;
    if (editCoverInput) editCoverInput.value = '';
  }

  if (editBookCloseBtn) editBookCloseBtn.addEventListener('click', closeEditBookModal);
  if (editBookCancelBtn) editBookCancelBtn.addEventListener('click', closeEditBookModal);
  if (editBookModal) {
    editBookModal.addEventListener('click', (e) => {
      if (e.target === editBookModal) closeEditBookModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editBookModal && !editBookModal.classList.contains('hidden')) {
      closeEditBookModal();
    }
  });

  if (editCoverPreview) {
    editCoverPreview.addEventListener('click', () => {
      if (editCoverInput) editCoverInput.click();
    });
  }

  if (editCoverBtn) {
    editCoverBtn.addEventListener('click', () => {
      if (editCoverInput) editCoverInput.click();
    });
  }

  if (editCoverInput) {
    editCoverInput.addEventListener('change', () => {
      const file = editCoverInput.files[0];
      if (!file) return;
      selectedNewCoverFile = file;
      const reader = new FileReader();
      reader.onload = (evt) => {
        editCoverPreviewImg.src = evt.target.result;
        editCoverPreviewImg.classList.remove('hidden');
        editCoverPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  }

  if (editBookForm) {
    editBookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookId = editBookIdInput.value;
      const title = editTitleInput.value.trim();
      const author = editAuthorInput.value.trim();
      const tagsStr = editTagsInput.value.trim();
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

      const username = localStorage.getItem('koresync_user');
      const authKey = localStorage.getItem('koresync_auth_key');

      editBookSaveBtn.disabled = true;
      editBookSaveBtn.innerHTML = '<span class="material-symbols-outlined spin-icon">sync</span> Salvando...';

      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('author', author);
        formData.append('tags', JSON.stringify(tags));
        if (selectedNewCoverFile) {
          formData.append('cover', selectedNewCoverFile);
        }

        const res = await fetch(`/api/books/${bookId}`, {
          method: 'PUT',
          headers: {
            'x-auth-user': username,
            'x-auth-key': authKey
          },
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Livro atualizado com sucesso!', 'success');
          closeEditBookModal();
          await loadBooks();
        } else {
          showToast(data.error || 'Erro ao atualizar livro', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Erro de conexão ao salvar alterações', 'error');
      } finally {
        editBookSaveBtn.disabled = false;
        editBookSaveBtn.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Alterações';
      }
    });
  }

});
