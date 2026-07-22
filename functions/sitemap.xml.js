export async function onRequestGet(context) {
    const { request } = context;
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.hostname}`; // Automatically takes https://neerajvfx.com

    try {
        // 1. Fetch live projects.json data
        const dataUrl = new URL('/data/projects.json', request.url);
        const dataRes = await fetch(dataUrl);
        const data = await dataRes.json();

        // Current date format (YYYY-MM-DD) for static pages
        const today = new Date().toISOString().split('T')[0];

        // 2. Start building XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // 3. Add Static Pages (Home, Works, About)
        const staticPages = ['', '/works.html', '/about.html'];
        for (const page of staticPages) {
            xml += `  <url>\n`;
            xml += `    <loc>${baseUrl}${page}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `  </url>\n`;
        }

        // 4. Add Dynamic Project Pages Automatically
        if (data && data.projects) {
            const publishedProjects = data.projects.filter(p => p.status === 'published');
            for (const project of publishedProjects) {
                // Use the project's date from JSON, if missing use today's date
                const projDate = project.date ? project.date : today;
                
                xml += `  <url>\n`;
                xml += `    <loc>${baseUrl}/project.html?slug=${project.slug}</loc>\n`;
                xml += `    <lastmod>${projDate}</lastmod>\n`;
                xml += `  </url>\n`;
            }
        }

        xml += `</urlset>`;

        // 5. Send back as official XML file
        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'max-age=3600' // Caches for 1 hour for fast loading
            }
        });

    } catch (err) {
        return new Response('Error generating sitemap', { status: 500 });
    }
}