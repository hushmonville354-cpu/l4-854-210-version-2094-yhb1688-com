(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    restart();
  }

  function uniqueValues(cards, key) {
    var values = [];
    var seen = {};
    cards.forEach(function (card) {
      var value = card.getAttribute('data-' + key) || '';
      if (value && !seen[value]) {
        seen[value] = true;
        values.push(value);
      }
    });
    return values.sort(function (a, b) {
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
        return Number(b) - Number(a);
      }
      return a.localeCompare(b, 'zh-CN');
    });
  }

  function fillSelect(select, cards, key) {
    if (!select || select.getAttribute('data-filled') === 'true') {
      return;
    }
    uniqueValues(cards, key).forEach(function (value) {
      var option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    select.setAttribute('data-filled', 'true');
  }

  function applyFilters(targetSelector) {
    var containers = Array.prototype.slice.call(document.querySelectorAll(targetSelector));
    containers.forEach(function (container) {
      var cards = Array.prototype.slice.call(container.querySelectorAll('[data-card]'));
      var searchInputs = Array.prototype.slice.call(document.querySelectorAll('[data-card-search][data-target="' + targetSelector + '"]'));
      var yearFilter = document.querySelector('[data-card-filter="year"][data-target="' + targetSelector + '"]');
      var typeFilter = document.querySelector('[data-card-filter="type"][data-target="' + targetSelector + '"]');
      fillSelect(yearFilter, cards, 'year');
      fillSelect(typeFilter, cards, 'type');

      var query = searchInputs.map(function (input) {
        return input.value.trim().toLowerCase();
      }).join(' ').trim();
      var selectedYear = yearFilter ? yearFilter.value : '';
      var selectedType = typeFilter ? typeFilter.value : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
        var year = card.getAttribute('data-year') || '';
        var type = card.getAttribute('data-type') || '';
        var matched = true;
        if (query && text.indexOf(query) === -1) {
          matched = false;
        }
        if (selectedYear && year !== selectedYear) {
          matched = false;
        }
        if (selectedType && type !== selectedType) {
          matched = false;
        }
        card.setAttribute('hidden-by-filter', matched ? 'false' : 'true');
        if (matched) {
          visibleCount += 1;
        }
      });

      var emptyState = document.querySelector('[data-empty-state]');
      if (emptyState) {
        emptyState.classList.toggle('show', visibleCount === 0);
      }
    });
  }

  function setupFilters() {
    var targets = {};
    Array.prototype.slice.call(document.querySelectorAll('[data-card-search], [data-card-filter]')).forEach(function (control) {
      var selector = control.getAttribute('data-target');
      if (!selector) {
        return;
      }
      targets[selector] = true;
      control.addEventListener('input', function () {
        applyFilters(selector);
      });
      control.addEventListener('change', function () {
        applyFilters(selector);
      });
    });
    Object.keys(targets).forEach(applyFilters);
  }

  function setupPlayers() {
    Array.prototype.slice.call(document.querySelectorAll('.video-player')).forEach(function (player) {
      var video = player.querySelector('video');
      var overlay = player.querySelector('.player-overlay');
      var message = player.querySelector('[data-player-message]');
      var source = player.getAttribute('data-src');
      var hlsInstance = null;

      function showMessage(text) {
        if (!message) {
          return;
        }
        message.textContent = text;
        message.classList.add('show');
      }

      function playVideo() {
        if (!video || !source) {
          showMessage('播放源暂不可用。');
          return;
        }
        if (player.getAttribute('data-ready') === 'true') {
          video.play();
          return;
        }
        player.setAttribute('data-ready', 'true');
        video.setAttribute('controls', 'controls');
        video.setAttribute('playsinline', 'playsinline');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().catch(function () {
            showMessage('浏览器已阻止自动播放，请再次点击播放器开始观看。');
          });
          player.classList.add('is-playing');
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              showMessage('视频已加载，请再次点击播放按钮。');
            });
            player.classList.add('is-playing');
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              showMessage('播放过程中出现网络或媒体错误，请刷新页面后重试。');
              if (hlsInstance) {
                hlsInstance.destroy();
              }
            }
          });
          return;
        }

        showMessage('当前浏览器不支持 HLS 播放，请使用新版 Chrome、Edge、Safari 或移动浏览器访问。');
      }

      if (overlay) {
        overlay.addEventListener('click', playVideo);
      }
      if (video) {
        video.addEventListener('play', function () {
          player.classList.add('is-playing');
        });
        video.addEventListener('pause', function () {
          if (!video.ended) {
            player.classList.remove('is-playing');
          }
        });
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
