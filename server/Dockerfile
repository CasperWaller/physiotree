# Generisk container för Railway / Fly.io / valfri host.
FROM node:20-bookworm-slim

# Prisma behöver openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 4000
# db push synkar schemat vid start; seed körs separat en gång.
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
