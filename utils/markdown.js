/* ==========================================================================
   FZ.markdown — a deliberately small markdown-to-HTML converter (no
   external library, per "no frameworks"). Covers what a personal notes
   module needs: headings, bold/italic, links, lists, code, paragraphs.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const escapeHtml = FZ.format.escapeHtml;

  function inline(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return out;
  }

  function toHtml(markdown) {
    const lines = (markdown || '').split('\n');
    const htmlParts = [];
    let listItems = null;

    function flushList() {
      if (listItems) {
        htmlParts.push('<ul>' + listItems.join('') + '</ul>');
        listItems = null;
      }
    }

    lines.forEach((line) => {
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      const listItem = line.match(/^[-*]\s+(.*)$/);

      if (heading) {
        flushList();
        const level = heading[1].length;
        htmlParts.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      } else if (listItem) {
        listItems = listItems || [];
        listItems.push(`<li>${inline(listItem[1])}</li>`);
      } else if (line.trim() === '') {
        flushList();
      } else {
        flushList();
        htmlParts.push(`<p>${inline(line)}</p>`);
      }
    });
    flushList();

    return htmlParts.join('\n');
  }

  FZ.markdown = { toHtml };
})(window.FZ = window.FZ || {});
