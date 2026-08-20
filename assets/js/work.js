(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var count = (window.FZ_PROJECTS || []).filter(function (p) { return !p.gated; }).length;
    var el = document.getElementById('archiveCount');
    if (el) el.textContent = 'SELECTED 001—' + String(count).padStart(3, '0');
  });
})();
