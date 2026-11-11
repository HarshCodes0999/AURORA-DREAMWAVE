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
    const slider = $("welcome-slider");
    const thumb = $("welcome-slider-thumb");
    const label = $("welcome-slider-label");

    if (!overlay || !slider || !thumb || !label) return;

    overlay.hidden = false;

    let dragging = false;
    let completed = false;
    let progress = 0;
    let maxTravel = 0;
    const completionThreshold = 0.96;

    function measureSlider() {
      maxTravel = Math.max(0, slider.clientWidth - thumb.offsetWidth - 10);
    }

    function updateSlider(value) {
      progress = Math.min(1, Math.max(0, value));
      slider.style.setProperty("--slide-progress", `${progress * 100}%`);
      slider.style.setProperty("--slide-offset", `${progress * maxTravel}px`);
      thumb.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
      thumb.setAttribute(
        "aria-valuetext",
        progress >= completionThreshold ? "Complete" : `${Math.round(progress * 100)} percent`
      );
    }

    function closeWelcome() {
      if (completed) return;
      completed = true;
      updateSlider(1);
      label.textContent = "Opening your soundspace…";
      thumb.disabled = true;

      try {
        localStorage.setItem("aurora_welcome_seen", "true");
      } catch {
        // Welcome can still close if storage is unavailable.
      }

      window.setTimeout(() => {
        overlay.hidden = true;
        showPage("home");
      }, 220);
    }

    function updateFromPointer(event) {
      if (!dragging || !maxTravel) return;

      const rect = slider.getBoundingClientRect();
      const thumbCenter = event.clientX - rect.left - 5 - thumb.offsetWidth / 2;
      updateSlider(thumbCenter / maxTravel);

      if (progress >= completionThreshold) {
        dragging = false;
        closeWelcome();
      }
    }

    thumb.addEventListener("pointerdown", event => {
      if (completed) return;
      measureSlider();
      dragging = true;
      thumb.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    thumb.addEventListener("pointermove", updateFromPointer);

    function stopDragging() {
      if (!dragging) return;
      dragging = false;
      if (!completed) updateSlider(0);
    }

    thumb.addEventListener("pointerup", stopDragging);
    thumb.addEventListener("pointercancel", stopDragging);
    thumb.addEventListener("lostpointercapture", stopDragging);

    thumb.addEventListener("keydown", event => {
      if (completed) return;

      if (event.key === "ArrowRight" || event.key === "End") {
        event.preventDefault();
        updateSlider(event.key === "End" ? 1 : progress + 0.12);

        if (progress >= completionThreshold) closeWelcome();
      } else if (event.key === "Home" || event.key === "ArrowLeft") {
        event.preventDefault();
        updateSlider(0);
      }
    });

    window.addEventListener("resize", () => {
      measureSlider();
      updateSlider(progress);
    });
    measureSlider();
    updateSlider(0);
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
