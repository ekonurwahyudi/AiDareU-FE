import { Suspense } from 'react'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import VoucherTable from './VoucherTable'

const VoucherManagementPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Suspense fallback={<CircularProgress />}>
          <VoucherTable />
        </Suspense>
      </Grid>
    </Grid>
  )
}

export default VoucherManagementPage
