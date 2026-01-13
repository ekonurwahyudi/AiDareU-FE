'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

// Component Imports
import PlatformManagementTable from './PlatformManagementTable'

const PlatformManagementPage = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={
            <div className="flex justify-center items-center p-8">
              <CircularProgress />
            </div>
          }>
            <PlatformManagementTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default PlatformManagementPage
