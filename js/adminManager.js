/*
====================================
Neeraj VFX CMS
Admin Manager v7.1 (Home Showreel Icon Update)
====================================
*/

class AdminManager {

    constructor() {
        this.content = document.getElementById("admin-content");
        this.menuButtons = document.querySelectorAll(".menu-btn");
        this.currentPage = "";
        this.editingProjectId = null;
        this.slugManuallyEdited = false;
        this.searchTerm = "";

        // Thumbnail State Management
        this.thumbSourceType = "upload";
        this.thumbFile = null;
        this.isThumbValid = false;
        this.currentThumbUrl = "";

        // Predefined VFX Industry Tags
        this.availableTags = [
            "CGI Compositing", "Compositing", "Paint & Prep", "Rotoscoping", 
            "Matchmove", "Camera Tracking", "Object Tracking", "Keying", 
            "Set Extension", "Look Development", "FX Integration", "3D Integration", 
            "Projection", "Environment Extension", "Beauty Work"
        ];

        this.init();
    }

    async init() {
        await dataManager.loadProjects();
        this.bindMenu();
        this.loadPage("Admin/dashboard.html");
    }

    bindMenu() {
        this.menuButtons.forEach((button) => {
            button.addEventListener("click", () => {
                this.setActiveMenu(button);
                const page = button.textContent.trim();
                switch (page) {
                    case "Dashboard": this.loadPage("Admin/dashboard.html"); break;
                    case "Add Project": 
                        this.editingProjectId = null;
                        this.loadPage("Admin/add-project.html"); 
                        break;
                    case "All Projects":
                        this.searchTerm = "";
                        this.loadPage("Admin/all-projects.html");
                        break;
                    case "Import / Export": this.loadPage("Admin/import-export.html"); break;
                    case "Settings": this.loadPage("Admin/settings.html"); break;
                }
            });
        });
    }

    setActiveMenu(activeButton) {
        this.menuButtons.forEach(btn => btn.classList.remove("active"));
        if (activeButton) activeButton.classList.add("active");
    }

    async loadPage(file) {
        try {
            const response = await fetch(file);
            const html = await response.text();
            this.content.innerHTML = html;
            this.currentPage = file;
            this.afterPageLoad();
        } catch (error) {
            console.error(error);
            this.content.innerHTML = `<h2>Page Load Error</h2><p>${file} not found.</p>`;
        }
    }

    afterPageLoad() {
        if (this.currentPage.includes("add-project")) {
            this.slugManuallyEdited = false;
            
            // Reset state
            this.thumbSourceType = "upload";
            this.thumbFile = null;
            this.isThumbValid = false;
            this.currentThumbUrl = "";

            this.setupSlugAutoGenerate();
            this.setupTagsSystem(); 
            this.setupThumbnailUI();
            this.setupVideoFields();
            this.setupSaveProject();

            if (this.editingProjectId) {
                this.prefillProjectForm(this.editingProjectId);
            }
        }
        if (this.currentPage.includes("dashboard")) {
            this.updateDashboard();
        }
        if (this.currentPage.includes("all-projects")) {
            this.setupSearch();
            this.renderAllProjects();
        }
        if (this.currentPage.includes("import-export")) {
            this.setupImportExport();
        }
    }

    /* ---------- SLUG ---------- */
    slugify(text) {
        return text.toString().toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-");
    }

    setupSlugAutoGenerate() {
        const titleInput = document.getElementById("project-title");
        const slugInput = document.getElementById("project-slug");
        if (!titleInput || !slugInput) return;

        slugInput.addEventListener("input", () => { this.slugManuallyEdited = true; });
        titleInput.addEventListener("input", () => {
            if (!this.slugManuallyEdited && !this.editingProjectId) {
                slugInput.value = this.slugify(titleInput.value);
            }
        });
    }

    /* ---------- TAGS SYSTEM ---------- */
    setupTagsSystem(selectedTags = []) {
        const container = document.getElementById("tags-container");
        if (!container) return;

        container.innerHTML = "";
        
        this.availableTags.forEach(tag => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tag-btn";
            btn.textContent = tag;
            btn.dataset.tag = tag;
            
            if (selectedTags.includes(tag)) {
                btn.classList.add("active");
            }

            btn.addEventListener("click", () => {
                btn.classList.toggle("active");
            });

            container.appendChild(btn);
        });
    }

    getSelectedTags() {
        const container = document.getElementById("tags-container");
        if (!container) return [];
        
        const activeBtns = container.querySelectorAll(".tag-btn.active");
        return Array.from(activeBtns).map(btn => btn.dataset.tag);
    }

    /* ---------- THUMBNAIL UI & LOGIC ---------- */
    setupThumbnailUI() {
        const tabs = document.querySelectorAll(".thumb-tab");
        const panels = document.querySelectorAll(".thumb-panel");
        const fileInput = document.getElementById("thumbnail-file");
        const urlInput = document.getElementById("thumbnail-url");

        tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                tabs.forEach(t => t.classList.remove("active"));
                panels.forEach(p => p.classList.remove("active"));
                
                tab.classList.add("active");
                this.thumbSourceType = tab.dataset.target;
                document.getElementById(`thumb-panel-${this.thumbSourceType}`).classList.add("active");
                
                if (this.thumbSourceType === "upload" && this.thumbFile) {
                    this.loadImagePreview(URL.createObjectURL(this.thumbFile));
                } else if (this.thumbSourceType === "url" && urlInput.value.trim()) {
                    this.loadImagePreview(urlInput.value.trim());
                } else if (this.currentThumbUrl && this.editingProjectId) {
                    this.loadImagePreview(this.currentThumbUrl); 
                } else {
                    this.clearPreview();
                }
            });
        });

        urlInput.addEventListener("input", (e) => {
            const url = e.target.value.trim();
            if (url) this.loadImagePreview(url);
            else this.clearPreview();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                this.thumbFile = file;
                this.loadImagePreview(URL.createObjectURL(file));
            } else {
                this.thumbFile = null;
                this.clearPreview();
            }
        });
    }

    loadImagePreview(url) {
        const previewImg = document.getElementById("thumb-preview-img");
        const placeholder = document.getElementById("thumb-placeholder");
        
        previewImg.onload = () => {
            previewImg.style.display = "block";
            if (placeholder) placeholder.style.display = "none";
            this.isThumbValid = true;
        };
        previewImg.onerror = () => {
            this.clearPreview();
        };
        previewImg.src = url;
    }

    clearPreview() {
        const previewImg = document.getElementById("thumb-preview-img");
        const placeholder = document.getElementById("thumb-placeholder");
        
        previewImg.src = "";
        previewImg.style.display = "none";
        if (placeholder) placeholder.style.display = "block";
        this.isThumbValid = false;
    }

    async uploadFileToStorage(file) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const fakeCDNUrl = `https://cdn.neerajvfx.com/uploads/${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
                resolve(fakeCDNUrl);
            }, 800);
        });
    }

    /* ---------- VIDEO FIELDS ---------- */
    setupVideoFields() {
        const select = document.getElementById("video-type");
        const container = document.getElementById("video-fields");
        if (!select || !container) return;

        const render = () => {
            let html = "";
            switch (select.value) {
                case "single-mp4":
                    html = `<div class="form-group"><label>Video URL (.mp4)</label><input type="text" class="vid-input" placeholder="video.mp4"></div>`;
                    break;
                case "multi-mp4":
                    html = `
                    <div class="form-group"><label>720p URL</label><input type="text" class="vid-input" data-quality="720p"></div>
                    <div class="form-group"><label>1080p URL</label><input type="text" class="vid-input" data-quality="1080p"></div>
                    <div class="form-group"><label>1440p URL</label><input type="text" class="vid-input" data-quality="1440p"></div>
                    <div class="form-group"><label>4K URL</label><input type="text" class="vid-input" data-quality="4K"></div>`;
                    break;
                case "hls":
                    html = `<div class="form-group"><label>Master Playlist (.m3u8)</label><input type="text" class="vid-input" placeholder="master.m3u8"></div>`;
                    break;
                case "external":
                    html = `<div class="form-group"><label>External Video URL</label><input type="text" class="vid-input" placeholder="https://"></div>`;
                    break;
            }
            container.innerHTML = html;
        };
        render();
        select.addEventListener("change", render);
    }

    collectVideoSources(videoType) {
        const inputs = document.querySelectorAll(".vid-input");
        const sources = {};
        if (videoType === "single-mp4" || videoType === "hls" || videoType === "external") {
            if (inputs[0] && inputs[0].value.trim()) sources["Auto"] = inputs[0].value.trim();
        } else if (videoType === "multi-mp4") {
            inputs.forEach(input => {
                if (input.value.trim()) sources[input.dataset.quality] = input.value.trim();
            });
        }
        return sources;
    }

    fillVideoSources(videoType, sources) {
        if (!sources) return;
        const inputs = document.querySelectorAll(".vid-input");
        if (videoType === "single-mp4" || videoType === "hls" || videoType === "external") {
            if (inputs[0] && sources["Auto"]) inputs[0].value = sources["Auto"];
        } else if (videoType === "multi-mp4") {
            inputs.forEach(input => {
                if (sources[input.dataset.quality]) input.value = sources[input.dataset.quality];
            });
        }
    }

    /* ---------- SAVE PROJECT ---------- */
    setupSaveProject() {
        const saveBtn = document.getElementById("save-project");
        if (!saveBtn) return;

        saveBtn.textContent = this.editingProjectId ? "Update Project" : "Save Project";

        saveBtn.onclick = async (e) => {
            e.preventDefault();

            const title = document.getElementById("project-title").value.trim();
            const slug = document.getElementById("project-slug").value.trim();
            const tags = this.getSelectedTags(); 
            const overview = document.getElementById("project-overview").value.trim();
            const videoType = document.getElementById("video-type").value;
            const statusEl = document.getElementById("project-status");
            const featuredEl = document.getElementById("project-featured");
            const showreelEl = document.getElementById("project-showreel"); // Checkbox reference

            if (!title) { alert("Project Title is required."); return; }
            if (!slug) { alert("Project Slug is required."); return; }
            if (tags.length === 0) { alert("Please select at least one Tag."); return; }

            if (dataManager.isSlugTaken(slug, this.editingProjectId)) {
                alert(`Slug "${slug}" is already in use. Please choose another.`);
                return;
            }

            if (!this.isThumbValid) {
                alert("Thumbnail Image load nahi ho payi. Please check file or URL.");
                return;
            }

            const videoSources = this.collectVideoSources(videoType);
            if (Object.keys(videoSources).length === 0) {
                alert("Kam se kam ek video URL daalna zaroori hai.");
                return;
            }

            let finalThumbnailUrl = this.currentThumbUrl;

            if (this.thumbSourceType === "url") {
                finalThumbnailUrl = document.getElementById("thumbnail-url").value.trim();
            } else if (this.thumbSourceType === "upload" && this.thumbFile) {
                saveBtn.textContent = "Processing Image...";
                saveBtn.disabled = true;
                
                try {
                    finalThumbnailUrl = await this.uploadFileToStorage(this.thumbFile);
                } catch (err) {
                    alert("Upload failed! Server error.");
                    saveBtn.disabled = false;
                    saveBtn.textContent = this.editingProjectId ? "Update Project" : "Save Project";
                    return;
                }
            }

            // SMART LOGIC: Agar is project ko showreel banaya hai, to baaki sab se flag hata do
            const isHomeShowreel = showreelEl ? showreelEl.checked : false;
            if (isHomeShowreel) {
                dataManager.projects.forEach(p => p.isHomeShowreel = false);
            }

            const project = {
                title, slug, tags, overview,
                thumbnail: finalThumbnailUrl, 
                status: statusEl ? statusEl.value : "draft",
                featured: featuredEl ? featuredEl.checked : false,
                isHomeShowreel: isHomeShowreel,
                video: { type: videoType, sources: videoSources }
            };

            if (this.editingProjectId) {
                dataManager.updateProject(this.editingProjectId, project);
                alert("Project updated successfully.");
                this.editingProjectId = null;
            } else {
                dataManager.addProject(project);
                alert("Project saved successfully.");
            }

            this.setActiveMenu(this.menuButtons[0]);
            this.loadPage("Admin/dashboard.html");
        };
    }

    /* ---------- PREFILL (EDIT MODE) ---------- */
    prefillProjectForm(id) {
        const project = dataManager.getProjectById(id);
        if (!project) return;

        document.getElementById("project-title").value = project.title || "";
        document.getElementById("project-slug").value = project.slug || "";
        document.getElementById("project-overview").value = project.overview || "";

        if (project.tags && Array.isArray(project.tags)) {
            this.setupTagsSystem(project.tags);
        } else if (project.category) {
            this.setupTagsSystem([project.category]);
        }

        const statusEl = document.getElementById("project-status");
        const featuredEl = document.getElementById("project-featured");
        const showreelEl = document.getElementById("project-showreel");

        if (statusEl) statusEl.value = project.status || "draft";
        if (featuredEl) featuredEl.checked = !!project.featured;
        if (showreelEl) showreelEl.checked = !!project.isHomeShowreel;

        this.slugManuallyEdited = true;

        if (project.thumbnail) {
            this.currentThumbUrl = project.thumbnail;
            const urlTab = document.querySelector('.thumb-tab[data-target="url"]');
            if(urlTab) urlTab.click(); 
            
            const urlInput = document.getElementById("thumbnail-url");
            if(urlInput) {
                urlInput.value = project.thumbnail;
                this.loadImagePreview(project.thumbnail);
            }
        }

        const videoTypeSelect = document.getElementById("video-type");
        if (project.video && project.video.type) {
            videoTypeSelect.value = project.video.type;
            videoTypeSelect.dispatchEvent(new Event("change"));
            setTimeout(() => { this.fillVideoSources(project.video.type, project.video.sources); }, 0);
        }
    }

    /* ---------- DASHBOARD / LIST / SEARCH / IMPORT ---------- */
    setupSearch() {
        const searchInput = document.getElementById("project-search");
        if (!searchInput) return;
        searchInput.value = this.searchTerm;
        searchInput.addEventListener("input", () => {
            this.searchTerm = searchInput.value.trim().toLowerCase();
            this.renderAllProjects();
        });
    }

    renderAllProjects() {
        const container = document.getElementById("all-projects-list");
        if (!container) return;

        let projects = dataManager.getProjects();
        if (this.searchTerm) {
            projects = projects.filter(p => {
                const titleMatch = (p.title || "").toLowerCase().includes(this.searchTerm);
                const tagMatch = p.tags ? p.tags.some(tag => tag.toLowerCase().includes(this.searchTerm)) : false;
                return titleMatch || tagMatch;
            });
        }

        if (projects.length === 0) {
            container.innerHTML = `<div class="card"><p>${this.searchTerm ? "Koi matching project nahi mila." : 'Abhi koi project nahi hai. "Add Project" se ek naya project banao.'}</p></div>`;
            return;
        }

        container.innerHTML = projects.map(project => {
            const displayTags = (project.tags && project.tags.length > 0) ? project.tags.join(', ') : (project.category || "—");
            
            // UI FIX: Render Home Icon if project is set as showreel
            const showreelBadge = project.isHomeShowreel ? `<span style="font-size: 1.1em; margin-left: 6px;" title="Set as Home Showreel">🏠</span>` : "";
            
            return `
            <div class="card project-row">
                <div>
                    <h3>${project.title || "(Untitled)"} ${project.featured ? "⭐" : ""} ${showreelBadge}</h3>
                    <p style="color:#e50914; font-weight:500; font-size:13px; margin-bottom:4px;">${displayTags}</p>
                    <p><span style="color: ${project.status === 'published' ? '#4caf50' : '#ff9800'}">${project.status || "draft"}</span> · ${project.date || "—"}</p>
                </div>
                <div class="actions">
                    <button class="publish-btn edit-project-btn" style="padding: 8px 16px; font-size: 13px;" data-id="${project.id}">Edit</button>
                    <button class="publish-btn delete-project-btn" style="padding: 8px 16px; font-size: 13px; background:#2a2a2a; color:#fff;" data-id="${project.id}" data-title="${(project.title || "this project").replace(/"/g, "&quot;")}">Delete</button>
                </div>
            </div>
            `;
        }).join("");

        container.querySelectorAll(".delete-project-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (confirm(`Delete "${btn.dataset.title}"? Yeh undo nahi ho sakta.`)) {
                    dataManager.deleteProject(btn.dataset.id);
                    this.renderAllProjects();
                }
            });
        });

        container.querySelectorAll(".edit-project-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.editingProjectId = btn.dataset.id;
                this.loadPage("Admin/add-project.html");
            });
        });
    }

    setupImportExport() {
        const exportBtn = document.getElementById("export-btn");
        const importBtn = document.getElementById("import-btn");
        const fileInput = document.getElementById("import-file");

        if (exportBtn) exportBtn.onclick = () => dataManager.exportJSON();
        
        if (importBtn) {
            importBtn.onclick = () => {
                const file = fileInput.files[0];
                if (!file) { alert("Pehle ek JSON file select karo."); return; }
                if (!confirm("Import karne se aapka current data poori tarah replace ho jaayega. Continue karein?")) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (dataManager.importJSON(e.target.result)) {
                        alert("Import successful. Dashboard updated.");
                        this.loadPage("Admin/dashboard.html");
                        const dashboardBtn = [...this.menuButtons].find(btn => btn.textContent.trim() === "Dashboard");
                        if(dashboardBtn) this.setActiveMenu(dashboardBtn);
                    } else alert("Invalid JSON file.");
                };
                reader.readAsText(file);
            };
        }
    }

    updateDashboard() {
        if (typeof dataManager === "undefined") return;
        const projects = dataManager.getProjects();
        
        let allTags = [];
        projects.forEach(p => {
            if (p.tags) allTags = allTags.concat(p.tags);
            else if (p.category) allTags.push(p.category); 
        });
        const uniqueTags = [...new Set(allTags)];

        let totalSources = 0;
        projects.forEach(project => {
            if (!project.video) return;
            if (project.video.type === "multi-mp4" && project.video.sources) totalSources += Object.keys(project.video.sources).length;
            else totalSources++;
        });

        const pCount = document.getElementById("dashboard-total-projects");
        const cCountHeading = document.querySelector("#dashboard-total-categories")?.previousElementSibling;
        if(cCountHeading) cCountHeading.textContent = "Tags Used";
        
        const cCount = document.getElementById("dashboard-total-categories");
        const sCount = document.getElementById("dashboard-total-sources");
        
        if (pCount) pCount.textContent = projects.length;
        if (cCount) cCount.textContent = uniqueTags.length;
        if (sCount) sCount.textContent = totalSources;
    }
}
const adminManager = new AdminManager();