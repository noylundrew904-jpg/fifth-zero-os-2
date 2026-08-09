(function () {
  'use strict';

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function show(id, visible) {
    var el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
  }

  function renderNotFound(slug) {
    document.title = 'Project Not Found — REPLAY';
    document.getElementById('main').innerHTML =
      '<section class="not-found">' +
        '<div class="container">' +
          '<span class="eyebrow mono">Error / 404</span>' +
          '<h1>PROJECT NOT FOUND.</h1>' +
          '<p>' + (slug ? 'There’s no film at “' + escapeHtml(slug) + '”.' : 'That film doesn’t exist.') + '</p>' +
          '<a class="btn btn-solid" href="work.html" data-cursor="VIEW FILM →">Return to Archive →</a>' +
        '</div>' +
      '</section>';
  }

  function render() {
    var projects = window.REPLAY_PROJECTS || [];
    var slug = getSlug();
    var project = slug ? projects.find(function (p) { return p.slug === slug; }) : projects[0];

    if (!project) {
      renderNotFound(slug);
      return;
    }

    var index = projects.indexOf(project);
    var next = projects[(index + 1) % projects.length];
    var prev = projects[(index - 1 + projects.length) % projects.length];

    document.title = project.title + ' — REPLAY';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', project.description || project.brief);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', project.title + ' — REPLAY');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', project.description || project.brief);

    document.getElementById('projectHero').innerHTML =
      window.REPLAY.mediaFrameHTML({
        mp4: project.media.mp4, webm: project.media.webm, mp4Mobile: project.media.mp4Mobile, poster: project.media.poster,
        tag: project.category + (project.media.mp4 ? '' : ' / REPLACE MEDIA'), cam: 'CAM A · LIVE', sweep: true
      });

    document.getElementById('projectNum').textContent = 'Project ' + project.id;
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('projectSub').textContent = project.category + ' — ' + project.client;
    document.getElementById('projectTags').innerHTML =
      '<span class="eyebrow mono">' + project.location + '</span>' +
      '<span class="eyebrow mono">' + project.year + '</span>';

    var hasStats = project.stats && project.stats.length;
    show('projectStatsSection', hasStats);
    if (hasStats) {
      document.getElementById('projectStats').innerHTML = project.stats.map(function (s) {
        return '<div><div class="stat-value">' + s.value + '</div><div class="stat-label mono">' + s.label + '</div></div>';
      }).join('');
    }

    var briefEl = document.getElementById('projectBrief');
    show('projectBriefBlock', !!project.brief);
    if (project.brief) briefEl.textContent = project.brief;

    var approachEl = document.getElementById('projectApproach');
    show('projectApproachBlock', !!project.approach);
    if (project.approach) approachEl.textContent = project.approach;

    var hasGallery = project.gallery && project.gallery.length;
    show('projectGallerySection', hasGallery);
    if (hasGallery) {
      document.getElementById('projectGallery').innerHTML = project.gallery.map(function (g, i) {
        return window.REPLAY.mediaFrameHTML({
          image: g.image, alt: g.alt || (project.title + ' — frame ' + (i + 1)),
          tag: 'FRAME ' + String(i + 1).padStart(4, '0'), cursor: g.image ? '' : 'IMAGE / REPLACE'
        });
      }).join('');
    }

    show('projectResultBlock', !!project.result);
    if (project.result) {
      document.getElementById('projectResult').textContent = project.result;
      document.getElementById('projectResultMedia').innerHTML =
        window.REPLAY.mediaFrameHTML({
          mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
          tag: 'THE RESULT', cursor: 'PLAY →'
        });
    }
    show('projectResultMediaSection', !!project.result);

    var hasCredits = project.credits && project.credits.length;
    show('projectCreditsBlock', hasCredits);
    if (hasCredits) {
      document.getElementById('projectCredits').innerHTML = project.credits.map(function (c) {
        return '<div class="capability-row"><span>' + c.role + '</span><span>' + c.name + '</span></div>';
      }).join('');
    }

    document.getElementById('nextProjectLink').href = 'project.html?slug=' + next.slug;
    document.getElementById('nextProjectTitle').textContent = next.title;
    document.getElementById('prevProjectLink').href = 'project.html?slug=' + prev.slug;
    document.getElementById('prevProjectTitle').textContent = prev.title;

    window.REPLAY.initMediaFrames(document);
    window.REPLAY.initReveals();
  }

  document.addEventListener('DOMContentLoaded', render);
})();
