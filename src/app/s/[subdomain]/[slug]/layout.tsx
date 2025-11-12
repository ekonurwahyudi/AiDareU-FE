import type { Metadata } from 'next'

type Props = {
  params: Promise<{ subdomain: string; slug: string }>
  searchParams: Promise<{ uuid?: string }>
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

// Fetch product data by UUID
async function fetchProductByUuid(uuid: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const apiUrl = `${backendUrl}/api/public/products/${uuid}`

    console.log('[Product Metadata] Fetching product:', apiUrl)

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
    console.error('[Product Metadata] Error:', error)
    return null
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { subdomain, slug } = await params

  // Try to get UUID from multiple sources
  let productUuid: string | undefined

  // First try: Get from searchParams
  try {
    const search = await searchParams
    if (search?.uuid) {
      productUuid = search.uuid
      console.log('[Product Metadata] UUID from searchParams:', productUuid)
    }
  } catch (error) {
    console.error('[Product Metadata] Error getting searchParams:', error)
  }

  // Second try: Check if slug contains UUID pattern (if searchParams failed)
  // UUID pattern: 8-4-4-4-12 characters (e.g., e4d49228-d5d2-4645-8f25-847ffbc88b37)
  if (!productUuid && slug) {
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = slug.match(uuidPattern)
    if (match) {
      productUuid = match[0]
      console.log('[Product Metadata] UUID extracted from slug:', productUuid)
    }
  }

  console.log('========================================')
  console.log('[Product Metadata] LAYOUT CALLED!')
  console.log('[Product Metadata] Final UUID:', productUuid)
  console.log('[Product Metadata] Subdomain:', subdomain)
  console.log('[Product Metadata] Slug:', slug)
  console.log('========================================')

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

  // If we have product UUID, fetch product data
  let productData = null
  if (productUuid) {
    try {
      productData = await fetchProductByUuid(productUuid)
      console.log('[Product Metadata] Product data loaded:', !!productData)
    } catch (error) {
      console.error('[Product Metadata] Error fetching product:', error)
      productData = null
    }
  }

  // If product data available, use it for OG tags
  if (productData) {
    console.log('[Product Metadata] ✅ PRODUCT DATA FOUND - Using product OG tags')
    const productName = productData.nama_produk || 'Product'
    const storeName = storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'
    console.log('[Product Metadata] Product Name:', productName)
    console.log('[Product Metadata] Store Name:', storeName)

    // Clean HTML from description
    let productDescription = ''
    if (productData.deskripsi_produk) {
      productDescription = typeof productData.deskripsi_produk === 'string'
        ? productData.deskripsi_produk.replace(/<[^>]*>/g, '').substring(0, 160)
        : ''
    }

    // Get product image
    let productImage = ''
    if (productData.upload_gambar_produk) {
      try {
        const images = Array.isArray(productData.upload_gambar_produk)
          ? productData.upload_gambar_produk
          : JSON.parse(productData.upload_gambar_produk)

        const firstImage = Array.isArray(images) ? images[0] : images
        if (firstImage) {
          productImage = `${backendUrl}/storage/${firstImage}`
        }
      } catch (e) {
        console.error('[Product Metadata] Error parsing product images:', e)
      }
    }

    // Fallback to store image
    if (!productImage) {
      productImage = storeData.seo?.og_image
        ? `${backendUrl}/storage/${storeData.seo.og_image}`
        : (storeData.settings?.logo ? `${backendUrl}/storage/${storeData.settings.logo}` : '')
    }

    console.log('[Product Metadata] ✅ RETURNING PRODUCT METADATA')
    console.log('[Product Metadata] Title:', `${productName} - ${storeName}`)
    console.log('[Product Metadata] OG Image:', productImage)

    return {
      // Meta tags dari product data (prioritas produk, bukan store SEO)
      title: `${productName} - ${storeName}`,
      description: productDescription || `${productName} at ${storeName}`,
      keywords: `${productName}, ${storeData.seo?.keyword || ''}`.trim(),

      // Open Graph dari product data
      openGraph: {
        type: 'website',
        title: `${productName} - ${storeName}`,
        description: productDescription || `${productName} at ${storeName}`,
        images: productImage ? [
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: productName
          }
        ] : []
      },

      // Twitter Card dari product data
      twitter: {
        card: 'summary_large_image',
        title: `${productName} - ${storeName}`,
        description: productDescription || `${productName} at ${storeName}`,
        images: productImage ? [productImage] : []
      },

      robots: {
        index: true,
        follow: true
      }
    }
  }

  // Fallback to store metadata if no product
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
