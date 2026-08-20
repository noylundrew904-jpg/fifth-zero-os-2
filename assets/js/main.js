(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------------------------------------------------------
     Media frame: builds/wires the reusable "video placeholder" unit
     used across hero, archive cards, galleries and project pages.
     Drop real files into a project's `media` object in data.js (see
     assets/media/projects/README.txt) and this same markup switches
     from the animated placeholder to real playback automatically.
     Never renders a broken video/image — anything missing just falls
     back to the placeholder treatment.
  --------------------------------------------------------------- */
  function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* Escapes text before it's concatenated into an innerHTML template.
     Every value below currently comes from the studio's own static
     data.js, never from a URL/query param — this is defense-in-depth
     so that stays true even as content is edited over time. */
  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function mediaFrameHTML(opts) {
    opts = opts || {};
    var mp4 = opts.mp4 || '';
    var webm = opts.webm || '';
    var mp4Mobile = opts.mp4Mobile || '';
    var poster = opts.poster || '';
    var image = opts.image || '';
    var alt = opts.alt || '';
    var tag = opts.tag || '';
    var cam = opts.cam || '';
    var scrim = opts.scrim !== false;
    var curtain = opts.curtain !== false;
    var sweep = !!opts.sweep;
    var cursor = opts.cursor || '';
    return (
      '<div class="media-frame" data-mp4="' + escapeAttr(mp4) + '" data-webm="' + escapeAttr(webm) + '" data-mp4-mobile="' + escapeAttr(mp4Mobile) + '" data-poster="' + escapeAttr(poster) + '" data-image="' + escapeAttr(image) + '" data-alt="' + escapeAttr(alt) + '"' +
        (cursor ? ' data-cursor="' + escapeAttr(cursor) + '"' : '') + '>' +
        (tag ? '<span class="media-frame-tag">' + escapeHtml(tag) + '</span>' : '') +
        (cam ? '<span class="media-frame-cam">' + escapeHtml(cam) + '</span>' : '') +
        '<div class="media-frame-placeholder"></div>' +
        (sweep ? '<div class="media-frame-sweep"></div>' : '') +
        '<video muted loop playsinline preload="none"' + (poster ? ' poster="' + escapeAttr(poster) + '"' : '') + ' aria-hidden="true"></video>' +
        (scrim ? '<div class="media-frame-scrim"></div>' : '') +
        (curtain ? '<div class="media-frame-curtain"></div>' : '') +
      '</div>'
    );
  }

  function initMediaFrames(root) {
    (root || document).querySelectorAll('.media-frame').forEach(function (frame) {
      if (frame.dataset.wired) return;
      frame.dataset.wired = '1';
      var mp4 = frame.dataset.mp4, webm = frame.dataset.webm, mp4Mobile = frame.dataset.mp4Mobile;
      var image = frame.dataset.image;

      if (image) {
        var img = document.createElement('img');
        img.className = 'media-frame-image';
        img.alt = frame.dataset.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('error', function () {
          frame.classList.remove('has-image');
          img.remove();
        });
        frame.classList.add('has-image');
        frame.insertBefore(img, frame.querySelector('.media-frame-scrim') || null);
        img.src = image;
        return;
      }

      if (!mp4 && !webm) return;
      var video = frame.querySelector('video');
      if (!video) return;
      if (mp4Mobile) { var s0 = document.createElement('source'); s0.src = mp4Mobile; s0.type = 'video/mp4'; s0.media = '(max-width: 640px)'; video.appendChild(s0); }
      if (webm) { var s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; video.appendChild(s1); }
      if (mp4) { var s2 = document.createElement('source'); s2.src = mp4; s2.type = 'video/mp4'; video.appendChild(s2); }
      video.addEventListener('error', function () { frame.classList.remove('has-video'); }, true);
      frame.classList.add('has-video');

      var isHoverPlay = frame.closest('.archive-card, .archive-feature, .gallery-grid');
      if (isHoverPlay && !isTouch) {
        var card = frame.closest('a, div');
        card.addEventListener('mouseenter', function () { video.play().catch(function () {}); });
        card.addEventListener('mouseleave', function () { video.pause(); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) video.play().catch(function () {});
            else video.pause();
          });
        }, { threshold: 0.35 });
        io.observe(frame);
      }
    });
  }

  window.FZ = window.FZ || {};
  window.FZ.mediaFrameHTML = mediaFrameHTML;
  window.FZ.initMediaFrames = initMediaFrames;
  window.FZ.initReveals = function () { initReveals(); };
  window.FZ.escapeAttr = escapeAttr;
  window.FZ.escapeHtml = escapeHtml;

  /* ---------------------------------------------------------------
     Custom cursor
  --------------------------------------------------------------- */
  function initCursor() {
    if (isTouch) return;
    var dot = document.createElement('div');
    dot.className = 'cursor';
    var label = document.createElement('div');
    label.className = 'cursor-label';
    document.body.appendChild(dot);
    document.body.appendChild(label);

    var mx = 0, my = 0, dx = 0, dy = 0;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      label.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function tick() {
      dx += (mx - dx) * 0.2;
      dy += (my - dy) * 0.2;
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    })();

    document.addEventListener('mouseover', function (e) {
      var target = e.target.closest('[data-cursor]');
      if (target) {
        var text = target.getAttribute('data-cursor');
        if (text) {
          label.textContent = text;
          label.classList.add('is-active');
          dot.classList.add('is-hidden');
        } else {
          dot.style.width = '46px';
          dot.style.height = '46px';
        }
      }
    });
    document.addEventListener('mouseout', function (e) {
      var target = e.target.closest('[data-cursor]');
      if (target) {
        label.classList.remove('is-active');
        dot.classList.remove('is-hidden');
        dot.style.width = '';
        dot.style.height = '';
      }
    });
    document.addEventListener('mouseleave', function () {
      dot.classList.add('is-hidden');
      label.classList.remove('is-active');
    });
    document.addEventListener('mouseenter', function () {
      dot.classList.remove('is-hidden');
    });
  }

  /* ---------------------------------------------------------------
     Hero entrance — film-title-style line reveal, fired once the
     loader curtain lifts (or immediately if there's no loader).
  --------------------------------------------------------------- */
  function revealHero() {
    var title = document.querySelector('.hero-title');
    var category = document.querySelector('.hero-category');
    var sub = document.querySelector('.hero-sub');
    var actions = document.querySelector('.hero-actions');
    if (title) title.classList.add('is-revealed');
    if (category) category.classList.add('is-revealed');
    if (sub) sub.classList.add('is-revealed');
    if (actions) actions.classList.add('is-revealed');
  }

  /* ---------------------------------------------------------------
     Hero title fit — a headline word with no spaces (e.g.
     "UNFORGETTABLE.") can't wrap, so at some viewport widths it's
     wider than its line and gets clipped by the reveal wrapper's
     overflow:hidden. Multi-word lines are left alone — they wrap
     safely on their own. This measures the actual rendered width of
     any single-token line and shrinks just that line's font-size
     enough to always fit, however wide the word or narrow the
     screen. Re-runs once the real webfont swaps in and on resize.
  --------------------------------------------------------------- */
  function fitTextLine(el) {
    if (!el) return;
    var available = el.parentElement ? el.parentElement.clientWidth : 0;
    if (!available) return;
    el.style.fontSize = '';
    var cs = getComputedStyle(el);
    var full = parseFloat(cs.fontSize);
    if (!full) return;
    var canvas = fitTextLine._canvas || (fitTextLine._canvas = document.createElement('canvas'));
    var ctx = canvas.getContext('2d');
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + full + 'px ' + cs.fontFamily;
    var width = ctx.measureText(el.textContent).width;
    if (width > available) {
      el.style.fontSize = (full * (available / width) * 0.98) + 'px';
    }
  }

  function initHeroTitleFit() {
    var targets = [];
    document.querySelectorAll('.hero-title .line-inner').forEach(function (el) {
      if (!/\s/.test(el.textContent.trim())) targets.push(el);
    });
    var projectTitle = document.querySelector('.project-hero-title');
    if (projectTitle && !/\s/.test(projectTitle.textContent.trim())) targets.push(projectTitle);
    if (!targets.length) return;

    function fitAll() { targets.forEach(fitTextLine); }
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitAll, 120);
    });
  }
  window.FZ.fitTextLine = fitTextLine;

  /* ---------------------------------------------------------------
     Intro loader (homepage only, once per session)
  --------------------------------------------------------------- */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) {
      revealHero();
      return;
    }
    var played = sessionStorage.getItem('fzIntroPlayed');
    var finish = function () {
      loader.classList.add('is-done');
      document.body.classList.remove('loading');
      sessionStorage.setItem('fzIntroPlayed', '1');
      revealHero();
    };
    if (played || reduceMotion) {
      finish();
      return;
    }
    document.body.classList.add('loading');
    requestAnimationFrame(function () { loader.classList.add('is-playing'); });
    var t = setTimeout(finish, 3400);
    loader.querySelector('.loader-skip').addEventListener('click', function () {
      clearTimeout(t);
      finish();
    });
  }

  /* ---------------------------------------------------------------
     Live timecode — a ticking mm:ss:cs readout, control-room detail
  --------------------------------------------------------------- */
  function initTimecode() {
    if (reduceMotion) return;
    document.querySelectorAll('[data-timecode]').forEach(function (el) {
      var start = performance.now();
      function tick() {
        var elapsed = (performance.now() - start) / 1000;
        var m = Math.floor(elapsed / 60);
        var s = Math.floor(elapsed % 60);
        var cs = Math.floor((elapsed * 100) % 100);
        el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ':' + String(cs).padStart(2, '0');
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------
     Page transition — a cut-to-black between internal pages instead
     of a bare browser navigation.
  --------------------------------------------------------------- */
  function initPageTransition() {
    var el = document.querySelector('.page-transition');
    if (!el) return;
    if (reduceMotion) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-revealing'); });
    });
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('http') === 0 || a.target === '_blank') return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        el.classList.remove('is-revealing');
        el.classList.add('is-leaving');
        setTimeout(function () { window.location.href = href; }, 420);
      });
    });
  }

  /* ---------------------------------------------------------------
     Header state + mobile nav
  --------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 12);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    var burger = document.querySelector('.nav-burger');
    var mobileNav = document.querySelector('.mobile-nav');
    if (burger && mobileNav) {
      burger.addEventListener('click', function () {
        var open = burger.classList.toggle('is-open');
        mobileNav.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          burger.classList.remove('is-open');
          mobileNav.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
    }
  }

  /* ---------------------------------------------------------------
     Scroll reveals
  --------------------------------------------------------------- */
  function initReveals() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger, .clip-reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     Stat counters — animates a [data-count] element from 0 up to its
     target value once scrolled into view, e.g. the about page's
     "Events Filmed / Countries / Frames Cut" stat band. Values with
     [data-no-animate] (a single fact like a founding year, not a
     running total) just render as-is instead of counting up.
  --------------------------------------------------------------- */
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    var compactFormatter = (window.Intl && Intl.NumberFormat)
      ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
      : null;

    function format(el, value) {
      if (el.hasAttribute('data-compact') && compactFormatter) return compactFormatter.format(value);
      return String(Math.round(value));
    }

    function animateCount(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (!isFinite(target)) return;
      if (reduceMotion || el.hasAttribute('data-no-animate')) {
        el.textContent = format(el, target) + suffix;
        return;
      }
      var duration = 1600;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(el, target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------
     Manifesto scroll-scrub — pins the section and steps a "playhead"
     word-by-word as the visitor scrolls, like scrubbing an edit
     timeline. Falls back to a static stacked list under
     prefers-reduced-motion (handled entirely in CSS).
  --------------------------------------------------------------- */
  function initScrub() {
    var wrap = document.getElementById('manifestoScrub');
    if (!wrap || reduceMotion) return;
    var words = wrap.querySelectorAll('.scrub-word');
    var dots = wrap.querySelectorAll('.scrub-progress i');
    var ticking = false;

    function update() {
      ticking = false;
      var rect = wrap.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;
      var progress = Math.min(1, Math.max(0, -rect.top / total));
      var idx = Math.min(words.length - 1, Math.floor(progress * words.length));
      words.forEach(function (w, i) {
        w.classList.toggle('is-active', i === idx);
        w.classList.toggle('is-passed', i < idx);
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------
     Sound toggle (structural — wires up once real audio/video exists)
  --------------------------------------------------------------- */
  function initSoundToggle() {
    var btn = document.querySelector('.sound-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = btn.classList.toggle('is-on');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.querySelector('.label').textContent = on ? 'SOUND ON' : 'SOUND OFF';
      document.querySelectorAll('.media-frame video').forEach(function (v) { v.muted = !on; });
    });
  }

  /* ---------------------------------------------------------------
     Archive builders — shared by homepage teaser + work.html.
     Gated projects (see data.js) are filtered out before anything
     renders, so they never appear here — see project.js for what
     happens if someone reaches a gated slug directly. The first
     remaining item renders as a full-bleed "feature" (film-poster
     style); everything else drops into the asymmetric grid.
  --------------------------------------------------------------- */
  function archiveCardHTML(project) {
    var span = project.span || 6;
    return (
      '<div class="archive-item reveal" data-span="' + span + '" data-vertical="' + !!project.vertical + '">' +
        '<a class="archive-card" href="project.html?slug=' + escapeAttr(project.slug) + '" data-cursor="VIEW FILM →">' +
          mediaFrameHTML({
            mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
            tag: project.category, cam: (parseInt(project.id, 10) % 2 === 0) ? 'CAM B' : 'CAM A'
          }) +
          '<span class="archive-card-ghost mono">' + escapeHtml(project.id) + '</span>' +
          '<div class="archive-card-info">' +
            '<div>' +
              '<div class="archive-card-num mono">' + escapeHtml(project.id) + '</div>' +
              '<div class="archive-card-title">' + escapeHtml(project.title) + '</div>' +
            '</div>' +
            '<div class="archive-card-meta">' + escapeHtml(project.event) + '<br>' + escapeHtml(project.location) + ' / ' + escapeHtml(project.year) + '</div>' +
          '</div>' +
        '</a>' +
      '</div>'
    );
  }

  function archiveFeatureHTML(project) {
    return (
      '<a class="archive-feature reveal" href="project.html?slug=' + escapeAttr(project.slug) + '" data-cursor="VIEW FILM →">' +
        mediaFrameHTML({
          mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
          tag: project.category, cam: 'CAM A', sweep: true
        }) +
        '<div class="archive-feature-overlay">' +
          '<span class="archive-feature-num mono">FILM / ' + escapeHtml(project.id) + '</span>' +
          '<h3 class="archive-feature-title">' + escapeHtml(project.title) + '</h3>' +
          '<div class="archive-feature-meta">' + escapeHtml(project.event) + ' — ' + escapeHtml(project.location) + ' / ' + escapeHtml(project.year) + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function renderArchive(containerId, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    opts = opts || {};
    var list = (window.FZ_PROJECTS || []).filter(function (p) { return !p.gated; });
    var featureEl = opts.featureId ? document.getElementById(opts.featureId) : null;
    if (featureEl && list.length) {
      featureEl.innerHTML = archiveFeatureHTML(list[0]);
      list = list.slice(1);
      initMediaFrames(featureEl);
    }
    if (opts.limit) list = list.slice(0, opts.limit);
    container.innerHTML = list.map(archiveCardHTML).join('');
    initMediaFrames(container);
    initReveals();
  }
  window.FZ.renderArchive = renderArchive;

  /* ---------------------------------------------------------------
     Footer year
  --------------------------------------------------------------- */
  function initFooterYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------------------------------------------------------
     Hero showreel — points the hero's media-frame at
     window.FZ_SHOWREEL (see data.js) before it gets wired up by
     initMediaFrames, so a real showreel takes over automatically the
     moment its paths are filled in. Runs before initMediaFrames.
  --------------------------------------------------------------- */
  function applyShowreelConfig() {
    var frame = document.getElementById('heroMedia');
    if (!frame) return;
    var reel = window.FZ_SHOWREEL;
    if (!reel || (!reel.mp4 && !reel.webm)) return;
    frame.dataset.mp4 = reel.mp4 || '';
    frame.dataset.webm = reel.webm || '';
    frame.dataset.mp4Mobile = reel.mp4Mobile || '';
    if (reel.poster) frame.dataset.poster = reel.poster;
    var tag = document.getElementById('heroPlaceholderTag');
    if (tag) tag.remove();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPageTransition();
    applyShowreelConfig();
    initLoader();
    initCursor();
    initHeader();
    initMediaFrames(document);
    initReveals();
    initCounters();
    initHeroTitleFit();
    initScrub();
    initSoundToggle();
    initFooterYear();
    initTimecode();
    if (document.getElementById('archiveTeaser')) renderArchive('archiveTeaser', { featureId: 'archiveFeature', limit: 5 });
    if (document.getElementById('workGrid')) renderArchive('workGrid', { featureId: 'archiveFeature' });
    var heroCount = document.getElementById('heroArchiveCount');
    if (heroCount) {
      var publicCount = (window.FZ_PROJECTS || []).filter(function (p) { return !p.gated; }).length;
      heroCount.textContent = 'SELECTED 001—' + String(publicCount).padStart(3, '0');
    }
  });
})();
