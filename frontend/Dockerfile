FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:24-alpine
WORKDIR /app
COPY index.html extra.css ./
COPY --from=build /app/main.js /app/extra.js /app/server.js ./
USER node
EXPOSE 8080
CMD ["node", "server.js"]
