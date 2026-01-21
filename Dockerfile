FROM node:20

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

# Vite doit écouter sur toutes les interfaces
EXPOSE 5173

# Lancer le serveur dev
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]