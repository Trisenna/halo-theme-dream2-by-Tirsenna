(function($) {
    'use strict';
  
    function initializeLikePage() {
  
      const $likePageContainer = $('.like-page-container');
      if ($likePageContainer.length === 0) return;
      if ($likePageContainer.data('initialized')) return;
  
      console.log('[Like Page] Initializing scripts...');
  
      // 1) Tab 切换
      $('.like-tab').each(function() {
        const $tab = $(this);
        if ($tab.data('tab-bound')) return;
  
        $tab.data('tab-bound', true);
        $tab.on('click', function() {
          $('.like-tab').removeClass('active');
          $('.like-tab-content').removeClass('active');
          $(this).addClass('active');
          $('#' + $(this).data('tab')).addClass('active');
        });
      });
  
      // 2) waifu 卡片 3D + 拟真光照（方向光 + 镜面 + Fresnel 边缘光）
      $('.waifu-card-wrap').each(function() {
        const $wrap = $(this);
        if ($wrap.data('mouse-bound')) return;

        $wrap.data('mouse-bound', true);
        const $card = $wrap.find('.waifu-card');
        if (!$card.length) return;

        const maxRotate = 18;
        const DEG2RAD = Math.PI / 180;

        // ========== 光照参数 ==========
        // 固定光源方向（归一化）：左上前方
        const lightDir = normalize3([-0.5, -0.6, 0.8]);
        // 视线方向（正对屏幕）
        const viewDir = [0, 0, 1];
        // 镜面高光指数（越大光斑越集中）
        const shininess = 50;
        // Fresnel 边缘光指数（越大边缘越锐利）
        const fresnelPow = 2.5;

        // ========== 向量工具函数 ==========
        function normalize3(v) {
          const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) || 1;
          return [v[0]/len, v[1]/len, v[2]/len];
        }
        function dot3(a, b) {
          return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        }
        function add3(a, b) {
          return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
        }
        function reflect3(I, N) {
          // R = I - 2*(I·N)*N
          const d = 2 * dot3(I, N);
          return [I[0] - d*N[0], I[1] - d*N[1], I[2] - d*N[2]];
        }

        $wrap.on('mousemove', function(e) {
          const rect = $card[0].getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          // 卡片旋转角度
          const rotateX = ((y - centerY) / centerY) * -maxRotate;
          const rotateY = ((x - centerX) / centerX) *  maxRotate;

          // ========== 计算表面法线 N ==========
          // rotateX 绕 X 轴旋转 → 法线 Y 分量变化
          // rotateY 绕 Y 轴旋转 → 法线 X 分量变化
          const radX = rotateX * DEG2RAD;
          const radY = rotateY * DEG2RAD;
          const normal = normalize3([
            Math.sin(radY),
            -Math.sin(radX),
            Math.cos(radX) * Math.cos(radY)
          ]);

          // ========== Diffuse（漫反射）==========
          const NdotL = dot3(normal, lightDir);
          const diffuse = Math.max(0, NdotL);

          // ========== Specular（镜面高光，Blinn-Phong）==========
          const halfVec = normalize3(add3(lightDir, viewDir));
          const NdotH = Math.max(0, dot3(normal, halfVec));
          const specRaw = Math.pow(NdotH, shininess);
          // 增强镜面高光，确保玻璃透亮感可见
          const spec = Math.min(1, specRaw * 3.5);

          // ========== Fresnel / Rim（边缘光）==========
          const NdotV = Math.max(0, dot3(normal, viewDir));
          const rim = Math.pow(1 - NdotV, fresnelPow);

          // ========== 高光斑点位置（基于反射方向投影）==========
          const negLight = [-lightDir[0], -lightDir[1], -lightDir[2]];
          const R = reflect3(negLight, normal);
          // 将反射向量投影到 2D（XY → 百分比位置）
          const spotX = 50 + R[0] * 35;
          const spotY = 50 - R[1] * 28;

          // ========== 高光角度（指向翘起的边缘，与鼠标位置相反）==========
          // CSS conic-gradient: 0° 在顶部，顺时针
          // 鼠标在右下 → 左上翘起 → 角度指向左上 (~315°)
          const shadeAngle = 90 - Math.atan2(-rotateX, -rotateY) * 180 / Math.PI;

          // ========== 整体倾斜强度（用于基础增强）==========
          const tilt = Math.min(1, Math.hypot(rotateX, rotateY) / maxRotate);

          $card.css({
            '--rotate-x': `${rotateX}deg`,
            '--rotate-y': `${rotateY}deg`,

            // 拟真光照变量
            '--diffuse': diffuse.toFixed(3),
            '--spec': spec.toFixed(3),
            '--rim': rim.toFixed(3),
            '--spot-x': `${spotX.toFixed(1)}%`,
            '--spot-y': `${spotY.toFixed(1)}%`,
            '--shade-angle': `${shadeAngle.toFixed(1)}deg`,
            '--tilt': tilt.toFixed(3)
          });
        });

        $wrap.on('mouseleave', function() {
          $card.css({
            '--rotate-x': '',
            '--rotate-y': '',
            '--diffuse': '',
            '--spec': '',
            '--rim': '',
            '--spot-x': '',
            '--spot-y': '',
            '--shade-angle': '',
            '--tilt': ''
          });
        });
      });
  
      // 3) 阅读更多
      function initCollapsibleDescriptions() {
        $('.ranked-item-info').each(function() {
          const $info = $(this);
          if ($info.data('desc-initialized')) return;
  
          const $desc = $info.find('.ranked-item-desc');
          const $tags = $info.find('.ranked-item-tags');
          if ($desc.length === 0) return;
  
          const isOverflowing = $desc[0].scrollHeight > $desc[0].clientHeight + 1;
  
          if (isOverflowing || $tags.length > 0) {
            const $footer = $('<div class="ranked-item-footer"></div>');
  
            if ($tags.length > 0) {
              $footer.append($tags);
            } else {
              $footer.append('<div class="ranked-item-tags"></div>');
            }
  
            if (isOverflowing) {
              const $readMoreBtn = $('<button class="read-more-btn">阅读更多</button>');
              $readMoreBtn.on('click', function(e) {
                e.preventDefault();
                $desc.toggleClass('is-expanded');
                $(this).text($desc.hasClass('is-expanded') ? '收起' : '阅读更多');
              });
              $footer.append($readMoreBtn);
            }
  
            $info.append($footer);
          }
  
          $info.data('desc-initialized', true);
        });
        console.log('[Like Page] "Read More" check complete.');
      }
  
      setTimeout(initCollapsibleDescriptions, 300);
  
      $likePageContainer.data('initialized', true);
    }
  
    $(document).ready(function() {
      initializeLikePage();
    });
  
    $(document).on('pjax:end', function() {
      console.log('[Like Page] PJAX end detected. Re-running initialization.');
      setTimeout(initializeLikePage, 100);
    });
  
  })(jQuery);
