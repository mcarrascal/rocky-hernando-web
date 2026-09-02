---
name: publicar-resena
description: Publica una reseña nueva de un alumno en el sitio de Rocky Hernando, de punta a punta — pull de main, tarjeta HTML, PR listo para mergear, deploy a Cloudflare y verificación en vivo. Usala SIEMPRE que Mili mande una reseña para el sitio de Rocky, aunque no diga "publicar" ni nombre la skill: alcanza con que pegue un mail de Web3Forms, mande los tres campos sueltos (nombre / estrellas / reseña), escriba "llegó otra reseña", "nueva reseña", "agregá esta reseña", "subí esta al sitio", o pegue un texto que claramente sea el testimonio de un alumno. Si el texto trae "ReseÃ±a" o cualquier otro símbolo raro por mala codificación, es justamente el caso de esta skill. También usala si pide deployar o publicar reseñas ya mergeadas.
---

# Publicar una reseña en el sitio de Rocky

Mili recibe las reseñas por mail y te las manda — muchas veces desde el teléfono,
en una sesión nueva sin contexto. Este es el procedimiento completo, del pull al
sitio publicado.

**El objetivo real:** que Mili solo tenga que tocar un link y apretar "Merge".
Todo lo demás lo hacés vos, y le decís con precisión qué quedó publicado.

Son testimonios reales de personas reales. Nunca inventes una reseña, un nombre
ni un puntaje. Si algo no se entiende de lo que mandó Mili, preguntá antes de
publicar — es preferible una pregunta a publicar algo que la persona no escribió.

---

## Lo que te va a mandar

Tres variables, en cualquier formato: pegado el mail entero de Web3Forms, o los
datos sueltos.

```
Nombre
Augusto Raimundo
Estrellas
5 / 5
ReseÃ±a
Mas que un entrenador, un sensei.
```

- **Nombre** — la firma de la tarjeta.
- **Estrellas** — sobre 5. Si no viene, asumí 5.
- **Reseña** — el texto. La etiqueta casi siempre llega como `ReseÃ±a`.

### La codificación rota (mojibake)

El mail llega mal codificado y las tildes y eñes aparecen como pares de símbolos
raros. **No es lo que escribió la persona: es el mail que se rompió en el
camino.** Leelo como el texto correcto y publicá siempre la versión bien escrita.

| Llega | Es |
|---|---|
| `Ã±` | `ñ` |
| `Ã¡` | `á` |
| `Ã©` | `é` |
| `Ã­` | `í` |
| `Ã³` | `ó` |
| `Ãº` | `ú` |
| `Ã` sola | `í` |

Vale para cualquier palabra, no solo para la etiqueta "Reseña". Si el texto de la
reseña viene así, arreglalo entero antes de armar la tarjeta. **Nunca copies los
símbolos rotos al HTML** — quedarían visibles en el sitio para siempre.

---

## Paso 1 — Partir de la última versión

Mili edita el sitio por su cuenta entre reseña y reseña, así que `main` casi
siempre avanzó desde la última vez. Empezá siempre de cero desde `main`:

```bash
git fetch origin main
git checkout -B claude/resenas origin/main
```

Si `claude/resenas` está ocupada por un PR tuyo todavía abierto, usá otro nombre
(`claude/resena-<nombre>`) para que los dos PRs queden independientes y Mili
pueda mergearlos en el orden que quiera.

Mirá si `main` trae cambios de Mili sin deployar (`git log`). No es un problema
—tu deploy los va a publicar junto con la reseña— pero **avisale al final**, para
que no le salgan cambios al aire de sorpresa.

---

## Paso 2 — Agregar la tarjeta

Va dentro de `<div class="reviews-grid" data-reviews>` en `index.html`, **al
final de las que ya están**:

```html
<article class="review-card">
  <div class="review-stars" aria-label="5 de 5 estrellas">★★★★★</div>
  <p class="review-text">Texto de la reseña.</p>
  <p class="review-name">Nombre como firma</p>
</article>
```

**Estrellas.** Si no son 5, usá `★` llenas y `☆` vacías hasta sumar 5
(4 → `★★★★☆`) y **cambiá también el `aria-label`** al número real
(`aria-label="4 de 5 estrellas"`). El `aria-label` es lo que escucha alguien que
usa un lector de pantalla: si dice 5 y las estrellas muestran 4, esa persona
recibe información falsa.

**Texto.** Respetá lo que escribió la persona, emojis incluidos. Corregí solo
errores obvios de tipeo —una tilde que falta en un comparativo, por ejemplo— y
decíselo a Mili en el PR. No reescribas ni "mejores" el tono: si suena raro leído
suelto, es la voz de esa persona y así tiene que salir.

**Nombre.** Como lo mandó Mili. El CSS lo pasa a mayúsculas solo, no hace falta
escribirlo en mayúsculas ni corregirle las minúsculas.

**Caracteres especiales.** Escapá `&` como `&amp;` y `<` como `&lt;`.

**Cantidad.** No hay tope. La grilla y el carrusel se adaptan solos.

El diff tiene que ser **solo la `<article>` nueva**. Si tocaste algo más, volvé
atrás: cualquier otra línea en el diff hace que Mili tenga que revisar de verdad
en vez de solo aprobar.

---

## Paso 3 — Probarlo antes de subirlo

Las reseñas se muestran en un carrusel que arma el JavaScript leyendo las
tarjetas del HTML. Verificar que el HTML "se ve bien" no alcanza: hay que ver que
el carrusel efectivamente levante la tarjeta nueva.

```bash
.claude/skills/publicar-resena/scripts/verificar-local.sh "Nombre como firma"
```

Levanta la página en un navegador real y comprueba que la tarjeta esté, que las
estrellas coincidan con el `aria-label`, que el carrusel la tome y que no haya
errores de JavaScript. Si falla, arreglalo antes de seguir.

Los pedidos fallidos a `fonts.googleapis.com` y `static.cloudflareinsights.com`
son normales: el entorno los bloquea. No son un problema del sitio.

---

## Paso 4 — Commit, push y PR

```bash
git add index.html
git commit -m "Agregar reseña de <Nombre>"
git push -u origin claude/resenas
```

Si el push falla con `stale info`, es porque GitHub borró la rama al mergear el
PR anterior: `git remote prune origin` y volvé a pushear. No uses `--force`.

Abrí el PR contra `main` con el tool de GitHub. En el cuerpo poné quién dejó la
reseña y con cuántas estrellas, el texto citado, y cualquier corrección de tipeo
que hayas hecho — Mili lo revisa desde el teléfono y tiene que poder decidir de
un vistazo.

**Después escribile en el chat exactamente así**, con el link markdown completo
para que lo pueda tocar desde el teléfono:

```
Listo. PR #9 abierto: [mcarrascal/rocky-hernando-web#9](https://github.com/mcarrascal/rocky-hernando-web/pull/9)
```

Agregá abajo dos o tres líneas con qué reseña es, cuántas van en total y qué
verificaste. Nada más: el detalle largo ya está en el PR.

---

## Paso 5 — Pará acá y esperá

**No mergees por Mili.** Ella aprueba y mergea; es su sitio y son testimonios de
sus alumnos. Terminá el turno y esperá a que te diga "ya lo mergeé" o similar.

Si te pidió las dos cosas en un mismo mensaje ("agregala y publicala"), igual
tenés que frenar acá: el deploy sale de `main`, y `main` no tiene la reseña hasta
que ella mergee. Decíselo en una línea así sabe que la pelota está de su lado.

---

## Paso 6 — Deployar

Mergear **no publica nada**. El sitio recién cambia cuando corrés el deploy.

```bash
git checkout main && git pull origin main   # deployá main, nunca la rama del PR
WRANGLER_SEND_METRICS=false npx wrangler deploy
```

Antes, confirmá que el PR está realmente mergeado (con el tool de GitHub) y que
`main` local tiene la reseña. Si Mili se confundió de botón, mejor darte cuenta
acá que después de decirle que está publicado.

**Wrangler va a subir un solo archivo (`index.html`) casi siempre.** No es que
falte algo: Cloudflare guarda los archivos por contenido, y si Mili ya deployó
desde su compu, el resto ya está arriba. Confirmalo por hash en el paso 7 en vez
de asumirlo.

---

## Paso 7 — Verificar en el sitio en vivo

```bash
.claude/skills/publicar-resena/scripts/verificar-vivo.sh "Nombre como firma"
```

Comprueba contra `https://rockyhernando.keplerai.workers.dev` que la reseña
aparezca, que el HTML publicado sea idéntico al de `main`, que los assets
coincidan por hash y que `CLAUDE.md`, `.git/config` y demás sigan dando 404.

**Nunca digas que una reseña está publicada si el deploy no corrió o si esta
verificación no pasó.** Si algo falla, decilo con el error concreto.

---

## Cuando algo sale mal

**`Authentication error [code: 10000]`** — el token de Cloudflare no sirve para
publicar. Tiene que ser uno de la plantilla "Edit Cloudflare Workers" (permiso
`Workers Scripts:Edit`). Ojo: "Workers AI" es otro producto y no sirve. Para ver
qué token estás usando sin exponerlo:

```bash
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
```

**`fetch failed` / `CONNECT tunnel failed 403`** — la política de red del entorno
bloquea `api.cloudflare.com` o el dominio del sitio. Lo tiene que habilitar Mili
en la configuración del entorno; no hay forma de saltearlo desde acá.

**Cambiaste una variable de entorno y no la toma** — un contenedor ya en marcha
no las relee. Hace falta abrir una sesión nueva desde el mismo entorno.

Si no podés deployar, decíselo claro y recordale que ella puede correr
`npx wrangler deploy` desde su compu.

---

## Cosas que no hay que hacer

- **No pushear directo a `main`.** Siempre rama y PR.
- **No mergear por Mili.**
- **No inventar** reseñas, nombres ni puntajes.
- **No tocar el resto de la página.** El diff es solo la `<article>` nueva.
- **No agregar archivos a la raíz sin sumarlos a `.assetsignore`.**
  `wrangler.jsonc` publica la carpeta entera (`assets.directory = "."`), así que
  todo lo que no esté excluido queda descargable en `https://<sitio>/<ruta>`.
