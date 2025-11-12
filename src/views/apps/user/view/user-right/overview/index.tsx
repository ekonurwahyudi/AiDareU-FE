'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import TokoSaya from './TokoSaya'
import DomainToko from './DomainToko'
import Pixel from './Pixel'

const OverViewTab = ({ storeUuid }: { storeUuid?: string | null }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <TokoSaya storeUuid={storeUuid} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <DomainToko storeUuid={storeUuid} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Pixel storeUuid={storeUuid} />
      </Grid>
      <Grid size={{ xs: 12 }}>
      </Grid>
    </Grid>
  )
}

export default OverViewTab
