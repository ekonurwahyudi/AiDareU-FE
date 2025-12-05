/**
 * Generate static sitemap.xml
 * Run: node scripts/generate-sitemap.js
 */

const fs = require('fs')
const path = require('path')

const baseUrl = 'https://aidareu.com'

// Static pages
const staticPages = [
  '',
  '/domain-checker',
  '/front-pages/landing-page',
  '/front-pages/pricing',
  '/front-pages/help-center',
  '/login',
  '/register',
]

function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  const publicPath = path.join(__dirname, '../public')

  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true })
  }

  fs.writeFileSync(path.join(publicPath, 'sitemap-static.xml'), sitemap)

  console.log('✅ Static sitemap generated successfully!')
  console.log(`📄 Location: ${path.join(publicPath, 'sitemap-static.xml')}`)
}

generateSitemap()
