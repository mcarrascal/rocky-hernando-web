/* Renders assets/credits.json into the credits page. Classic script. */
(function () {
  "use strict";
  var list = document.querySelector("[data-credits]");
  if (!list) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  fetch("assets/credits.json")
    .then(function (r) { return r.json(); })
    .then(function (credits) {
      var entries = Object.keys(credits).map(function (k) { return credits[k]; });
      if (!entries.length) { list.innerHTML = "<li>Sin créditos que mostrar.</li>"; return; }
      list.innerHTML = entries.map(function (c) {
        var author = c.creator_url
          ? '<a href="' + esc(c.creator_url) + '" target="_blank" rel="noopener">' + esc(c.creator || "Autor") + "</a>"
          : esc(c.creator || "Autor desconocido");
        var lic = c.license_url
          ? '<a href="' + esc(c.license_url) + '" target="_blank" rel="noopener">' + esc((c.license || "").toUpperCase()) + " " + esc(c.license_version || "") + "</a>"
          : esc((c.license || "").toUpperCase());
        var orig = c.foreign_landing_url
          ? ' · <a href="' + esc(c.foreign_landing_url) + '" target="_blank" rel="noopener">ver original ↗</a>'
          : "";
        return "<li><strong>" + esc(c.title || "Imagen") + "</strong> — " + author
          + '<span class="meta">' + esc(c.source || "") + " · " + lic + orig + "</span></li>";
      }).join("");
    })
    .catch(function () {
      list.innerHTML = "<li>No se pudieron cargar los créditos (abrí la web desde un servidor, no con doble clic).</li>";
    });
})();
