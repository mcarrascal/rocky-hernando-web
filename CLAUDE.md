# Rocky Hernando — sitio web

Landing estática (HTML + CSS + JS vanilla, sin build ni npm). Se sirve con
Cloudflare Workers static assets (`wrangler.jsonc`, `assets.directory = "."`).

- `index.html` — toda la página, una sola vista
- `styles.css` — estilos
- `main.js` — interacciones (nav, reveals, carrusel, formularios)
- `lib/manifest.js` — configuración (WhatsApp, Access Key de Web3Forms)
- `assets/img/` — imágenes `.webp`

No hay tests ni linter. Para validar un cambio, abrir `index.html` en el navegador.

---

## 📌 Tarea principal: publicar reseñas nuevas

**Este es el motivo por el que existe este archivo.** La dueña del sitio
(Mili) recibe reseñas por mail y se las manda a Claude — muchas veces desde el
teléfono, en una sesión nueva sin contexto previo. Cuando eso pase, seguí este
procedimiento tal cual.

### De dónde vienen las reseñas

El formulario de la web (`index.html`, sección `#resenas`) manda las reseñas
por **Web3Forms** al mail de Rocky (ver `initReviewForm` en `main.js`). **No se
publican solas.** Alguien tiene que agregarlas al HTML a mano: ese es el trabajo.

El mail llega con este formato:

```
Asunto: Nueva reseña (5/5) de Nombre Apellido
Nombre: Nombre Apellido
Estrellas: 5 / 5
Reseña: El texto que escribió la persona.
```

Mili puede pegar el mail tal cual, o pasar los datos sueltos. Si falta el
puntaje, asumir 5 estrellas.

### Cómo publicarlas

**1. Rama.** Trabajar siempre en `claude/resenas`, partiendo de `main` actualizado:

```bash
git fetch origin main
git checkout -B claude/resenas origin/main
```

Empezar de cero desde `main` en cada tanda: el PR anterior ya se mergeó y no se
reutiliza.

**2. Agregar las tarjetas.** Van dentro de `<div class="reviews-grid" data-reviews>`
en `index.html`, al final de las que ya están. Una `<article>` por reseña:

```html
<article class="review-card">
  <div class="review-stars" aria-label="5 de 5 estrellas">★★★★★</div>
  <p class="review-text">Texto de la reseña, tal cual lo escribió la persona.</p>
  <p class="review-name">Nombre como firma</p>
</article>
```

Reglas:

- **Estrellas.** Si no son 5, usar `★` llenas y `☆` vacías hasta sumar 5
  (ej. 4 estrellas → `★★★★☆`) y **actualizar el `aria-label`** para que diga el
  número real (`aria-label="4 de 5 estrellas"`). El `aria-label` es lo que leen
  los lectores de pantalla: si no coincide con las estrellas, es un bug de
  accesibilidad.
- **Texto.** Respetar lo que escribió la persona, emojis incluidos. Corregir
  solo errores obvios de tipeo. No reescribir ni "mejorar" el tono.
- **Nombre.** Como lo mandó Mili. El CSS lo pasa a mayúsculas solo, no hace
  falta escribirlo en mayúsculas.
- **Caracteres especiales.** Escapar `&` como `&amp;`, `<` como `&lt;`.
- **Cantidad.** La grilla es flex con wrap centrado (`styles.css`), así que
  entra cualquier cantidad de tarjetas sin romper el layout. No hay tope.

**3. Commit y push.**

```bash
git add index.html
git commit -m "Agregar reseña de <Nombre>"
git push -u origin claude/resenas
```

**4. Abrir un PR contra `main`.** Uno por cada tanda de reseñas. En el cuerpo,
listar quién dejó cada reseña y con cuántas estrellas, para que Mili lo revise
de un vistazo desde el teléfono.

**Mili mergea el PR.** No mergear por ella. Al mergearse a `main` es cuando la
reseña queda publicada.

### Cosas que NO hay que hacer

- No pushear directo a `main`.
- No inventar reseñas, nombres ni puntajes. Si algo no está claro en lo que
  mandó Mili, preguntar antes de publicar — son testimonios reales de personas
  reales.
- No tocar el resto de la página al agregar una reseña. El diff debería ser
  solo las `<article>` nuevas.
