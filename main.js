(function () {
  "use strict";
  /* Rocky Hernando · The Conqueror — main.js (IIFE, classic script) */

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---------- WhatsApp helpers ---------- */
  function waURL(text) {
    var num = String(data.whatsapp || "").replace(/[^0-9]/g, "");
    var base = "https://wa.me/" + num;
    return text ? base + "?text=" + encodeURIComponent(text) : base;
  }
  function initWhatsApp() {
    var hello = data.whatsappHello || "Hola, quiero más info.";
    $$("[data-wa-link]").forEach(function (a) {
      a.setAttribute("href", waURL(hello));
      a.setAttribute("target", "_blank");
    });
  }

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 600);
    else window.addEventListener("load", function () { setTimeout(hide, 400); });
    setTimeout(hide, 4000); // extra safety
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var root = $("[data-cursor-root]");
    if (!root || !fineHover) return;
    document.documentElement.classList.add("has-cursor");
    var ring = $(".cursor-ring", root), dot = $(".cursor-dot", root);
    var tx = 0, ty = 0, rx = 0, ry = 0, first = false;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!first) { first = true; rx = tx; ry = ty; if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)"; root.classList.add("is-ready"); }
    }, { passive: true });
    (function tick() { rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18; if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)"; requestAnimationFrame(tick); })();
    var HOVER = "a[href], button, .exp-card, .train-card, .press-card, .g-item";
    document.addEventListener("mouseover", function (e) { if (e.target.closest(HOVER)) root.classList.add("is-interactive"); });
    document.addEventListener("mouseout", function (e) { if (e.target.closest(HOVER) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVER))) root.classList.remove("is-interactive"); });
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (nav) {
      var on = function () { if (window.scrollY > 70) nav.classList.add("is-scrolled"); else nav.classList.remove("is-scrolled"); };
      on(); window.addEventListener("scroll", on, { passive: true });
    }
    var burger = $("[data-burger]"), menu = $("[data-mobile-menu]");
    if (burger && menu) {
      var setOpen = function (open) {
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        menu.setAttribute("aria-hidden", open ? "false" : "true");
        document.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function () { setOpen(menu.getAttribute("aria-hidden") === "true"); });
      $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    }
  }

  /* ---------- Smooth anchors (native) ---------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var offset = 76;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - offset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("is-revealed"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -3% 0px" });
    els.forEach(function (el) { io.observe(el); });
    // Safety net: reveal anything still hidden in-view after 6s
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  /* ---------- Count-up ---------- */
  function initCountUp() {
    $$("[data-count-to]").forEach(function (el) {
      var target = parseFloat(el.dataset.countTo);
      var decimals = ((el.dataset.countTo.split(".")[1]) || "").length;
      var done = false;
      var fmt = function (v) {
        var n = decimals ? v.toFixed(decimals) : Math.round(v).toString();
        return target >= 1000 ? Number(n).toLocaleString("es-AR") : n;
      };
      var trigger = function () {
        if (done) return; done = true;
        if (window.gsap) {
          var obj = { v: 0 };
          window.gsap.to(obj, { v: target, duration: 1.5, ease: "power2.out", onUpdate: function () { el.textContent = fmt(obj.v); } });
        } else { el.textContent = fmt(target); }
      };
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { trigger(); io.unobserve(e.target); } });
      }, { threshold: 0.05 });
      io.observe(el);
    });
  }

  /* ---------- Tilt ---------- */
  function initTilt() {
    if (matchMedia("(hover: none)").matches) return;
    $$("[data-tilt]").forEach(function (card) {
      var MAX = 6, tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.classList.add("has-tilt");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- Marquee ---------- */
  function initMarquee() {
    $$("[data-marquee]").forEach(function (track) {
      var container = track.parentNode;
      var base = track.innerHTML;
      // Fill until the content clearly exceeds the viewport, so it reads as ONE
      // continuous ribbon (not two visible copies).
      var guard = 0;
      while (track.scrollWidth < container.offsetWidth * 1.6 && guard < 40) { track.innerHTML += base; guard++; }
      var half = track.scrollWidth;
      track.innerHTML += track.innerHTML;   // duplicate once → seamless wrap
      if (!window.gsap || half <= 0) return;
      var speed = 90; // px/sec
      window.gsap.to(track, { x: -half, duration: half / speed, ease: "none", repeat: -1 });
    });
  }

  /* ---------- Center-mode carousel (step + pause, infinite loop) ---------- */
  function initCenterCarousel() {
    $$("[data-ccar]").forEach(function (root) {
      var vp = $("[data-ccar-vp]", root);
      var track = $("[data-ccar-track]", root);
      var dotsWrap = $("[data-ccar-dots]", root);
      if (!vp || !track) return;
      var reals = $$(".cslide", track);
      var n = reals.length;
      if (n < 2) return;
      var CLONES = 2;

      // Clone edges so the loop is seamless.
      var firstOriginal = track.children[0];
      for (var i = n - CLONES; i < n; i++) {
        var c = reals[i].cloneNode(true); c.classList.add("is-clone"); c.setAttribute("aria-hidden", "true");
        track.insertBefore(c, firstOriginal);
      }
      for (var k = 0; k < CLONES; k++) {
        var c2 = reals[k].cloneNode(true); c2.classList.add("is-clone"); c2.setAttribute("aria-hidden", "true");
        track.appendChild(c2);
      }
      var slides = $$(".cslide", track);

      // Dots (one per real slide).
      var dots = [];
      if (dotsWrap) {
        dotsWrap.innerHTML = "";
        reals.forEach(function (_, i) {
          var b = document.createElement("button");
          b.type = "button"; b.setAttribute("aria-label", "Ir a la foto " + (i + 1));
          b.addEventListener("click", function () { goReal(i); });
          dotsWrap.appendChild(b); dots.push(b);
        });
      }

      var current = CLONES, vpW = 0, TRANS = 700, PAUSE = 3200, timer = null;

      function render(animate) {
        var s = slides[current];
        var x = vpW / 2 - (s.offsetLeft + s.offsetWidth / 2);
        track.classList.toggle("ccar-jump", !animate);
        track.style.transform = "translate3d(" + x + "px,0,0)";
        slides.forEach(function (sl, i) { sl.classList.toggle("is-active", i === current); });
        var r = ((current - CLONES) % n + n) % n;
        dots.forEach(function (d, i) { d.classList.toggle("is-active", i === r); });
      }
      function measure() { vpW = vp.clientWidth; render(false); }
      function normalize() {
        if (current >= n + CLONES) { current -= n; render(false); }
        else if (current < CLONES) { current += n; render(false); }
      }
      function step(dir) { current += dir; render(true); setTimeout(normalize, TRANS + 40); }
      function goReal(r) { current = r + CLONES; render(true); setTimeout(normalize, TRANS + 40); restart(); }
      function restart() { if (timer) clearInterval(timer); timer = setInterval(function () { step(1); }, PAUSE); }

      var prev = $(".ccar-prev", root), next = $(".ccar-next", root);
      if (prev) prev.addEventListener("click", function () { step(-1); restart(); });
      if (next) next.addEventListener("click", function () { step(1); restart(); });

      // Swipe (touch / pointer).
      var sx = null;
      vp.addEventListener("pointerdown", function (e) { sx = e.clientX; });
      vp.addEventListener("pointerup", function (e) {
        if (sx == null) return; var dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 40) { step(dx < 0 ? 1 : -1); restart(); }
      });

      measure();
      $$("img", track).forEach(function (im) { if (!im.complete) im.addEventListener("load", measure); });
      window.addEventListener("resize", function () { clearTimeout(track._crt); track._crt = setTimeout(measure, 200); });
      restart();
    });
  }

  /* ---------- Hero parallax ---------- */
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var content = $(".hero-content"), bg = $(".hero-bg");
    if (bg) window.gsap.to(bg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (content) window.gsap.to(content, { yPercent: -28, opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* ---------- Contact form → WhatsApp ---------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    var success = $("[data-contact-success]");
    if (!form) return;
    var btn = form.querySelector("[type=submit]");
    var msg = $("[data-contact-success-msg]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;

      var name = (form.elements.name.value || "").trim();
      var email = (form.elements.email.value || "").trim();
      var goal = (form.elements.goal.value || "").trim();
      var message = (form.elements.message.value || "").trim();
      var text = "¡Hola Rocky! Soy " + name + "."
        + "\nObjetivo: " + goal
        + (message ? "\n" + message : "")
        + (email ? "\nMi email: " + email : "");

      // Open WhatsApp synchronously (preserves the click gesture)
      window.open(waURL(text), "_blank");

      form.classList.add("is-sending");
      if (btn) btn.disabled = true;
      setTimeout(function () {
        var first = name.split(/\s+/)[0] || "";
        if (msg) msg.textContent = first + ", te derivo a WhatsApp con tu consulta lista. Si no se abrió, tocá el botón de WhatsApp.";
        form.classList.add("is-sent");
        if (success) { success.setAttribute("aria-hidden", "false"); success.classList.add("is-visible"); }
      }, 650);
    });
  }

  /* ---------- Star rating input ---------- */
  function initStars() {
    $$("[data-stars]").forEach(function (group) {
      var hidden = $("[data-stars-value]", group.parentNode) || $("[data-stars-value]");
      var stars = $$(".star", group);
      function clear() { stars.forEach(function (s) { s.classList.remove("is-on", "is-hover", "is-hint", "is-hint-half"); }); }
      function showValue(v, cls) { clear(); stars.forEach(function (s, i) { if (i < v) s.classList.add(cls); }); }
      function showHint() { clear(); stars.forEach(function (s, i) { if (i < 3) s.classList.add("is-hint"); else if (i === 3) s.classList.add("is-hint-half"); }); }
      function current() { return (hidden && hidden.value) ? parseInt(hidden.value, 10) : 0; }
      showHint();  // pista inicial: 3 estrellas y media en dorado tenue
      stars.forEach(function (s, i) {
        s.addEventListener("mouseenter", function () { showValue(i + 1, "is-hover"); });
        s.addEventListener("click", function () { if (hidden) hidden.value = i + 1; showValue(i + 1, "is-on"); });
      });
      group.addEventListener("mouseleave", function () { var v = current(); if (v > 0) showValue(v, "is-on"); else showHint(); });
    });
  }

  /* ---------- Review form (Web3Forms) ---------- */
  function initReviewForm() {
    var form = $("[data-review-form]");
    if (!form) return;
    var success = $("[data-review-success]");
    var btn = form.querySelector("[type=submit]");
    var hiddenStars = $("[data-stars-value]", form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      if (!form.reportValidity()) return;
      if (!hiddenStars || !hiddenStars.value) { alert("Elegí una puntuación de 1 a 5 estrellas."); return; }

      var key = (data.web3formsKey || "").trim();
      var name = (form.elements.name.value || "").trim();
      var review = (form.elements.review.value || "").trim();
      var stars = hiddenStars.value;

      if (!key) { alert("Falta configurar la Access Key de Web3Forms en lib/manifest.js (web3formsKey)."); return; }

      form.classList.add("is-sending");
      if (btn) btn.disabled = true;

      var fd = new FormData();
      fd.append("access_key", key);
      fd.append("subject", "Nueva reseña (" + stars + "/5) de " + name);
      fd.append("from_name", "Reseñas web · Rocky Hernando");
      fd.append("Nombre", name);
      fd.append("Estrellas", stars + " / 5");
      fd.append("Reseña", review);

      fetch("https://api.web3forms.com/submit", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json && json.success) {
            form.classList.add("is-sent");
            if (success) { success.setAttribute("aria-hidden", "false"); success.classList.add("is-visible"); }
          } else { throw new Error((json && json.message) || "error"); }
        })
        .catch(function () {
          form.classList.remove("is-sending");
          if (btn) btn.disabled = false;
          alert("No se pudo enviar la reseña. Revisá la conexión (o la Access Key) e intentá de nuevo.");
        });
    });
  }

  /* ---------- Misc ---------- */
  function initYear() { $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); }); }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initYear, "initYear");
    safe(initWhatsApp, "initWhatsApp");
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTilt, "initTilt");
    safe(initContactForm, "initContactForm");
    safe(initStars, "initStars");
    safe(initReviewForm, "initReviewForm");
    safe(initCenterCarousel, "initCenterCarousel");

    if (window.gsap && window.ScrollTrigger) {
      try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (_) {}
      safe(initMarquee, "initMarquee");
      safe(initHeroParallax, "initHeroParallax");
    } else if (window.gsap) {
      safe(initMarquee, "initMarquee");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
