/**
 * TOC Enhanced - 目录组件增强脚本
 * 功能：
 * 1. 监听目录高亮变化，自动滚动到当前项
 * 2. 管理滚动状态类（显示渐变遮罩）
 * 3. 支持 PJAX 页面切换
 */

(function() {
  'use strict';

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:IIFE-start',message:'Script loaded and executing',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // 配置项
  const CONFIG = {
    // 只选择右侧边栏中的 TOC，排除左侧 shadow 克隆
    containerSelector: '.column-side.column-right .widget.toc .toc-content',
    activeSelector: 'a.is-active',
    scrollBehavior: 'smooth',
    scrollOffset: 0.5, // 滚动到容器的 50% 位置（居中）
    throttleDelay: 100, // 节流延迟
    observerDebounce: 50 // 观察器防抖
  };

  // 状态管理
  let observer = null;
  let scrollCheckTimer = null;
  let isInitialized = false;
  let isUserInteractingWithToc = false;  // 用户是否正在操作目录
  let userInteractionTimer = null;       // 用户交互超时计时器

  /**
   * 节流函数
   */
  function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  /**
   * 防抖函数
   */
  function debounce(func, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 获取 TOC 容器
   */
  function getTocContainer() {
    // #region agent log
    const allContainers = document.querySelectorAll('.toc-content');
    const widgetContainer = document.querySelector(CONFIG.containerSelector);
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:getTocContainer',message:'Finding TOC containers',data:{totalTocContents:allContainers.length,widgetContainerFound:!!widgetContainer,containersInfo:Array.from(allContainers).map((c,i)=>({index:i,className:c.className,parentClass:c.parentElement?.className,childCount:c.children.length,scrollHeight:c.scrollHeight,clientHeight:c.clientHeight}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return document.querySelector(CONFIG.containerSelector);
  }

  /**
   * 更新滚动状态类
   * 根据滚动位置显示/隐藏顶部和底部的渐变遮罩
   */
  function updateScrollState(container) {
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const threshold = 5; // 像素阈值

    // 检查是否可以向上滚动
    if (scrollTop > threshold) {
      container.classList.add('can-scroll-up');
    } else {
      container.classList.remove('can-scroll-up');
    }

    // 检查是否可以向下滚动
    if (scrollTop + clientHeight < scrollHeight - threshold) {
      container.classList.add('can-scroll-down');
    } else {
      container.classList.remove('can-scroll-down');
    }
  }

  /**
   * 滚动目录到当前高亮项
   * 始终将激活项保持在容器中间位置（除非在开头/结尾没有足够空间）
   * 如果用户正在操作目录，则不强制滚动
   */
  function scrollToActiveItem(container, activeItem) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:scrollToActiveItem',message:'scrollToActiveItem called',data:{hasContainer:!!container,hasActiveItem:!!activeItem,activeText:activeItem?.innerText?.substring(0,30),isUserInteracting:isUserInteractingWithToc},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!container || !activeItem) return;
    
    // 如果用户正在操作目录，不强制滚动
    if (isUserInteractingWithToc) return;

    // 使用 getBoundingClientRect 获取精确位置
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();
    
    // 计算目录项相对于容器内容顶部的绝对偏移
    // itemRect.top - containerRect.top 是当前可视区域内的相对位置
    // 加上 container.scrollTop 得到相对于容器内容顶部的绝对位置
    const itemOffsetTop = itemRect.top - containerRect.top + container.scrollTop;
    
    const itemHeight = activeItem.offsetHeight;
    const containerHeight = container.clientHeight;
    
    // 计算目标滚动位置，使激活项居中
    // 目标：item 的中心 = 容器可视区域的中心
    const targetScrollTop = itemOffsetTop - (containerHeight / 2) + (itemHeight / 2);
    
    // 边界处理：确保不会滚动到负值或超出最大值
    const maxScrollTop = container.scrollHeight - containerHeight;
    const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
    
    // 只有当目标位置与当前位置差异较大时才滚动（避免微小抖动）
    const scrollDiff = Math.abs(container.scrollTop - finalScrollTop);
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:scroll-calc',message:'Scroll calculation',data:{scrollDiff,finalScrollTop,currentScrollTop:container.scrollTop,willScroll:scrollDiff>5,containerHeight,maxScrollTop},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (scrollDiff > 5) {
      // 平滑滚动
      container.scrollTo({
        top: finalScrollTop,
        behavior: CONFIG.scrollBehavior
      });
    }

    // 添加闪烁效果
    activeItem.classList.add('toc-flash');
    setTimeout(() => {
      activeItem.classList.remove('toc-flash');
    }, 600);
  }

  /**
   * 处理高亮变化
   */
  const handleActiveChange = debounce(function() {
    const container = getTocContainer();
    if (!container) return;

    // 获取所有 active 项，选择最深层的（DOM 顺序中最后一个）
    const allActiveItems = container.querySelectorAll(CONFIG.activeSelector);
    const activeItem = allActiveItems.length > 0 ? allActiveItems[allActiveItems.length - 1] : null;
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:handleActiveChange',message:'Selecting deepest active item',data:{totalActiveItems:allActiveItems.length,selectedText:activeItem?.innerText?.substring(0,30),allActiveTexts:Array.from(allActiveItems).map(a=>a.innerText?.substring(0,20))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    
    if (activeItem) {
      scrollToActiveItem(container, activeItem);
    }

    // 更新滚动状态
    updateScrollState(container);
  }, CONFIG.observerDebounce);

  /**
   * 初始化 MutationObserver
   * 监听目录容器内 class 属性的变化
   */
  function initObserver() {
    const container = getTocContainer();
    // #region agent log
    const containerStyle = container ? window.getComputedStyle(container) : null;
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:initObserver',message:'initObserver called',data:{containerFound:!!container,containerSelector:'.widget.toc .toc-content',containerClass:container?.className,containerClientHeight:container?.clientHeight,containerScrollHeight:container?.scrollHeight,maxHeight:containerStyle?.maxHeight,overflowY:containerStyle?.overflowY,display:containerStyle?.display},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B2'})}).catch(()=>{});
    // #endregion
    if (!container) return;

    // 断开之前的观察器
    if (observer) {
      observer.disconnect();
    }

    // 创建新的观察器
    observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:MutationObserver',message:'Class mutation detected',data:{tagName:target.tagName,hasIsActive:target.classList.contains('is-active'),className:target.className},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          if (target.tagName === 'A' && target.classList.contains('is-active')) {
            handleActiveChange();
            break;
          }
        }
      }
    });
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2b6d0a74-92ee-40b0-b8f2-ff0a2d15d865',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'toc-enhanced.js:observer-created',message:'MutationObserver created and observing',data:{observing:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // 开始观察
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });

    // 绑定滚动事件，更新滚动状态
    const throttledScrollHandler = throttle(function() {
      updateScrollState(container);
    }, CONFIG.throttleDelay);

    container.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // 检测用户是否正在操作目录
    // 鼠标进入目录区域时，标记为用户正在交互
    container.addEventListener('mouseenter', function() {
      isUserInteractingWithToc = true;
      clearTimeout(userInteractionTimer);
    });
    
    // 鼠标离开目录区域后，延迟一段时间恢复自动滚动
    container.addEventListener('mouseleave', function() {
      clearTimeout(userInteractionTimer);
      userInteractionTimer = setTimeout(function() {
        isUserInteractingWithToc = false;
      }, 1500); // 离开后 1.5 秒恢复自动滚动
    });
    
    // 用户在目录上滚动时，也标记为正在交互
    container.addEventListener('wheel', function() {
      isUserInteractingWithToc = true;
      clearTimeout(userInteractionTimer);
      userInteractionTimer = setTimeout(function() {
        isUserInteractingWithToc = false;
      }, 2000); // 滚动后 2 秒恢复自动滚动
    }, { passive: true });
    
    // 触摸设备支持
    container.addEventListener('touchstart', function() {
      isUserInteractingWithToc = true;
      clearTimeout(userInteractionTimer);
    }, { passive: true });
    
    container.addEventListener('touchend', function() {
      clearTimeout(userInteractionTimer);
      userInteractionTimer = setTimeout(function() {
        isUserInteractingWithToc = false;
      }, 2000);
    }, { passive: true });

    // 初始化滚动状态
    setTimeout(() => {
      updateScrollState(container);
      // 如果已有高亮项，滚动到该位置（选择最深层的）
      const allActiveItems = container.querySelectorAll(CONFIG.activeSelector);
      const activeItem = allActiveItems.length > 0 ? allActiveItems[allActiveItems.length - 1] : null;
      if (activeItem) {
        scrollToActiveItem(container, activeItem);
      }
    }, 100);
  }

  /**
   * 初始化 TOC 增强功能
   */
  function init() {
    // 等待 DOM 准备就绪
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // 延迟初始化，确保 btoc.min.js 和 common.min.js 已执行完毕，TOC 内容已生成
    setTimeout(function() {
      initObserver();
      isInitialized = true;
    }, 500);
  }

  /**
   * 重新初始化（用于 PJAX 场景）
   */
  function reinit() {
    // 清理之前的观察器
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // 重新初始化，增加延迟确保 TOC DOM 已更新完成
    setTimeout(function() {
      initObserver();
    }, 500);
  }

  /**
   * 销毁函数
   */
  function destroy() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scrollCheckTimer) {
      clearTimeout(scrollCheckTimer);
      scrollCheckTimer = null;
    }
    isInitialized = false;
  }

  // 暴露到全局，供 PJAX 回调使用
  window.TocEnhanced = {
    init: init,
    reinit: reinit,
    destroy: destroy,
    scrollToActive: function() {
      const container = getTocContainer();
      const activeItem = container?.querySelector(CONFIG.activeSelector);
      if (activeItem) {
        scrollToActiveItem(container, activeItem);
      }
    }
  };

  // 自动初始化
  init();

  // 监听 PJAX 事件
  $(document).on('pjax:complete', function() {
    reinit();
  });

  // 包装 tocPjax 函数，在 TOC 重建后重新初始化
  function wrapTocPjax() {
    if (typeof window.tocPjax === 'function' && !window.tocPjax._tocEnhancedWrapped) {
      const originalTocPjax = window.tocPjax;
      window.tocPjax = function() {
        originalTocPjax.apply(this, arguments);
        // TOC 重建后重新初始化，增加延迟确保 DOM 更新完成
        setTimeout(reinit, 300);
      };
      window.tocPjax._tocEnhancedWrapped = true;
    }
  }

  // 立即尝试包装
  wrapTocPjax();

  // 如果 tocPjax 还未定义，等待 DOM 加载后再尝试
  if (typeof window.tocPjax !== 'function') {
    document.addEventListener('DOMContentLoaded', wrapTocPjax);
    // 再次延迟尝试，确保所有脚本都已加载
    setTimeout(wrapTocPjax, 100);
  }

})();
