// Component Imports
import LandingPageWrapper from '@views/front-pages/landing-page'

const LandingPage = async () => {
  // Force light mode for landing page to ensure readability
  // Dark mode causes visibility issues with the design
  const mode = 'light'

  return <LandingPageWrapper mode={mode} />
}

export default LandingPage
