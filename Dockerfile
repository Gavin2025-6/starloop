FROM node:22-slim

RUN apt-get update -qq && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --prefer-offline=false

# Copy source and build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
