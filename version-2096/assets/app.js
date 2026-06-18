(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      var opened = mobileMenu.hasAttribute('hidden');
      if (opened) {
        mobileMenu.removeAttribute('hidden');
        menuButton.setAttribute('aria-expanded', 'true');
      } else {
        mobileMenu.setAttribute('hidden', '');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initHero() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.hero-dot'));
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function next() {
      show(current + 1);
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(next, 6200);
    }

    slider.querySelectorAll('[data-hero]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-hero');
        show(action === 'prev' ? current - 1 : current + 1);
        restart();
      });
    });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-slide'), 10) || 0);
        restart();
      });
    });

    restart();
  }

  function setupFiltering() {
    var grids = Array.prototype.slice.call(document.querySelectorAll('.browsable-grid, .rank-list, .movie-grid'));
    var searchInputs = Array.prototype.slice.call(document.querySelectorAll('.site-search'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
    var activeFilter = 'all';
    var initialQuery = '';

    try {
      initialQuery = new URLSearchParams(window.location.search).get('q') || '';
    } catch (error) {
      initialQuery = '';
    }

    searchInputs.forEach(function (input) {
      if (initialQuery) {
        input.value = initialQuery;
      }
      input.addEventListener('input', apply);
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeFilter = chip.getAttribute('data-filter') || 'all';
        chips.forEach(function (item) {
          item.classList.toggle('is-active', item === chip);
        });
        apply();
      });
    });

    function currentQuery() {
      var input = searchInputs[0];
      return input ? input.value.trim().toLowerCase() : initialQuery.trim().toLowerCase();
    }

    function apply() {
      var query = currentQuery();
      var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        var region = card.getAttribute('data-region') || '';
        var type = card.getAttribute('data-type') || '';
        var year = card.getAttribute('data-year') || '';
        var matchesText = !query || text.indexOf(query) !== -1;
        var matchesFilter = activeFilter === 'all' || region === activeFilter || type === activeFilter || year === activeFilter;
        card.classList.toggle('is-filter-hidden', !(matchesText && matchesFilter));
      });
    }

    if (initialQuery) {
      apply();
    }
  }

  var hlsLoading = false;
  var hlsCallbacks = [];

  function ensureHls(callback) {
    if (window.Hls) {
      callback();
      return;
    }

    hlsCallbacks.push(callback);

    if (hlsLoading) {
      return;
    }

    hlsLoading = true;
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = function () {
      hlsLoading = false;
      var callbacks = hlsCallbacks.slice();
      hlsCallbacks = [];
      callbacks.forEach(function (item) {
        item();
      });
    };
    script.onerror = function () {
      hlsLoading = false;
      hlsCallbacks = [];
    };
    document.head.appendChild(script);
  }

  function startPlayer(video, url, overlay) {
    if (!video || !url) {
      return;
    }

    if (overlay) {
      overlay.classList.add('is-hidden');
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (!video.src) {
        video.src = url;
      }
      video.play().catch(function () {});
      return;
    }

    ensureHls(function () {
      if (window.Hls && window.Hls.isSupported()) {
        if (!video._hlsPlayer) {
          video._hlsPlayer = new window.Hls({
            lowLatencyMode: true,
            backBufferLength: 90
          });
          video._hlsPlayer.loadSource(url);
          video._hlsPlayer.attachMedia(video);
          video._hlsPlayer.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.play().catch(function () {});
        }
      }
    });
  }

  function initPlayers() {
    document.querySelectorAll('.player-overlay').forEach(function (overlay) {
      var targetId = overlay.getAttribute('data-target');
      var url = overlay.getAttribute('data-url');
      var video = document.getElementById(targetId);

      overlay.addEventListener('click', function () {
        startPlayer(video, url, overlay);
      });

      if (video) {
        video.addEventListener('play', function () {
          overlay.classList.add('is-hidden');
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHero();
    setupFiltering();
    initPlayers();
  });
})();
