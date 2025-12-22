'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import * as gtag from '@/lib/gtag'

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      gtag.pageview(url)
    }
  }, [pathname, searchParams])

  return null
}
