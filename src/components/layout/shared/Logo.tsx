'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// Third-party Imports
import styled from '@emotion/styled'

// Type Imports
import type { VerticalNavContextProps } from '@menu/contexts/verticalNavContext'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

type LogoTextProps = {
  isHovered?: VerticalNavContextProps['isHovered']
  isCollapsed?: VerticalNavContextProps['isCollapsed']
  transitionDuration?: VerticalNavContextProps['transitionDuration']
  isBreakpointReached?: VerticalNavContextProps['isBreakpointReached']
  color?: CSSProperties['color']
}

const LogoText = styled.span<LogoTextProps>`
  color: ${({ color }) => color ?? 'var(--mui-palette-text-primary)'};
  font-size: 1.375rem;
  line-height: 1.09091;
  font-weight: 700;
  letter-spacing: 0.25px;
  transition: ${({ transitionDuration }) =>
    `margin-inline-start ${transitionDuration}ms ease-in-out, opacity ${transitionDuration}ms ease-in-out`};

  ${({ isHovered, isCollapsed, isBreakpointReached }) =>
    !isBreakpointReached && isCollapsed && !isHovered
      ? 'opacity: 0; margin-inline-start: 0;'
      : 'opacity: 1; margin-inline-start: 12px;'}
`

type PlatformpreneurData = {
  username: string
  judul: string
  perusahaan: string
  logo: string | null
  logo_footer: string | null
}

const Logo = ({ color }: { color?: CSSProperties['color'] }) => {
  // Refs
  const logoTextRef = useRef<HTMLSpanElement>(null)

  // States
  const [platformpreneur, setPlatformpreneur] = useState<PlatformpreneurData | null>(null)
  const [logoError, setLogoError] = useState(false)

  // Hooks
  const { isHovered, transitionDuration, isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()

  // Vars
  const { layout } = settings

  useEffect(() => {
    // Get platformpreneur data from user profile
    const fetchPlatformpreneur = async () => {
      try {
        const authToken = localStorage.getItem('auth_token')
        if (!authToken) return

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json'
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.user?.platformpreneur) {
            setPlatformpreneur(result.user.platformpreneur)
          }
        }
      } catch (error) {
        // Silently fail - will show default logo
      }
    }

    fetchPlatformpreneur()
  }, [])

  useEffect(() => {
    if (layout !== 'collapsed') {
      return
    }

    if (logoTextRef && logoTextRef.current) {
      if (!isBreakpointReached && layout === 'collapsed' && !isHovered) {
        logoTextRef.current?.classList.add('hidden')
      } else {
        logoTextRef.current.classList.remove('hidden')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, layout, isBreakpointReached])

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  const showPlatformpreneurLogo = platformpreneur?.logo && !logoError

  return (
    <div className='flex items-center'>
      {showPlatformpreneurLogo ? (
        <img
          src={`${backendUrl}/storage/${platformpreneur.logo}`}
          alt={platformpreneur.perusahaan || 'Partner Logo'}
          className='h-8 object-contain'
          style={{ maxWidth: '120px' }}
          onError={() => setLogoError(true)}
        />
      ) : (
        <>
          <img
            src='/images/front-pages/landing-page/icon.png'
            alt='AiDareU Logo'
            className='w-8 h-8 object-contain'
          />
          <LogoText
            color={color}
            ref={logoTextRef}
            isHovered={isHovered}
            isCollapsed={layout === 'collapsed'}
            transitionDuration={transitionDuration}
            isBreakpointReached={isBreakpointReached}
          >
            {themeConfig.templateName}
          </LogoText>
        </>
      )}
    </div>
  )
}

export default Logo
