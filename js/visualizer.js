/* AURORA DREAMWAVE — Visualizer */

(() => {
  "use strict";

  const canvas = document.getElementById("visualizer");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let frame = 0;
  let playing = false;

  const bars = Array.from({ length: 48 }, (_, i) => ({
    phase: Math.random() * Math.PI * 2,
    speed: 0.015 + Math.random() * 0.025,
    height: 0.15 + Math.random() * 0.3,
    offset: i * 0.13
  }));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    if (!width || !height) return;

    const barWidth = width / bars.length;
    const center = height * 0.5;

    bars.forEach((bar, i) => {
      bar.phase += reducedMotion ? 0 : bar.speed;

      const wave = (
        Math.sin(bar.phase + bar.offset) +
        Math.sin(bar.phase * 0.65 + i * 0.2)
      ) / 2;

      const idleHeight = 3 + Math.abs(wave) * height * 0.17;
      const activeHeight = 5 + Math.abs(wave) * height * 0.38;

      const barHeight = playing ? activeHeight : idleHeight;
      const x = i * barWidth + barWidth * 0.2;

      const gradient = ctx.createLinearGradient(
        0, center - barHeight,
        0, center + barHeight
      );

      gradient.addColorStop(0, "rgba(166, 145, 255, 0.9)");
      gradient.addColorStop(0.5, "rgba(235, 190, 255, 0.95)");
      gradient.addColorStop(1, "rgba(116, 190, 255, 0.85)");

      ctx.fillStyle = gradient;

      const w = Math.max(2, barWidth * 0.55);
      const h = barHeight * (playing ? 1 : 0.55);

      ctx.beginPath();
      ctx.roundRect(
        x,
        center - h,
        w,
        h * 2,
        w / 2
      );
      ctx.fill();
    });

    frame = requestAnimationFrame(draw);
  }

  document.addEventListener("aurora:youtube-state", event => {
    playing = event.detail.state === 1;
  });

  document.addEventListener("aurora:youtube-error", () => {
    playing = false;
  });

  window.addEventListener("resize", resize);

  resize();
  draw();

  window.AuroraVisualizer = {
    setPlaying(value) {
      playing = Boolean(value);
    }
  };
})();
