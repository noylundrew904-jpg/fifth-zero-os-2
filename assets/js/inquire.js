(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('project');
    var projects = window.FZ_PROJECTS || [];
    var project = slug ? projects.find(function (p) { return p.slug === slug; }) : null;
    var cfg = window.FZ_INQUIRE || { email: 'hello@fifthandzero.studio', formUrl: '' };

    var note = document.getElementById('inquireProjectNote');
    if (project && note) {
      note.textContent = 'You were looking for ' + project.title + ' — that film is not posted publicly. Reach out and we will share it directly.';
      note.style.display = '';
    }

    var mailBtn = document.getElementById('inquireMailto');
    if (mailBtn) {
      var subject = project ? 'Full reel request — ' + project.title : 'Full reel request';
      var body = project
        ? 'Hi Fifth & Zero,\n\nI would like to see the full film for "' + project.title + '" (and any other work that is not posted publicly).\n\n'
        : 'Hi Fifth & Zero,\n\nI would like to see more of your work that is not posted publicly.\n\n';
      mailBtn.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    var formBtn = document.getElementById('inquireFormLink');
    if (formBtn && cfg.formUrl) {
      formBtn.href = cfg.formUrl;
      formBtn.style.display = '';
    }
  });
})();
