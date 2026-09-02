#!/usr/bin/env bash
# Verifica contra el sitio EN VIVO que el deploy salió bien.
#
#   verificar-vivo.sh "Nombre como firma"
#
# Comprueba que la reseña esté publicada, que el HTML servido sea idéntico al de
# main, que los assets coincidan por hash y que los archivos privados sigan
# dando 404. Sale 0 si está todo bien, 1 si algo falla.
#
# Correr esto DESPUÉS de `wrangler deploy`, con main ya pulleado.

set -uo pipefail

SITIO="${SITIO:-https://rockyhernando.keplerai.workers.dev}"
FIRMA="${1:-}"
if [ -z "$FIRMA" ]; then
  echo "Uso: verificar-vivo.sh \"Nombre como firma\"" >&2
  exit 1
fi

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$REPO" || exit 1

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

OK=0
di() { if [ "$1" = "0" ]; then echo "  OK     $2"; else echo "  FALLA  $2"; OK=1; fi; }

echo "Sitio: $SITIO"
echo ""

# El borde de Cloudflare puede seguir sirviendo la página vieja unos segundos
# después del deploy. Eso no es un fallo del deploy, pero sí es lo que ve la
# gente, así que esperamos a que el borde se ponga al día en vez de dar por
# bueno un HIT viejo. Reintentamos la URL normal —la que abren los visitantes—
# y recién si no se actualiza distinguimos "deploy fallido" de "caché atrasada".
descargar() { curl -sS --max-time 30 "$1" -o "$2"; }

INTENTOS=6
for i in $(seq 1 $INTENTOS); do
  if ! descargar "$SITIO/" "$WORK/live.html"; then
    echo "ERROR: no pude descargar el sitio. Si dice 'CONNECT tunnel failed 403'," >&2
    echo "la política de red del entorno bloquea el dominio: lo tiene que habilitar Mili." >&2
    exit 1
  fi
  grep -qF "$FIRMA" "$WORK/live.html" && break
  [ "$i" = "$INTENTOS" ] && break
  echo "  ...el borde todavía sirve la versión anterior, reintento en 10s ($i/$INTENTOS)"
  sleep 10
done

# ¿Sigue sin aparecer? Distinguir caché atrasada de deploy que no salió.
if ! grep -qF "$FIRMA" "$WORK/live.html"; then
  if descargar "$SITIO/?cb=$$-$RANDOM" "$WORK/nocache.html" && grep -qF "$FIRMA" "$WORK/nocache.html"; then
    echo ""
    echo "OJO: el deploy SÍ salió —saltando la caché, la reseña está publicada—"
    echo "pero el borde de Cloudflare todavía sirve la página anterior a quien la"
    echo "abra normalmente. Suele resolverse en un minuto. Volvé a correr esto"
    echo "antes de decirle a Mili que está publicado."
    exit 1
  fi
fi

# --- Contenido publicado ---
TOTAL=$(grep -c 'class="review-card"' "$WORK/live.html" || true)
echo "Reseñas publicadas: $TOTAL"

grep -qF "$FIRMA" "$WORK/live.html"
di $? "la reseña de \"$FIRMA\" está en vivo"

! grep -qE 'Ã.|Â.' "$WORK/live.html"
di $? "no hay símbolos de codificación rota en la página publicada"

cmp -s "$WORK/live.html" index.html
di $? "el HTML en vivo es idéntico al de main"

# --- Assets por hash: wrangler suele subir solo index.html, hay que confirmar ---
echo ""
echo "Assets (local vs publicado):"
for f in styles.css main.js lib/manifest.js; do
  [ -f "$f" ] || continue
  if curl -sS --max-time 30 "$SITIO/$f" -o "$WORK/asset" 2>/dev/null; then
    a=$(sha256sum "$f" | cut -d' ' -f1)
    b=$(sha256sum "$WORK/asset" | cut -d' ' -f1)
    [ "$a" = "$b" ]
    di $? "$f"
  else
    di 1 "$f (no se pudo descargar)"
  fi
done

# --- Nada privado expuesto ---
echo ""
echo "Archivos privados (tienen que dar 404):"
for p in CLAUDE.md .git/config .gitignore wrangler.jsonc .assetsignore \
         tools/ assets/photos/ .claude/skills/publicar-resena/SKILL.md; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$SITIO/$p")
  [ "$code" = "404" ]
  di $? "/$p → $code"
done

echo ""
if [ "$OK" = "0" ]; then
  echo "TODO BIEN — la reseña está publicada y verificada en el sitio real."
else
  echo "HAY PROBLEMAS — no le digas a Mili que está publicado hasta resolverlos."
fi
exit "$OK"
