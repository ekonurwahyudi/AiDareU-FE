import { Suspense } from 'react'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import VoucherTable from './VoucherTable'

// Context Imports
import { RBACProvider } from '@/contexts/rbacContext'

const VoucherManagementPage = () => {
  return (
    <RBACProvider>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Suspense fallback={<CircularProgress />}>
            <VoucherTable />
          </Suspense>
        </Grid>
      </Grid>
    </RBACProvider>
  )
}

export default VoucherManagementPage
