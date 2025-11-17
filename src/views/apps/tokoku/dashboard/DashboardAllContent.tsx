'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Components Imports
import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
import CardStatVertical from '@/components/card-statistics/Vertical'
import RevenueReport from '@/views/apps/tokoku/dashboard/RevenueReport'
import PopularProducts from '@/views/apps/tokoku/dashboard/PopularProducts'
import PopularStores from '@/views/apps/tokoku/dashboard/PopularStores'

interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_products: number
  total_customers: number
  total_stores: number
  orders_growth?: number
  revenue_growth?: number
  products_growth?: number
  customers_growth?: number
  stores_growth?: number
}

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface PopularProduct {
  uuid: string
  name: string
  image: string | null
  total_sold: number
  revenue: number
}

interface PopularStore {
  uuid: string
  name: string
  total_orders: number
  total_revenue: number
}

interface DashboardContentProps {
  dashboardStats?: DashboardStats | null
  revenueData?: RevenueData[] | null
  popularProducts?: PopularProduct[] | null
  popularStores?: PopularStore[] | null
}

const DashboardAllContent = ({ dashboardStats, revenueData, popularProducts, popularStores }: DashboardContentProps) => {
  // Safe access with defaults
  const stats = dashboardStats || {
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
    total_customers: 0,
    total_stores: 0,
    orders_growth: 0,
    revenue_growth: 0,
    products_growth: 0,
    customers_growth: 0,
    stores_growth: 0
  }

  // Format currency
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  // Format growth percentage
  const formatGrowth = (growth: number = 0) => {
    const safeGrowth = growth || 0

    return `${safeGrowth > 0 ? '+' : ''}${safeGrowth.toFixed(1)}%`
  }

  return (
    <>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2, xl: 2 }}>
        <DistributedBarChartOrder orders={stats.total_orders || 0} growth={0} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2, xl: 2 }}>
        <LineAreaYearlySalesChart customers={stats.total_customers || 0} growth={0} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2, xl: 2 }}>
        <CardStatVertical
          title='Total Product'
          stats={`${stats.total_products || 0} Produk`}
          avatarColor='error'
          avatarIcon='tabler-package'
          avatarSkin='light'
          avatarSize={44}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2, xl: 2 }}>
        <CardStatVertical
          title='Total Stores'
          stats={`${stats.total_stores || 0} Toko`}
          avatarColor='primary'
          avatarIcon='tabler-building-store'
          avatarSkin='light'
          avatarSize={44}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <RevenueReport revenueData={revenueData || []} />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <PopularProducts products={popularProducts} />
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <PopularStores stores={popularStores} />
      </Grid>
    </>
  )
}

export default DashboardAllContent
