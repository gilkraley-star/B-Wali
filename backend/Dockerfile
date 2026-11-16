FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
