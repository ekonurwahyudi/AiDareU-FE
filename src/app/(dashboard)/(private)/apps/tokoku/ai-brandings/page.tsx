// React Imports
import type { ReactElement } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// Component Imports
import AIBrandingSettings from '@/views/apps/tokoku/ai-brandings'

const AILogoTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-logo'))
const AIProductPhotoTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-product-photo'))
const AIFashionPhotoTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-fashion-photo'))
const AIMergePhotoTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-merge-photo'))
const AIBannerTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-banner'))
const AIPhotoToVideoTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-photo-to-video'))
const AICopywritingTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-copywriting'))
const AIMarketingTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-marketing'))
const AIAdsAnalyticsTab = dynamic(() => import('@/views/apps/tokoku/ai-brandings/ai-ads-analytics'))

// Vars
const tabContentList = (): { [key: string]: ReactElement } => ({
  'ai-logo': <AILogoTab />,
  'ai-product-photo': <AIProductPhotoTab />,
  'ai-fashion-photo': <AIFashionPhotoTab />,
  'ai-merge-photo': <AIMergePhotoTab />,
  'ai-banner': <AIBannerTab />,
  'ai-photo-to-video': <AIPhotoToVideoTab />,
  'ai-copywriting': <AICopywritingTab />,
  'ai-marketing': <AIMarketingTab />,
  'ai-ads-analytics': <AIAdsAnalyticsTab />
})

const AIBrandingPage = () => {
  return <AIBrandingSettings tabContentList={tabContentList()} />
}

export default AIBrandingPage
