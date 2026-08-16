(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var count = (window.FZ_PROJECTS || []).length;
    var el = document.getElementById('archiveCount');
    if (el) el.textContent = 'ARCHIVE 001—' + String(count).padStart(3, '0');
  });
})();
