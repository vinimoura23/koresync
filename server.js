const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const db = require('./db');
const { parseEpub } = require('./epub-util');

const app = express();
const PORT = process.env.PORT || 3000;

// Garantir diretórios necessários
const BOOKS_DIR = path.join(__dirname, 'data', 'books');
const COVERS_DIR = path.join(__dirname, 'data', 'covers');
if (!fs.existsSync(BOOKS_DIR)) fs.mkdirSync(BOOKS_DIR, { recursive: true });
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configurar o Multer para upload temporário
const upload = multer({
  dest: path.join(__dirname, 'data', 'temp'),
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
      hasCover: !!b.coverFilename,
      addedAt: b.addedAt,
      progress: prog ? {
        percentage: prog.percentage,
        progress: prog.progress,
        device: prog.device,
        timestamp: prog.timestamp
      } : null
    };
  });
  
  res.json(result);
});

// Upload de Livros
app.post('/api/books', authMiddleware, upload.single('book'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const tempPath = req.file.path;
  
  try {
    // 1. Calcular o MD5 hash do arquivo para ID único do KOReader
    const fileBuffer = fs.readFileSync(tempPath);
    const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
    
    const finalFilename = `${md5}.epub`;
    const finalPath = path.join(BOOKS_DIR, finalFilename);

    // Se o livro já existe, não precisamos duplicar o arquivo físico, apenas re-analisar
    fs.writeFileSync(finalPath, fileBuffer);
    fs.unlinkSync(tempPath); // Remover temporário

    // 2. Extrair metadados e capa usando o utilitário
    const metadata = parseEpub(finalPath, COVERS_DIR);

    // 3. Cadastrar livro no banco
    const bookData = {
      id: md5,
      title: metadata.title,
      author: metadata.author,
      filename: req.file.originalname,
      filepath: finalPath,
      coverFilename: metadata.coverFilename,
      addedAt: Date.now()
    };

    db.addBook(bookData, req.user.username);

    res.status(201).json({
      success: true,
      book: {
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        hasCover: !!bookData.coverFilename
      }
    });

  } catch (err) {
    console.error('Erro no upload do livro:', err);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    res.status(500).json({ error: 'Erro ao processar o arquivo EPUB' });
  }
});

// Download/Stream do arquivo do livro (suporta tanto a rota antiga do OPDS quanto a nova com extensão para o EpubJS)
app.get(['/books/:id/file', '/books/:id/book.epub'], (req, res) => {
  const book = db.getBook(req.params.id);
  if (!book || !fs.existsSync(book.filepath)) {
    return res.status(404).json({ error: 'Arquivo do livro não encontrado' });
  }
  
  // Definir o Content-Type correto para o EpubJS reconhecer o formato sem a extensão na URL
  res.setHeader('Content-Type', 'application/epub+zip');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(book.filename)}"`);
  res.sendFile(book.filepath);
});

// Obter Capa do Livro
app.get('/books/:id/cover', (req, res) => {
  const book = db.getBook(req.params.id);
  const serveDefaultCover = () => {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="200" height="300">
  <defs>
    <linearGradient id="cover-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a73e8" />
      <stop offset="100%" stop-color="#1557b0" />
    </linearGradient>
  </defs>
  <rect width="200" height="300" fill="url(#cover-grad)"/>
  <rect x="10" y="10" width="180" height="280" rx="4" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <circle cx="100" cy="120" r="40" fill="rgba(255,255,255,0.1)"/>
  <path d="M90 100 L110 120 L90 140" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="100" y="210" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="1">KoreSync</text>
  <text x="100" y="232" font-family="'Inter', sans-serif" font-size="11" font-weight="400" fill="rgba(255,255,255,0.7)" text-anchor="middle">Sem Capa</text>
</svg>
    `);
  };

  if (!book || !book.coverFilename) {
    return serveDefaultCover();
  }
  
  const coverPath = path.join(COVERS_DIR, book.coverFilename);
  if (fs.existsSync(coverPath)) {
    res.sendFile(coverPath);
  } else {
    return serveDefaultCover();
  }
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
    if (fs.existsSync(deletedBook.filepath)) {
      try { fs.unlinkSync(deletedBook.filepath); } catch (_) {}
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
