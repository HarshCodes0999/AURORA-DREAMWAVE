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
  }

  navItems.forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  $("explore-button")?.addEventListener("click", () => {
    const input = $("youtube-url");

    input?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    setTimeout(() => input?.focus(), 400);
  });

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
      description.textContent = "Add a YouTube video to begin listening.";

      card.append(symbol, heading, description);
      container.appendChild(card);
      return;
    }

    tracks.slice(-4).reverse().forEach(track => {
      const card = document.createElement("div");
      card.className = "featured-card";

      const artwork = document.createElement("div");
      artwork.className = "featured-art";
      artwork.textContent = "♫";

      const heading = document.createElement("h3");
      heading.textContent = track.title;

      const description = document.createElement("p");
      description.textContent = "YouTube • Your Library";

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

  // Keep featured tracks synchronized.
  const originalGetLibrary = window.AuroraPlayer?.getLibrary;

  if (originalGetLibrary) {
    renderFeatured();

    const observer = new MutationObserver(renderFeatured);
    const library = $("library-list");

    if (library) {
      observer.observe(library, {
        childList: true,
        subtree: true
      });
    }
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

  // Start application.
  showPage("home");
  renderFeatured();

  console.log("✦ AURORA DREAMWAVE initialized.");
})();
