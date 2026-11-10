/* AURORA DREAMWAVE — Music Player Engine */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const elements = {
    url: $("youtube-url"),
    add: $("add-track-button"),
    title: $("current-title"),
    artist: $("current-artist"),
    play: $("play-button"),
    previous: $("previous-button"),
    next: $("next-button"),
    shuffle: $("shuffle-button"),
    repeat: $("repeat-button"),
    favorite: $("favorite-button"),
    progress: $("progress-bar"),
    currentTime: $("current-time"),
    duration: $("duration"),
    volume: $("volume-control"),
    library: $("library-list"),
    favorites: $("favorites-list"),
    recent: $("recent-list")
  };

  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  let library = read("aurora_library", []);
  let favorites = read("aurora_favorites", []);
  let recent = read("aurora_recent", []);
  let currentIndex = -1;
  let shuffle = false;
  let repeat = false;
  let seeking = false;

  function videoIdFrom(input) {
    const value = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
      return value;
    }

    try {
      const url = new URL(value);
      let id = "";

      if (url.hostname === "youtu.be" ||
          url.hostname.endsWith(".youtu.be")) {
        id = url.pathname.split("/").filter(Boolean)[0] || "";
      } else if (
        url.hostname === "youtube.com" ||
        url.hostname.endsWith(".youtube.com") ||
        url.hostname === "youtube-nocookie.com" ||
        url.hostname.endsWith(".youtube-nocookie.com")
      ) {
        id = url.searchParams.get("v") || "";

        if (!id) {
          const parts = url.pathname.split("/").filter(Boolean);
          if (["embed", "shorts", "live"].includes(parts[0])) {
            id = parts[1] || "";
          }
        }
      }

      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  }

  function notify(message) {
    let toast = $("aurora-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "aurora-toast";
      toast.className = "aurora-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  function currentTrack() {
    return library[currentIndex] || null;
  }

  function updateFavoriteButton() {
    const track = currentTrack();
    const active = track &&
      favorites.some(item => item.id === track.id);

    elements.favorite.textContent = active ? "♥" : "♡";
    elements.favorite.classList.toggle("active", !!active);
  }

  function updateNowPlaying() {
    const track = currentTrack();

    elements.title.textContent = track?.title || "Nothing playing";
    elements.artist.textContent = track
      ? "YouTube • AURORA DREAMWAVE"
      : "Choose your first track";

    updateFavoriteButton();
  }

  function renderList(container, tracks, emptyText) {
    if (!container) return;

    container.replaceChildren();

    if (!tracks.length) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    tracks.forEach(track => {
      const row = document.createElement("div");
      row.className = "track-row";

      const info = document.createElement("div");
      info.className = "track-row-info";

      const title = document.createElement("strong");
      title.textContent = track.title;

      const subtitle = document.createElement("span");
      subtitle.textContent = "YouTube";

      info.append(title, subtitle);

      const play = document.createElement("button");
      play.type = "button";
      play.textContent = "▶";
      play.setAttribute("aria-label", `Play ${track.title}`);
      play.addEventListener("click", () => playTrack(track.id));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${track.title}`);
      remove.addEventListener("click", () => removeTrack(track.id));

      row.append(info, play, remove);
      container.appendChild(row);
    });
  }

  function renderAll() {
    renderList(
      elements.library,
      library,
      "Your library is waiting for its first track."
    );

    renderList(
      elements.favorites,
      favorites,
      "Your favorite tracks will appear here."
    );

    renderList(
      elements.recent,
      recent,
      "Your listening history will appear here."
    );
  }

  function persist() {
    save("aurora_library", library);
    save("aurora_favorites", favorites);
    save("aurora_recent", recent);
  }

  function playTrack(id) {
    const index = library.findIndex(track => track.id === id);
    if (index < 0) return;

    currentIndex = index;
    const track = currentTrack();

    updateNowPlaying();

    recent = [
      track,
      ...recent.filter(item => item.id !== track.id)
    ].slice(0, 30);

    persist();
    renderAll();

    window.AuroraYouTube.load(track.id);
    elements.play.textContent = "Ⅱ";
  }

  function addTrack() {
    const raw = elements.url.value;
    const id = videoIdFrom(raw);

    if (!id) {
      notify("Please enter a valid YouTube URL or video ID.");
      return;
    }

    const existing = library.find(track => track.id === id);

    if (existing) {
      elements.url.value = "";
      playTrack(id);
      notify("Track already in your library.");
      return;
    }

    const track = {
      id,
      title: `YouTube Track ${library.length + 1}`,
      addedAt: Date.now()
    };

    library.push(track);
    elements.url.value = "";

    persist();
    renderAll();
    playTrack(id);

    notify("Track added to your library!");
  }

  function removeTrack(id) {
    const index = library.findIndex(track => track.id === id);
    if (index < 0) return;

    library.splice(index, 1);
    favorites = favorites.filter(track => track.id !== id);

    if (currentIndex === index) {
      currentIndex = -1;
      window.AuroraYouTube.pause();
      updateNowPlaying();
    } else if (currentIndex > index) {
      currentIndex--;
    }

    persist();
    renderAll();
  }

  function toggleFavorite() {
    const track = currentTrack();
    if (!track) return;

    const exists = favorites.some(item => item.id === track.id);

    favorites = exists
      ? favorites.filter(item => item.id !== track.id)
      : [...favorites, track];

    persist();
    renderAll();
    updateFavoriteButton();
  }

  function nextTrack() {
    if (!library.length) return;

    let next = currentIndex + 1;

    if (shuffle && library.length > 1) {
      do {
        next = Math.floor(Math.random() * library.length);
      } while (next === currentIndex);
    } else if (next >= library.length) {
      next = 0;
    }

    playTrack(library[next].id);
  }

  function previousTrack() {
    if (!library.length) return;

    const next = currentIndex <= 0
      ? library.length - 1
      : currentIndex - 1;

    playTrack(library[next].id);
  }

  elements.add?.addEventListener("click", addTrack);

  elements.url?.addEventListener("keydown", event => {
    if (event.key === "Enter") addTrack();
  });

  elements.play?.addEventListener("click", () => {
    if (!currentTrack()) {
      if (library.length) playTrack(library[0].id);
      else notify("Add a YouTube track first.");
      return;
    }

    window.AuroraYouTube.toggle();
  });

  elements.next?.addEventListener("click", nextTrack);
  elements.previous?.addEventListener("click", previousTrack);
  elements.favorite?.addEventListener("click", toggleFavorite);

  elements.shuffle?.addEventListener("click", () => {
    shuffle = !shuffle;
    elements.shuffle.classList.toggle("active", shuffle);
    notify(shuffle ? "Shuffle enabled" : "Shuffle disabled");
  });

  elements.repeat?.addEventListener("click", () => {
    repeat = !repeat;
    elements.repeat.classList.toggle("active", repeat);
    notify(repeat ? "Repeat enabled" : "Repeat disabled");
  });

  elements.volume?.addEventListener("input", event => {
    window.AuroraYouTube.setVolume(Number(event.target.value));
  });

  elements.progress?.addEventListener("input", () => {
    seeking = true;
  });

  elements.progress?.addEventListener("change", event => {
    const total = window.AuroraYouTube.duration();
    const value = Number(event.target.value);

    if (total > 0) {
      window.AuroraYouTube.seek(total * value / 100);
    }

    seeking = false;
  });

  document.addEventListener("aurora:youtube-state", event => {
    const state = event.detail.state;

    if (state === 1) {
      elements.play.textContent = "Ⅱ";
    } else if (state === 2 || state === 0) {
      elements.play.textContent = "▶";
    }

    if (state === 0) {
      if (repeat) {
        window.AuroraYouTube.load(currentTrack()?.id);
      } else {
        nextTrack();
      }
    }
  });

  document.addEventListener("aurora:youtube-error", () => {
    elements.play.textContent = "▶";
    notify("This video cannot be played. Try another video.");
  });

  window.setInterval(() => {
    const total = window.AuroraYouTube.duration();
    const current = window.AuroraYouTube.currentTime();

    if (!seeking && total > 0) {
      elements.progress.value = current / total * 100;
    }

    elements.currentTime.textContent = formatTime(current);
    elements.duration.textContent = formatTime(total);
  }, 500);

  window.AuroraPlayer = {
    addTrack,
    playTrack,
    nextTrack,
    previousTrack,
    getLibrary: () => [...library]
  };

  renderAll();
  updateNowPlaying();
})();
