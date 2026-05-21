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
    progress: {} // chave: 'username:bookId'
  }, null, 2));
}

// Leitura atômica
function readDb() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Erro ao ler banco de dados JSON, reiniciando...', err);
    return { users: [], books: [], progress: {} };
  }
}

// Escrita atômica para evitar corrupção
function writeDb(data) {
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

// Operações de Usuários
function getUser(username) {
  const db = readDb();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
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

// Operações de Livros
function addBook(book) {
  const db = readDb();
  // Se o livro já existe pelo hash, atualiza
  const index = db.books.findIndex(b => b.id === book.id);
  if (index >= 0) {
    db.books[index] = { ...db.books[index], ...book };
  } else {
    db.books.push(book);
  }
  writeDb(db);
  return book;
}

function getBooks() {
  const db = readDb();
  return db.books;
}

function getBook(id) {
  const db = readDb();
  return db.books.find(b => b.id === id);
}

function deleteBook(id) {
  const db = readDb();
  const index = db.books.findIndex(b => b.id === id);
  if (index >= 0) {
    const book = db.books[index];
    db.books.splice(index, 1);
    
    // Remover o progresso associado ao livro
    for (const key in db.progress) {
      if (key.endsWith(`:${id}`)) {
        delete db.progress[key];
      }
    }

    // Remover mapeamentos de hash associados a este livro
    if (db.hash_mappings) {
      for (const hash in db.hash_mappings) {
        if (db.hash_mappings[hash] === id) {
          delete db.hash_mappings[hash];
        }
      }
    }
    
    writeDb(db);
    return book;
  }
  return null;
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
    timestamp: newTimestamp
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
  addBook,
  getBooks,
  getBook,
  deleteBook,
  getProgress,
  updateProgress,
  getAllProgress
};
