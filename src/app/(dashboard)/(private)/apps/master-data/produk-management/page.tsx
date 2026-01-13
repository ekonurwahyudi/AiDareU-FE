'use client'

// React Imports
import { Suspense } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

// Component Imports
import ProductManagementTable from './ProductManagementTable'
import ProductStatsCard from './ProductStatsCard'

const ProdukManagementPage = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            Product Management
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Kelola semua produk dari semua toko
          </Typography>
        </Grid>

        {/* Stats Cards */}
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={
            <div className="flex justify-center items-center p-8">
              <CircularProgress />
            </div>
          }>
            <ProductStatsCard />
          </Suspense>
        </Grid>

        {/* Product Table */}
        <Grid size={{ xs: 12 }}>
          <Suspense fallback={
            <div className="flex justify-center items-center p-8">
              <CircularProgress />
            </div>
          }>
            <ProductManagementTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default ProdukManagementPage
