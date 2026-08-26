# KoreSync 📚

O **KoreSync** é uma plataforma local e offline-first completa para gerenciar sua biblioteca de e-books e sincronizar cirurgicamente o progresso de leitura entre o navegador do seu computador (PC/Notebook) e o seu Kindle (ou qualquer dispositivo rodando **KOReader**).

Tudo funciona de forma **100% offline**, rodando na sua rede Wi-Fi local sem depender de servidores na nuvem externos ou conexões com a internet externa.

---

## ✨ Recursos Principais

- **Sincronização Bidirecional Precisa**: Comece a ler no computador e continue exatamente no mesmo parágrafo no Kindle (e vice-versa), de forma automática ou manual.
- **Catálogo OPDS Integrado**: Baixe seus livros diretamente pelo menu do KOReader no Kindle, sem fios ou cabos USB.
- **Leitor Web Premium integrado**: Leitor embutido baseado em EpubJS com:
  - **Sumário Completo (TOC)** com suporte recursivo a capítulos e subcapítulos.
  - Alternância rápida entre layouts de **Página Única** ou **Página Dupla** (spread de 2 colunas calibrado).
  - Controle de tamanho de fonte, navegação por teclado e **Modo Tela Cheia** com tecla `ESC` inteligente.
  - Temas de leitura personalizados (**Claro**, **Sépia** e **Escuro**).
  - Barra de progresso interativa e sincronização com feedback visual.
- **Gerenciamento Completo de Biblioteca**:
  - **Coleções / Tags**: Organize seus livros em categorias (*"Harry Potter"*, *"Fantasia"*, *"Favoritos"*) com barra de filtros no topo.
  - **Filtro de Leitura**: Oculte livros não lidos com 1 clique para focar no que está em andamento.
  - **Editor de Metadados e Capas**: Altere título, autor, tags e envie novas capas personalizadas com orientações de proporção ideal (2:3).
  - **Ordenação Dinâmica**: Ordene por data de adição, título (A→Z / Z→A) ou progresso de leitura (% lida).
  - **Estatísticas de Leitura**: Acompanhe datas de adição, início e conclusão da leitura em cada cartão.
  - **Upload Múltiplo**: Envie até 20 livros simultaneamente por drag & drop.
  - **Backup & Restauração**: Exporte e importe backups completos em `.zip` contendo o banco de dados, livros e capas.
  - **Perfil e Avatares**: Altere nome de usuário e senha, escolha avatares minimalistas padrão ou envie sua própria foto de perfil.
- **Banco de Dados Atômico em RAM**: Cache em memória ultra rápido com gravação atômica em disco (`.tmp` → `.json`), seguro contra corrupções e sem necessidade de compilação de bancos pesados.

---

## 🛠️ Tecnologias Utilizadas

### Servidor (Backend)
- **Node.js** (v18+) & **Express**
- **Multer** & **Adm-Zip**
- **Crypto & FS** nativos

### Cliente (Frontend / Web Reader)
- **HTML5 & CSS3** (Material Design moderno com suporte a Modo Escuro)
- **Javascript Moderno** (sem frameworks pesados ou etapas de build)
- **EpubJS** local e otimizado

---

## 🚀 Instalação e Inicialização

### Opção A: Executar com Docker (Recomendado para Servidores/NAS)
Se você possui Docker e Docker Compose instalados:

```bash
docker compose up -d
```
O KoreSync estará rodando em segundo plano na porta `3000` com persistência automática no diretório `./data`.

---

### Opção B: Executar Localmente com Node.js

#### Pré-requisitos
Certifique-se de ter o **Node.js** (versão **18** ou superior) instalado em sua máquina.

#### Passo 1: Instalar Dependências
```bash
npm install
```

#### Passo 2: Iniciar o Servidor
```bash
npm start
```
*(Para desenvolvimento com auto-reload: `npm run dev`)*

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
