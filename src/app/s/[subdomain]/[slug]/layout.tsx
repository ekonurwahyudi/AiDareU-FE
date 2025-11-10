import type { Metadata } from 'next'
import { headers } from 'next/headers'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params

  // Get UUID from URL
  const headersList = await headers()
  const fullUrl = headersList.get('x-url') || headersList.get('referer') || ''
  const urlParams = new URLSearchParams(fullUrl.split('?')[1] || '')
  const productUuid = urlParams.get('uuid')

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
    productData = await fetchProductByUuid(productUuid)
    console.log('[Product Metadata] Product data loaded:', !!productData)
  }

  // If product data available, use it for OG tags
  if (productData) {
    const productName = productData.nama_produk || 'Product'
    const storeName = storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'

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

    return {
      // Meta tags dari store SEO
      title: storeData.seo?.meta_title || `${productName} - ${storeName}`,
      description: storeData.seo?.deskripsi || productDescription || `${productName} at ${storeName}`,
      keywords: storeData.seo?.keyword || productName,

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
