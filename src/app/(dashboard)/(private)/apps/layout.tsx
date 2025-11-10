'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Box from '@mui/material/Box'

// Component Imports
import StoreWarningBanner from '@/components/store-setup/StoreWarningBanner'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

interface AppsLayoutProps {
  children: ReactNode
}

const AppsLayout = ({ children }: AppsLayoutProps) => {
  return (
    <RBACProvider>
      <Box>
        <StoreWarningBanner />
        {children}
      </Box>
    </RBACProvider>
  )
}

export default AppsLayout
