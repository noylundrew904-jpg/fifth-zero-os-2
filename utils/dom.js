/* ==========================================================================
   FZ.dom — tiny DOM-building helpers so modules don't hand-write innerHTML
   strings or repeat createElement/setAttribute boilerplate.
   ========================================================================== */

(function (FZ) {
  'use strict';

  // el('div', { class: 'card', onclick: fn }, [child1, 'text', child2])
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach((key) => {
      const value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'class') {
        node.className = value;
      } else if (key === 'html') {
        node.innerHTML = value;
      } else if (key in node && key !== 'list') {
        node[key] = value;
      } else {
        node.setAttribute(key, value);
      }
    });
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children === undefined || children === null) return;
    const list = Array.isArray(children) ? children : [children];
    list.forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      if (typeof child === 'string' || typeof child === 'number') {
        node.appendChild(document.createTextNode(String(child)));
      } else {
        node.appendChild(child);
      }
    });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  FZ.dom = { el, clear, qs };
})(window.FZ = window.FZ || {});
