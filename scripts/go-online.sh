#!/usr/bin/env bash
# Share the local stack: public tunnels (no account needed) -> web build -> APK.
# Temporary: tunnel addresses change every run and stop when this Mac sleeps.
# Permanent hosting = swap the two env values (see docs/build/HANDOFF.md).
set -euo pipefail
cd "$(dirname "$0")/.."
LOG=${TMPDIR:-/tmp}/kc-tunnels; mkdir -p "$LOG"
KEY=$(supabase status -o env | grep ^ANON_KEY | cut -d'"' -f2)
tun() { (nohup cloudflared tunnel --no-autoupdate --url "$1" >"$LOG/$2.log" 2>&1 &); for _ in $(seq 1 30); do u=$(grep -ho 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG/$2.log" | head -1); [ -n "$u" ] && { echo "$u"; return; }; sleep 1; done; }
API=$(tun http://127.0.0.1:56321 api); MAIL=$(tun http://127.0.0.1:56324 mail)
echo "API  $API"; echo "MAIL $MAIL (sign-in codes)"
( cd web && NEXT_DIST_DIR=.next-online NEXT_PUBLIC_SUPABASE_URL=$API NEXT_PUBLIC_SUPABASE_ANON_KEY=$KEY NEXT_PUBLIC_DEMO_STATES=1 npm run build >/dev/null \
  && (NEXT_DIST_DIR=.next-online NEXT_PUBLIC_SUPABASE_URL=$API NEXT_PUBLIC_SUPABASE_ANON_KEY=$KEY NEXT_PUBLIC_DEMO_STATES=1 nohup npx next start -p 3300 >"$LOG/web-server.log" 2>&1 &) )
WEB=$(tun http://127.0.0.1:3300 web); echo "WEB  $WEB"
( cd app && flutter build apk --release --dart-define=SUPABASE_URL=$API --dart-define=SUPABASE_ANON_KEY=$KEY ) && mkdir -p export && cp app/build/app/outputs/flutter-apk/app-release.apk export/KudiCubs-test.apk && echo "APK  export/KudiCubs-test.apk"
