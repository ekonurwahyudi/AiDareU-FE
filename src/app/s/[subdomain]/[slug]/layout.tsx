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
    // Backend returns { status: "success" } or { success: true }
    return (data.status === 'success' || data.success) ? data.data : null
  } catch (error) {
    console.error('[Product generateMetadata] Error fetching store:', error)
    return null
  }
}

// Fetch product data by UUID (try both physical and digital product endpoints)
async function fetchProductByUuid(uuid: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

    // Try physical products first
    let apiUrl = `${backendUrl}/api/public/products/${uuid}`
//     console.log('[Product Metadata] Fetching product (physical):', apiUrl)

    let response = await fetch(apiUrl, {
      cache: 'no-store',
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      // Backend returns { status: "success", data: {...} }
      if (data.status === 'success' && data.data) {
//         console.log('[Product Metadata] ✅ Physical product found')
        return data.data
      }
    }

    // If not found, try digital products
    apiUrl = `${backendUrl}/api/public/products-digital/${uuid}`
//     console.log('[Product Metadata] Fetching product (digital):', apiUrl)

    response = await fetch(apiUrl, {
      cache: 'no-store',
      next: { revalidate: 60 },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      // Backend returns { status: "success", data: {...} }
      if (data.status === 'success' && data.data) {
//         console.log('[Product Metadata] ✅ Digital product found')
        return data.data
      }
    }

//     console.log('[Product Metadata] ❌ Product not found in both endpoints')
    return null
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
//       console.log('[Product Metadata] UUID from searchParams:', productUuid)
    }
  } catch (error) {
    console.error('[Product Metadata] Error getting searchParams:', error)
  }

  // Second try: Check if slug contains UUID pattern (if searchParams failed)
  // UUID pattern: Full UUID (8-4-4-4-12) or partial UUID prefix (8 chars at end)
  if (!productUuid && slug) {
    // Try full UUID pattern first
    const fullUuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    let match = slug.match(fullUuidPattern)

    if (match) {
      productUuid = match[0]
//       console.log('[Product Metadata] Full UUID extracted from slug:', productUuid)
    } else {
      // Try partial UUID at end of slug (e.g., "product-name-e4d49228")
      const partialUuidPattern = /-([0-9a-f]{8})$/i
      match = slug.match(partialUuidPattern)
      if (match && match[1]) {
        // We have 8-char prefix, need to fetch using this prefix
        // Store the partial for now - backend API will need to handle prefix search
        productUuid = match[1]
//         console.log('[Product Metadata] Partial UUID (8 chars) extracted from slug:', productUuid)
//         console.log('[Product Metadata] ⚠️  Warning: Using partial UUID - may need full UUID from query param')
      }
    }
  }

//   console.log('========================================')
//   console.log('[Product Metadata] LAYOUT CALLED!')
//   console.log('[Product Metadata] Final UUID:', productUuid)
//   console.log('[Product Metadata] Subdomain:', subdomain)
//   console.log('[Product Metadata] Slug:', slug)
//   console.log('========================================')

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
//       console.log('[Product Metadata] Product data loaded:', !!productData)
    } catch (error) {
      console.error('[Product Metadata] Error fetching product:', error)
      productData = null
    }
  }

  // If product data available, use it for OG tags
  if (productData) {
//     console.log('[Product Metadata] ✅ PRODUCT DATA FOUND - Using product OG tags')
    const productName = productData.nama_produk || 'Product'
    const storeName = storeData.settings?.site_title || storeData.store?.name || 'AiDareU Store'
//     console.log('[Product Metadata] Product Name:', productName)
//     console.log('[Product Metadata] Store Name:', storeName)

    // Clean HTML from description
    // Backend can return either 'deskripsi' or 'deskripsi_produk'
    let productDescription = ''
    const rawDescription = productData.deskripsi_produk || productData.deskripsi
    if (rawDescription) {
      productDescription = typeof rawDescription === 'string'
        ? rawDescription.replace(/<[^>]*>/g, '').trim().substring(0, 160)
        : ''
    }

//     console.log('[Product Metadata] Product Description:', productDescription || 'No description')

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

//     console.log('[Product Metadata] ✅ RETURNING PRODUCT METADATA')
//     console.log('[Product Metadata] Title:', `${productName} - ${storeName}`)
//     console.log('[Product Metadata] OG Image:', productImage)

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
