/* ============================================
   VIDEO SOURCES — Yahan future mein HLS/multiple
   quality URLs daalenge. Abhi ek demo/test video hai.
   ============================================ */
const videoSources = {
  showreel: {
    poster: "",
    qualities: {
      "Auto": "https://pub-66ab9d6fa4d24e1cbadbe0b3f79ffa0c.r2.dev/video_20260512_143930.mp4"
      // Future example:
      // "1080p": "https://your-r2-url/showreel/1080p/master.m3u8",
      // "720p": "https://your-r2-url/showreel/720p/master.m3u8"
    }
  }
};

/* ===== NAVBAR: mobile toggle + active link ===== */
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  document.querySelectorAll(".nav-links a").forEach(link => {
    if (link.getAttribute("href") === window.location.pathname.split("/").pop() ||
        (window.location.pathname.endsWith("/") && link.getAttribute("href") === "index.html")) {
      link.classList.add("active");
    }
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });

  /* ===== Scroll reveal animation ===== */
  const revealEls = document.querySelectorAll(".section, .work-card");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  /* ===== Init player if present on page ===== */
  const playerEl = document.getElementById("showreel-player");
  if (playerEl) initPlayer(playerEl, videoSources.showreel);
});

/* ============================================
   CUSTOM VIDEO PLAYER
   ============================================ */
function initPlayer(wrapper, source) {
  const video = wrapper.querySelector(".player-video");
  const overlay = wrapper.querySelector(".player-overlay");
  const bigPlayBtn = wrapper.querySelector(".big-play-btn");
  const loading = wrapper.querySelector(".player-loading");
  const playPauseBtn = wrapper.querySelector(".play-pause-btn");
  const progressContainer = wrapper.querySelector(".progress-bar-container");
  const progressFilled = wrapper.querySelector(".progress-bar-filled");
  const progressBuffered = wrapper.querySelector(".progress-bar-buffered");
  const timeDisplay = wrapper.querySelector(".time-display");
  const volumeBtn = wrapper.querySelector(".volume-btn");
  const volumeSlider = wrapper.querySelector(".volume-slider");
  const settingsBtn = wrapper.querySelector(".settings-btn");
  const settingsMenu = wrapper.querySelector(".settings-menu");
  const fullscreenBtn = wrapper.querySelector(".fullscreen-btn");
  const speedIndicator = wrapper.querySelector(".speed-indicator");
  const controls = wrapper.querySelector(".player-controls");

  let currentQuality = Object.keys(source.qualities)[0];
  video.src = source.qualities[currentQuality];
  if (source.poster) video.poster = source.poster;

  let hideControlsTimer;
  let holdTimer;
  let isHolding = false;

  const formatTime = (t) => {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ---- Play / Pause ---- */
  function togglePlay() {
    if (video.paused) { video.play(); } else { video.pause(); }
  }

  overlay.addEventListener("click", togglePlay);
  playPauseBtn.addEventListener("click", togglePlay);

  video.addEventListener("play", () => {
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    playPauseBtn.textContent = "❚❚";
    wrapper.classList.remove("paused");
    resetHideControlsTimer();
  });

  video.addEventListener("pause", () => {
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    playPauseBtn.textContent = "▶";
    wrapper.classList.add("paused");
  });

  video.addEventListener("waiting", () => loading.style.display = "flex");
  video.addEventListener("playing", () => loading.style.display = "none");
  video.addEventListener("canplay", () => loading.style.display = "none");

  /* ---- Progress bar ---- */
  video.addEventListener("timeupdate", () => {
    const pct = (video.currentTime / video.duration) * 100 || 0;
    progressFilled.style.width = pct + "%";
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  video.addEventListener("progress", () => {
    if (video.buffered.length) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const pct = (bufferedEnd / video.duration) * 100 || 0;
      progressBuffered.style.width = pct + "%";
    }
  });

  progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  });

  /* ---- Volume ---- */
  volumeSlider.addEventListener("input", () => {
    video.volume = volumeSlider.value;
    video.muted = video.volume === 0;
    volumeBtn.textContent = video.muted ? "🔇" : "🔊";
  });

  volumeBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    volumeBtn.textContent = video.muted ? "🔇" : "🔊";
    volumeSlider.value = video.muted ? 0 : video.volume;
  });

  /* ---- Settings menu (speed + quality) ---- */
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle("open");
  });

  document.addEventListener("click", () => settingsMenu.classList.remove("open"));

  wrapper.querySelectorAll("[data-speed]").forEach(btn => {
    btn.addEventListener("click", () => {
      video.playbackRate = parseFloat(btn.dataset.speed);
      wrapper.querySelectorAll("[data-speed]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  wrapper.querySelectorAll("[data-quality]").forEach(btn => {
    btn.addEventListener("click", () => {
      const time = video.currentTime;
      const wasPlaying = !video.paused;
      currentQuality = btn.dataset.quality === "auto" ? Object.keys(source.qualities)[0] : btn.dataset.quality;
      video.src = source.qualities[currentQuality] || source.qualities[Object.keys(source.qualities)[0]];
      video.currentTime = time;
      if (wasPlaying) video.play();
      wrapper.querySelectorAll("[data-quality]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* ---- Fullscreen + orientation ---- */
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) {
          await wrapper.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen(); // iOS Safari fallback
        }
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      } else {
        document.exitFullscreen();
      }
    } catch (err) { console.log("Fullscreen not supported:", err); }
  });

  /* ---- Auto-hide controls ---- */
  function resetHideControlsTimer() {
    wrapper.classList.add("show-controls");
    clearTimeout(hideControlsTimer);
    hideControlsTimer = setTimeout(() => {
      if (!video.paused) wrapper.classList.remove("show-controls");
    }, 2800);
  }
  wrapper.addEventListener("mousemove", resetHideControlsTimer);
  wrapper.addEventListener("touchstart", resetHideControlsTimer);

  /* ---- Press-and-hold right side = 1.5x speed (fullscreen only) ---- */
  wrapper.addEventListener("pointerdown", (e) => {
    if (!document.fullscreenElement) return;
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) return; // only right half

    holdTimer = setTimeout(() => {
      isHolding = true;
      video.playbackRate = 1.5;
      speedIndicator.style.display = "flex";
      speedIndicator.textContent = "1.5x »»";
    }, 350);
  });

  function endHold() {
    clearTimeout(holdTimer);
    if (isHolding) {
      isHolding = false;
      video.playbackRate = 1;
      speedIndicator.style.display = "none";
    }
  }
  wrapper.addEventListener("pointerup", endHold);
  wrapper.addEventListener("pointerleave", endHold);
  wrapper.addEventListener("pointercancel", endHold);
}