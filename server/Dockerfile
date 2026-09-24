# Generisk container för Railway / Fly.io / valfri host.
# OBS: bygg från REPO-ROTEN så att content/ kommer med:
#   docker build -f server/Dockerfile -t physiotree-api .
FROM node:20-bookworm-slim

# Prisma behöver openssl
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
COPY content/ /content
RUN npx prisma generate && npm run build

ENV CONTENT_DIR=/content
EXPOSE 4000
# db push synkar schemat; seedar bara om databasen är tom; startar sedan API:t.
CMD ["sh", "-c", "npm run deploy:start"]
