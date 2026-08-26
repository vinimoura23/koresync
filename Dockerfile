FROM node:18-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código-fonte da aplicação
COPY . .

# Criar diretórios de dados
RUN mkdir -p data/books data/covers data/temp

# Porta padrão do KoreSync
EXPOSE 3000

# Volume para persistência do banco, livros e capas
VOLUME ["/app/data"]

# Iniciar servidor
CMD ["node", "server.js"]
