import { H as Hls } from './hls-vendor.js';

function bindPlayer(card) {
  var video = card.querySelector('.movie-player');
  var button = card.querySelector('.player-overlay');
  var stream = card.getAttribute('data-stream');
  var started = false;

  if (!video || !button || !stream) {
    return;
  }

  function load() {
    if (started) {
      return Promise.resolve();
    }

    started = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      return Promise.resolve();
    }

    if (Hls && Hls.isSupported()) {
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
      return new Promise(function (resolve) {
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
        window.setTimeout(resolve, 1200);
      });
    }

    video.src = stream;
    return Promise.resolve();
  }

  function play() {
    load().then(function () {
      card.classList.add('playing');
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          card.classList.remove('playing');
        });
      }
    });
  }

  button.addEventListener('click', play);
  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    }
  });
  video.addEventListener('play', function () {
    card.classList.add('playing');
  });
}

document.querySelectorAll('.player-card').forEach(bindPlayer);
