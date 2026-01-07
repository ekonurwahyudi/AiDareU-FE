'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Pagination from '@mui/material/Pagination'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Popover from '@mui/material/Popover'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

// Icon Imports
import { Icon } from '@iconify/react'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Type Imports
interface CoinTransaction {
  id: number
  keterangan: string
  coin_masuk: number
  coin_keluar: number
  status: 'berhasil' | 'pending' | 'gagal'
  created_at: string
}

interface CoinSummary {
  coin_saat_ini: number
  total_coin_masuk: number
  total_coin_keluar: number
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const CoinAiDareU = () => {
  // States
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [summary, setSummary] = useState<CoinSummary>({
    coin_saat_ini: 0,
    total_coin_masuk: 0,
    total_coin_keluar: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [dateRangeAnchor, setDateRangeAnchor] = useState<null | HTMLElement>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })

  // Get backend URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // Convert Date to string format for API
  const formatDateForAPI = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        console.error('No auth token found')
        return
      }

      const params = new URLSearchParams()

      const startDate = formatDateForAPI(dateRange[0])
      const endDate = formatDateForAPI(dateRange[1])

      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`${backendUrl}/api/coins/summary?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch summary')
      }

      const result = await response.json()

      if (result.success) {
        setSummary(result.data)
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  // Fetch transactions data
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        setError('Authentication required. Please login.')
        setLoading(false)
        return
      }

      const params = new URLSearchParams()

      params.append('page', (page + 1).toString())
      params.append('per_page', rowsPerPage.toString())

      if (search) params.append('search', search)

      const startDate = formatDateForAPI(dateRange[0])
      const endDate = formatDateForAPI(dateRange[1])

      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`${backendUrl}/api/coins?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()

      if (result.success) {
        setTransactions(result.data.data)
        setPagination({
          current_page: result.data.current_page,
          last_page: result.data.last_page,
          per_page: result.data.per_page,
          total: result.data.total
        })
      } else {
        throw new Error(result.message || 'Failed to fetch transactions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Effects
  useEffect(() => {
    fetchTransactions()
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage])

  // Handle search submit
  const handleSearchSubmit = () => {
    setPage(0)
    fetchTransactions()
    fetchSummary()
  }

  // Handle filter reset
  const handleResetFilter = () => {
    setSearch('')
    setDateRange([null, null])
    setPage(0)
    setTimeout(() => {
      fetchTransactions()
      fetchSummary()
    }, 100)
  }

  // Format date range display
  const formatDateRangeDisplay = () => {
    const [start, end] = dateRange
    if (!start && !end) return 'Pilih Range Tanggal'

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    if (start && end) {
      return `${formatDate(start)} - ${formatDate(end)}`
    } else if (start) {
      return `${formatDate(start)} - ...`
    }
    return 'Pilih Range Tanggal'
  }

  // Handle export
  const handleExport = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        alert('Authentication required. Please login.')
        return
      }

      const params = new URLSearchParams()

      const startDate = formatDateForAPI(dateRange[0])
      const endDate = formatDateForAPI(dateRange[1])

      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      // Create a temporary link and trigger download
      const response = await fetch(`${backendUrl}/api/coins/export?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'text/csv'
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')

        a.href = url
        a.download = `coin_transactions_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export data')
      }
    } catch (err) {
      console.error('Error exporting:', err)
      alert('Error exporting data')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)

    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'berhasil':
        return 'success'
      case 'pending':
        return 'warning'
      case 'gagal':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Coin AiDareU
        </Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='warning' sx={{ width: 56, height: 56 }}>
                <Icon icon='mdi:coins' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'warning.main' }}>
                 🪙 {formatNumber(summary.coin_saat_ini)} Pts
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Coin Saat Ini
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='success' sx={{ width: 56, height: 56 }}>
                <Icon icon='mdi:arrow-down-circle' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'success.main' }}>
                  🪙 + {formatNumber(summary.total_coin_masuk)} Pts
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Coin Masuk
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='error' sx={{ width: 56, height: 56 }}>
                <Icon icon='mdi:arrow-up-circle' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'error.main' }}>
                🪙 - {formatNumber(summary.total_coin_keluar)} Pts
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Coin Keluar
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Table with Filters */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Riwayat Transaksi Coin'
            action={
              <Button variant='outlined' onClick={handleExport} startIcon={<Icon icon='mdi:download' />}>
                Export Report
              </Button>
            }
            sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
          />
          <Divider />

          <CardContent>
            {/* Filter Row */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left Side - Rows Per Page */}
              <CustomTextField
                select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(0)
                }}
                sx={{ minWidth: 100 }}
                size='small'
              >
                <MenuItem value={10}>Show 10</MenuItem>
                <MenuItem value={50}>Show 50</MenuItem>
                <MenuItem value={100}>Show 100</MenuItem>
              </CustomTextField>

              {/* Right Side - Search and Filters */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                  size='small'
                  placeholder='Cari keterangan...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit()
                    }
                  }}
                  sx={{ minWidth: 220 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mdi:magnify' fontSize={18} />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Date Range Picker */}
                <Button
                  variant='outlined'
                  size='small'
                  onClick={e => setDateRangeAnchor(e.currentTarget)}
                  startIcon={<Icon icon='mdi:calendar' fontSize={18} />}
                  sx={{
                    minWidth: 200,
                    height: '40px',
                    px: 1.5,
                    fontSize: '0.875rem'
                  }}
                >
                  {formatDateRangeDisplay()}
                </Button>

                <Popover
                  open={Boolean(dateRangeAnchor)}
                  anchorEl={dateRangeAnchor}
                  onClose={() => setDateRangeAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                  <Box sx={{ p: 2.5, minWidth: 340 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2, fontSize: '0.875rem', fontWeight: 600 }}>
                      Pilih Range Tanggal
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <TextField
                        fullWidth
                        type='date'
                        label='Dari Tanggal'
                        value={dateRange[0] ? formatDateForAPI(dateRange[0]) : ''}
                        onChange={e => {
                          const newDate = e.target.value ? new Date(e.target.value) : null
                          setDateRange([newDate, dateRange[1]])
                        }}
                        InputLabelProps={{ shrink: true }}
                        size='small'
                        sx={{
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiInputBase-input': {
                            fontSize: '0.875rem',
                            py: 1,
                            height: '40px',
                            boxSizing: 'border-box'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                      <TextField
                        fullWidth
                        type='date'
                        label='Sampai Tanggal'
                        value={dateRange[1] ? formatDateForAPI(dateRange[1]) : ''}
                        onChange={e => {
                          const newDate = e.target.value ? new Date(e.target.value) : null
                          setDateRange([dateRange[0], newDate])
                        }}
                        InputLabelProps={{ shrink: true }}
                        size='small'
                        sx={{
                          '& .MuiInputBase-root': {
                            height: '40px'
                          },
                          '& .MuiInputBase-input': {
                            fontSize: '0.875rem',
                            py: 1,
                            height: '40px',
                            boxSizing: 'border-box'
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 3, justifyContent: 'flex-end' }}>
                      <Button
                        size='small'
                        onClick={() => {
                          setDateRange([null, null])
                          setDateRangeAnchor(null)
                        }}
                        sx={{
                          fontSize: '0.8125rem',
                          px: 2.5,
                          py: 0.75,
                          minWidth: 80,
                          textTransform: 'none'
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        size='small'
                        variant='contained'
                        onClick={() => {
                          setDateRangeAnchor(null)
                          handleSearchSubmit()
                        }}
                        sx={{
                          fontSize: '0.8125rem',
                          px: 2.5,
                          py: 0.75,
                          minWidth: 80,
                          textTransform: 'none'
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  </Box>
                </Popover>

                {/* Filter & Reset Buttons */}
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleSearchSubmit}
                  startIcon={<Icon icon='mdi:filter' fontSize={18} />}
                  sx={{ height: '40px', px: 2.5, fontSize: '0.875rem' }}
                >
                  Filter
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleResetFilter}
                  startIcon={<Icon icon='mdi:refresh' fontSize={18} />}
                  sx={{ height: '40px', px: 2.5, fontSize: '0.875rem' }}
                >
                  Reset
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity='error' sx={{ mb: 4 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>NO</th>
                        <th>KETERANGAN</th>
                        <th align='right'>COIN MASUK/KELUAR</th>
                        <th>STATUS</th>
                        <th>TGL TRANSAKSI</th>
                      </tr>
                    </thead>
                    {transactions.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan={5} className='text-center'>
                            <Typography variant='body2' color='text.secondary'>
                              Tidak ada data transaksi
                            </Typography>
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody>
                        {transactions.map((transaction, index) => (
                          <tr key={transaction.id}>
                            <td>{page * rowsPerPage + index + 1}</td>
                            <td>{transaction.keterangan}</td>
                            <td align='right'>
                              {transaction.coin_masuk > 0 ? (
                                <Typography variant='body2' sx={{ fontWeight: 600, color: 'success.main' }}>
                                  🪙 + {formatNumber(transaction.coin_masuk)} Pts
                                </Typography>
                              ) : (
                                <Typography variant='body2' sx={{ fontWeight: 600, color: 'error.main' }}>
                                  🪙 - {formatNumber(transaction.coin_keluar)} Pts
                                </Typography>
                              )}
                            </td>
                            <td>
                              <Chip
                                label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                color={getStatusColor(transaction.status)}
                                size='small'
                                variant='tonal'
                              />
                            </td>
                            <td>{formatDate(transaction.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>

                {/* Custom Pagination */}
                <Box className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
                  <Typography color='text.disabled' sx={{ fontSize: '0.8125rem' }}>
                    {`Showing ${pagination.total === 0 ? 0 : page * rowsPerPage + 1} to ${Math.min(
                      (page + 1) * rowsPerPage,
                      pagination.total
                    )} of ${pagination.total} entries`}
                  </Typography>
                  <Pagination
                    shape='rounded'
                    color='primary'
                    variant='tonal'
                    count={pagination.last_page}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CoinAiDareU
