/* ==========================================================================
   FZ.chart — the one canvas bar-chart renderer in the app (no charting
   library, per "no frameworks"). Used by Finance's 6-month cash trend and
   by Analytics' several trend charts, so the drawing logic lives once.
   ========================================================================== */

(function (FZ) {
  'use strict';

  // drawBarChart(canvas, { labels, values, positiveColor, negativeColor, singleColor })
  // values may be signed (drawn up/down from a zero line, like cash flow)
  // or all-positive (drawn as a simple column chart) — both share one path.
  function drawBarChart(canvas, config) {
    const labels = config.labels || [];
    const values = config.values || [];
    const positiveColor = config.positiveColor || '#4ade80';
    const negativeColor = config.negativeColor || '#f87171';
    const singleColor = config.singleColor || null;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth * 2;
    const height = canvas.height = canvas.clientHeight * 2;
    ctx.clearRect(0, 0, width, height);

    const hasNegative = values.some((v) => v < 0);
    const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
    const barWidth = width / Math.max(1, labels.length);
    const zeroY = hasNegative ? height / 2 : height - 28;
    const usableHeight = hasNegative ? height / 2 - 24 : height - 48;

    values.forEach((value, i) => {
      const barHeight = (Math.abs(value) / maxAbs) * usableHeight;
      const x = i * barWidth + barWidth * 0.25;
      const w = barWidth * 0.5;
      ctx.fillStyle = singleColor || (value >= 0 ? positiveColor : negativeColor);
      if (value >= 0) ctx.fillRect(x, zeroY - barHeight, w, barHeight);
      else ctx.fillRect(x, zeroY, w, barHeight);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] || '', x + w / 2, height - 6);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
  }

  FZ.chart = { drawBarChart };
})(window.FZ = window.FZ || {});
