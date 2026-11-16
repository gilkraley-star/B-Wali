#!/usr/bin/env bash
# Installe (ou met à jour) Bê Wali sur le serveur. Se lance en root : bash install.sh
set -euo pipefail
DOMAIN="${BEWALI_DOMAIN:-bewali.naxaci.com}"
CADDY_DIR="/root/naxaci-mail"
CADDY_CT="naxaci-mail-caddy-1"
APP_DIR="/root/be-wali"
DATA_DIR="/root/bewali-data"

echo "== 1/6 Téléchargement du code =="
if [ -d "$APP_DIR/.git" ]; then git -C "$APP_DIR" pull --ff-only; else git clone https://github.com/gilkraley-star/B-Wali "$APP_DIR"; fi
mkdir -p "$DATA_DIR/uploads"
cd "$APP_DIR/deploy"

echo "== 2/6 Réglages (une seule fois) =="
if [ ! -f .env ] || ! grep -q "^ADMIN_PASSWORD=.\+" .env; then
  read -r -p "E-mail du compte administrateur Bê Wali : " ADMIN_EMAIL </dev/tty
  read -r -s -p "Mot de passe administrateur (12 caractères ou plus, sans guillemets ni \$, invisible quand tu tapes) : " ADMIN_PASSWORD </dev/tty; echo
  NET=$(docker inspect "$CADDY_CT" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
  umask 077
  cat > .env <<ENV
DATABASE_URL=file:/data/bewali.db
JWT_SECRET=$(openssl rand -hex 32)
PORT=4000
NODE_ENV=production
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
UPLOAD_DIR=/data/uploads
DOWNLOAD_URL=https://github.com/gilkraley-star/B-Wali/releases
CADDY_NETWORK=$NET
ENV
fi

echo "== 3/6 Adresse https://$DOMAIN dans Caddy =="
if ! grep -q "^$DOMAIN" "$CADDY_DIR/Caddyfile"; then
  cp "$CADDY_DIR/Caddyfile" "$CADDY_DIR/Caddyfile.avant-bewali"
  cat >> "$CADDY_DIR/Caddyfile" <<CADDY

# Bê Wali (application de santé et d'entraide pour les filles)
$DOMAIN {
        encode zstd gzip
        reverse_proxy bewali-api:4000
}
CADDY
fi
getent hosts "$DOMAIN" >/dev/null || echo "⚠ $DOMAIN ne pointe pas encore vers ce serveur : ajoute l'entrée DNS de type A, puis relance ce script."

echo "== 4/6 Construction et démarrage (3 à 6 minutes) =="
docker compose up -d --build

echo "== 5/6 Contenu de départ =="
if [ ! -f "$DATA_DIR/.seeded" ]; then
  sleep 15
  docker compose exec -T bewali-api npm run seed && touch "$DATA_DIR/.seeded"
fi

echo "== 6/6 Activation de l'adresse sécurisée =="
docker exec "$CADDY_CT" caddy reload --config /etc/caddy/Caddyfile || { echo "Rechargement doux impossible : redémarrage rapide de Caddy"; docker restart "$CADDY_CT"; }
sleep 12
echo "Test :"; curl -s -o /dev/null -w "  https://$DOMAIN/admin/ -> code %{http_code}\n" "https://$DOMAIN/admin/" || echo "  pas encore joignable (DNS ou certificat en cours) : réessaie dans 2 minutes"
echo "Terminé. Administration : https://$DOMAIN/admin/"
