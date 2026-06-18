(function () {
  var header = document.querySelector('[data-site-header]');
  var toggle = document.querySelector('[data-menu-toggle]');

  function syncHeader() {
    if (!header) return;
    if (window.scrollY > 18) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', header.classList.contains('is-open'));
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
      thumbs.forEach(function (thumb, i) {
        thumb.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('mouseenter', function () {
        show(i);
      });
    });

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

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function setupFilters() {
    document.querySelectorAll('[data-card-filter]').forEach(function (panel) {
      var root = panel.parentElement;
      var search = panel.querySelector('[data-card-search]');
      var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-type], [data-filter-year]'));
      var cards = Array.prototype.slice.call(root.querySelectorAll('[data-movie-card]'));
      var state = { type: 'all', year: 'all', query: '' };

      function apply() {
        var q = state.query.trim().toLowerCase();
        cards.forEach(function (card) {
          var haystack = [
            card.getAttribute('data-title'),
            card.getAttribute('data-type'),
            card.getAttribute('data-year'),
            card.getAttribute('data-region'),
            card.getAttribute('data-genre')
          ].join(' ').toLowerCase();
          var typeOk = state.type === 'all' || card.getAttribute('data-type') === state.type;
          var yearOk = state.year === 'all' || card.getAttribute('data-year') === state.year;
          var queryOk = !q || haystack.indexOf(q) !== -1;
          card.classList.toggle('is-hidden', !(typeOk && yearOk && queryOk));
        });
      }

      if (search) {
        search.addEventListener('input', function () {
          state.query = search.value;
          apply();
        });
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.hasAttribute('data-filter-type')) {
            state.type = button.getAttribute('data-filter-type');
            buttons.filter(function (btn) { return btn.hasAttribute('data-filter-type'); }).forEach(function (btn) {
              btn.classList.toggle('is-active', btn === button);
            });
          }
          if (button.hasAttribute('data-filter-year')) {
            var value = button.getAttribute('data-filter-year');
            state.year = state.year === value ? 'all' : value;
            buttons.filter(function (btn) { return btn.hasAttribute('data-filter-year'); }).forEach(function (btn) {
              btn.classList.toggle('is-active', state.year === btn.getAttribute('data-filter-year'));
            });
          }
          apply();
        });
      });
    });
  }

  function attachSource(video, source) {
    if (!video || !source) return Promise.resolve();
    if (video.getAttribute('data-ready') === source) return Promise.resolve();
    video.setAttribute('data-ready', source);
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      return Promise.resolve();
    }
    if (window.Hls && window.Hls.isSupported()) {
      if (video._hls) video._hls.destroy();
      var hls = new window.Hls({ enableWorker: true });
      video._hls = hls;
      return new Promise(function (resolve) {
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      });
    }
    video.src = source;
    return Promise.resolve();
  }

  function setupPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (box) {
      var video = box.querySelector('video');
      var button = box.querySelector('[data-play-trigger]');
      if (!video) return;
      var source = video.getAttribute('data-src');

      function play() {
        attachSource(video, source).then(function () {
          var promise = video.play();
          if (promise && promise.catch) promise.catch(function () {});
        });
      }

      if (button) {
        button.addEventListener('click', function () {
          play();
        });
      }

      video.addEventListener('play', function () {
        box.classList.add('is-playing');
      });

      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) box.classList.remove('is-playing');
      });

      video.addEventListener('click', function () {
        if (video.paused) play();
      });
    });
  }

  function setupSearchPage() {
    var form = document.querySelector('[data-search-page-form]');
    var input = document.querySelector('[data-search-page-input]');
    var results = document.querySelector('[data-search-results]');
    if (!form || !input || !results || !window.SEARCH_DATA) return;

    function render(query) {
      var q = (query || '').trim().toLowerCase();
      input.value = query || '';
      var list = window.SEARCH_DATA.filter(function (item) {
        if (!q) return true;
        return item.search.indexOf(q) !== -1;
      }).slice(0, 80);

      if (!list.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配内容</div>';
        return;
      }

      results.innerHTML = list.map(function (item) {
        return '<a class="search-result-card" href="./' + item.file + '">' +
          '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
          '<div><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.meta) + '</p><p>' + escapeHtml(item.oneLine) + '</p></div>' +
          '<span>查看详情</span>' +
          '</a>';
      }).join('');
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var q = input.value.trim();
      history.replaceState(null, '', q ? './search.html?q=' + encodeURIComponent(q) : './search.html');
      render(q);
    });

    input.addEventListener('input', function () {
      render(input.value);
    });

    var params = new URLSearchParams(window.location.search);
    render(params.get('q') || '');
  }

  setupHero();
  setupFilters();
  setupPlayers();
  setupSearchPage();
})();
