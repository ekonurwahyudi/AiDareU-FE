'use client'

import { useState } from 'react'

// MUI Imports
import { Box, Container, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#1F2937',
  color: 'white',
  padding: theme.spacing(3, 0),
  marginTop: 'auto'
}))

type PlatformpreneurData = {
  username: string
  judul: string
  perusahaan: string
  logo: string | null
  logo_footer: string | null
  domain?: string | null
}

interface StoreFooterProps {
  platformpreneur?: PlatformpreneurData | null
}

const StoreFooter = ({ platformpreneur }: StoreFooterProps) => {
  const [logoError, setLogoError] = useState(false)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  
  const showPlatformpreneurLogo = platformpreneur?.logo_footer && !logoError

  // Build the link URL from domain
  const getDomainUrl = (domain: string | null | undefined) => {
    if (!domain) return null
    // If domain doesn't have protocol, add https://
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      return domain
    }
    return `https://${domain}`
  }

  const domainUrl = getDomainUrl(platformpreneur?.domain)

  return (
    <FooterContainer>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          {showPlatformpreneurLogo ? (
            <>
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Powered by
              </Typography>
              {domainUrl ? (
                <a href={domainUrl} target="_blank" rel="noopener noreferrer">
                  <Box
                    component="img"
                    src={`${backendUrl}/storage/${platformpreneur.logo_footer}`}
                    alt={platformpreneur.perusahaan || 'Partner'}
                    sx={{
                      height: '24px',
                      maxWidth: '100px',
                      objectFit: 'contain',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      '&:hover': { opacity: 0.8 }
                    }}
                    onError={() => setLogoError(true)}
                  />
                </a>
              ) : (
                <Box
                  component="img"
                  src={`${backendUrl}/storage/${platformpreneur.logo_footer}`}
                  alt={platformpreneur.perusahaan || 'Partner'}
                  sx={{
                    height: '24px',
                    maxWidth: '100px',
                    objectFit: 'contain'
                  }}
                  onError={() => setLogoError(true)}
                />
              )}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
              Made with ❤️ by <a href="https://aidareu.com" target="_blank" rel="noopener noreferrer" style={{ color: '#9CA3AF' }}>AiDareU</a>
            </Typography>
          )}
        </Box>
      </Container>
    </FooterContainer>
  )
}

export default StoreFooter
