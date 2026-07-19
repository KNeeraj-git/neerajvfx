/* ============================================
   VIDEO SOURCES (For Home Page Showreel)
============================================ */
const videoSources = {
    showreel: {
        poster: "",
        type: "single-mp4",
        sources: {
            "Auto": "https://pub-66ab9d6fa4d24e1cbadbe0b3f79ffa0c.r2.dev/video_20260512_143930.mp4"
        }
    }
};

/* ============================================
   UI & NAVBAR LOGIC
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    // Mobile Navbar Toggle
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("open");
        });
    }

    // Active Link Logic
    document.querySelectorAll(".nav-links a").forEach(link => {
        const linkPath = link.getAttribute("href");
        const currentPath = window.location.pathname.split("/").pop();
        
        if (linkPath === currentPath || (window.location.pathname.endsWith("/") && linkPath === "index.html")) {
            link.classList.add("active");
        }
        link.addEventListener("click", () => navLinks.classList.remove("open"));
    });

    // Scroll Reveal Animation
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

    // Initialize Home Page Player if it exists
    const playerEl = document.getElementById("showreel-player");
    if (playerEl) {
        Player.init(playerEl, videoSources.showreel);
    }
});

/* ============================================
   CUSTOM VIDEO PLAYER ENGINE V2.3 (FINAL HLS)
============================================ */
const Player = {
    hlsInstance: null, 

    load: function(videoConfig) {
        const wrapper = document.getElementById("project-player");
        if (!wrapper) return;
        this.init(wrapper, videoConfig);
    },

    init: function(wrapper, config) {
        // DOM Elements
        const video = wrapper.querySelector(".player-video");
        const overlay = wrapper.querySelector(".player-overlay");
        const controls = wrapper.querySelector(".player-controls");
        const loading = wrapper.querySelector(".player-loading");
        const speedIndicator = wrapper.querySelector(".speed-indicator");
        
        // Progress & Controls
        const progressContainer = wrapper.querySelector(".progress-bar-container");
        const progressBuffered = wrapper.querySelector(".progress-bar-buffered");
        const progressFilled = wrapper.querySelector(".progress-bar-filled");
        const playPauseBtn = wrapper.querySelector(".play-pause-btn");
        const timeDisplay = wrapper.querySelector(".time-display");
        const volumeBtn = wrapper.querySelector(".volume-btn");
        const volumeSlider = wrapper.querySelector(".volume-slider");
        const fullscreenBtn = wrapper.querySelector(".fullscreen-btn");

        // Premium Settings Menus
        const speedBoxBtn = wrapper.querySelector(".speed-box-btn");
        const speedMenu = wrapper.querySelector(".speed-menu");
        const qualityBoxBtn = wrapper.querySelector(".quality-box-btn");
        const qualityMenu = wrapper.querySelector(".quality-menu");

        // Validation
        if (!config || !config.sources || Object.keys(config.sources).length === 0) {
            console.error("❌ Player Error: No video sources provided.");
            if (loading) loading.style.display = "none";
            return;
        }

        // Clean up previous instances
        const existingIframe = wrapper.querySelector(".external-iframe");
        if (existingIframe) existingIframe.remove();
        if (this.hlsInstance) {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
        }

        // Base Setup
        video.style.display = "block";
        if (controls) controls.style.display = "block"; 
        if (overlay) overlay.style.display = "flex";
        video.addEventListener("contextmenu", (e) => e.preventDefault());

        const sourceKeys = Object.keys(config.sources);
        let currentQuality = sourceKeys[0]; 

        if (config.type === "multi-mp4" && config.sources["1080p"]) {
            currentQuality = "1080p";
        }

        const videoUrl = config.sources[currentQuality];

        /* ==========================================
           1. VIDEO SOURCE HANDLING
        ========================================== */

        if (config.type === "external") {
            const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
            const isVimeo = videoUrl.includes("vimeo.com");

            if (isYouTube || isVimeo) {
                video.style.display = "none";
                if (controls) controls.style.display = "none";
                if (overlay) overlay.style.display = "none";
                if (loading) loading.style.display = "none";

                let embedUrl = videoUrl;
                if (isYouTube) {
                    let ytId = "";
                    if (videoUrl.includes("watch?v=")) ytId = videoUrl.split("watch?v=")[1].split("&")[0];
                    else if (videoUrl.includes("youtu.be/")) ytId = videoUrl.split("youtu.be/")[1].split("?")[0];
                    embedUrl = `https://www.youtube.com/embed/${ytId}?rel=0`;
                } else if (isVimeo) {
                    const vimeoId = videoUrl.split("vimeo.com/")[1].split("?")[0];
                    embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
                }

                const iframe = document.createElement("iframe");
                iframe.className = "external-iframe";
                iframe.setAttribute("allowfullscreen", "true");
                iframe.src = embedUrl;
                wrapper.insertBefore(iframe, video);
                return; 
            } else {
                video.src = videoUrl;
                if (qualityBoxBtn) qualityBoxBtn.style.display = "none";
            }
        } 
        
        else if (config.type === "hls") {
            if (typeof Hls !== "undefined" && Hls.isSupported()) {
                this.hlsInstance = new Hls({
                    enableWorker: true,
                    maxBufferLength: 30,
                    startLevel: -1
                });

                this.hlsInstance.loadSource(videoUrl);
                this.hlsInstance.attachMedia(video);

                // Event listener for SWITCHED only (Removed SWITCHING for instant UI feedback)
                this.hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    const level = this.hlsInstance.levels[data.level];
                    if (level && qualityBoxBtn) {
                        const isAuto = this.hlsInstance.autoLevelEnabled;
                        // Backup check: Sirf tab update karo jab auto mode ON ho, taaki user click override na ho
                        if (isAuto) {
                            qualityBoxBtn.textContent = `Auto (${level.height}p)`;
                        }
                    }
                });

                this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    if (qualityMenu) {
                        let menuHTML = `<div class="settings-header"><span>Quality</span></div>`;
                        menuHTML += `<button class="settings-option active" data-quality="auto"><span>Auto</span></button>`;
                        
                        const levels = data.levels.map((level, index) => ({...level, originalIndex: index})).reverse();
                        
                        levels.forEach((level) => {
                            const height = level.height;
                            let badgeStr = "";
                            let displayTitle = height + "p";

                            if (height >= 720 && height < 1080) badgeStr = `<span class="q-badge">HD</span>`;
                            else if (height >= 1080 && height < 1440) badgeStr = `<span class="q-badge">Full HD</span>`;
                            else if (height >= 1440 && height < 2160) badgeStr = `<span class="q-badge">2K</span>`;
                            else if (height >= 2160) {
                                badgeStr = `<span class="q-badge q-4k">4K</span>`;
                                displayTitle = "2160p";
                            }
                            
                            menuHTML += `<button class="settings-option" data-hls-level="${level.originalIndex}">
                                            <span>${displayTitle} ${badgeStr}</span>
                                         </button>`;
                        });
                        qualityMenu.innerHTML = menuHTML;
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = videoUrl;
            }
        } 
        
        else {
            video.src = videoUrl;
        }

        if (config.poster) video.poster = config.poster;


        /* ==========================================
           2. DYNAMIC QUALITY MENU GENERATION
        ========================================== */
        if (qualityMenu && config.type !== "external") {
            let menuHTML = `<div class="settings-header"><span>Quality</span></div>`;
            
            if (config.type === "single-mp4") {
                menuHTML += `<button class="settings-option" style="opacity:0.6; cursor:default;" disabled><span>Auto (Single Source)</span></button>`;
                if (qualityBoxBtn) {
                    qualityBoxBtn.textContent = "Auto";
                    qualityBoxBtn.style.display = "flex";
                }
                qualityMenu.innerHTML = menuHTML;
            } else if (config.type === "hls") {
                menuHTML += `<button class="settings-option active" data-quality="auto"><span>Auto</span></button>`;
                if (qualityBoxBtn) {
                    qualityBoxBtn.textContent = "Auto";
                    qualityBoxBtn.style.display = "flex";
                }
                qualityMenu.innerHTML = menuHTML;
            } else {
                sourceKeys.forEach((quality) => {
                    const isActive = (quality === currentQuality) ? "active" : "";
                    let badgeStr = "";
                    let displayTitle = quality;

                    if (quality.includes("720")) badgeStr = `<span class="q-badge">HD</span>`;
                    else if (quality.includes("1080")) badgeStr = `<span class="q-badge">Full HD</span>`;
                    else if (quality.includes("1440")) badgeStr = `<span class="q-badge">2K</span>`;
                    else if (quality.includes("4K") || quality.includes("2160")) {
                        badgeStr = `<span class="q-badge q-4k">4K</span>`;
                        displayTitle = "2160p";
                    }

                    menuHTML += `<button class="settings-option ${isActive}" data-quality="${quality}">
                                    <span>${displayTitle} ${badgeStr}</span>
                                 </button>`;
                });
                
                if (qualityBoxBtn) {
                    let initialQ = currentQuality.includes("4K") || currentQuality.includes("2160") ? "2160p" : currentQuality;
                    qualityBoxBtn.textContent = initialQ;
                    qualityBoxBtn.style.display = "flex";
                }
                qualityMenu.innerHTML = menuHTML;
            }
        }

        /* ==========================================
           3. CORE PLAYER FUNCTIONALITY
        ========================================== */
        video.addEventListener("loadedmetadata", updateTime);
        
        let hideControlsTimer;
        let holdTimer;
        let isHolding = false;

        function formatTime(seconds) {
            if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${String(s).padStart(2, "0")}`;
        }

        function updateTime() {
            if (timeDisplay) {
                const durationText = (video.duration && isFinite(video.duration)) ? formatTime(video.duration) : "Live";
                timeDisplay.textContent = `${formatTime(video.currentTime)} / ${durationText}`;
            }
        }

        function togglePlayback() {
            video.paused ? video.play() : video.pause();
        }

        if (overlay) overlay.addEventListener("click", togglePlayback);
        if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlayback);

        video.addEventListener("play", () => {
            if (overlay) {
                overlay.style.opacity = "0";
                overlay.style.pointerEvents = "none";
            }
            if (playPauseBtn) playPauseBtn.innerHTML = "❚❚";
            wrapper.classList.remove("paused");
            showControls();
        });

        video.addEventListener("pause", () => {
            if (overlay) {
                overlay.style.opacity = "1";
                overlay.style.pointerEvents = "auto";
            }
            if (playPauseBtn) playPauseBtn.innerHTML = "▶";
            wrapper.classList.add("paused");
        });

        video.addEventListener("waiting", () => { if (loading) loading.style.display = "flex"; });
        video.addEventListener("playing", () => { if (loading) loading.style.display = "none"; });
        video.addEventListener("canplay", () => { if (loading) loading.style.display = "none"; });

        video.addEventListener("timeupdate", () => {
            updateTime();
            if (progressFilled) {
                let duration = video.duration;
                if (duration && isFinite(duration) && duration > 0) {
                    progressFilled.style.width = ((video.currentTime / duration) * 100) + "%";
                } else {
                    progressFilled.style.width = "0%";
                }
            }
        });

        video.addEventListener("progress", () => {
            if (!video.buffered.length || !progressBuffered) return;
            const buffered = video.buffered.end(video.buffered.length - 1);
            if (video.duration && isFinite(video.duration) && video.duration > 0) {
                progressBuffered.style.width = ((buffered / video.duration) * 100) + "%";
            }
        });

        if (progressContainer) {
            progressContainer.addEventListener("click", (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (video.duration && isFinite(video.duration)) {
                    video.currentTime = percent * video.duration;
                }
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener("input", () => {
                video.volume = volumeSlider.value;
                video.muted = false;
                if (volumeBtn) volumeBtn.innerHTML = video.volume === 0 ? "🔇" : "🔊";
            });
        }

        if (volumeBtn) {
            volumeBtn.addEventListener("click", () => {
                video.muted = !video.muted;
                volumeBtn.innerHTML = video.muted ? "🔇" : "🔊";
                if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
            });
        }

        /* ==========================================
           4. SETTINGS MENUS (Speed & Quality)
        ========================================== */
        function closeAllMenus() {
            if (speedMenu) speedMenu.classList.remove("show");
            if (qualityMenu) qualityMenu.classList.remove("show");
        }

        if (speedBoxBtn && speedMenu) {
            speedBoxBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = speedMenu.classList.contains("show");
                closeAllMenus();
                if (!isOpen) speedMenu.classList.add("show");
            });
        }

        if (qualityBoxBtn && qualityMenu) {
            qualityBoxBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = qualityMenu.classList.contains("show");
                closeAllMenus();
                if (!isOpen) qualityMenu.classList.add("show");
            });
        }

        document.addEventListener("click", closeAllMenus);
        if (speedMenu) speedMenu.addEventListener("click", e => e.stopPropagation());

        wrapper.querySelectorAll("[data-speed]").forEach(btn => {
            btn.addEventListener("click", () => {
                video.playbackRate = parseFloat(btn.dataset.speed);
                wrapper.querySelectorAll("[data-speed]").forEach(item => item.classList.remove("active"));
                btn.classList.add("active");
                if (speedBoxBtn) {
                    speedBoxBtn.textContent = btn.dataset.speed + "x";
                }
                closeAllMenus();
            });
        });

        if (qualityMenu) {
            qualityMenu.addEventListener("click", (e) => {
                e.stopPropagation();
                const btn = e.target.closest(".settings-option");
                if (!btn || btn.disabled) return;

                const isAuto = btn.dataset.quality === "auto";

                qualityMenu.querySelectorAll(".settings-option").forEach(item => item.classList.remove("active"));
                btn.classList.add("active");

                if (config.type === "hls" && Player.hlsInstance) {
                    if (isAuto) {
                        Player.hlsInstance.nextLevel = -1;
                        if (qualityBoxBtn) qualityBoxBtn.textContent = "Auto"; // Instant UI Update
                    } else {
                        Player.hlsInstance.nextLevel = parseInt(btn.dataset.hlsLevel);
                        // Instant UI Update so user doesn't wait
                        let spanText = btn.querySelector("span").textContent.replace(/HD|Full HD|2K|4K/g, "").trim();
                        if (qualityBoxBtn) qualityBoxBtn.textContent = spanText;
                    }
                    closeAllMenus();
                    return;
                }

                if (config.type === "multi-mp4") {
                    let selectedQuality = btn.dataset.quality;
                    if (!selectedQuality || selectedQuality === currentQuality) {
                        closeAllMenus();
                        return; 
                    }

                    const wasPlaying = !video.paused;
                    const currentTime = video.currentTime;

                    if (config.sources[selectedQuality]) {
                        currentQuality = selectedQuality;
                        video.src = config.sources[currentQuality];
                        video.currentTime = currentTime;
                        if (wasPlaying) video.play();
                    }
                    
                    if (qualityBoxBtn) {
                        let qText = selectedQuality.includes("4K") || selectedQuality.includes("2160") ? "2160p" : selectedQuality;
                        qualityBoxBtn.textContent = qText;
                    }
                    closeAllMenus();
                }
            });
        }

        /* ==========================================
           5. ADVANCED CONTROLS
        ========================================== */
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener("click", async () => {
                try {
                    if (!document.fullscreenElement) {
                        if (wrapper.requestFullscreen) await wrapper.requestFullscreen();
                        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
                        if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
                    } else {
                        await document.exitFullscreen();
                    }
                } catch (err) { console.log(err); }
            });
        }

        function showControls() {
            wrapper.classList.add("show-controls");
            clearTimeout(hideControlsTimer);
            if (!video.paused) {
                hideControlsTimer = setTimeout(() => {
                    wrapper.classList.remove("show-controls");
                    closeAllMenus(); 
                }, 2500);
            }
        }

        wrapper.addEventListener("mousemove", showControls);
        wrapper.addEventListener("touchstart", showControls);

        wrapper.addEventListener("pointerdown", (e) => {
            if (!document.fullscreenElement) return;
            const rect = wrapper.getBoundingClientRect();
            if ((e.clientX - rect.left) < rect.width / 2) return;

            holdTimer = setTimeout(() => {
                isHolding = true;
                video.playbackRate = 1.5;
                if(speedIndicator) {
                    speedIndicator.textContent = "1.5× Speed";
                    speedIndicator.style.display = "flex";
                }
            }, 300);
        });

        function stopHold() {
            clearTimeout(holdTimer);
            if (!isHolding) return;
            isHolding = false;
            video.playbackRate = parseFloat(
                wrapper.querySelector("[data-speed].active")?.dataset.speed || 1
            );
            if(speedIndicator) speedIndicator.style.display = "none";
        }

        wrapper.addEventListener("pointerup", stopHold);
        wrapper.addEventListener("pointerleave", stopHold);
        wrapper.addEventListener("pointercancel", stopHold);

        document.addEventListener("keydown", (e) => {
            const tag = document.activeElement.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea") return;

            switch (e.code) {
                case "Space":
                case "KeyK":
                    e.preventDefault(); togglePlayback(); break;
                case "ArrowRight":
                case "KeyL":
                    e.preventDefault();
                    if (video.duration && isFinite(video.duration)) video.currentTime = Math.min(video.currentTime + 5, video.duration);
                    break;
                case "ArrowLeft":
                case "KeyJ":
                    e.preventDefault();
                    video.currentTime = Math.max(video.currentTime - 5, 0); break;
                case "ArrowUp":
                    e.preventDefault();
                    video.volume = Math.min(video.volume + 0.05, 1);
                    if (volumeSlider) volumeSlider.value = video.volume;
                    video.muted = false;
                    if (volumeBtn) volumeBtn.innerHTML = "🔊";
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    video.volume = Math.max(video.volume - 0.05, 0);
                    if (volumeSlider) volumeSlider.value = video.volume;
                    if (video.volume === 0) { video.muted = true; if (volumeBtn) volumeBtn.innerHTML = "🔇"; }
                    break;
                case "KeyM":
                    video.muted = !video.muted;
                    if (volumeBtn) volumeBtn.innerHTML = video.muted ? "🔇" : "🔊"; 
                    if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
                    break;
                case "KeyF":
                    if (fullscreenBtn) fullscreenBtn.click(); break;
            }
            showControls();
        });

        updateTime();
        showControls();
    }
};