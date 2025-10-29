import { Metadata } from 'next'

// Helper function to get storage URL
function getStorageUrl(path: string | null | undefined): string {
  if (!path) return ''
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'

  // If path already includes full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // If path starts with 'storage/', use it as is
  if (cleanPath.startsWith('storage/')) {
    return backendUrl + '/' + cleanPath
  }

  // Otherwise add storage prefix
  return backendUrl + '/storage/' + cleanPath
}

// Function to fetch store data
async function getStoreData(subdomain: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'
    const response = await fetch(backendUrl + '/api/store/' + subdomain, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.success && data.data) {
      return data.data
    }

    return null
  } catch (error) {
    console.error('Error fetching store data for metadata:', error)
    return null
  }
}

// Generate metadata for the store page
export async function generateMetadata({
  params
}: {
  params: { subdomain: string }
}): Promise<Metadata> {
  const storeData = await getStoreData(params.subdomain)

  if (!storeData) {
    return {
      title: 'Store Not Found',
      description: 'The requested store could not be found.'
    }
  }

  const seo = storeData.seo || {}
  const settings = storeData.settings || {}
  const store = storeData.store || {}

  // Build title
  const siteTitle = settings.site_title || store.name || 'AiDareU Store'
  const siteTagline = settings.site_tagline || ''
  const metaTitle = seo.meta_title || (siteTagline ? siteTitle + ' - ' + siteTagline : siteTitle)

  // Build description
  const metaDescription = seo.deskripsi || 'Discover amazing products at ' + siteTitle + '. Quality items with great prices.'

  // Build keywords
  const metaKeywords = seo.keyword || ''

  // Open Graph
  const ogTitle = seo.og_title || metaTitle
  const ogDescription = seo.og_deskripsi || metaDescription
  const ogImagePath = seo.og_image || settings.logo
  const ogImage = ogImagePath ? getStorageUrl(ogImagePath) : undefined

  // Favicon
  const faviconPath = settings.favicon
  const favicon = faviconPath ? getStorageUrl(faviconPath) : undefined

  // Get current URL
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://aidareu.com'
  const currentUrl = baseUrl + '/s/' + params.subdomain

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    authors: [{ name: siteTitle }],
    creator: siteTitle,
    publisher: siteTitle,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: favicon ? {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    } : undefined,
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: currentUrl,
      siteName: siteTitle,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: currentUrl,
    },
  }
}

export default function SubdomainLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
