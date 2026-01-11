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
import OrderListTable from '@/views/apps/tokoku/orders/list/OrderListTable'

const TokokuOrdersList = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Typography variant='h4' sx={{ fontWeight: 600 }}>
            My Orders
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Kelola semua pesanan toko Anda
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Suspense fallback={
            <div className="flex justify-center items-center p-8">
              <CircularProgress />
            </div>
          }>
            <OrderListTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default TokokuOrdersList
