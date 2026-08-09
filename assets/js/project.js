(function () {
  'use strict';

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    return params.get('slug');
  }

  function render() {
    var projects = window.REPLAY_PROJECTS || [];
    var slug = getSlug();
    var project = projects.find(function (p) { return p.slug === slug; }) || projects[0];
    if (!project) return;

    var index = projects.indexOf(project);
    var next = projects[(index + 1) % projects.length];

    document.title = project.title + ' — REPLAY';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', project.brief);

    document.getElementById('projectHero').innerHTML =
      window.REPLAY.mediaFrameHTML({
        mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
        tag: project.category + ' / REPLACE', cam: 'CAM A · LIVE'
      });

    document.getElementById('projectNum').textContent = 'Project ' + project.id;
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('projectSub').textContent = project.category + ' — ' + project.client;
    document.getElementById('projectTags').innerHTML =
      '<span class="eyebrow mono">' + project.location + '</span>' +
      '<span class="eyebrow mono">' + project.year + '</span>';

    document.getElementById('projectStats').innerHTML = project.stats.map(function (s) {
      return '<div><div class="stat-value">' + s.value + '</div><div class="stat-label mono">' + s.label + '</div></div>';
    }).join('');

    document.getElementById('projectBrief').textContent = project.brief;
    document.getElementById('projectApproach').textContent = project.approach;
    document.getElementById('projectResult').textContent = project.result;
    document.getElementById('projectResultMedia').innerHTML =
      window.REPLAY.mediaFrameHTML({
        mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
        tag: 'THE RESULT', cursor: 'PLAY →'
      });

    document.getElementById('projectFilm').innerHTML =
      window.REPLAY.mediaFrameHTML({
        mp4: project.media.mp4, webm: project.media.webm, poster: project.media.poster,
        tag: 'THE FILM', sweep: true, cursor: 'PLAY →'
      });

    document.getElementById('projectGallery').innerHTML = project.gallery.map(function (g, i) {
      return window.REPLAY.mediaFrameHTML({ poster: g.poster, tag: 'FRAME ' + String(i + 1).padStart(4, '0'), cursor: 'PLAY →' });
    }).join('');

    document.getElementById('projectCredits').innerHTML = project.credits.map(function (c) {
      return '<div class="capability-row"><span>' + c.role + '</span><span>' + c.name + '</span></div>';
    }).join('');

    document.getElementById('nextProjectLink').href = 'project.html?slug=' + next.slug;
    document.getElementById('nextProjectLink').textContent = next.title;
    document.getElementById('nextProjectNum').textContent = 'Next / Project ' + next.id;

    window.REPLAY.initMediaFrames(document);
    window.REPLAY.initReveals();
  }

  document.addEventListener('DOMContentLoaded', render);
})();
