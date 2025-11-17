'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import CongratulationsAll from './CongratulationsAll'
import DashboardAllContent from './DashboardAllContent'

const DashboardAllClient = () => {
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [popularProducts, setPopularProducts] = useState<any>(null)
  const [popularStores, setPopularStores] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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

      // Fetch all dashboard data in parallel - without store_uuid filter
      const [statsRes, revenueRes, productsRes, storesRes] = await Promise.allSettled([
        fetch(`${apiUrl}/dashboard/stats/all`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${apiUrl}/dashboard/revenue/all`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${apiUrl}/dashboard/popular-products/all?limit=5`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        }),
        fetch(`${apiUrl}/dashboard/popular-stores/all?limit=5`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })
      ])

      // Process stats
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json()
        console.log('Stats Response:', statsData)
        if (statsData.status === 'success') {
          setDashboardStats(statsData.data)
        }
      } else {
        console.error('Stats failed:', statsRes)
      }

      // Process revenue
      if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
        const revData = await revenueRes.value.json()
        console.log('Revenue Response:', revData)
        if (revData.status === 'success' && revData.data) {
          setRevenueData(revData.data)
        } else {
          console.warn('Revenue data is empty or failed:', revData)
        }
      } else {
        console.error('Revenue failed:', revenueRes)
      }

      // Process popular products
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const prodData = await productsRes.value.json()
        console.log('Popular Products Response:', prodData)
        if (prodData.status === 'success' && prodData.data) {
          setPopularProducts(prodData.data)
        } else {
          console.warn('Popular Products data is empty or failed:', prodData)
        }
      } else {
        console.error('Popular Products failed:', productsRes)
      }

      // Process popular stores
      if (storesRes.status === 'fulfilled' && storesRes.value.ok) {
        const storesData = await storesRes.value.json()
        console.log('Popular Stores Response:', storesData)
        if (storesData.status === 'success' && storesData.data) {
          setPopularStores(storesData.data)
        } else {
          console.warn('Popular Stores data is empty or failed:', storesData)
        }
      } else {
        console.error('Popular Stores failed:', storesRes)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent className='flex flex-col gap-4'>
              <Skeleton variant='text' width={180} height={28} />
              <Skeleton variant='text' width='100%' height={24} />
              <Skeleton variant='rounded' width='100%' height={120} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={100} height={40} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Skeleton variant='text' width={120} height={24} />
              <Skeleton variant='text' width={100} height={40} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const totalBillingRevenue = dashboardStats?.total_revenue || 0

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <CongratulationsAll
          userName="Admin"
          totalRevenue={totalBillingRevenue}
        />
      </Grid>
      <DashboardAllContent
        dashboardStats={dashboardStats}
        revenueData={revenueData}
        popularProducts={popularProducts}
        popularStores={popularStores}
      />
    </Grid>
  )
}

export default DashboardAllClient
