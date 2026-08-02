/* ==========================================================================
   FZ.recurrence — generic recurrence engine: any unit x any interval
   ("every 3 days", "every 2 weeks", "every 18 months"). Adding a new unit
   later is a one-line change to UNITS + one branch in next(), nothing
   about the callers (tasks module) needs to change.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const UNITS = [
    { value: 'day', label: 'Day(s)' },
    { value: 'week', label: 'Week(s)' },
    { value: 'month', label: 'Month(s)' },
    { value: 'year', label: 'Year(s)' },
  ];

  function next(isoDate, unit, interval) {
    const n = Math.max(1, parseInt(interval, 10) || 1);
    const base = isoDate || FZ.format.todayISO();
    const d = new Date(base + 'T00:00:00');
    if (unit === 'day') d.setDate(d.getDate() + n);
    else if (unit === 'week') d.setDate(d.getDate() + n * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() + n);
    else if (unit === 'year') d.setFullYear(d.getFullYear() + n);
    else return base;
    return FZ.format.toISODate(d);
  }

  // "Every day" / "Every 3 days" / "Every 2 weeks" ...
  function label(unit, interval) {
    if (!unit || unit === 'none') return '';
    const n = Math.max(1, parseInt(interval, 10) || 1);
    const unitWord = unit + (n === 1 ? '' : 's');
    return n === 1 ? `Every ${unitWord}` : `Every ${n} ${unitWord}`;
  }

  FZ.recurrence = { UNITS, next, label };
})(window.FZ = window.FZ || {});
