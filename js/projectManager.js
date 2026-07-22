/*
===========================================
Neeraj VFX CMS
Project Page Manager v6.2 (Cleaned for Cloudflare Function)
===========================================
*/

class ProjectManager {

    constructor() {
        this.project = null;
    }

    async init() {
        await dataManager.loadProjects();

        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug');

        if (!slug) {
            this.showError("Missing Slug", "Project URL is missing or invalid.");
            return;
        }

        this.project = dataManager.getProjectBySlug(slug);

        if (!this.project) {
            this.showError("Project Not Found", "The project you are looking for does not exist or has been removed.");
            return;
        }

        if (this.project.status !== "published") {
            this.showError("Project Unavailable", "This project is currently in Draft mode.");
            return;
        }

        this.renderProject();
    }

    renderProject() {
        // Basic fallback for browser tab title
        document.title = `${this.project.title} | Neeraj VFX`;

        const titleEl = document.querySelector(".yt-video-title");
        if (titleEl) {
            const badge = this.project.featured ? `<span class="featured-badge-inline">FEATURED PROJECT</span>` : '';
            titleEl.innerHTML = `${this.project.title} ${badge}`;
        }

        const overviewEl = document.querySelector(".project-overview-text");
        if (overviewEl) {
            overviewEl.innerHTML = (this.project.overview || "").replace(/\n/g, '<br>');
        }

        const tagsContainer = document.getElementById("project-tags-list");
        if (tagsContainer) {
            if (this.project.tags && this.project.tags.length > 0) {
                tagsContainer.innerHTML = this.project.tags.map(t => `<span class="tag-chip">${t}</span>`).join('');
                tagsContainer.style.display = 'flex';
            } else if (this.project.category) {
                tagsContainer.innerHTML = `<span class="tag-chip">${this.project.category}</span>`;
                tagsContainer.style.display = 'flex';
            } else {
                tagsContainer.style.display = 'none';
            }
        }

        const videoConfig = {
            poster: this.project.thumbnail || "assets/thumbnails/comingsoon.webp",
            sources: this.project.video?.sources || {},
            type: this.project.video?.type || "mp4"
        };

        if (typeof Player !== "undefined") {
            Player.load(videoConfig);
        } else {
            console.error("❌ Player Engine not found!");
        }

        this.renderRelatedProjects();
    }

    renderRelatedProjects() {
        const container = document.getElementById("related-videos-container");
        if (!container) return;

        const allPublished = dataManager.getProjects().filter(p => p.status === "published");

        let related = allPublished.filter(p => {
            if (p.id === this.project.id) return false;
            if (this.project.tags && p.tags) return this.project.tags.some(tag => p.tags.includes(tag));
            return p.category === this.project.category;
        });

        if (related.length < 4) {
            const others = allPublished.filter(p => {
                if (p.id === this.project.id) return false;
                if (this.project.tags && p.tags) return !this.project.tags.some(tag => p.tags.includes(tag));
                return p.category !== this.project.category;
            });
            related = related.concat(others);
        }

        related = related.slice(0, 4);

        let html = `<h3 class="sidebar-title">More Projects</h3>`;

        related.forEach(p => {
            const safeSlug = encodeURIComponent(p.slug || "");
            let displayTags = 'VFX';
            if (p.tags && p.tags.length > 0) {
                displayTags = p.tags.slice(0, 2).join(', ');
                if (p.tags.length > 2) displayTags += '...';
            } else if (p.category) {
                displayTags = p.category;
            }

            html += `
            <a href="project.html?slug=${safeSlug}" class="related-item">
                <div class="related-thumb">
                    <img src="${p.thumbnail || 'assets/thumbnails/comingsoon.webp'}" alt="${p.title}" onerror="this.onerror=null; this.src='assets/thumbnails/comingsoon.webp';">
                </div>
                <div class="related-info">
                    <h4>${p.title}</h4>
                    <p>${displayTags}</p>
                </div>
            </a>
            `;
        });

        container.innerHTML = html;
    }

    showError(title, message) {
        const mainCol = document.querySelector(".yt-main-column");
        if (mainCol) {
            mainCol.innerHTML = `
                <div class="error-container">
                    <h2 class="error-title">${title}</h2>
                    <p class="error-text">${message}</p>
                    <a href="works.html" class="publish-btn error-btn">Browse Portfolio</a>
                </div>
            `;
        }
    }
}

const projectManager = new ProjectManager();

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".yt-main-column")) {
        projectManager.init();
    }
});