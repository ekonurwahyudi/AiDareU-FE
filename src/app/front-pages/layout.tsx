// MUI Imports
import Button from '@mui/material/Button'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Context Imports
import { IntersectionProvider } from '@/contexts/intersectionContext'

// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import FrontLayout from '@components/layout/front-pages'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'AiDareU - Platformnya Para Entrepreneur Indonesia',
  description:
    'Buat website toko online profesional tanpa coding dalam 5 menit. Gratis selamanya dengan AI Mentor, SEO otomatis, WhatsApp Report, Multi Payment Gateway. Domain gratis tersedia!',
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
      'Buat website toko online profesional tanpa coding dalam 5 menit. Gratis selamanya dengan AI Mentor, SEO otomatis, WhatsApp Report, Multi Payment Gateway.',
    siteName: 'AiDareU',
    images: [
      {
        url: 'https://aidareu.com/images/og-image.png',
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
      'Buat website toko online profesional tanpa coding dalam 5 menit. Gratis selamanya dengan AI Mentor, SEO otomatis, WhatsApp Report.',
    images: ['https://aidareu.com/images/og-image.png'],
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
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code'
  }
}

const Layout = async ({ children }: ChildrenType) => {
  // Vars
  const systemMode = await getSystemMode()

  return (
    <html id='__next' suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <Providers direction='ltr'>
          <BlankLayout systemMode={systemMode}>
            <IntersectionProvider>
              <FrontLayout>
                {children}
                <ScrollToTop className='mui-fixed'>
                  <Button
                    variant='contained'
                    className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'
                  >
                    <i className='tabler-arrow-up' />
                  </Button>
                </ScrollToTop>
              </FrontLayout>
            </IntersectionProvider>
          </BlankLayout>
        </Providers>
      </body>
    </html>
  )
}

export default Layout
