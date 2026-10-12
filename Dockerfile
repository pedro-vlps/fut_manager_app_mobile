FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:pwa

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY scripts/start-web.sh /usr/local/bin/start-web
RUN chmod +x /usr/local/bin/start-web
COPY --from=build /app/dist /srv
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/start-web"]
