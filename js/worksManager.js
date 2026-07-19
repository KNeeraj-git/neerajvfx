/*
===========================================
Neeraj VFX CMS
Works Page Manager v6.1 (Primary Tag UI Fix)
===========================================
*/

class WorksManager {

    constructor() {
        this.container = document.querySelector(".works-grid");
    }

    async init() {
        if (!this.container) return;
        
        await dataManager.loadProjects();
        this.renderProjects();
    }

    renderProjects() {
        const projects = dataManager.getProjects();
        this.container.innerHTML = "";

        let publishedProjects = projects.filter(project => project.status === "published");

        if (publishedProjects.length === 0) {
            this.container.innerHTML = `
                <div class="empty-projects" style="grid-column: 1/-1; text-align: center; padding: 40px 0;">
                    <h2 style="font-size: 24px; color: #666;">No Published Projects Found</h2>
                </div>
            `;
            return;
        }

        publishedProjects.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return b.id.localeCompare(a.id);
        });

        publishedProjects.forEach(project => {
            const card = document.createElement("a");
            card.className = "work-card";
            
            const safeSlug = encodeURIComponent(project.slug || "");
            card.href = `project.html?slug=${safeSlug}`;

            const featuredBadge = project.featured ? `<span class="featured-indicator">FEATURED PROJECT</span>` : '';

            // UI FIX: Show ONLY the First Tag (Primary Tag) on the card
            let displayTag = 'VFX PRODUCTION';
            if (project.tags && project.tags.length > 0) {
                displayTag = project.tags[0]; // Strictly first tag only
            } else if (project.category) {
                displayTag = project.category; // Backward compatibility
            }

            card.innerHTML = `
                <div class="work-thumb">
                    ${featuredBadge}
                    <img src="${project.thumbnail}" alt="${project.title || 'VFX Project'}" onerror="this.onerror=null; this.src='assets/thumbnails/comingsoon.webp';">
                    <div class="play-icon">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" style="margin-left: 2px;">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>

                <div class="work-info">
                    <div class="category">
                        ${displayTag}
                    </div>
                    <h3>
                        ${project.title || 'Untitled Artwork'}
                    </h3>
                    <p>
                        ${project.overview ? this.truncateText(project.overview, 110) : 'Click to view project breakdown and technical visual effects reel.'}
                    </p>
                </div>
            `;

            this.container.appendChild(card);
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength).trim() + "...";
    }
}

const worksManager = new WorksManager();

document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".works-grid")) {
        worksManager.init();
    }
});