FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# The app runs as the node user, which can't write to /app
ENV DATA_FILE=/tmp/data.json
ENV CLAIMS_FILE=/tmp/claims.json
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4001
USER node
CMD ["node", "dist/index.js"]
