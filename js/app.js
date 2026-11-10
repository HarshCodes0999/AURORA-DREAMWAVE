/* AURORA DREAMWAVE — Main Application */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const navItems = document.querySelectorAll(".nav-item");

  const pages = {
    home: $("home-page"),
    search: $("search-page"),
    library: $("library-page"),
    favorites: $("favorites-page"),
    recent: $("recent-page")
  };

  function focusSearch() {
    window.setTimeout(() => {
      window.AuroraSearch?.focus();
    }, 350);
  }

  function showPage(pageName) {
    if (!pages[pageName]) return;

    Object.entries(pages).forEach(([name, page]) => {
      page.classList.toggle("active", name === pageName);
    });

    navItems.forEach(button => {
      const active = button.dataset.page === pageName;
      button.classList.toggle("active", active);

      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    document.querySelector(".main-content")
      ?.scrollTo({ top: 0, behavior: "smooth" });

    if (pageName === "search") focusSearch();
  }

  navItems.forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  function openSearch() {
    showPage("search");
  }

  $("explore-button")?.addEventListener("click", openSearch);
  $("home-search-button")?.addEventListener("click", openSearch);

  function renderFeatured() {
    const container = $("featured-grid");
    const tracks = window.AuroraPlayer?.getLibrary() || [];

    if (!container) return;

    container.replaceChildren();

    if (!tracks.length) {
      const card = document.createElement("div");
      card.className = "empty-card";

      const symbol = document.createElement("span");
      symbol.textContent = "♫";

      const heading = document.createElement("h3");
      heading.textContent = "Your sound journey starts here";

      const description = document.createElement("p");
      description.textContent = "Discover a song and build your personal library.";

      card.append(symbol, heading, description);
      container.appendChild(card);
      return;
    }

    tracks.slice(-4).reverse().forEach(track => {
      const card = document.createElement("div");
      card.className = "featured-card";

      const artwork = document.createElement("div");
      artwork.className = "featured-art";

      if (track.thumbnail) {
        const image = document.createElement("img");
        image.src = track.thumbnail;
        image.alt = "";
        image.loading = "lazy";
        artwork.appendChild(image);
      } else {
        artwork.textContent = "♫";
      }

      const heading = document.createElement("h3");
      heading.textContent = track.title;

      const description = document.createElement("p");
      description.textContent = track.channelTitle || "YouTube";

      const button = document.createElement("button");
      button.className = "primary-button";
      button.textContent = "Play ▶";

      button.addEventListener("click", () => {
        window.AuroraPlayer?.playTrack(track.id);
      });

      card.append(artwork, heading, description, button);
      container.appendChild(card);
    });
  }

  document.addEventListener("aurora:library-updated", renderFeatured);

  function setupWelcome() {
    const overlay = $("welcome-overlay");
    const startButton = $("welcome-start-button");
    const skipButton = $("welcome-skip-button");

    if (!overlay) return;

    let alreadySeen = false;

    try {
      alreadySeen = localStorage.getItem("aurora_welcome_seen") === "true";
    } catch {
      alreadySeen = false;
    }

    if (!alreadySeen) {
      overlay.hidden = false;
    }

    function closeWelcome(goToSearch) {
      overlay.hidden = true;

      try {
        localStorage.setItem("aurora_welcome_seen", "true");
      } catch {
        // Continue even if browser storage is unavailable.
      }

      if (goToSearch) openSearch();
    }

    startButton?.addEventListener("click", () => {
      closeWelcome(true);
    });

    skipButton?.addEventListener("click", () => {
      closeWelcome(false);
    });
  }

  // Keyboard shortcuts.
  document.addEventListener("keydown", event => {
    const target = event.target;
    const typing = target.matches("input, textarea, select");

    if (typing || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      $("play-button")?.click();
    }

    if (event.code === "ArrowRight") {
      $("next-button")?.click();
    }

    if (event.code === "ArrowLeft") {
      $("previous-button")?.click();
    }
  });

  showPage("home");
  renderFeatured();
  setupWelcome();

  console.log("✦ AURORA DREAMWAVE initialized.");
})();
