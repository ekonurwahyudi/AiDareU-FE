'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
type PopularStoreType = {
  uuid: string
  name: string
  total_orders: number
  total_revenue: number
}

const PopularStores = ({ stores }: { stores?: PopularStoreType[] | null }) => {
  console.log('PopularStores received data:', stores)

  // States
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
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

  return (
    <Card>
      <CardHeader
        title='Toko Populer'
        subheader={`Total ${stores?.length || 0} Toko`}
        action={
          <IconButton onClick={handleClick}>
            <i className='tabler-dots-vertical text-textPrimary' />
          </IconButton>
        }
      />
      <Menu
        keepMounted
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleClose}>Refresh</MenuItem>
        <MenuItem onClick={handleClose}>Download</MenuItem>
      </Menu>
      <CardContent className='flex flex-col gap-6'>
        {!stores || stores.length === 0 ? (
          <Typography color='text.secondary' className='text-center'>
            Belum ada data toko populer
          </Typography>
        ) : (
          stores.map((store, index) => (
            <div key={store.uuid} className='flex items-center gap-4'>
              <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary-100'>
                <i className='tabler-building-store text-primary text-xl' />
              </div>
              <div className='flex flex-col flex-1'>
                <Typography variant='body2' className='font-medium'>
                  {store.name}
                </Typography>
                <div className='flex items-center gap-2'>
                  <Typography variant='caption' color='text.secondary'>
                    {store.total_orders} Orders
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    • {formatCurrency(store.total_revenue)}
                  </Typography>
                </div>
              </div>
              <Typography variant='body2' className='font-medium text-primary'>
                #{index + 1}
              </Typography>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default PopularStores
