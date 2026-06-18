(function () {
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var active = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    active = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === active);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === active);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      showSlide(Number(dot.getAttribute('data-target')) || 0);
    });
  });

  if (slides.length > 1) {
    window.setInterval(function () {
      showSlide(active + 1);
    }, 5200);
  }

  document.querySelectorAll('.filter-panel').forEach(function (panel) {
    var root = panel.parentElement;
    var target = root ? root.querySelector('.filter-target') : null;
    var items = target ? Array.prototype.slice.call(target.children) : [];
    var search = panel.querySelector('.movie-search');
    var region = panel.querySelector('.movie-region');
    var year = panel.querySelector('.movie-year');
    var genre = panel.querySelector('.movie-genre');

    function value(node) {
      return node ? node.value.trim().toLowerCase() : '';
    }

    function text(node, name) {
      return (node.getAttribute(name) || '').toLowerCase();
    }

    function apply() {
      var q = value(search);
      var r = value(region);
      var y = value(year);
      var g = value(genre);

      items.forEach(function (item) {
        var haystack = [
          text(item, 'data-title'),
          text(item, 'data-region'),
          text(item, 'data-year'),
          text(item, 'data-genre'),
          text(item, 'data-tags')
        ].join(' ');

        var matched = true;

        if (q && haystack.indexOf(q) === -1) {
          matched = false;
        }
        if (r && text(item, 'data-region').indexOf(r) === -1) {
          matched = false;
        }
        if (y && text(item, 'data-year').indexOf(y) === -1) {
          matched = false;
        }
        if (g && haystack.indexOf(g) === -1) {
          matched = false;
        }

        item.classList.toggle('is-hidden', !matched);
      });
    }

    [search, region, year, genre].forEach(function (node) {
      if (node) {
        node.addEventListener('input', apply);
        node.addEventListener('change', apply);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q');
    if (initial && search) {
      search.value = initial;
      apply();
    }
  });
})();
