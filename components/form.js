/* ==========================================================================
   FZ.form — builds a labeled <form> from a field-definition array so every
   module's "add/edit" modal shares the same markup and reading logic
   instead of hand-rolling inputs each time.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;

  // fields: [{ name, label, type: 'text'|'number'|'date'|'select'|'textarea',
  //            required, options: [{value,label}], value, placeholder, step }]
  // Returns { form, getValues() } — getValues reads current input state.
  function build(fields, submitLabel, onSubmit) {
    const inputs = {};

    const rows = fields.map((field) => {
      let input;
      const common = {
        name: field.name,
        id: 'f_' + field.name,
        required: !!field.required,
        placeholder: field.placeholder || '',
      };

      if (field.type === 'select') {
        input = el('select', common,
          (field.options || []).map((opt) =>
            el('option', { value: opt.value, selected: opt.value === field.value }, opt.label)
          )
        );
      } else if (field.type === 'textarea') {
        input = el('textarea', Object.assign({}, common, { rows: field.rows || 3 }));
        input.value = field.value || '';
      } else {
        input = el('input', Object.assign({}, common, {
          type: field.type || 'text',
          step: field.step,
        }));
        if (field.value !== undefined && field.value !== null) input.value = field.value;
      }

      inputs[field.name] = input;

      return el('div', { class: 'field' }, [
        el('label', { for: common.id }, field.label),
        input,
      ]);
    });

    const form = el('form', {
      class: 'modal-form',
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit(getValues());
      },
    }, [
      ...rows,
      el('button', { type: 'submit', class: 'btn btn-primary' }, submitLabel),
    ]);

    function getValues() {
      const values = {};
      Object.keys(inputs).forEach((name) => { values[name] = inputs[name].value; });
      return values;
    }

    return { form, getValues, inputs };
  }

  FZ.form = { build };
})(window.FZ = window.FZ || {});
