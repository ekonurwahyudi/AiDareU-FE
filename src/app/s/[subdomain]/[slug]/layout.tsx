import type { Metadata } from 'next'

type Props = {
  params: Promise<{ subdomain: string; slug: string }>
  children: React.ReactNode
}

// Fetch store data untuk metadata
async function fetchStoreData(subdomain: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const apiUrl = `${backendUrl}/api/store/${subdomain}`

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('[Product generateMetadata] Error fetching store:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params

  // Fetch store data untuk SEO settings
  const storeData = await fetchStoreData(subdomain)

  // If no store, return minimal metadata
  if (!storeData) {
    return {
      title: 'AiDareU Store',
      description: 'Discover amazing products at our store'
    }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // Use store SEO settings for product pages
  // Client-side useStoreMetadata will update with actual product data
  const metaTitle = storeData.seo?.meta_title ||
    (storeData.settings?.site_tagline
      ? `${storeData.settings?.site_title || storeData.store?.name} - ${storeData.settings.site_tagline}`
      : (storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'))

  const metaDescription = storeData.seo?.deskripsi ||
    `Discover amazing products at ${storeData.settings?.site_title || storeData.store?.name || 'our store'}`

  const ogTitle = storeData.seo?.og_title ||
    storeData.settings?.site_title ||
    storeData.store?.name ||
    'AiDareU Store'

  const ogDescription = storeData.seo?.og_deskripsi ||
    storeData.seo?.deskripsi ||
    metaDescription

  const ogImage = storeData.seo?.og_image
    ? `${backendUrl}/storage/${storeData.seo.og_image}`
    : (storeData.settings?.logo
      ? `${backendUrl}/storage/${storeData.settings.logo}`
      : '')

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: storeData.seo?.keyword || '',
    openGraph: {
      type: 'website',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle
        }
      ] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : []
    },
    robots: {
      index: true,
      follow: true
    }
  }
}

export default function ProductLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
