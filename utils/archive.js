/* ==========================================================================
   FZ.archive — soft-delete rules shared by every module. A "deleted"
   record isn't removed, it's stamped with deletedAt and kept for 30 days
   so it can be restored, then purged. Pure array functions so the same
   logic works for top-level storage collections (data/storage.js) and for
   arrays nested inside a composite record (finance.transactions/invoices).
   ========================================================================== */

(function (FZ) {
  'use strict';

  const RETENTION_DAYS = 30;

  function isExpired(record) {
    if (!record || !record.deletedAt) return false;
    return (Date.now() - new Date(record.deletedAt).getTime()) > RETENTION_DAYS * 86400000;
  }

  // Whole days left before permanent purge; null if not deleted.
  function daysRemaining(record) {
    if (!record || !record.deletedAt) return null;
    const elapsedDays = (Date.now() - new Date(record.deletedAt).getTime()) / 86400000;
    return Math.max(0, Math.ceil(RETENTION_DAYS - elapsedDays));
  }

  function markDeleted(record) {
    return Object.assign({}, record, { deletedAt: new Date().toISOString() });
  }

  function markRestored(record) {
    return Object.assign({}, record, { deletedAt: null });
  }

  // ---- array-level helpers --------------------------------------------------

  function active(list) {
    return list.filter((r) => !r.deletedAt);
  }

  // Deleted but still inside the 30-day recovery window.
  function trashed(list) {
    return list.filter((r) => r.deletedAt && !isExpired(r));
  }

  function softDeleteById(list, id) {
    return list.map((r) => (r.id === id ? markDeleted(r) : r));
  }

  function restoreById(list, id) {
    return list.map((r) => (r.id === id ? markRestored(r) : r));
  }

  function removeById(list, id) {
    return list.filter((r) => r.id !== id);
  }

  function purgeExpired(list) {
    return list.filter((r) => !isExpired(r));
  }

  FZ.archive = {
    RETENTION_DAYS, isExpired, daysRemaining, markDeleted, markRestored,
    active, trashed, softDeleteById, restoreById, removeById, purgeExpired,
  };
})(window.FZ = window.FZ || {});
