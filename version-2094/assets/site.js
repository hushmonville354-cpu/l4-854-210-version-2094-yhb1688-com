(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function setupMobileMenu() {
    var toggle = qs('[data-mobile-toggle]');
    var menu = qs('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = qs('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = qsa('[data-hero-slide]', hero);
    var dots = qsa('[data-hero-dot]', hero);
    var prev = qs('[data-hero-prev]', hero);
    var next = qs('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
  }

  function getCardText(card) {
    return normalize([
      card.getAttribute('data-title'),
      card.getAttribute('data-region'),
      card.getAttribute('data-year'),
      card.getAttribute('data-genre'),
      card.getAttribute('data-tags'),
      card.textContent
    ].join(' '));
  }

  function setupFilters() {
    qsa('[data-filter-scope]').forEach(function (scope) {
      var input = qs('[data-filter-input]', scope);
      var form = qs('[data-filter-form]', scope);
      var cards = qsa('.movie-card', scope);
      var chips = qsa('[data-filter-value]', scope);
      var count = qs('[data-filter-count]', scope);
      var empty = qs('[data-filter-empty]', scope);
      var activeChipValue = '';

      function applyFilter() {
        var inputValue = input ? input.value : '';
        var tokens = [inputValue, activeChipValue]
          .map(normalize)
          .filter(Boolean);
        var visibleCount = 0;

        cards.forEach(function (card) {
          var cardText = getCardText(card);
          var visible = tokens.every(function (token) {
            return cardText.indexOf(token) !== -1;
          });
          card.hidden = !visible;
          if (visible) {
            visibleCount += 1;
          }
        });

        if (count) {
          count.textContent = String(visibleCount);
        }
        if (empty) {
          empty.hidden = visibleCount !== 0;
        }
      }

      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          applyFilter();
        });
      }

      if (input) {
        input.addEventListener('input', applyFilter);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (item) {
            item.classList.remove('is-active');
          });
          chip.classList.add('is-active');
          activeChipValue = chip.getAttribute('data-filter-value') || '';
          applyFilter();
        });
      });

      if (scope.hasAttribute('data-search-page')) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';
        if (input && query) {
          input.value = query;
        }
      }

      applyFilter();
    });
  }

  function setupRanking() {
    var page = qs('[data-ranking-page]');
    if (!page) {
      return;
    }
    var list = qs('[data-ranking-list]', page);
    var sort = qs('[data-ranking-sort]', page);
    if (!list || !sort) {
      return;
    }
    var items = qsa('.ranking-item', list);

    function numberValue(item, key) {
      var raw = item.getAttribute('data-' + key) || '0';
      var value = parseFloat(raw.replace(/[^0-9.]/g, ''));
      return Number.isFinite(value) ? value : 0;
    }

    function applySort() {
      var key = sort.value;
      items.sort(function (a, b) {
        return numberValue(b, key) - numberValue(a, key);
      });
      items.forEach(function (item, itemIndex) {
        var number = qs('.ranking-number', item);
        if (number) {
          number.textContent = String(itemIndex + 1).padStart(2, '0');
        }
        list.appendChild(item);
      });
    }

    sort.addEventListener('change', applySort);
    applySort();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        if (window.Hls) {
          resolve();
        }
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function setupPlayer() {
    var player = qs('[data-player]');
    if (!player) {
      return;
    }
    var video = qs('.js-hls-video', player);
    var overlay = qs('.player-overlay', player);
    var message = qs('[data-player-message]', player);
    var source = video ? video.getAttribute('data-src') : '';
    var isReady = false;
    var hlsInstance = null;

    function showMessage(text) {
      if (message) {
        message.textContent = text || '';
      }
    }

    function prepareVideo() {
      if (!video || !source) {
        showMessage('未找到可用播放源。');
        return Promise.reject(new Error('Missing HLS source'));
      }

      if (isReady) {
        return Promise.resolve();
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        isReady = true;
        return Promise.resolve();
      }

      var cdn = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      return loadScript(cdn).then(function () {
        if (!window.Hls || !window.Hls.isSupported()) {
          throw new Error('HLS is not supported');
        }
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage('视频加载失败，请稍后重试。');
          }
        });
        isReady = true;
      });
    }

    function playVideo() {
      showMessage('正在加载播放源...');
      prepareVideo().then(function () {
        return video.play();
      }).then(function () {
        showMessage('');
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      }).catch(function () {
        showMessage('当前浏览器阻止了自动播放，请再次点击播放按钮。');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('play', function () {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      });
      video.addEventListener('pause', function () {
        if (overlay && video.currentTime === 0) {
          overlay.classList.remove('is-hidden');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setupHero();
    setupFilters();
    setupRanking();
    setupPlayer();
  });
})();
