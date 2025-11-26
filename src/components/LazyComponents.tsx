'use client'

import dynamic from 'next/dynamic'
import { Skeleton, Box } from '@mui/material'

// Loading component
const LoadingBox = ({ height = 400 }: { height?: number }) => (
  <Box sx={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton variant="rectangular" width="100%" height="100%" />
  </Box>
)

// Lazy load StoreFooter
export const LazyStoreFooter = dynamic(() => import('@/components/store/StoreFooter'), {
  loading: () => <LoadingBox height={200} />,
  ssr: true
})

// Lazy load CartDrawer
export const LazyCartDrawer = dynamic(() => import('@/components/store/CartDrawer'), {
  loading: () => null,
  ssr: false
})

// Lazy load Rating component (not immediately visible)
export const LazyRating = dynamic(() => import('@mui/material/Rating'), {
  loading: () => <Skeleton variant="rectangular" width={100} height={20} />,
  ssr: false
})

// Lazy load heavy MUI components
export const LazyCollapse = dynamic(() => import('@mui/material/Collapse'), {
  ssr: false
})

export default {
  LazyStoreFooter,
  LazyCartDrawer,
  LazyRating,
  LazyCollapse
}
