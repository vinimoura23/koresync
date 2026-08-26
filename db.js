const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Garantir que a pasta data exista
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Inicializar banco se não existir
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    books: [],
    progress: {},
    hash_mappings: {}
  }, null, 2));
}

// ==========================================
// CACHE EM MEMÓRIA
// ==========================================
let _cache = null;

function readDb() {
  if (_cache) return _cache;
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    _cache = JSON.parse(content);
    if (!_cache.users) _cache.users = [];
    if (!_cache.books) _cache.books = [];
    if (!_cache.progress) _cache.progress = {};
    if (!_cache.hash_mappings) _cache.hash_mappings = {};
    return _cache;
  } catch (err) {
    console.error('Erro ao ler banco de dados JSON, reiniciando...', err);
    _cache = { users: [], books: [], progress: {}, hash_mappings: {} };
    return _cache;
  }
}

// Escrita atômica para evitar corrupção
function writeDb(data) {
  _cache = data;
  const tempPath = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Erro na gravação atômica do banco de dados:', err);
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
    throw err;
  }
}

function invalidateCache() {
  _cache = null;
}

// Operações de Usuários
function getUser(username) {
  const db = readDb();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function createUser(username, md5Password) {
  const db = readDb();
  if (getUser(username)) {
    return false; // Usuário já existe
  }
  db.users.push({
    username: username.toLowerCase(),
    password: md5Password
  });
  writeDb(db);
  return true;
}

function updateUser(username, { newUsername, newPassword }) {
  const db = readDb();
  const lower = username.toLowerCase();
  const index = db.users.findIndex(u => u.username.toLowerCase() === lower);
  if (index < 0) return false;

  const newLower = newUsername ? newUsername.toLowerCase().trim() : lower;

  // Se alterou o username, verificar se já existe outro usuário com esse nome
  if (newLower !== lower && db.users.some(u => u.username.toLowerCase() === newLower)) {
    return 'conflict';
  }

  if (newUsername) {
    db.users[index].username = newLower;
  }

  if (newPassword) {
    db.users[index].password = newPassword;
  }

  // Migrar dados se o username mudou
  if (newUsername && newLower !== lower) {
    // Migrar livros
    db.books.forEach(b => {
      if (b.owner && b.owner.toLowerCase() === lower) {
        b.owner = newLower;
      }
    });

    // Migrar progresso
    const keysToMigrate = Object.keys(db.progress).filter(k => k.startsWith(`${lower}:`));
    keysToMigrate.forEach(oldKey => {
      const bookId = oldKey.slice(lower.length + 1);
      const newKey = `${newLower}:${bookId}`;
      db.progress[newKey] = {
        ...db.progress[oldKey],
        username: newLower
      };
      delete db.progress[oldKey];
    });
  }

  writeDb(db);
  return true;
}

// Operações de Livros
function addBook(book, username) {
  const db = readDb();
  const index = db.books.findIndex(b => b.id === book.id);
  const bookWithOwner = {
    ...book,
    tags: Array.isArray(book.tags) ? book.tags : [],
    owner: username ? username.toLowerCase() : null
  };
  if (index >= 0) {
    db.books[index] = { ...db.books[index], ...bookWithOwner };
  } else {
    db.books.push(bookWithOwner);
  }
  writeDb(db);
  return bookWithOwner;
}

function getBooks(username) {
  const db = readDb();
  const list = !username
    ? db.books
    : db.books.filter(b => !b.owner || b.owner === username.toLowerCase());
  return list.map(b => ({ ...b, tags: b.tags || [] }));
}

function getBook(id) {
  const db = readDb();
  const book = db.books.find(b => b.id === id);
  if (!book) return null;
  return { ...book, tags: book.tags || [] };
}

function updateBook(id, updates, username) {
  const db = readDb();
  const index = db.books.findIndex(b => b.id === id);
  if (index < 0) return null;

  const book = db.books[index];
  if (book.owner && username && book.owner !== username.toLowerCase()) {
    return false; // sem permissão
  }

  if (updates.title !== undefined) book.title = updates.title.trim();
  if (updates.author !== undefined) book.author = updates.author.trim();
  if (updates.tags !== undefined) {
    book.tags = Array.isArray(updates.tags)
      ? updates.tags.map(t => String(t).trim()).filter(Boolean)
      : [];
  }
  if (updates.coverFilename !== undefined) {
    book.coverFilename = updates.coverFilename;
  }

  db.books[index] = book;
  writeDb(db);
  return book;
}

function deleteBook(id, username) {
  const db = readDb();
  const index = db.books.findIndex(b => b.id === id);
  if (index < 0) return null;

  const book = db.books[index];

  // Verificar propriedade: apenas o dono pode deletar (livros sem dono são legáveis)
  if (book.owner && username && book.owner !== username.toLowerCase()) {
    return false; // sem permissão
  }

  db.books.splice(index, 1);

  // Remover o progresso associado ao livro
  for (const key in db.progress) {
    if (key.endsWith(`:${id}`)) delete db.progress[key];
  }

  // Remover mapeamentos de hash associados a este livro
  if (db.hash_mappings) {
    for (const hash in db.hash_mappings) {
      if (db.hash_mappings[hash] === id) delete db.hash_mappings[hash];
    }
  }

  writeDb(db);
  return book;
}

// Função para resolver o ID real do livro (mapear hashes alternativos do KOReader como fastDigest)
function resolveBookId(bookId) {
  const db = readDb();
  if (!db.hash_mappings) {
    db.hash_mappings = {};
  }
  
  // 1. Se já existe um mapeamento gravado para este hash, retorna o ID real
  if (db.hash_mappings[bookId]) {
    return db.hash_mappings[bookId];
  }
  
  // 2. Se o ID já é de um livro cadastrado, retorna ele mesmo
  if (db.books.some(b => b.id === bookId)) {
    return bookId;
  }
  
  // 3. Se é um hash desconhecido, mas temos exatamente 1 único livro na biblioteca, mapeamos automaticamente!
  if (db.books.length === 1) {
    const singleBookId = db.books[0].id;
    db.hash_mappings[bookId] = singleBookId;
    writeDb(db);
    console.log(`[KoreSync Mapping] Hash desconhecido "${bookId}" mapeado automaticamente para o único livro cadastrado "${singleBookId}"`);
    return singleBookId;
  }
  
  return bookId;
}

// Operações de Progresso
function getProgress(username, bookId) {
  const resolvedId = resolveBookId(bookId);
  const db = readDb();
  const key = `${username.toLowerCase()}:${resolvedId}`;
  return db.progress[key] || null;
}

function updateProgress(username, bookId, percentage, progressString, device, deviceId, timestamp) {
  const resolvedId = resolveBookId(bookId);
  const db = readDb();
  const key = `${username.toLowerCase()}:${resolvedId}`;
  
  // Garantir que a porcentagem é um número válido e está entre 0 e 1
  let pct = parseFloat(percentage);
  if (isNaN(pct)) pct = 0;
  if (pct > 1) pct = pct / 100; // Caso KOReader envie em escala de 0-100 (embora costume ser 0-1)
  
  // Buscar se já tem progresso mais recente antes de atualizar
  const current = db.progress[key];
  const newTimestamp = timestamp || Math.floor(Date.now() / 1000);
  
  if (current && current.timestamp >= newTimestamp) {
    // Não atualizar se o progresso gravado for mais recente ou idêntico em timestamp
    return current;
  }

  const updated = {
    username: username.toLowerCase(),
    book_id: resolvedId,
    percentage: pct,
    progress: progressString,
    device: device || 'Web Reader',
    device_id: deviceId || 'web_browser',
    timestamp: newTimestamp,
    // startedAt: preserva o original se já existia, senão define agora
    startedAt: (current && current.startedAt) ? current.startedAt : newTimestamp,
    // completedAt: define quando >= 99%, preserva se já foi definido antes
    completedAt: pct >= 0.99
      ? (current && current.completedAt ? current.completedAt : newTimestamp)
      : (current ? current.completedAt || null : null)
  };

  db.progress[key] = updated;
  writeDb(db);
  return updated;
}

function getAllProgress(username) {
  const db = readDb();
  const userProgress = [];
  const lowerUser = username.toLowerCase();
  for (const key in db.progress) {
    if (key.startsWith(`${lowerUser}:`)) {
      userProgress.push(db.progress[key]);
    }
  }
  return userProgress;
}

module.exports = {
  getUser,
  createUser,
  updateUser,
  addBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  resolveBookId,
  getProgress,
  updateProgress,
  getAllProgress,
  invalidateCache
};
