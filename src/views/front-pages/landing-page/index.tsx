'use client'

// React Imports
import { useEffect } from 'react'

// Component Imports
import HeroSection from './HeroSection'
// import TrustedBy from './TrustedBy'
import UsefulFeature from './UsefulFeature'
import CustomerReviews from './CustomerReviews'
import ProductStat from './ProductStat'
import Faqs from './Faqs'
import GetStarted from './GetStarted'
import { useSettings } from '@core/hooks/useSettings'

const LandingPageWrapper = () => {
  // Hooks
  const { updatePageSettings } = useSettings()

  // Always use light mode for landing page
  const mode = 'light'

  // For Page specific settings
  useEffect(() => {
    return updatePageSettings({
      skin: 'default'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className='bg-backgroundPaper'
      style={{
        backgroundColor: '#ffffff',
        color: '#000000',
        minHeight: '100vh'
      }}
    >
      <HeroSection mode={mode} />
      {/* <TrustedBy /> */}
      <UsefulFeature />
      <ProductStat />
      <CustomerReviews />
      <Faqs />
      <GetStarted mode={mode} />
    </div>
  )
}

export default LandingPageWrapper
