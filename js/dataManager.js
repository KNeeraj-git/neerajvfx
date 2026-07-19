/* ==========================================
   Neeraj VFX CMS
   Data Manager v3 — Final
========================================== */

class DataManager {

    constructor() {
        this.projects = [];
        this.storageKey = "neerajvfx_cms_projects";
    }

    async loadProjects() {

        const saved = localStorage.getItem(this.storageKey);

        if (saved) {
            try {
                this.projects = JSON.parse(saved);
                return this.projects;
            } catch (error) {
                console.error("Corrupt local data, loading from file instead:", error);
            }
        }

        try {
            const response = await fetch(CMS_CONFIG.paths.projects);
            const data = await response.json();
            this.projects = data.projects || [];
            this.saveToLocal();
        } catch (error) {
            console.error("Failed to load projects.json:", error);
            this.projects = [];
        }

        return this.projects;
    }

    saveToLocal() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
    }

    getProjects() {
        return this.projects;
    }

    getProjectById(id) {
        return this.projects.find(project => project.id === id);
    }

    getProjectBySlug(slug) {
        return this.projects.find(project => project.slug === slug);
    }

    getProjectsByCategory(category) {
        return this.projects.filter(project => project.category === category);
    }

    /* Duplicate slug check — excludeId isliye hai taaki edit
       karte waqt project khud ke slug se conflict na kare */
    isSlugTaken(slug, excludeId = null) {
        return this.projects.some(p => p.slug === slug && p.id !== excludeId);
    }

    addProject(project) {
        project.id = "proj_" + Date.now();
        if (!project.date) {
            project.date = new Date().toISOString().split("T")[0];
        }
        if (!project.status) {
            project.status = "draft";
        }
        this.projects.push(project);
        this.saveToLocal();
        return project;
    }

    updateProject(id, updatedData) {
        const index = this.projects.findIndex(project => project.id === id);
        if (index === -1) return false;

        this.projects[index] = { ...this.projects[index], ...updatedData, id };
        this.saveToLocal();
        return true;
    }

    deleteProject(id) {
        this.projects = this.projects.filter(project => project.id !== id);
        this.saveToLocal();
    }

    exportJSON() {
        const dataStr = JSON.stringify({ projects: this.projects }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "projects.json";
        link.click();

        URL.revokeObjectURL(url);
    }

    importJSON(fileText) {
        try {
            const data = JSON.parse(fileText);
            this.projects = data.projects || [];
            this.saveToLocal();
            return true;
        } catch (error) {
            console.error("Invalid JSON file:", error);
            return false;
        }
    }

}

const dataManager = new DataManager();