/* AURORA DREAMWAVE — Add Music by YouTube URL */

(() => {
  "use strict";

  const form = document.getElementById("music-search-form");
  const input = document.getElementById("music-search-input");
  const button = document.getElementById("music-search-button");
  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");

  if (!form || !input || !button || !status || !results) return;

  function setStatus(message) {
    status.textContent = message;
  }

  function extractVideoId(value) {
    try {
      const url = new URL(value.trim());

      const allowedHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
        "www.youtu.be",
        "youtube-nocookie.com",
        "www.youtube-nocookie.com"
      ];

      if (!["https:", "http:"].includes(url.protocol)) return null;
      if (!allowedHosts.includes(url.hostname)) return null;

      let id = url.searchParams.get("v");

      if (!id && url.hostname.includes("youtu.be")) {
        id = url.pathname.split("/").filter(Boolean)[0];
      }

      if (!id) {
        const match = url.pathname.match(
          /^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/
        );
        if (match) id = match[1];
      }

      return /^[a-zA-Z0-9_-]{11}$/.test(id || "") ? id : null;
    } catch {
      return null;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const videoId = extractVideoId(input.value);

    if (!videoId) {
      setStatus("Please enter a valid YouTube video URL.");
      input.focus();
      return;
    }

    if (!window.AuroraPlayer?.addSearchResult) {
      setStatus("Player is loading. Please try again.");
      return;
    }

    button.disabled = true;
    button.textContent = "Adding...";
    setStatus("Getting track information...");
    results.replaceChildren();

    try {
      const response = await fetch(
        `/api/video?id=${encodeURIComponent(videoId)}`
      );

      if (!response.ok) {
        throw new Error("Could not retrieve video information.");
      }

      const track = await response.json();

      window.AuroraPlayer.addSearchResult(track);

      setStatus(
        track.title
          ? `Added and playing: ${track.title}`
          : "Track added. Starting playback..."
      );

      input.value = "";
    } catch (error) {
      setStatus(error.message || "Something went wrong.");
    } finally {
      button.disabled = false;
      button.innerHTML = 'Add & Play <span>♫</span>';
    }
  });

  window.AuroraSearch = {
    focus() {
      input.focus();
    }
  };
})();
