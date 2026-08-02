/* ==========================================================================
   FZ.modules.habits — daily habits with a streak counter and a completion
   toggle for today. A habit record stores its completion dates directly.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function all() {
    return FZ.storage.get('habits');
  }

  // Consecutive days completed, counting back from today (or yesterday if
  // today isn't done yet, so a streak doesn't zero out at 12:01am).
  function streak(habit) {
    const done = new Set(habit.completions || []);
    let count = 0;
    let cursor = new Date();
    if (!done.has(fmt.toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (done.has(fmt.toISODate(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function isDoneToday(habit) {
    return (habit.completions || []).includes(fmt.todayISO());
  }

  function toggleToday(habit) {
    const today = fmt.todayISO();
    const completions = habit.completions || [];
    const next = completions.includes(today)
      ? completions.filter((d) => d !== today)
      : completions.concat(today);
    FZ.storage.update('habits', habit.id, { completions: next });
  }

  function openForm(existing, onSaved) {
    const fields = [
      { name: 'name', label: 'Habit', required: true, value: existing && existing.name },
      { name: 'frequency', label: 'Frequency', type: 'select', value: (existing && existing.frequency) || 'daily',
        options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }] },
    ];

    const { form } = FZ.form.build(fields, existing ? 'Save changes' : 'Add habit', (values) => {
      if (existing) {
        FZ.storage.update('habits', existing.id, values);
      } else {
        FZ.storage.add('habits', Object.assign({ id: FZ.id(), completions: [], createdAt: new Date().toISOString() }, values));
      }
      FZ.toast.show('Habit saved');
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit habit' : 'New habit', body: form });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const habits = all();
    const list = el('div', { class: 'list' },
      habits.length ? habits.map((habit) => FZ.listRow.build({
        title: habit.name,
        meta: streak(habit) + ' day streak · ' + habit.frequency,
        checked: isDoneToday(habit),
        onToggle: () => { toggleToday(habit); rerender(); },
        onEdit: () => openForm(habit, rerender),
        onDelete: () => { FZ.storage.remove('habits', habit.id); rerender(); },
      })) : [emptyState('No habits yet. Add your first one.')]
    );

    container.appendChild(
      section({
        title: 'Habits',
        actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null, rerender) }, '+ Habit'),
        children: list,
      })
    );
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.habits = { render, openForm, all, streak, isDoneToday };
})(window.FZ = window.FZ || {});
