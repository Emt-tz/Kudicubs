#!/usr/bin/env bash
# Bring the local KudiCubs backend up: start the stack if needed, apply migrations, seed, print URLs.
# Only touches the "kudicubs" Supabase project (run from this repo; other projects are never stopped).
set -euo pipefail
cd "$(dirname "$0")/.."

docker info >/dev/null 2>&1 || { echo "Docker is not running. Start Docker Desktop and run this again."; exit 1; }
command -v supabase >/dev/null || { echo "supabase CLI not found (brew install supabase/tap/supabase)"; exit 1; }
command -v node >/dev/null || { echo "node not found"; exit 1; }

if ! supabase status -o env >/dev/null 2>&1; then
  echo "Starting the local Supabase stack..."
  supabase start
fi
echo "Applying migrations (db reset)..."
supabase db reset

( cd scripts && { [ -d node_modules ] || npm ci --silent; } && node seed.mjs --reset )

eval "$(supabase status -o env | grep -E '^(API_URL|DB_URL|STUDIO_URL|MAILPIT_URL|ANON_KEY)=')"
cat <<OUT

KudiCubs backend is ready
  API        $API_URL
  DB         $DB_URL
  Studio     $STUDIO_URL
  Mailpit    $MAILPIT_URL   (sign-in codes arrive here)
  Anon key   $ANON_KEY
  (service key: supabase status -o env, SERVICE_ROLE_KEY; never ship it in a client)

Demo accounts: parent@example.com, parent2@example.com, staff@example.com
Parent PIN: 5821
OUT
