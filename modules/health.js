/* ==========================================================================
   FZ.modules.health — manual daily entries: steps, calories, weight, sleep,
   workout, water. One entry per date; logging today again edits it in place.
   Future: Apple Health sync would populate the same "health" collection.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function all() {
    return FZ.storage.list('health').sort((a, b) => b.date.localeCompare(a.date));
  }

  function todayEntry() {
    return all().find((e) => e.date === fmt.todayISO());
  }

  function todaySteps() {
    const entry = todayEntry();
    return entry ? Number(entry.steps) || 0 : 0;
  }

  function todayCalories() {
    const entry = todayEntry();
    return entry ? Number(entry.calories) || 0 : 0;
  }

  // existing (optional) pre-fills the form so history rows are editable,
  // not just deletable.
  function openForm(existing, onSaved) {
    const fields = [
      { name: 'date', label: 'Date', type: 'date', value: (existing && existing.date) || fmt.todayISO(), required: true },
      { name: 'steps', label: 'Steps', type: 'number', value: existing && existing.steps },
      { name: 'calories', label: 'Calories', type: 'number', value: existing && existing.calories },
      { name: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1', value: existing && existing.weight },
      { name: 'sleepHours', label: 'Sleep (hours)', type: 'number', step: '0.1', value: existing && existing.sleepHours },
      { name: 'workout', label: 'Workout', value: existing && existing.workout, placeholder: 'e.g. 30 min run' },
      { name: 'water', label: 'Water (ml)', type: 'number', value: existing && existing.water },
    ];

    const { form } = FZ.form.build(fields, 'Save entry', (values) => {
      const list = FZ.storage.get('health');
      // Upsert by date: an entry already logged for that date gets updated
      // instead of duplicated, whether the user is editing today's entry
      // or fixing an older one.
      const index = list.findIndex((e) => e.date === values.date && !e.deletedAt);
      if (index === -1) {
        list.push(Object.assign({ id: FZ.id() }, values));
      } else {
        list[index] = Object.assign({}, list[index], values);
      }
      FZ.storage.set('health', list);
      FZ.toast.show('Health entry saved');
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit entry' : 'Log health', body: form });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const entries = all();
    const today = todayEntry();

    const stats = el('div', { class: 'stat-row' }, [
      el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Steps today'), el('div', { class: 'stat-value' }, todaySteps().toLocaleString())]),
      el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Calories today'), el('div', { class: 'stat-value' }, todayCalories().toLocaleString())]),
      el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Weight'), el('div', { class: 'stat-value' }, today && today.weight ? today.weight + ' kg' : '—')]),
      el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Sleep'), el('div', { class: 'stat-value' }, today && today.sleepHours ? today.sleepHours + ' h' : '—')]),
    ]);

    container.appendChild(section({
      title: 'Today',
      actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(today, rerender) }, '+ Log entry'),
      children: stats,
    }));

    const list = el('div', { class: 'list' },
      entries.length ? entries.map((entry) => FZ.listRow.build({
        id: entry.id,
        title: fmt.friendlyDate(entry.date),
        meta: [
          entry.steps ? entry.steps + ' steps' : '',
          entry.calories ? entry.calories + ' cal' : '',
          entry.workout || '',
        ].filter(Boolean).join(' · '),
        onEdit: () => openForm(entry, rerender),
        onDelete: () => FZ.deleteFlow.run({
          label: 'Health entry',
          onDelete: () => FZ.storage.softDelete('health', entry.id),
          onUndo: () => FZ.storage.restore('health', entry.id),
          onDone: rerender,
        }),
      })) : [emptyState({
        icon: '♥',
        title: 'No health entries yet',
        message: 'Log steps, calories, weight, sleep, workouts, and water — manually for now, Apple Health sync is planned.',
        actionLabel: '+ Log entry',
        onAction: () => openForm(null, rerender),
      })]
    );

    container.appendChild(section({ title: 'History', children: list }));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.health = { render, openForm, all, todaySteps, todayCalories, todayEntry };
})(window.FZ = window.FZ || {});
