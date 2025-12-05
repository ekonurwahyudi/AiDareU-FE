// Structured Data / Schema.org helpers for SEO

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
  alternateName: 'AidareU',
  url: 'https://aidareu.com',
  logo: 'https://aidareu.com/icon.png',
  description: 'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
  foundingDate: '2025',
  sameAs: [
    'https://www.facebook.com/aidareu',
    'https://www.instagram.com/aidareu.official',
    'https://twitter.com/aidareu',
    'https://www.linkedin.com/company/aidareu'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['Indonesian', 'English']
  }
})

export const generateWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
  url: 'https://aidareu.com',
  description: 'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://aidareu.com/search?q={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
})

export const generateProductSchema = (product: {
  name: string
  description: string
  image: string
  price: number
  currency?: string
  availability?: string
  brand?: string
  sku?: string
  rating?: number
  reviewCount?: number
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image,
  sku: product.sku || product.name.toLowerCase().replace(/\s+/g, '-'),
  brand: {
    '@type': 'Brand',
    name: product.brand || 'AiDareU Store'
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: product.currency || 'IDR',
    availability: product.availability || 'https://schema.org/InStock',
    url: typeof window !== 'undefined' ? window.location.href : ''
  },
  ...(product.rating && {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 1
    }
  })
})

export const generateBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
})

export const generateLocalBusinessSchema = (store: {
  name: string
  description: string
  address?: string
  phone?: string
  url: string
  logo?: string
  image?: string
  priceRange?: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: store.name,
  description: store.description,
  url: store.url,
  image: store.image || store.logo,
  priceRange: store.priceRange || '$$',
  ...(store.address && {
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      streetAddress: store.address
    }
  }),
  ...(store.phone && {
    telephone: store.phone
  })
})

export const generateFAQSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
})
