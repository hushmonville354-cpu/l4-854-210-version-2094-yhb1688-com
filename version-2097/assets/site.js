(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  ready(function () {
    var toggle = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");

    if (toggle && mobileNav) {
      toggle.addEventListener("click", function () {
        var isOpen = mobileNav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    initHero();
    initFilters();
    initPlayers();
  });

  function initHero() {
    var hero = document.querySelector("[data-hero]");

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
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
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot, itemIndex) {
      dot.addEventListener("click", function () {
        show(itemIndex);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function initFilters() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var inputs = Array.prototype.slice.call(document.querySelectorAll(".filter-input, .search-input"));
    var selects = Array.prototype.slice.call(document.querySelectorAll(".filter-select"));
    var forms = Array.prototype.slice.call(document.querySelectorAll("form[role='search']"));
    var empty = document.querySelector(".empty-state");

    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get("q") || "";

    if (initialQuery) {
      inputs.forEach(function (input) {
        input.value = initialQuery;
      });
    }

    function cardText(card) {
      return [
        card.getAttribute("data-title") || "",
        card.getAttribute("data-tags") || "",
        card.getAttribute("data-year") || "",
        card.textContent || ""
      ].join(" ").toLowerCase();
    }

    function applyFilters() {
      if (!cards.length) {
        return;
      }

      var query = "";
      inputs.some(function (input) {
        if (input.value.trim()) {
          query = input.value.trim().toLowerCase();
          return true;
        }
        return false;
      });

      var selectedCategory = "";
      var selectedYear = "";

      selects.forEach(function (select) {
        if (select.getAttribute("data-filter") === "category") {
          selectedCategory = select.value;
        }
        if (select.getAttribute("data-filter") === "year") {
          selectedYear = select.value;
        }
      });

      var visible = 0;

      cards.forEach(function (card) {
        var matchesQuery = !query || cardText(card).indexOf(query) !== -1;
        var matchesCategory = !selectedCategory || card.getAttribute("data-category") === selectedCategory;
        var matchesYear = !selectedYear || card.getAttribute("data-year") === selectedYear;
        var isVisible = matchesQuery && matchesCategory && matchesYear;
        card.classList.toggle("is-hidden", !isVisible);
        if (isVisible) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener("input", applyFilters);
    });

    selects.forEach(function (select) {
      select.addEventListener("change", applyFilters);
    });

    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        if (!cards.length) {
          return;
        }
        event.preventDefault();
        applyFilters();
      });
    });

    applyFilters();
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("video[data-stream]"));

    players.forEach(function (video) {
      var streamUrl = video.getAttribute("data-stream");
      var box = video.closest(".player-box");
      var overlay = box ? box.querySelector(".play-overlay") : null;
      var prepared = false;
      var hlsInstance = null;

      function prepare() {
        if (prepared || !streamUrl) {
          return;
        }
        prepared = true;

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        }
      }

      function play() {
        prepare();
        var result = video.play();
        if (result && typeof result.then === "function") {
          result.catch(function () {});
        }
      }

      video.addEventListener("play", function () {
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
      });

      video.addEventListener("pause", function () {
        if (overlay && video.currentTime === 0) {
          overlay.classList.remove("is-hidden");
        }
      });

      if (overlay) {
        overlay.addEventListener("click", play);
      }

      video.addEventListener("click", function () {
        prepare();
      });
    });
  }
})();
