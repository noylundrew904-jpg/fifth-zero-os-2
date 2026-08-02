/* ==========================================================================
   FZ.format — shared formatting helpers (currency, dates, relative time).
   Kept in one place so every module renders dates/money the same way.
   ========================================================================== */

(function (FZ) {
  'use strict';

  function currency(amount) {
    const value = Number(amount) || 0;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  // yyyy-mm-dd used everywhere internally (sortable, <input type="date"> native).
  function todayISO() {
    return toISODate(new Date());
  }

  function toISODate(date) {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function friendlyDate(isoDate) {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function friendlyDateTime(isoDateTime) {
    const date = new Date(isoDateTime);
    if (isNaN(date.getTime())) return isoDateTime;
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  function isToday(isoDate) {
    return isoDate === todayISO();
  }

  function isPast(isoDate) {
    if (!isoDate) return false;
    return isoDate < todayISO();
  }

  // "3 days left" / "overdue by 2 days" / "today" style label for deadlines.
  function dueLabel(isoDate) {
    if (!isoDate) return '';
    const diff = daysBetween(todayISO(), isoDate);
    if (diff === 0) return 'Today';
    if (diff > 0) return `In ${diff} day${diff === 1 ? '' : 's'}`;
    return `Overdue ${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'}`;
  }

  function daysBetween(isoA, isoB) {
    const a = new Date(isoA + 'T00:00:00');
    const b = new Date(isoB + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  FZ.format = {
    currency, todayISO, toISODate, friendlyDate, friendlyDateTime,
    isToday, isPast, dueLabel, daysBetween, escapeHtml,
  };
})(window.FZ = window.FZ || {});
