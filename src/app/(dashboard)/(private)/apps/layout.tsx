'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Box from '@mui/material/Box'

// Component Imports
import StoreWarningBanner from '@/components/store-setup/StoreWarningBanner'

interface AppsLayoutProps {
  children: ReactNode
}

const AppsLayout = ({ children }: AppsLayoutProps) => {
  return (
    <Box>
      <StoreWarningBanner />
      {children}
    </Box>
  )
}

export default AppsLayout
