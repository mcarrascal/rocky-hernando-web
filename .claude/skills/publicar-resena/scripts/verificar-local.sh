#!/usr/bin/env bash
# Verifica en un navegador real que la reseña nueva se vea y que el carrusel la
# tome. El carrusel se arma con JavaScript leyendo las tarjetas del HTML, así que
# revisar el HTML a ojo no alcanza: hay que ejecutar la página.
#
#   verificar-local.sh "Nombre como firma"
#
# Sale 0 si está todo bien, 1 si algo falla.

set -uo pipefail

FIRMA="${1:-}"
if [ -z "$FIRMA" ]; then
  echo "Uso: verificar-local.sh \"Nombre como firma\"" >&2
  exit 1
fi

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$REPO" || exit 1

if [ ! -f index.html ]; then
  echo "ERROR: no encuentro index.html en $REPO" >&2
  exit 1
fi

WORK="$(mktemp -d)"
PORT=8099
while lsof -i ":$PORT" >/dev/null 2>&1; do PORT=$((PORT + 1)); done

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if ! curl -sS --noproxy '*' -o /dev/null "http://127.0.0.1:$PORT/index.html"; then
  echo "ERROR: no pude levantar el sitio local" >&2
  exit 1
fi

# Playwright: reusar el del proyecto si está, si no instalarlo en el temporal.
if node -e "require.resolve('playwright')" 2>/dev/null; then
  NODE_PATH_DIR="$(node -e "console.log(require.resolve('playwright'))" | sed 's#/node_modules/playwright.*##')/node_modules"
else
  echo "Instalando playwright (una vez)..." >&2
  (cd "$WORK" && npm i playwright --silent --no-fund --no-audit >/dev/null 2>&1)
  NODE_PATH_DIR="$WORK/node_modules"
fi

cat > "$WORK/check.mjs" <<'JS'
import { chromium } from 'playwright';

const [url, firma] = [process.argv[2], process.argv[3]];
const errores = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => errores.push(String(e.message)));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

const r = await page.evaluate((firma) => {
  const grid = document.querySelector('[data-reviews]');
  const car = document.querySelector('[data-reviews-carousel]');
  if (!grid) return { error: 'No encontré la grilla [data-reviews]' };
  const cards = [...grid.querySelectorAll('.review-card')];
  const card = cards.find(c => c.querySelector('.review-name')?.textContent.trim() === firma);
  if (!card) return { error: `No encontré la tarjeta de "${firma}"`, total: cards.length };
  const stars = card.querySelector('.review-stars');
  const txt = stars?.textContent?.trim() ?? '';
  return {
    total: cards.length,
    estrellas: txt,
    llenas: (txt.match(/★/g) || []).length,
    vacias: (txt.match(/☆/g) || []).length,
    aria: stars?.getAttribute('aria-label') ?? '',
    texto: card.querySelector('.review-text')?.textContent?.trim() ?? '',
    carruselListo: car ? car.classList.contains('is-ready') : null,
    enCarrusel: car ? [...car.querySelectorAll('.review-name')]
      .filter(n => n.textContent.trim() === firma).length : 0,
  };
}, firma);

await browser.close();

if (r.error) { console.log('FALLO: ' + r.error); process.exit(1); }

let ok = true;
const di = (bien, msg) => { console.log((bien ? '  OK   ' : '  FALLA') + '  ' + msg); if (!bien) ok = false; };

console.log(`Reseñas en la página: ${r.total}`);
console.log(`Tarjeta de "${firma}": ${r.estrellas}  ·  aria-label: "${r.aria}"`);
console.log(`Texto: ${r.texto}`);
console.log('');

di(r.llenas + r.vacias === 5, `las estrellas suman 5 (${r.llenas} llenas + ${r.vacias} vacías)`);
const nAria = parseInt((r.aria.match(/^(\d+)\s+de\s+5/) || [])[1] ?? '-1', 10);
di(nAria === r.llenas, `el aria-label ("${r.aria}") coincide con ${r.llenas} estrellas llenas`);
di(r.texto.length > 0, 'la tarjeta tiene texto');
di(!/Ã|Â/.test(r.texto + firma), 'no quedaron símbolos de codificación rota');
di(r.carruselListo === true, 'el carrusel se armó');
di(r.enCarrusel > 0, `el carrusel tomó la reseña nueva (aparece ${r.enCarrusel} veces en el loop)`);
di(errores.length === 0, errores.length ? `errores de JavaScript: ${JSON.stringify(errores)}` : 'sin errores de JavaScript');

console.log('');
console.log(ok ? 'TODO BIEN — listo para commitear.' : 'HAY PROBLEMAS — arreglalos antes de subir.');
process.exit(ok ? 0 : 1);
JS

NODE_PATH="$NODE_PATH_DIR" node "$WORK/check.mjs" "http://127.0.0.1:$PORT/index.html" "$FIRMA"
