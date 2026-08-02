/* ==========================================================================
   FZ.id — tiny unique id generator, used whenever a new record is created.
   ========================================================================== */

(function (FZ) {
  'use strict';

  function generate() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for browsers without crypto.randomUUID.
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  FZ.id = generate;
})(window.FZ = window.FZ || {});
