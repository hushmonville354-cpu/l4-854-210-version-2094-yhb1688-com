(function () {
  function loadHls(done) {
    if (window.Hls) {
      done();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1';
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  function setMessage(shell, text) {
    var message = shell.querySelector('[data-player-message]');
    if (message) {
      message.textContent = text || '';
    }
  }

  function playVideo(shell) {
    if (shell.getAttribute('data-ready') === '1') {
      var activeVideo = shell.querySelector('video');
      if (activeVideo) {
        activeVideo.play().catch(function () {});
      }
      return;
    }

    var video = shell.querySelector('video');
    if (!video) {
      return;
    }

    var stream = video.getAttribute('data-stream');
    if (!stream) {
      setMessage(shell, '视频暂时无法加载，请稍后重试');
      return;
    }

    shell.classList.add('is-active');
    shell.setAttribute('data-ready', '1');
    setMessage(shell, '正在加载视频');

    function start() {
      video.play().then(function () {
        setMessage(shell, '');
      }).catch(function () {
        setMessage(shell, '点击视频继续播放');
      });
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      start();
      return;
    }

    loadHls(function () {
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, start);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage(shell, '视频暂时无法加载，请稍后重试');
          }
        });
      } else {
        video.src = stream;
        start();
      }
    });
  }

  document.querySelectorAll('[data-player]').forEach(function (shell) {
    shell.addEventListener('click', function () {
      playVideo(shell);
    });
    var button = shell.querySelector('[data-play-button]');
    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        playVideo(shell);
      });
    }
  });
})();
