'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

const AIBannerTab = () => {
  return (
    <Box>
      <Typography variant='h4' sx={{ fontWeight: 600, mb: 2 }}>
        AI Banner & Ads Creative
      </Typography>
      <Alert severity='info'>Fitur ini akan segera hadir!</Alert>
    </Box>
  )
}

export default AIBannerTab
