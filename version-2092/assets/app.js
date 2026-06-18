(function() {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function createCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function(tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return "<article class="movie-card">" +
      "<a href="" + movie.href + "" class="movie-cover-link" aria-label="" + escapeHtml(movie.title) + "">" +
      "<img src="" + movie.cover + "" alt="" + escapeHtml(movie.title) + "" loading="lazy">" +
      "<span class="year-badge">" + escapeHtml(movie.year) + "</span>" +
      "</a>" +
      "<div class="movie-card-body">" +
      "<a href="" + movie.categoryHref + "" class="category-pill">" + escapeHtml(movie.category) + "</a>" +
      "<h3><a href="" + movie.href + "">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine) + "</p>" +
      "<div class="tag-row">" + tags + "</div>" +
      "<div class="movie-meta"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "</div>" +
      "</article>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function() {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function() {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function(dot) {
      dot.addEventListener("click", function() {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        play();
      });
    });
    if (prev) {
      prev.addEventListener("click", function() {
        show(index - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function() {
        show(index + 1);
        play();
      });
    }
    play();
  }

  function initFilters() {
    document.querySelectorAll("[data-filter-list]").forEach(function(list) {
      var panel = document.querySelector("[data-filter-panel]");
      if (!panel) {
        return;
      }
      var keyword = panel.querySelector("[data-filter-keyword]");
      var year = panel.querySelector("[data-filter-year]");
      var type = panel.querySelector("[data-filter-type]");
      var reset = panel.querySelector("[data-filter-reset]");
      var items = Array.prototype.slice.call(list.children);
      var empty = document.createElement("div");
      empty.className = "empty-message";
      empty.textContent = "没有找到匹配的影片。";
      var years = Array.from(new Set(items.map(function(item) {
        return item.getAttribute("data-year") || "";
      }).filter(Boolean))).sort(function(a, b) {
        return b.localeCompare(a);
      });
      var types = Array.from(new Set(items.map(function(item) {
        return item.getAttribute("data-type") || "";
      }).filter(Boolean))).sort();
      years.forEach(function(value) {
        year.appendChild(new Option(value, value));
      });
      types.forEach(function(value) {
        type.appendChild(new Option(value, value));
      });

      function apply() {
        var q = normalize(keyword.value);
        var selectedYear = year.value;
        var selectedType = type.value;
        var visible = 0;
        items.forEach(function(item) {
          var haystack = normalize([
            item.getAttribute("data-title"),
            item.getAttribute("data-year"),
            item.getAttribute("data-type"),
            item.getAttribute("data-genre"),
            item.getAttribute("data-region")
          ].join(" "));
          var ok = (!q || haystack.indexOf(q) >= 0) &&
            (!selectedYear || item.getAttribute("data-year") === selectedYear) &&
            (!selectedType || item.getAttribute("data-type") === selectedType);
          item.classList.toggle("is-filter-hidden", !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (!visible && !empty.parentNode) {
          list.appendChild(empty);
        }
        if (visible && empty.parentNode) {
          empty.parentNode.removeChild(empty);
        }
      }

      [keyword, year, type].forEach(function(control) {
        control.addEventListener("input", apply);
        control.addEventListener("change", apply);
      });
      reset.addEventListener("click", function() {
        keyword.value = "";
        year.value = "";
        type.value = "";
        apply();
      });
      apply();
    });
  }

  function initSearch() {
    var form = document.querySelector("[data-search-form]");
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    var status = document.querySelector("[data-search-status]");
    if (!form || !input || !results || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function render() {
      var q = normalize(input.value);
      var found = window.SEARCH_MOVIES.filter(function(movie) {
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" "));
        return !q || haystack.indexOf(q) >= 0;
      }).slice(0, 96);
      if (!q) {
        results.innerHTML = "";
        status.textContent = "输入关键词即可开始检索。";
        return;
      }
      if (!found.length) {
        results.innerHTML = "<div class="empty-message">没有找到匹配的影片。</div>";
        status.textContent = "可尝试更换片名、类型、地区或年份。";
        return;
      }
      results.innerHTML = found.map(createCard).join("");
      status.textContent = "已为你匹配相关影片。";
    }

    form.addEventListener("submit", function(event) {
      event.preventDefault();
      var url = new URL(window.location.href);
      url.searchParams.set("q", input.value);
      window.history.replaceState(null, "", url.toString());
      render();
    });
    input.addEventListener("input", render);
    render();
  }

  window.initMoviePlayer = function(videoId, overlayId, sourceUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    var mounted = false;
    var hls = null;
    if (!video || !sourceUrl) {
      return;
    }

    function mount() {
      if (mounted) {
        return;
      }
      mounted = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
    }

    function start() {
      mount();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      var result = video.play();
      if (result && result.catch) {
        result.catch(function() {
          if (overlay) {
            overlay.classList.remove("is-hidden");
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("click", function() {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", function() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
    video.addEventListener("ended", function() {
      if (overlay) {
        overlay.classList.remove("is-hidden");
      }
    });
    window.addEventListener("beforeunload", function() {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function() {
    initMenu();
    initHero();
    initFilters();
    initSearch();
  });
})();
