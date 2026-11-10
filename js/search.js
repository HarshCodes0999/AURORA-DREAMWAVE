/* AURORA DREAMWAVE — Music Search */

(() => {
  "use strict";

  const form = document.getElementById("music-search-form");
  const input = document.getElementById("music-search-input");
  const button = document.getElementById("music-search-button");
  const status = document.getElementById("search-status");
  const resultsContainer = document.getElementById("search-results");

  if (!form || !input || !resultsContainer) return;

  const cache = new Map();

  function setStatus(message) {
    status.textContent = message;
  }

  function renderResults(results) {
    resultsContainer.replaceChildren();

    if (!results.length) {
      setStatus("No results found. Try another song or artist.");
      return;
    }

    setStatus(`${results.length} results found`);

    results.forEach(track => {
      const card = document.createElement("article");
      card.className = "search-result-card";

      const image = document.createElement("img");
      image.className = "search-result-thumbnail";
      image.src = track.thumbnail;
      image.alt = "";
      image.loading = "lazy";

      const details = document.createElement("div");
      details.className = "search-result-info";

      const title = document.createElement("h3");
      title.textContent = track.title;

      const channel = document.createElement("p");
      channel.textContent = track.channelTitle;

      details.append(title, channel);

      const play = document.createElement("button");
      play.type = "button";
      play.className = "search-result-play";
      play.textContent = "▶";
      play.setAttribute("aria-label", `Play ${track.title}`);

      play.addEventListener("click", () => {
        if (!window.AuroraPlayer?.addSearchResult) {
          setStatus("Player is still loading. Try again.");
          return;
        }

        window.AuroraPlayer.addSearchResult(track);
      });

      card.append(image, details, play);
      resultsContainer.appendChild(card);
    });
  }

  async function searchMusic(query) {
    const normalized = query.trim().toLowerCase();

    if (normalized.length < 2) {
      setStatus("Please enter at least 2 characters.");
      return;
    }

    button.disabled = true;
    button.textContent = "Searching...";
    setStatus("Finding your music...");
    resultsContainer.replaceChildren();

    try {
      let results = cache.get(normalized);

      if (!results) {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Search failed.");
        }

        results = data.results || [];
        cache.set(normalized, results);
      }

      renderResults(results);
    } catch (error) {
      setStatus(error.message || "Something went wrong. Try again.");
    } finally {
      button.disabled = false;
      button.innerHTML = 'Search <span>⌕</span>';
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    searchMusic(input.value);
  });

  window.AuroraSearch = {
    focus() {
      input.focus();
    },
    search: searchMusic
  };
})();
