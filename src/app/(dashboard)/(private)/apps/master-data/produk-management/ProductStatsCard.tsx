'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type ProductStats = {
  total: number
  active: number
  inactive: number
  draft: number
}

const ProductStatsCard = () => {
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Get auth headers
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

      // Add cache-busting parameter
      const response = await fetch(`${apiUrl}/products/stats?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers
      })

      if (response.ok) {
        const result = await response.json()
        if (result.status === 'success') {
          setStats(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  const statsData = [
    {
      title: 'Total Products',
      value: stats.total,
      icon: 'tabler-package',
      color: 'primary' as const
    },
    {
      title: 'Active Products',
      value: stats.active,
      icon: 'tabler-check',
      color: 'success' as const
    },
    {
      title: 'Inactive Products',
      value: stats.inactive,
      icon: 'tabler-x',
      color: 'error' as const
    },
    {
      title: 'Draft Products',
      value: stats.draft,
      icon: 'tabler-file-text',
      color: 'warning' as const
    }
  ]

  return (
    <Grid container spacing={6}>
      {statsData.map((item, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CustomAvatar skin='light' variant='rounded' color={item.color} sx={{ width: 56, height: 56 }}>
                  <i className={item.icon} style={{ fontSize: 28 }} />
                </CustomAvatar>
                <Box>
                  <Typography variant='h4' sx={{ fontWeight: 600, color: `${item.color}.main` }}>
                    {item.value}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {item.title}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default ProductStatsCard
