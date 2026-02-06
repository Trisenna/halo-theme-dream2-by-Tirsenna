/**
 * GitHub Widget - 贡献图加载 + 开源项目自动拉取
 */
(function() {
  'use strict';

  const GHCHART_BASE_URL = 'https://ghchart.rshah.org';
  const GH_API_BASE = 'https://api.github.com';
  const CACHE_KEY_PREFIX = 'github_projects_';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

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

  /* ---------- 开源项目拉取与渲染 ---------- */

  function normalizeRepo(repo) {
    if (!repo || typeof repo !== 'string') return '';
    repo = repo.trim().replace(/\/+$/, '');
    // Handle full GitHub URLs like https://github.com/owner/repo
    var match = repo.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (match) return match[1];
    // Already in owner/repo format
    if (repo.indexOf('/') !== -1 && !repo.match(/^https?:\/\//)) return repo;
    return repo;
  }

  function getCached(repo) {
    try {
      const key = CACHE_KEY_PREFIX + repo.replace(/\//g, '_');
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, expires } = JSON.parse(raw);
      if (Date.now() > expires) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function setCache(repo, data) {
    try {
      const key = CACHE_KEY_PREFIX + repo.replace(/\//g, '_');
      localStorage.setItem(key, JSON.stringify({
        data: data,
        expires: Date.now() + CACHE_TTL_MS
      }));
    } catch (e) {}
  }

  function formatStars(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function renderProject(el, data) {
    const nameEl = el.querySelector('.project-name-text');
    const descEl = el.querySelector('.project-desc');
    const metaEl = el.querySelector('.project-meta');

    if (nameEl) nameEl.textContent = data.full_name || data.name || el.dataset.repo || 'Unknown';

    if (descEl) {
      if (data.description) {
        descEl.textContent = data.description;
        descEl.style.display = '';
      } else {
        descEl.style.display = 'none';
      }
    }

    if (metaEl) {
      const parts = [];
      if (data.language) {
        parts.push('<span class="project-lang"><i class="ri-code-s-slash-line"></i><span>' + escapeHtml(data.language) + '</span></span>');
      }
      if (data.stargazers_count != null) {
        parts.push('<span class="project-stars"><i class="ri-star-line"></i><span>' + escapeHtml(formatStars(data.stargazers_count)) + '</span></span>');
      }
      metaEl.innerHTML = parts.join('');
      metaEl.style.display = parts.length ? 'flex' : 'none';
    }

    el.classList.remove('project-loading');
  }

  function renderError(el, repo) {
    const nameEl = el.querySelector('.project-name-text');
    const descEl = el.querySelector('.project-desc');
    const metaEl = el.querySelector('.project-meta');

    if (nameEl) nameEl.textContent = repo || 'Unknown';
    if (descEl) { descEl.textContent = '获取失败'; descEl.style.display = ''; }
    if (metaEl) { metaEl.innerHTML = ''; metaEl.style.display = 'none'; }

    el.classList.remove('project-loading');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function fetchRepo(repo) {
    return fetch(GH_API_BASE + '/repos/' + repo, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    }).then(function(res) {
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    });
  }

  function loadProject(el) {
    const repo = normalizeRepo(el.dataset.repo);
    if (!repo) return;

    el.classList.add('project-loading');

    const cached = getCached(repo);
    if (cached) {
      renderProject(el, cached);
      return;
    }

    fetchRepo(repo)
      .then(function(data) {
        setCache(repo, data);
        renderProject(el, data);
      })
      .catch(function() {
        renderError(el, repo);
      });
  }

  function initProjects() {
    document.querySelectorAll('.widget.github-projects .project-item[data-repo]').forEach(loadProject);
  }

  /* ---------- 初始化 ---------- */

  function init() {
    updateChart();
    initProjects();
    observeTheme();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('pjax:complete', init);
  window.GitHubWidget = { init: init, updateChart: updateChart, initProjects: initProjects };
})();
