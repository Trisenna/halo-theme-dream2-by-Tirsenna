(function () {
  'use strict';

  // PJAX 和首屏都能初始化
  function initSearch() {
    const searchInput    = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    const mobileIcon     = document.getElementById('mobile-search-icon');

    if (!searchInput || !searchDropdown) {
      // PJAX 还没把节点换完，稍后再试
      setTimeout(initSearch, 300);
      return;
    }
    // 避免重复绑定
    if (searchInput.dataset.inited === 'on') return;
    searchInput.dataset.inited = 'on';

    let timer;
    let isLoaded = false;
    let allPosts = [];

    // 轻量预加载文章标题/摘要（100 条足够联想）
    const apiUrl = '/apis/api.content.halo.run/v1alpha1/posts?page=1&size=100&sort=spec.publishTime,desc';
    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        allPosts = Array.isArray(data.items) ? data.items : [];
        isLoaded = true;
      })
      .catch(err => {
        console.error('加载文章失败：', err);
        // 简单重试一次
        setTimeout(() => {
          fetch(apiUrl).then(r => r.json()).then(d => {
            allPosts = Array.isArray(d.items) ? d.items : [];
            isLoaded = true;
          }).catch(()=>{});
        }, 1000);
      });

    // 输入即搜（250ms 节流）
    searchInput.addEventListener('input', e => {
      const kw = e.target.value.trim();
      clearTimeout(timer);
      if (!kw) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }
      timer = setTimeout(() => doSearch(kw), 250);
    });

    // 聚焦时如果有值，立刻渲染
    searchInput.addEventListener('focus', function () {
      const kw = this.value.trim();
      if (kw) doSearch(kw);
    });

    // 点击外部收起
    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar-search')) {
        searchDropdown.classList.remove('active');
      }
    });

    // 空关键词不提交
    const form = searchInput.closest('form');
    if (form) {
      form.addEventListener('submit', e => {
        if (!searchInput.value.trim()) e.preventDefault();
      });
    }

    // 移动端：唤起主题现有的顶部搜索层
    if (mobileIcon) {
      mobileIcon.addEventListener('click', () => {
        const out  = document.querySelector('.navbar-searchout');
        const mask = document.querySelector('.navbar-mask');
        if (out)  out.classList.add('active');
        if (mask) mask.classList.add('active');
        const mInput = out?.querySelector('input[name="keyword"]');
        if (mInput) mInput.focus();
      });
    }
    // 蒙层点击关闭
    const mask = document.querySelector('.navbar-mask');
    if (mask) {
      mask.addEventListener('click', function () {
        this.classList.remove('active');
        document.querySelector('.navbar-searchout')?.classList.remove('active');
      });
    }

    function doSearch(keyword) {
      if (!isLoaded || !allPosts.length) {
        searchDropdown.innerHTML = '<div class="item">加载中…</div>';
        searchDropdown.classList.add('active');
        return;
      }
      const k = keyword.toLowerCase();
      const results = [];
      allPosts.forEach(p => {
        const title   = (p.spec?.title || '').toLowerCase();
        const excerpt = (p.status?.excerpt || '').toLowerCase();
        if (title.includes(k) || excerpt.includes(k)) results.push(p);
      });
      render(results.slice(0, 5), keyword);
    }

    function render(list, keyword) {
      if (!list.length) {
        searchDropdown.innerHTML = '<div class="item">暂无搜索结果</div>';
        searchDropdown.classList.add('active');
        return;
      }
      let html = '';
      list.forEach((post, i) => {
        const title = post.spec?.title || '无标题';
        const link  = post.status?.permalink || `/archives/${post.metadata?.name}`;
        html += `
          <a href="${link}" class="item" title="${escapeHtml(title)}">
            <span class="sort">${i + 1}</span>
            <span class="text">${mark(title, keyword)}</span>
          </a>`;
      });
      searchDropdown.innerHTML = html;
      searchDropdown.classList.add('active');
    }

    function mark(text, kw) {
      const esc = String(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return escapeHtml(text).replace(new RegExp('(' + esc + ')', 'gi'), '<mark>$1</mark>');
    }
    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
  document.addEventListener('pjax:complete', initSearch);
})();
