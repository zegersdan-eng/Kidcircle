/**
 * Server-side SEO routes: sitemap.xml, robots.txt
 */
import { Router } from 'express';

const router = Router();

// ============================================================
// GET /sitemap.xml — XML sitemap for search engines
// ============================================================
router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://kidcircle.app';

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/providers', changefreq: 'daily', priority: '0.9' },
    { loc: '/concierge', changefreq: 'weekly', priority: '0.8' },
    { loc: '/circle', changefreq: 'weekly', priority: '0.7' },
    { loc: '/profile', changefreq: 'monthly', priority: '0.6' },
    { loc: '/login', changefreq: 'monthly', priority: '0.5' },
    { loc: '/partner', changefreq: 'monthly', priority: '0.6' },
    { loc: '/swap-marketplace', changefreq: 'daily', priority: '0.8' },
    { loc: '/verification', changefreq: 'monthly', priority: '0.5' },
  ];

  let urls = '';
  for (const page of staticPages) {
    urls += `
    <url>
      <loc>${baseUrl}${page.loc}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`;
  }

  // Dynamic pages: provider profiles (up to 50)
  try {
    const db = (await import('../db/connection.js')).default;
    const providers = await db.execute({
      sql: "SELECT id, name, updated_at FROM providers WHERE active = 1 ORDER BY updated_at DESC LIMIT 50",
      args: [],
    });

    for (const p of providers.rows) {
      const lastmod = p.updated_at ? p.updated_at.split(' ')[0] : new Date().toISOString().split('T')[0];
      urls += `
    <url>
      <loc>${baseUrl}/providers/${p.id}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`;
    }
  } catch (err) {
    console.error('Sitemap provider query error:', err.message);
  }

  // Dynamic pages: events (up to 20)
  try {
    const db = (await import('../db/connection.js')).default;
    const events = await db.execute({
      sql: "SELECT id, updated_at FROM events WHERE active = 1 ORDER BY updated_at DESC LIMIT 20",
      args: [],
    });

    for (const e of events.rows) {
      const lastmod = e.updated_at ? e.updated_at.split(' ')[0] : new Date().toISOString().split('T')[0];
      urls += `
    <url>
      <loc>${baseUrl}/events/${e.id}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.6</priority>
    </url>`;
    }
  } catch (err) {
    console.error('Sitemap event query error:', err.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// ============================================================
// GET /robots.txt — Robots exclusion standard
// ============================================================
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || 'https://kidcircle.app';
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /profile
Disallow: /verification
Disallow: /analytics-dashboard

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

export { router };