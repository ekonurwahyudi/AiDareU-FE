// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import ToastProvider from '@/components/ToastProvider'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
  description:
    'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
  keywords: [
    'website toko online gratis',
    'buat website tanpa coding',
    'platform UMKM Indonesia',
    'website profesional gratis',
    'toko online indonesia',
    'AI mentor bisnis',
    'SEO otomatis',
    'payment gateway indonesia',
    'website builder indonesia',
    'domain gratis'
  ],
  authors: [{ name: 'AiDareU', url: 'https://aidareu.com' }],
  creator: 'AiDareU',
  publisher: 'AiDareU',
  metadataBase: new URL('https://aidareu.com'),
  alternates: {
    canonical: 'https://aidareu.com'
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://aidareu.com',
    title: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
    description:
      'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
    siteName: 'AiDareU',
    images: [
      {
        url: '/images/front-pages/landing-page/hero-dashboard-light.png',
        width: 1200,
        height: 630,
        alt: 'AiDareU - Platformnya Para Entrepreneur Indonesia'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
    description:
      'AidareU adalah platformnya para entrepreneur untuk mulai dan scale up bisnis tanpa ribet—mulai dari website profesional, branding, mentoring by Calista AI, hingga manajemen toko lengkap: desain website, manajemen order & customer, optimasi Meta & Google Ads, SEO, Learning Center, serta komunitas bisnis.',
    images: ['/images/front-pages/landing-page/hero-dashboard-light.png'],
    creator: '@aidareu'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const headersList = await headers()
  const systemMode = await getSystemMode()

  return (
    <html id='__next' lang='en' dir='ltr' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
