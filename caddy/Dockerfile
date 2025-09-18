# Only used in production

FROM caddy:2-builder AS builder

RUN xcaddy build --with github.com/mholt/caddy-ratelimit

FROM caddy:2.10-alpine

COPY Caddyfile.prod /etc/caddy/Caddyfile
COPY --from=builder /usr/bin/caddy /usr/bin/caddy

