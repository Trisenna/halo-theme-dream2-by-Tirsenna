/**
 * GitHub Widget - 贡献图加载
 */
(function() {
  'use strict';

  const GHCHART_BASE_URL = 'https://ghchart.rshah.org';

  function isNightMode() {
    return document.documentElement.classList.contains('night');
  }

  function getChartUrl(username, color) {
    if (!username) return '';
    return color ? `${GHCHART_BASE_URL}/${color}/${username}` : `${GHCHART_BASE_URL}/${username}`;
  }

  function updateChart() {
    document.querySelectorAll('.widget.github-contributions .github-chart').forEach(function(img) {
      const username = img.dataset.username;
      if (!username) return;
      
      const color = isNightMode() ? img.dataset.nightColor : img.dataset.color;
      const newSrc = getChartUrl(username, color);
      
      if (img.src !== newSrc) {
        img.src = newSrc;
      }
    });
  }

  function observeTheme() {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'class') setTimeout(updateChart, 100);
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    updateChart();
    observeTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('pjax:complete', init);
  window.GitHubWidget = { init: init, updateChart: updateChart };
})();
