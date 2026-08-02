/* ==========================================================================
   FZ.deleteFlow — the shared confirm -> soft-delete -> undo-toast sequence
   every module's delete button runs. One place to own that pattern instead
   of every module re-implementing confirm+toast wiring.
   ========================================================================== */

(function (FZ) {
  'use strict';

  // run({ label, onDelete, onUndo, onDone })
  // label: human name for the record ("Task", "Client"...) used in copy.
  // onDelete/onUndo: perform the actual soft-delete / restore.
  // onDone: re-render the caller's view.
  function run(config) {
    FZ.confirm.ask({
      title: 'Delete ' + config.label + '?',
      message: 'It moves to Archive and can be restored within 30 days.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        config.onDelete();
        config.onDone();
        FZ.toast.show(config.label + ' deleted', {
          actionLabel: 'Undo',
          duration: 10000,
          onAction: () => { config.onUndo(); config.onDone(); },
        });
      },
    });
  }

  // runHard({ label, onDelete, onDone }) — for records outside the soft-delete
  // list (subscriptions, loans, calendar events): still confirm first, since
  // every destructive action must, but there's no Archive/undo for these.
  function runHard(config) {
    FZ.confirm.ask({
      title: 'Delete ' + config.label + '?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        config.onDelete();
        config.onDone();
        FZ.toast.show(config.label + ' deleted');
      },
    });
  }

  FZ.deleteFlow = { run, runHard };
})(window.FZ = window.FZ || {});
