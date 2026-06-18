(function () {
  var menuButton = document.querySelector("[data-menu-button]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }

  document.querySelectorAll("[data-hero-carousel]").forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    var prev = carousel.querySelector("[data-hero-prev]");
    var next = carousel.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function play() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        play();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        play();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", play);
    show(0);
    play();
  });

  document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
    var input = scope.querySelector("[data-search-input]");
    var fields = Array.prototype.slice.call(scope.querySelectorAll("[data-filter-field]"));
    var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
    var empty = scope.querySelector("[data-empty-state]");

    fields.forEach(function (field) {
      var name = field.getAttribute("data-filter-field");
      var values = [];
      cards.forEach(function (card) {
        var value = card.getAttribute("data-" + name) || "";
        if (value && values.indexOf(value) === -1) {
          values.push(value);
        }
      });
      values.sort(function (a, b) {
        return b.localeCompare(a, "zh-CN", { numeric: true });
      });
      values.forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        field.appendChild(option);
      });
    });

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var active = 0;
      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-type"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-tags")
        ].join(" "));
        var pass = !keyword || haystack.indexOf(keyword) !== -1;
        fields.forEach(function (field) {
          var selected = field.value;
          var name = field.getAttribute("data-filter-field");
          var value = card.getAttribute("data-" + name) || "";
          if (selected && value !== selected) {
            pass = false;
          }
        });
        card.style.display = pass ? "" : "none";
        if (pass) {
          active += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("is-visible", active === 0);
      }
    }

    if (input) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q) {
        input.value = q;
      }
      input.addEventListener("input", apply);
    }

    fields.forEach(function (field) {
      field.addEventListener("change", apply);
    });

    apply();
  });
})();
