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

// Fetch product data untuk metadata
async function fetchProductData(uuid: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const apiUrl = `${backendUrl}/api/product/${uuid}`

    console.log('[Product generateMetadata] Fetching product from:', apiUrl)

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('[Product generateMetadata] Product response status:', response.status)

    if (!response.ok) return null

    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error('[Product generateMetadata] Error fetching product:', error)
    return null
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const { uuid } = await searchParams

  // Fetch store data untuk SEO settings
  const storeData = await fetchStoreData(subdomain)

  // If no UUID or store, return store metadata
  if (!uuid || !storeData) {
    return {
      title: storeData?.seo?.meta_title || 'AiDareU Store',
      description: storeData?.seo?.deskripsi || 'Discover amazing products at our store'
    }
  }

  // Fetch product data
  const productData = await fetchProductData(uuid)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // If product exists, use product data for OG tags but store SEO for meta tags
  if (productData) {
    const productName = productData.nama_produk || 'Product'
    const storeName = storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'

    // Strip HTML tags from description
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
        const images = typeof productData.upload_gambar_produk === 'string'
          ? JSON.parse(productData.upload_gambar_produk)
          : productData.upload_gambar_produk
        const firstImage = Array.isArray(images) ? images[0] : images
        if (firstImage) {
          productImage = `${backendUrl}/storage/${firstImage}`
        }
      } catch {
        productImage = storeData.seo?.og_image
          ? `${backendUrl}/storage/${storeData.seo.og_image}`
          : (storeData.settings?.logo ? `${backendUrl}/storage/${storeData.settings.logo}` : '')
      }
    }

    // Fallback to store OG image if no product image
    if (!productImage) {
      productImage = storeData.seo?.og_image
        ? `${backendUrl}/storage/${storeData.seo.og_image}`
        : (storeData.settings?.logo ? `${backendUrl}/storage/${storeData.settings.logo}` : '')
    }

    return {
      // Meta tags menggunakan SEO settings dari theme
      title: storeData.seo?.meta_title || `${productName} - ${storeName}`,
      description: storeData.seo?.deskripsi || productDescription || `Discover ${productName} at ${storeName}`,
      keywords: storeData.seo?.keyword ? `${productName}, ${storeData.seo.keyword}` : productName,

      // Open Graph menggunakan data produk
      openGraph: {
        type: 'website',
        title: `${productName} - ${storeName}`,
        description: productDescription || `Discover ${productName} at ${storeName}`,
        images: productImage ? [
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: productName
          }
        ] : []
      },

      // Twitter Card menggunakan data produk
      twitter: {
        card: 'summary_large_image',
        title: `${productName} - ${storeName}`,
        description: productDescription || `Discover ${productName} at ${storeName}`,
        images: productImage ? [productImage] : []
      },

      robots: {
        index: true,
        follow: true
      }
    }
  }

  // Fallback to store metadata if product not found
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
