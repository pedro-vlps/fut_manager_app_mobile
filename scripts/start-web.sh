#!/bin/sh
set -eu
if [ -z "${API_UPSTREAM:-}" ]; then
  echo "Configure API_UPSTREAM no ambiente do servidor antes de iniciar o site." >&2
  exit 1
fi
case "$API_UPSTREAM" in
  https://*|http://*) ;;
  *) echo "API_UPSTREAM deve conter um endereço HTTP ou HTTPS válido." >&2; exit 1 ;;
esac
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
