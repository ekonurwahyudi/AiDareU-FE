import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://aidareu.com'
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/domain-checker`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/front-pages/landing-page`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/front-pages/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/front-pages/help-center`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // Fetch active stores from API
  let storePages: MetadataRoute.Sitemap = []
  try {
    const response = await fetch(`${backendUrl}/api/public/stores`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (response.ok) {
      const data = await response.json()
      const stores = data.data || []

      storePages = stores
        .filter((store: any) => store.is_active || store.status === 'active')
        .map((store: any) => ({
          url: `${baseUrl}/s/${store.subdomain}`,
          lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.9,
        }))
    }
  } catch (error) {
    console.error('Error fetching stores for sitemap:', error)
  }

  // Fetch products from API (limit to recent products for performance)
  let productPages: MetadataRoute.Sitemap = []
  try {
    const response = await fetch(`${backendUrl}/api/public/products?per_page=100`, {
      next: { revalidate: 3600 } // Revalidate every hour
    })

    if (response.ok) {
      const data = await response.json()
      const products = data.data?.data || []

      productPages = products
        .filter((product: any) => product.status_produk === 'active')
        .map((product: any) => {
          // Generate product slug
          const slug = `${product.nama_produk.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${product.uuid}`
          return {
            url: `${baseUrl}/store/${slug}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          }
        })
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  return [...staticPages, ...storePages, ...productPages]
}
