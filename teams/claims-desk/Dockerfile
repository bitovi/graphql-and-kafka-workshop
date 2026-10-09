FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY public ./public
EXPOSE 3000
USER node
CMD ["node", "server.js"]
