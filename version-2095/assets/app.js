(function () {
  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function readQuery() {
    return new URLSearchParams(window.location.search);
  }

  function cardTemplate(item) {
    var tags = (item.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '' +
      '<a class="movie-card" href="./' + escapeHtml(item.file) + '" data-movie-card data-title="' + escapeHtml(item.title) + '" data-region="' + escapeHtml(item.region) + '" data-year="' + escapeHtml(item.year) + '" data-type="' + escapeHtml(item.type) + '" data-genre="' + escapeHtml(item.genre + ' ' + (item.tags || []).join(' ')) + '">' +
      '<div class="card-poster">' +
      '<img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
      '<span class="card-year">' + escapeHtml(item.year) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
      '<span class="card-category inline">' + escapeHtml(item.category) + '</span>' +
      '<h3>' + escapeHtml(item.title) + '</h3>' +
      '<p>' + escapeHtml(item.oneLine) + '</p>' +
      '<div class="card-meta"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
      '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
      '</a>';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initMobileNav() {
    var toggle = document.querySelector('[data-mobile-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
  }

  function initHeaderSearch() {
    selectAll('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var keyword = input ? input.value.trim() : '';

        if (keyword) {
          window.location.href = './search.html?q=' + encodeURIComponent(keyword);
        } else {
          window.location.href = './search.html';
        }
      });
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = selectAll('[data-hero-slide]', slider);
    var dots = selectAll('[data-hero-dot]', slider);
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
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

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initFilters() {
    var form = document.querySelector('[data-filter-form]');
    var results = document.querySelector('[data-filter-results]');

    if (!form || !results) {
      return;
    }

    var keyword = form.querySelector('[data-filter-keyword]');
    var year = form.querySelector('[data-filter-year]');
    var region = form.querySelector('[data-filter-region]');
    var cards = selectAll('[data-movie-card]', results);

    function apply() {
      var key = keyword ? keyword.value.trim().toLowerCase() : '';
      var selectedYear = year ? year.value : '';
      var selectedRegion = region ? region.value : '';

      cards.forEach(function (card) {
        var text = [card.dataset.title, card.dataset.genre, card.dataset.type, card.dataset.region, card.dataset.year].join(' ').toLowerCase();
        var matchedKeyword = !key || text.indexOf(key) !== -1;
        var matchedYear = !selectedYear || card.dataset.year === selectedYear;
        var matchedRegion = !selectedRegion || card.dataset.region === selectedRegion;
        card.classList.toggle('hidden-card', !(matchedKeyword && matchedYear && matchedRegion));
      });
    }

    [keyword, year, region].forEach(function (element) {
      if (element) {
        element.addEventListener('input', apply);
        element.addEventListener('change', apply);
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      apply();
    });
  }

  function initSearchPage() {
    var page = document.querySelector('[data-search-page]');
    var form = document.querySelector('[data-search-page-form]');
    var results = document.querySelector('[data-search-results]');
    var title = document.querySelector('[data-search-title]');
    var copy = document.querySelector('[data-search-copy]');
    var input = form ? form.querySelector('input[name="q"]') : null;
    var data = window.SEARCH_INDEX || [];

    if (!page || !form || !results) {
      return;
    }

    function render(query) {
      var key = String(query || '').trim().toLowerCase();

      if (input) {
        input.value = query || '';
      }

      if (!key) {
        if (title) {
          title.textContent = '热门推荐';
        }
        if (copy) {
          copy.textContent = '你也可以直接浏览下方精选影片。';
        }
        return;
      }

      var matched = data.filter(function (item) {
        return [item.title, item.region, item.type, item.year, item.genre, (item.tags || []).join(' '), item.oneLine].join(' ').toLowerCase().indexOf(key) !== -1;
      }).slice(0, 120);

      if (title) {
        title.textContent = '搜索结果';
      }

      if (copy) {
        copy.textContent = matched.length ? '以下影片与当前关键词相关。' : '可以尝试更换片名、地区、类型或标签。';
      }

      if (!matched.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配影片</div>';
        return;
      }

      results.innerHTML = matched.map(cardTemplate).join('');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = input ? input.value.trim() : '';
      var url = value ? './search.html?q=' + encodeURIComponent(value) : './search.html';
      history.replaceState(null, '', url);
      render(value);
    });

    render(readQuery().get('q') || '');
  }

  function attachHls(video, source) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      return;
    }

    video.src = source;
  }

  window.initVideoPlayer = function (source) {
    var video = document.querySelector('[data-player-video]');
    var overlay = document.querySelector('[data-player-overlay]');
    var attached = false;

    if (!video || !overlay || !source) {
      return;
    }

    function ensureReady() {
      if (attached) {
        return;
      }
      attached = true;
      attachHls(video, source);
    }

    function start() {
      ensureReady();
      overlay.classList.add('is-hidden');
      video.setAttribute('controls', 'controls');
      var playRequest = video.play();

      if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(function () {
          overlay.classList.remove('is-hidden');
        });
      }
    }

    overlay.addEventListener('click', start);
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHeaderSearch();
    initHeroSlider();
    initFilters();
    initSearchPage();
  });
})();
