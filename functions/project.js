export async function onRequestGet(context) {
    const { request, next } = context;
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    // 1. Original HTML file ko load karo
    const response = await next();

    // Agar URL mein slug nahi hai, toh normal page bhej do
    if (!slug) return response;

    try {
        // 2. Background mein projects.json ko fetch karo
        const dataUrl = new URL('/data/projects.json', request.url);
        const dataRes = await fetch(dataUrl);
        const data = await dataRes.json();

        // 3. Slug ke hisaab se project dhoondo
        const project = data.projects.find(p => p.slug === slug);
        if (!project) return response;

        // 4. Naya SEO Data taiyaar karo
        const title = `${project.title} | Neeraj VFX`;
        
        let rawDesc = (project.overview || "Watch the VFX breakdown and cinematic compositing work by Neeraj Kumar.").replace(/[\r\n]+/g, ' ').trim();
        const description = rawDesc.length > 150 ? rawDesc.substring(0, 147) + "..." : rawDesc;
        
        let image = project.thumbnail || "https://neerajvfx.com/assets/logos/social_preview.webp";
        if (!image.startsWith('http')) {
            image = new URL(image, request.url).href; // Relative path ko full URL banata hai
        }

        // 5. HTMLRewriter se live HTML ke tags change karke bhej do
        return new HTMLRewriter()
            .on('title', { element(e) { e.setInnerContent(title); } })
            .on('meta[name="title"]', { element(e) { e.setAttribute('content', title); } })
            .on('meta[name="description"]', { element(e) { e.setAttribute('content', description); } })
            .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
            .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', description); } })
            .on('meta[property="og:image"]', { element(e) { e.setAttribute('content', image); } })
            .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', title); } })
            .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', description); } })
            .on('meta[name="twitter:image"]', { element(e) { e.setAttribute('content', image); } })
            .transform(response);

    } catch (err) {
        // Agar koi error aaye toh website na toote, purana page dikha de
        return response;
    }
}