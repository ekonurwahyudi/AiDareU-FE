import type { Metadata } from 'next'

type Props = {
  params: Promise<{ subdomain: string }>
  children: React.ReactNode
}

// Fetch store data untuk metadata
async function fetchStoreData(subdomain: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/stores/subdomain/${subdomain}`, {
      cache: 'no-store',
      next: { revalidate: 60 }
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('Error fetching store data for metadata:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const storeData = await fetchStoreData(subdomain)

  if (!storeData) {
    return {
      title: 'Store Not Found',
      description: 'The store you are looking for does not exist.'
    }
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // Meta title dengan fallback
  const metaTitle = storeData.seo?.meta_title ||
    (storeData.settings?.site_tagline
      ? `${storeData.settings?.site_title || storeData.store?.name} - ${storeData.settings.site_tagline}`
      : (storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'))

  // Meta description dengan fallback
  const metaDescription = storeData.seo?.deskripsi ||
    `Discover amazing products at ${storeData.settings?.site_title || storeData.store?.name || 'our store'}`

  // OG Title dengan fallback
  const ogTitle = storeData.seo?.og_title ||
    storeData.settings?.site_title ||
    storeData.store?.name ||
    'AiDareU Store'

  // OG Description dengan fallback
  const ogDescription = storeData.seo?.og_deskripsi ||
    storeData.seo?.deskripsi ||
    metaDescription

  // OG Image dengan fallback
  const ogImage = storeData.seo?.og_image
    ? `${backendUrl}/storage/${storeData.seo.og_image}`
    : (storeData.settings?.logo
      ? `${backendUrl}/storage/${storeData.settings.logo}`
      : `${backendUrl}/images/default-og-image.png`)

  // Keywords
  const keywords = storeData.seo?.keyword || ''

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords,
    openGraph: {
      type: 'website',
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true
    }
  }
}

export default function SubdomainLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
