const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');

const db = require('./db');
const { parseEpub } = require('./epub-util');
const { generateCoverSvg } = require('./cover-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Garantir diretórios necessários
const BOOKS_DIR = path.join(__dirname, 'data', 'books');
const COVERS_DIR = path.join(__dirname, 'data', 'covers');
const TEMP_DIR = path.join(__dirname, 'data', 'temp');
if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Servir arquivos estáticos do frontend com controle de cache estrito
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Configurar o Multer para upload temporário
const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 100 * 1024 * 1024 } // Limite de 100 MB por arquivo
});

// Helper para escapar XML
function xmlEscape(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

// Helper para resolver o caminho físico do arquivo EPUB de forma resiliente (compatível com Host e Docker)
function getBookFilePath(book) {
  if (!book) return null;
  // 1. Arquivo direto em data/books/<id>.epub
  const defaultPath = path.join(BOOKS_DIR, `${book.id}.epub`);
  if (fs.existsSync(defaultPath)) return defaultPath;
  
  // 2. Se o book possui filepath gravado e ele existe no filesystem atual
  if (book.filepath && fs.existsSync(book.filepath)) return book.filepath;
  
  // 3. Se foi gravado com caminho absoluto de outro host/container, pegar apenas o nome do arquivo
  if (book.filepath) {
    const candidateFilename = path.basename(book.filepath);
    const candidatePath = path.join(BOOKS_DIR, candidateFilename);
    if (fs.existsSync(candidatePath)) return candidatePath;
  }
  
  return null;
}

// Middleware de Autenticação para KOReader e Web App
function authMiddleware(req, res, next) {
  // KOReader envia no cabeçalho x-auth-user e x-auth-key
  // Também suportamos query params ou body para o webapp
  const username = req.headers['x-auth-user'] || req.query['username'] || req.body?.username;
  const authKey = req.headers['x-auth-key'] || req.query['auth_key'] || req.body?.auth_key;

  if (!username || !authKey) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  const user = db.getUser(username);
  if (!user || user.password !== authKey) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  req.user = user;
  next();
}

// ==========================================
// 1. ENDPOINTS DE PROTOCOLO KOSYNC (KOReader)
// ==========================================

// Health Check
app.get('/healthcheck', (req, res) => {
  res.json({ state: 'OK' });
});

// Registro de Usuário (KOReader faz POST em /users/create)
app.post('/users/create', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e Password obrigatórios' });
  }

  const success = db.createUser(username, password);
  if (success) {
    res.status(201).json({ username: username.toLowerCase() });
  } else {
    // Código 402 ou 409 são interpretados pelo KOReader como "Usuário já existe"
    res.status(402).json({ error: 'Usuário já cadastrado' });
  }
});

// Autenticação de Usuário (KOReader faz GET em /users/auth)
app.get('/users/auth', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// Atualizar Perfil de Usuário (Nome de usuário e/ou Senha)
app.put('/api/user/profile', authMiddleware, (req, res) => {
  const { newUsername, newPassword } = req.body;
  const currentUsername = req.user.username;

  if (!newUsername && !newPassword) {
    return res.status(400).json({ error: 'Nenhum dado para atualizar fornecido.' });
  }

  const result = db.updateUser(currentUsername, {
    newUsername: newUsername ? newUsername.trim() : undefined,
    newPassword: newPassword ? newPassword : undefined
  });

  if (result === 'conflict') {
    return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
  }

  if (!result) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const updatedUsername = newUsername ? newUsername.trim().toLowerCase() : currentUsername;
  res.json({
    success: true,
    username: updatedUsername,
    message: 'Perfil atualizado com sucesso!'
  });
});

// Obter Progresso (KOReader faz GET em /syncs/progress/:document)
app.get('/syncs/progress/:document', authMiddleware, (req, res) => {
  const documentHash = req.params.document;
  const progress = db.getProgress(req.user.username, documentHash);
  
  if (progress) {
    res.json({
      document: documentHash,
      percentage: progress.percentage,
      progress: progress.progress,
      device: progress.device,
      device_id: progress.device_id,
      timestamp: progress.timestamp
    });
  } else {
    res.status(404).json({ error: 'Sem progresso para este documento' });
  }
});

// Atualizar Progresso (KOReader faz PUT em /syncs/progress)
app.put('/syncs/progress', authMiddleware, (req, res) => {
  const { document, percentage, progress, device, device_id, timestamp } = req.body;

  if (!document) {
    return res.status(400).json({ error: 'Document hash é obrigatório' });
  }

  const updated = db.updateProgress(
    req.user.username,
    document,
    percentage,
    progress,
    device,
    device_id,
    timestamp
  );

  res.json({
    document: document,
    percentage: updated.percentage,
    progress: updated.progress,
    device: updated.device,
    device_id: updated.device_id,
    timestamp: updated.timestamp
  });
});

// ==========================================
// 2. ENDPOINT OPDS CATALOG (Kindle / KOReader)
// ==========================================
app.get('/opds', (req, res) => {
  const books = db.getBooks();
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  const updatedTime = new Date().toISOString();

  let entriesXml = '';
  for (const book of books) {
    const bookUrl = `${baseUrl}/books/${book.id}/file`;
    const coverUrl = `${baseUrl}/books/${book.id}/cover`;

    entriesXml += `
  <entry>
    <title>${xmlEscape(book.title)}</title>
    <id>urn:uuid:${book.id}</id>
    <author>
      <name>${xmlEscape(book.author)}</name>
    </author>
    <summary>Livro adicionado em ${new Date(book.addedAt).toLocaleDateString()}</summary>
    <updated>${new Date(book.addedAt).toISOString()}</updated>
    <link rel="http://opds-spec.org/acquisition" href="${bookUrl}" type="application/epub+zip" title="Baixar EPUB" />
    <link rel="http://opds-spec.org/image" href="${coverUrl}" type="image/jpeg" />
    <link rel="http://opds-spec.org/image/thumbnail" href="${coverUrl}" type="image/jpeg" />
  </entry>`;
  }

  const opdsXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:dc="http://purl.org/dc/terms/"
      xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>urn:uuid:koresync-catalog</id>
  <title>Biblioteca KoreSync</title>
  <updated>${updatedTime}</updated>
  <author>
    <name>KoreSync Server</name>
  </author>
  <link rel="self" href="${baseUrl}/opds" type="application/atom+xml;profile=opds-catalog;kind=acquisition" />
  <link rel="start" href="${baseUrl}/opds" type="application/atom+xml;profile=opds-catalog;kind=acquisition" title="Início" />
  ${entriesXml}
</feed>`;

  res.header('Content-Type', 'application/atom+xml; charset=utf-8');
  res.send(opdsXml);
});

// ==========================================
// 3. ENDPOINTS DE GERENCIAMENTO DE LIVROS
// ==========================================

// Listar Livros + Progresso para o Web App
app.get('/api/books', authMiddleware, (req, res) => {
  const books = db.getBooks(req.user.username);
  const progressList = db.getAllProgress(req.user.username);
  
  const result = books.map(b => {
    const prog = progressList.find(p => p.book_id === b.id);
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      filename: b.filename,
      tags: b.tags || [],
      hasCover: !!b.coverFilename,
      addedAt: b.addedAt,
      progress: prog ? {
        percentage: prog.percentage,
        progress: prog.progress,
        device: prog.device,
        timestamp: prog.timestamp,
        startedAt: prog.startedAt || null,
        completedAt: prog.completedAt || null
      } : null
    };
  });
  
  res.json(result);
});

// Upload de Livros (múltiplos simultâneos)
app.post('/api/books', authMiddleware, upload.array('book', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const results = [];

  for (const file of req.files) {
    const tempPath = file.path;
    try {
      const fileBuffer = fs.readFileSync(tempPath);
      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');

      const finalFilename = `${md5}.epub`;
      const finalPath = path.join(BOOKS_DIR, finalFilename);

      fs.writeFileSync(finalPath, fileBuffer);
      fs.unlinkSync(tempPath);

      const metadata = parseEpub(finalPath, COVERS_DIR);

      const bookData = {
        id: md5,
        title: metadata.title,
        author: metadata.author,
        filename: file.originalname,
        filepath: finalPath,
        coverFilename: metadata.coverFilename,
        addedAt: Date.now()
      };

      db.addBook(bookData, req.user.username);

      results.push({
        success: true,
        filename: file.originalname,
        book: {
          id: bookData.id,
          title: bookData.title,
          author: bookData.author,
          hasCover: !!bookData.coverFilename
        }
      });
    } catch (err) {
      console.error(`Erro no upload de "${file.originalname}":`, err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      results.push({ success: false, filename: file.originalname, error: 'Erro ao processar o arquivo EPUB' });
    }
  }

  const anySuccess = results.some(r => r.success);
  res.status(anySuccess ? 201 : 500).json({ results });
});

// Download/Stream do arquivo do livro (suporta tanto a rota antiga do OPDS quanto a nova com extensão para o EpubJS)
app.get(['/books/:id/file', '/books/:id/book.epub'], (req, res) => {
  const book = db.getBook(req.params.id);
  const bookFilePath = getBookFilePath(book);
  if (!book || !bookFilePath) {
    return res.status(404).json({ error: 'Arquivo do livro não encontrado' });
  }
  
  // Definir o Content-Type correto para o EpubJS reconhecer o formato sem a extensão na URL
  res.setHeader('Content-Type', 'application/epub+zip');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(book.filename)}"`);
  res.sendFile(bookFilePath);
});

// Obter Capa do Livro (Capa extraída/customizada ou Capa Inteligente gerada proceduralmente)
app.get('/books/:id/cover', (req, res) => {
  const book = db.getBook(req.params.id);

  // 1. Se o livro tem uma capa em arquivo físico no disco com extensão de imagem válida
  if (book && book.coverFilename) {
    const isImageExt = /\.(jpe?g|png|webp|gif|svg)$/i.test(book.coverFilename);
    if (isImageExt) {
      const coverPath = path.join(COVERS_DIR, book.coverFilename);
      if (fs.existsSync(coverPath)) {
        try {
          const stats = fs.statSync(coverPath);
          if (stats.size > 100) {
            return res.sendFile(coverPath);
          }
        } catch (_) {}
      }
    }
  }

  // 2. Se o livro não tem arquivo de capa em disco, gerar Smart Cover em SVG vetorial de alta definição
  const title = book ? book.title : 'Livro KoreSync';
  const author = book ? book.author : 'KoreSync Library';
  const id = req.params.id || '';
  
  const svg = generateCoverSvg(title, author, id);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

// Remover Livro
app.delete('/api/books/:id', authMiddleware, (req, res) => {
  const deletedBook = db.deleteBook(req.params.id, req.user.username);
  if (deletedBook === null) {
    return res.status(404).json({ error: 'Livro não encontrado' });
  }
  if (deletedBook === false) {
    return res.status(403).json({ error: 'Você não tem permissão para excluir este livro' });
  }

  // Se nenhum outro usuário possuir o mesmo livro, remover arquivos físicos
  const remainingBooks = db.getBooks();
  const fileStillUsed = remainingBooks.some(b => b.id === req.params.id);
  if (!fileStillUsed) {
    const bookFilePath = getBookFilePath(deletedBook);
    if (bookFilePath && fs.existsSync(bookFilePath)) {
      try { fs.unlinkSync(bookFilePath); } catch (_) {}
    }
    if (deletedBook.coverFilename) {
      const coverPath = path.join(COVERS_DIR, deletedBook.coverFilename);
      if (fs.existsSync(coverPath)) {
        try { fs.unlinkSync(coverPath); } catch (_) {}
      }
    }
  }

  res.json({ success: true });
});

// Multer para upload de nova capa customizada
const uploadCover = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

// Editar Livro (Título, Autor, Tags e Capa)
app.put('/api/books/:id', authMiddleware, uploadCover.single('cover'), (req, res) => {
  const bookId = req.params.id;
  const book = db.getBook(bookId);
  if (!book) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(404).json({ error: 'Livro não encontrado' });
  }

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.author !== undefined) updates.author = req.body.author;

  if (req.body.tags !== undefined) {
    try {
      if (typeof req.body.tags === 'string') {
        const raw = req.body.tags.trim();
        updates.tags = raw.startsWith('[')
          ? JSON.parse(raw)
          : raw.split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(req.body.tags)) {
        updates.tags = req.body.tags;
      }
    } catch (_) {
      updates.tags = [];
    }
  }

  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const newCoverFilename = `${bookId}_custom_${Date.now()}${ext}`;
    const newCoverPath = path.join(COVERS_DIR, newCoverFilename);
    try {
      fs.copyFileSync(req.file.path, newCoverPath);
      fs.unlinkSync(req.file.path);

      // Remover capa antiga se for customizada anterior
      if (book.coverFilename && book.coverFilename.includes('_custom_')) {
        const oldPath = path.join(COVERS_DIR, book.coverFilename);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (_) {}
        }
      }

      updates.coverFilename = newCoverFilename;
    } catch (err) {
      console.error('Erro ao salvar nova capa customizada:', err);
    }
  }

  const updated = db.updateBook(bookId, updates, req.user.username);
  if (updated === false) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este livro' });
  }

  res.json({ success: true, book: updated });
});

// ==========================================
// 4. ENDPOINTS DE BACKUP E RESTAURAÇÃO
// ==========================================

// Multer separado para uploads de backup (zip grande)
const uploadRestore = multer({
  dest: path.join(__dirname, 'data', 'temp'),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2 GB
});

// Exportar Backup Completo (db.json + livros + capas)
app.get('/api/backup', authMiddleware, (req, res) => {
  try {
    const zip = new AdmZip();
    const DB_FILE = path.join(__dirname, 'data', 'db.json');

    // Adicionar o banco de dados
    if (fs.existsSync(DB_FILE)) {
      zip.addLocalFile(DB_FILE, '', 'db.json');
    }

    // Adicionar arquivos dos livros e capas
    const books = db.getBooks(); // todos, sem filtro de usuário
    for (const book of books) {
      const bookFilePath = getBookFilePath(book);
      if (bookFilePath && fs.existsSync(bookFilePath)) {
        zip.addLocalFile(bookFilePath, 'books/');
      }
      if (book.coverFilename) {
        const coverPath = path.join(COVERS_DIR, book.coverFilename);
        if (fs.existsSync(coverPath)) {
          zip.addLocalFile(coverPath, 'covers/');
        }
      }
    }

    const buffer = zip.toBuffer();
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="koresync_backup_${date}.zip"`);
    res.send(buffer);
  } catch (err) {
    console.error('Erro ao gerar backup:', err);
    res.status(500).json({ error: 'Erro ao gerar o arquivo de backup' });
  }
});

// Importar/Restaurar Backup
app.post('/api/restore', authMiddleware, uploadRestore.single('backup'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo de backup enviado' });
  }

  const tempPath = req.file.path;

  try {
    const zip = new AdmZip(tempPath);

    // Verificar se é um backup válido do KoreSync
    const dbEntry = zip.getEntry('db.json');
    if (!dbEntry) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({ error: 'Arquivo inválido: não é um backup KoreSync (db.json não encontrado)' });
    }

    // Restaurar banco de dados
    const DB_FILE = path.join(__dirname, 'data', 'db.json');
    const dbData = JSON.parse(dbEntry.getData().toString('utf8'));
    const tempDb = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempDb, JSON.stringify(dbData, null, 2), 'utf8');
    fs.renameSync(tempDb, DB_FILE);
    db.invalidateCache();

    // Restaurar arquivos de livros e capas
    let booksRestored = 0;
    let coversRestored = 0;

    for (const entry of zip.getEntries()) {
      if (entry.isDirectory) continue;
      const name = path.basename(entry.entryName);

      if (entry.entryName.startsWith('books/')) {
        fs.writeFileSync(path.join(BOOKS_DIR, name), entry.getData());
        booksRestored++;
      } else if (entry.entryName.startsWith('covers/')) {
        fs.writeFileSync(path.join(COVERS_DIR, name), entry.getData());
        coversRestored++;
      }
    }

    fs.unlinkSync(tempPath);

    res.json({
      success: true,
      message: `Backup restaurado com sucesso! ${booksRestored} livro(s) e ${coversRestored} capa(s) recuperados.`
    });
  } catch (err) {
    console.error('Erro ao restaurar backup:', err);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ error: 'Erro ao processar o arquivo de backup' });
  }
});

// Handler para rotas inexistentes (404)
app.use((req, res) => {
  if (req.accepts('json')) {
    res.status(404).json({ error: 'Rota não encontrada' });
  } else {
    res.status(404).type('txt').send('404 - Não encontrado');
  }
});

// Iniciar o Servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('==================================================');
  console.log(` KoreSync Iniciado com Sucesso!`);
  console.log(` Porta local: ${PORT}`);
  console.log('--------------------------------------------------');
  console.log(' Configure seu KOReader com os seguintes endereços:');
  console.log('--------------------------------------------------');
  
  // Obter endereços IPs da rede local
  const interfaces = os.networkInterfaces();
  let foundLocalIp = false;
  
  for (const devName in interfaces) {
    const ifaceList = interfaces[devName];
    for (const iface of ifaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(` IP Local (${devName}): ${iface.address}`);
        console.log(` -> Progresso (Custom Sync Server): http://${iface.address}:${PORT}`);
        console.log(` -> Catálogo de Livros (OPDS URL):  http://${iface.address}:${PORT}/opds`);
        console.log('--------------------------------------------------');
        foundLocalIp = true;
      }
    }
  }
  
  if (!foundLocalIp) {
    console.log(` Apenas Loopback Encontrado:`);
    console.log(` -> http://localhost:${PORT}`);
  }
  console.log(' Abra no navegador para gerenciar e ler seus livros!');
  console.log('==================================================');
});
