(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------------------------------------------------------
     Media frame: builds/wires the reusable "video placeholder" unit
     used across hero, archive cards, galleries and project pages.
     Drop a real mp4/webm/poster into a project's `media` object in
     data.js and this same markup starts playing real footage.
  --------------------------------------------------------------- */
  function mediaFrameHTML(opts) {
    opts = opts || {};
    var mp4 = opts.mp4 || '';
    var webm = opts.webm || '';
    var poster = opts.poster || '';
    var tag = opts.tag || '';
    var cam = opts.cam || '';
    var scrim = opts.scrim !== false;
    return (
      '<div class="media-frame" data-mp4="' + mp4 + '" data-webm="' + webm + '" data-poster="' + poster + '">' +
        (tag ? '<span class="media-frame-tag">' + tag + '</span>' : '') +
        (cam ? '<span class="media-frame-cam">' + cam + '</span>' : '') +
        '<div class="media-frame-placeholder"></div>' +
        '<video muted loop playsinline preload="none"' + (poster ? ' poster="' + poster + '"' : '') + '></video>' +
        (scrim ? '<div class="media-frame-scrim"></div>' : '') +
      '</div>'
    );
  }

  function initMediaFrames(root) {
    (root || document).querySelectorAll('.media-frame').forEach(function (frame) {
      var mp4 = frame.dataset.mp4, webm = frame.dataset.webm;
      if (!mp4 && !webm) return;
      var video = frame.querySelector('video');
      if (!video) return;
      if (webm) { var s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; video.appendChild(s1); }
      if (mp4) { var s2 = document.createElement('source'); s2.src = mp4; s2.type = 'video/mp4'; video.appendChild(s2); }
      frame.classList.add('has-video');

      var isHoverPlay = frame.closest('.archive-card, .gallery-grid');
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

  window.REPLAY = window.REPLAY || {};
  window.REPLAY.mediaFrameHTML = mediaFrameHTML;
  window.REPLAY.initMediaFrames = initMediaFrames;

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
     Intro loader (homepage only, once per session)
  --------------------------------------------------------------- */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    var played = sessionStorage.getItem('replayIntroPlayed');
    var finish = function () {
      loader.classList.add('is-done');
      document.body.classList.remove('loading');
      sessionStorage.setItem('replayIntroPlayed', '1');
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
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
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

  function initWordStacks() {
    document.querySelectorAll('.word-stack').forEach(function (stack) {
      var words = stack.querySelectorAll('span');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          words.forEach(function (w, i) {
            setTimeout(function () { w.classList.add('is-visible'); }, reduceMotion ? 0 : i * 90);
          });
          io.unobserve(entry.target);
        });
      }, { threshold: 0.3 });
      io.observe(stack);
    });
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
     Archive card builder — shared by homepage teaser + work.html
  --------------------------------------------------------------- */
  function archiveCardHTML(project) {
    var span = project.span || 6;
    return (
      '<div class="archive-item reveal" data-span="' + span + '" data-vertical="' + !!project.vertical + '">' +
        '<a class="archive-card" href="project.html?slug=' + project.slug + '" data-cursor="VIEW FILM →">' +
          mediaFrameHTML({
            mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
            tag: project.category, cam: (parseInt(project.id, 10) % 2 === 0) ? 'CAM B' : 'CAM A'
          }) +
          '<div class="archive-card-info">' +
            '<div>' +
              '<div class="archive-card-num mono">' + project.id + '</div>' +
              '<div class="archive-card-title">' + project.title + '</div>' +
            '</div>' +
            '<div class="archive-card-meta">' + project.event + '<br>' + project.location + ' / ' + project.year + '</div>' +
          '</div>' +
        '</a>' +
      '</div>'
    );
  }

  function renderArchive(containerId, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    opts = opts || {};
    var list = (window.REPLAY_PROJECTS || []).slice();
    if (opts.limit) list = list.slice(0, opts.limit);
    container.innerHTML = list.map(archiveCardHTML).join('');
    initMediaFrames(container);
    initReveals();
  }
  window.REPLAY.renderArchive = renderArchive;

  /* ---------------------------------------------------------------
     Footer year
  --------------------------------------------------------------- */
  function initFooterYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initCursor();
    initHeader();
    initMediaFrames(document);
    initReveals();
    initWordStacks();
    initSoundToggle();
    initFooterYear();
    if (document.getElementById('archiveTeaser')) renderArchive('archiveTeaser', { limit: 6 });
    if (document.getElementById('workGrid')) renderArchive('workGrid');
  });
})();
