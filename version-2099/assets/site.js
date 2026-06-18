(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        restart();
      });
    }

    showSlide(0);
    restart();
  }

  document.querySelectorAll('[data-filter-area]').forEach(function (area) {
    var search = area.querySelector('[data-search-input]');
    var selects = Array.prototype.slice.call(area.querySelectorAll('[data-filter-select]'));
    var cards = Array.prototype.slice.call(area.querySelectorAll('[data-search]'));
    var empty = area.querySelector('[data-empty-state]');

    function matches(card) {
      var q = search ? search.value.trim().toLowerCase() : '';
      var text = card.getAttribute('data-search') || '';
      if (q && text.indexOf(q) === -1) {
        return false;
      }
      return selects.every(function (select) {
        var key = select.getAttribute('data-filter-select');
        var value = select.value;
        return !value || (card.getAttribute('data-' + key) || '') === value;
      });
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var visible = matches(card);
        card.style.display = visible ? '' : 'none';
        if (visible) {
          shown += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('visible', shown === 0);
      }
    }

    if (search) {
      search.addEventListener('input', apply);
    }
    selects.forEach(function (select) {
      select.addEventListener('change', apply);
    });
    apply();
  });
})();
