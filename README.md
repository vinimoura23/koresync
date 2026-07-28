# KoreSync

Servidor local para sincronizar o progresso de leitura entre o KOReader (Kindle) e o navegador do computador. Roda na sua rede Wi-Fi sem depender de nenhum serviço externo.

## O que faz

- Implementa o protocolo **KOSync** — o mesmo que o KOReader usa nativamente para sincronizar progresso entre dispositivos
- Serve um **catálogo OPDS** para baixar livros diretamente pelo KOReader, sem cabo
- Inclui um **leitor web** baseado em EpubJS para ler no computador e manter o progresso sincronizado com o Kindle

## Instalação

Node.js 18+ é necessário.

```bash
git clone https://github.com/vinimoura23/koresync
cd koresync
npm install
npm start
```

O terminal exibe os IPs locais detectados:

```
KoreSync Iniciado com Sucesso! — Porta: 3000
IP Local (wlan0): 192.168.1.18
  -> Sincronização: http://192.168.1.18:3000
  -> Catálogo OPDS: http://192.168.1.18:3000/opds
```

Acesse `http://localhost:3000` no navegador para gerenciar a biblioteca.

## Configuração no KOReader

O Kindle e o computador precisam estar na **mesma rede Wi-Fi**.

**Sincronização de progresso**
1. Menu > Configurações > Sincronizar Progresso > Servidor personalizado
2. Digite o endereço exibido no terminal (ex: `http://192.168.1.18:3000`)
3. Clique em Registrar/Login com as mesmas credenciais criadas na interface web

**Baixar livros sem fio (OPDS)**
1. Menu > Pesquisa > Catálogos OPDS > Adicionar catálogo
2. Nome: `KoreSync`, URL: `http://192.168.1.18:3000/opds`

## Dados locais

Tudo fica em `data/` (ignorado pelo git):

```
data/
├── books/    # EPUBs carregados
├── covers/   # Capas extraídas
└── db.json   # Usuários e progresso de leitura
```

## Stack

| Camada | Tecnologia |
|---|---|
| Servidor | Node.js + Express |
| Upload | Multer |
| Parser EPUB | Adm-Zip (extração de metadados e capas) |
| Leitor web | EpubJS |
| Banco de dados | JSON com escrita atômica |

## Limitações conhecidas

- A biblioteca de livros é compartilhada entre todos os usuários cadastrados — não há isolamento por conta
- Senhas armazenadas como MD5 (adequado para uso local na LAN; não exponha o servidor na internet sem adicionar autenticação mais robusta)
- Sem testes automatizados

## Licença

MIT — uso pessoal livre.
