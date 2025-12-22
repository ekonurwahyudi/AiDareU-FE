'use client'

import { GoogleReCaptchaProvider as Provider } from 'react-google-recaptcha-v3'
import type { ReactNode } from 'react'

interface GoogleReCaptchaProviderProps {
  children: ReactNode
}

const GoogleReCaptchaProvider = ({ children }: GoogleReCaptchaProviderProps) => {
  const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LcoGjMsAAAAALCG1dUf-ClAiZGzzCe0fPjs98OC'

  return (
    <Provider
      reCaptchaKey={reCaptchaSiteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      {children}
    </Provider>
  )
}

export default GoogleReCaptchaProvider
