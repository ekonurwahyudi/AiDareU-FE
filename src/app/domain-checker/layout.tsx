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
  title: 'Cek Domain - AiDareU',
  description:
    'Cek ketersediaan domain untuk bisnis online Anda. Domain gratis untuk .web.id, .biz.id, dan .my.id. Proses cepat dan mudah.',
  keywords: [
    'cek domain',
    'domain gratis',
    'web.id gratis',
    'biz.id gratis',
    'my.id gratis',
    'domain checker indonesia',
    'domain murah',
    'beli domain'
  ],
  authors: [{ name: 'AiDareU', url: 'https://aidareu.com' }],
  creator: 'AiDareU',
  publisher: 'AiDareU',
  metadataBase: new URL('https://aidareu.com'),
  alternates: {
    canonical: 'https://aidareu.com/domain-checker'
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://aidareu.com/domain-checker',
    title: 'Cek Domain - AiDareU',
    description:
      'Cek ketersediaan domain untuk bisnis online Anda. Domain gratis untuk .web.id, .biz.id, dan .my.id. Proses cepat dan mudah.',
    siteName: 'AiDareU',
    images: [
      {
        url: '/images/front-pages/landing-page/hero-dashboard-light.png',
        width: 1200,
        height: 630,
        alt: 'Cek Domain - AiDareU'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cek Domain - AiDareU',
    description:
      'Cek ketersediaan domain untuk bisnis online Anda. Domain gratis untuk .web.id, .biz.id, dan .my.id. Proses cepat dan mudah.',
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
