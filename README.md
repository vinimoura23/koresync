# KoreSync 📚

O **KoreSync** é uma plataforma local e offline-first completa para gerenciar sua biblioteca de e-books e sincronizar cirurgicamente o progresso de leitura entre o navegador do seu computador (PC/Notebook) e o seu Kindle (ou qualquer dispositivo rodando **KOReader**).

Tudo funciona de forma **100% offline**, rodando na sua rede Wi-Fi local sem depender de servidores na nuvem externos ou conexões com a internet externa.

---

## ✨ Recursos Principais

- **Sincronização Bidirecional Precisa**: Comece a ler no computador e continue exatamente no mesmo parágrafo no Kindle (e vice-versa), de forma automática ou manual.
- **Catálogo OPDS Integrado**: Baixe seus livros diretamente pelo menu do KOReader no Kindle, sem necessidade de cabos USB ou transferências lentas.
- **Leitor Web Premium integrado**: Leitor embutido baseado em EpubJS com:
  - Alternância rápida entre layouts de **Página Única** ou **Página Dupla** (spread).
  - Controle de tamanho de fonte e **Modo Tela Cheia**.
  - Temas de leitura personalizados (**Claro**, **Sépia** e **Escuro**).
  - Barra de progresso interativa e arrastável por mouse ou touch com feedback a 60fps.
- **Gerenciamento de Biblioteca Web**:
  - Upload simples por arrastar e soltar (Drag & Drop) com barra de progresso.
  - Extração automática de metadados reais (Título, Autor) e capas dos arquivos `.epub`.
  - **Modo Escuro Global** na biblioteca que lembra sua preferência.
  - Visualização de porcentagem lida e dispositivo ativo por cartão de livro.
- **Banco de Dados Atômico e Leve**: Armazenamento em arquivos JSON estruturados usando gravação atômica para evitar corrupção de dados e eliminar a necessidade de compilação de SQLite/bancos nativos (100% livre de erros de dependências).

---

## 🛠️ Tecnologias Utilizadas

### Servidor (Backend)
- **Node.js**: Plataforma de execução Javascript assíncrona.
- **Express**: Framework web minimalista para rotas HTTP rápidas.
- **Multer**: Middleware para processamento eficiente do upload de livros.
- **Adm-Zip**: Biblioteca pura em JS para manipulação e extração rápida em memória de metadados/capas do arquivo compactado `.epub` (OPF e XML).
- **Crypto & FS**: Módulos nativos para cálculo de hash MD5 (ID único do livro no KOReader) e operações atômicas no sistema de arquivos.

### Cliente (Frontend / Web Reader)
- **HTML5 & CSS3 (Design System)**: Estilização moderna e responsiva baseada nas paletas oficiais do Google (Material Design), com efeitos de vidro (*glassmorphism*), layouts de grade flexíveis e transições suaves.
- **Javascript Moderno**: Lógica do cliente 100% limpa, modular e assíncrona.
- **EpubJS**: Biblioteca de alto desempenho para renderização e paginação dinâmica de arquivos EPUB no navegador dentro de sandboxes seguras (iframes).

---

## 🚀 Instalação e Inicialização

### Pré-requisitos
Certifique-se de ter o **Node.js** (versão **18** ou superior) instalado em sua máquina.

### Passo 1: Instalar Dependências
Navegue até a pasta do projeto e execute:
```bash
npm install
```

### Passo 2: Iniciar o Servidor
Para iniciar a aplicação, basta rodar:
```bash
npm start
```

O terminal exibirá os IPs locais detectados na sua rede Wi-Fi para que você configure seu Kindle com facilidade:
```text
==================================================
 KoreSync Iniciado com Sucesso!
 Porta local: 3000
--------------------------------------------------
 Configure seu KOReader com os seguintes endereços:
--------------------------------------------------
 IP Local (wlan0): 192.168.1.18
 -> Progresso (Custom Sync Server): http://192.168.1.18:3000
 -> Catálogo de Livros (OPDS URL):  http://192.168.1.18:3000/opds
==================================================
```

Abra `http://localhost:3000` no seu navegador no computador para acessar o painel principal!

---

## 📱 Configuração no Kindle (KOReader)

Certifique-se de que o seu Kindle está conectado na **mesma rede Wi-Fi** do seu computador.

### 1. Sincronizar o Progresso de Leitura (Push & Pull)
1. No KOReader, clique na barra superior para abrir o menu e vá em **Configurações** (ícone de engrenagem) > **Sincronizar Progresso** (Progress sync).
2. Em **Servidor de sincronização personalizado** (Custom sync server), digite o endereço exibido no terminal (ex: `http://192.168.1.18:3000`).
3. Clique em **Registrar / Login** (Register / Login) e insira as **mesmas credenciais** de usuário e senha que você criou na aplicação web do computador.
4. Ative a opção **Sincronização automática** (Auto sync) para salvar o progresso ao abrir ou fechar livros.

### 2. Baixar Livros sem Fio (Catálogo OPDS)
1. No KOReader, abra o menu superior, vá em **Pesquisa** (ícone de lupa) > **Catálogos OPDS** (OPDS Catalogs).
2. Selecione **Adicionar catálogo** (Add catalog).
3. Insira o nome: `KoreSync`
4. Insira a URL do catálogo OPDS exibida no terminal (ex: `http://192.168.1.18:3000/opds`).
5. Pronto! Agora basta clicar em `KoreSync` no menu do Kindle para visualizar, filtrar e baixar todos os seus livros sem usar fios ou e-mail!

---

## 🔒 Segurança e Dados Locais

Todos os seus livros, capas extraídas e dados de progresso de leitura são mantidos estritamente na sua máquina dentro do diretório `data/`:
- `data/books/`: Arquivos `.epub` reais carregados.
- `data/covers/`: Capas de livros extraídas e salvas em alta qualidade.
- `data/db.json`: Banco de dados estruturado em formato JSON onde residem as contas locais e logs de progresso (protegido contra inclusão no Git por padrão).

---

## 📄 Licença

Este projeto é de uso livre e pessoal para entusiastas de leitura digital e da comunidade KOReader.
