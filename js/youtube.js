/* AURORA DREAMWAVE — YouTube Engine */

window.AuroraYouTube = (() => {
  let player = null;
  let apiReady = false;
  let pendingVideoId = null;
  let readyCallbacks = [];

  function onReady(callback) {
    if (apiReady && player) {
      callback(player);
    } else {
      readyCallbacks.push(callback);
    }
  }

  function initialize() {
    if (!window.YT || !YT.Player) return;

    player = new YT.Player("youtube-player", {
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          apiReady = true;

          player.setVolume(70);

          readyCallbacks.forEach(callback => callback(player));
          readyCallbacks = [];

          if (pendingVideoId) {
            const id = pendingVideoId;
            pendingVideoId = null;
            load(id);
          }

          document.dispatchEvent(
            new CustomEvent("aurora:youtube-ready")
          );
        },

        onStateChange: event => {
          document.dispatchEvent(
            new CustomEvent("aurora:youtube-state", {
              detail: { state: event.data }
            })
          );
        },

        onError: event => {
          document.dispatchEvent(
            new CustomEvent("aurora:youtube-error", {
              detail: { code: event.data }
            })
          );
        }
      }
    });
  }

  function load(videoId) {
    if (!videoId) return;

    if (!apiReady || !player) {
      pendingVideoId = videoId;
      return;
    }

    player.loadVideoById(videoId);
  }

  function play() {
    if (player && apiReady) player.playVideo();
  }

  function pause() {
    if (player && apiReady) player.pauseVideo();
  }

  function toggle() {
    if (!player || !apiReady) return;

    const state = player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
      pause();
    } else {
      play();
    }
  }

  function seek(seconds) {
    if (player && apiReady) player.seekTo(seconds, true);
  }

  function setVolume(value) {
    if (player && apiReady) {
      player.setVolume(Math.max(0, Math.min(100, value)));
    }
  }

  function currentTime() {
    return player && apiReady ? player.getCurrentTime() || 0 : 0;
  }

  function duration() {
    return player && apiReady ? player.getDuration() || 0 : 0;
  }

  function state() {
    return player && apiReady
      ? player.getPlayerState()
      : -1;
  }

  window.onYouTubeIframeAPIReady = initialize;

  return {
    onReady,
    load,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    currentTime,
    duration,
    state
  };
})();
