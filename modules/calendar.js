/* ==========================================================================
   FZ.modules.calendar — month grid combining standalone events (fz.calendar)
   with task due dates, so deadlines show up without duplicating data.
   Events follow the same soft-delete/archive pattern as every other record.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section } = FZ.card;
  const fmt = FZ.format;

  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth(); // 0-indexed

  function eventsOn(isoDate) {
    const manual = FZ.storage.list('calendar').filter((e) => e.date === isoDate);
    const taskDeadlines = FZ.storage.list('tasks')
      .filter((t) => t.dueDate === isoDate && !t.done)
      .map((t) => ({ id: t.id, title: t.title, date: t.dueDate, source: 'task' }));
    return manual.concat(taskDeadlines);
  }

  function todayEventCount() {
    return eventsOn(fmt.todayISO()).length;
  }

  function openEventForm(isoDate, onSaved) {
    const fields = [
      { name: 'title', label: 'Title', required: true },
      { name: 'date', label: 'Date', type: 'date', value: isoDate, required: true },
      { name: 'time', label: 'Time', type: 'time' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ];
    const { form } = FZ.form.build(fields, 'Add event', (values) => {
      FZ.storage.add('calendar', Object.assign({ id: FZ.id(), source: 'manual' }, values));
      FZ.toast.show('Event added');
      FZ.modal.close();
      if (onSaved) onSaved();
    });
    FZ.modal.open({ title: 'New event', body: form });
  }

  function openDayView(isoDate, onChanged) {
    const events = eventsOn(isoDate);
    const body = el('div', { class: 'detail-view' }, [
      events.length
        ? el('div', { class: 'list' }, events.map((e) => FZ.listRow.build({
            id: e.id,
            title: e.title,
            meta: (e.time ? e.time + ' · ' : '') + (e.source === 'task' ? 'Task deadline' : 'Event'),
            onDelete: e.source === 'task' ? null : () => FZ.deleteFlow.run({
              label: 'Event',
              onDelete: () => FZ.storage.softDelete('calendar', e.id),
              onUndo: () => FZ.storage.restore('calendar', e.id),
              onDone: () => { onChanged(); openDayView(isoDate, onChanged); },
            }),
          })))
        : FZ.card.emptyState({ icon: '▦', title: 'Nothing scheduled', message: 'Add an event for this day.' }),
      el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openEventForm(isoDate, () => { onChanged(); openDayView(isoDate, onChanged); }) }, '+ Add event'),
    ]);
    FZ.modal.open({ title: fmt.friendlyDate(isoDate), body });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const nav = el('div', { class: 'calendar-nav' }, [
      el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Previous month', onclick: () => { viewMonth -= 1; if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; } rerender(); } }, '‹'),
      el('div', { class: 'calendar-month-label' }, monthLabel),
      el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Next month', onclick: () => { viewMonth += 1; if (viewMonth > 11) { viewMonth = 0; viewYear += 1; } rerender(); } }, '›'),
    ]);

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startWeekday = firstOfMonth.getDay();

    const grid = el('div', { class: 'calendar-grid', role: 'grid', 'aria-label': monthLabel });
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => grid.appendChild(el('div', { class: 'calendar-dow', 'aria-hidden': 'true' }, d)));
    for (let i = 0; i < startWeekday; i++) grid.appendChild(el('div', { class: 'calendar-cell calendar-cell-empty', 'aria-hidden': 'true' }));

    for (let day = 1; day <= daysInMonth; day++) {
      const isoDate = fmt.toISODate(new Date(viewYear, viewMonth, day));
      const count = eventsOn(isoDate).length;
      const label = fmt.friendlyDate(isoDate) + (count ? `, ${count} event${count === 1 ? '' : 's'}` : ', no events');
      grid.appendChild(
        el('button', {
          class: 'calendar-cell' + (fmt.isToday(isoDate) ? ' calendar-cell-today' : ''),
          type: 'button',
          'aria-label': label,
          onclick: () => openDayView(isoDate, rerender),
        }, [
          el('div', { class: 'calendar-day-num', 'aria-hidden': 'true' }, String(day)),
          count ? el('div', { class: 'calendar-dot', 'aria-hidden': 'true' }) : null,
        ])
      );
    }

    container.appendChild(section({ title: 'Calendar', actions: nav, children: grid }));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.calendar = { render, eventsOn, todayEventCount };
})(window.FZ = window.FZ || {});
