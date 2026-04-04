#!/usr/bin/env bash
# Configura variables de entorno en Vercel desde el archivo .env.secrets (local, NO subido a git).
# Uso:
#   1. Copia .env.secrets.example → .env.secrets y rellena los valores
#   2. bash setup-vercel-env.sh

VERCEL=/tmp/vercel-pkg/node_modules/.bin/vercel
SECRETS_FILE="$(dirname "$0")/.env.secrets"

if [ ! -f "$SECRETS_FILE" ]; then
  echo "ERROR: No se encontró $SECRETS_FILE"
  echo "Copia .env.secrets.example → .env.secrets y rellena los valores."
  exit 1
fi

# Load secrets file
set -a; source "$SECRETS_FILE"; set +a

# Validate required vars
for var in FLOW_API_KEY FLOW_SECRET_KEY ANTHROPIC_API_KEY_APRENDER SUPABASE_SERVICE_ROLE_KEY; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var no está definido en $SECRETS_FILE"
    exit 1
  fi
done

# Autenticar si es necesario
if ! $VERCEL whoami &>/dev/null; then
  echo "→ Iniciando sesión en Vercel..."
  $VERCEL login
fi

echo "→ Configurando variables de entorno en Vercel..."

set_env() {
  local key="$1"
  local value="$2"
  for env in production preview development; do
    echo "$value" | $VERCEL env add "$key" "$env" --force 2>/dev/null || \
    echo "$value" | $VERCEL env add "$key" "$env" 2>/dev/null
  done
  echo "  ✓ $key"
}

set_env "FLOW_API_KEY"               "$FLOW_API_KEY"
set_env "FLOW_SECRET_KEY"            "$FLOW_SECRET_KEY"
set_env "ANTHROPIC_API_KEY_APRENDER" "$ANTHROPIC_API_KEY_APRENDER"
set_env "SUPABASE_SERVICE_ROLE_KEY"  "$SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "✓ Variables configuradas. Iniciando redeploy..."
$VERCEL --prod --yes

echo ""
echo "✓ Listo."
