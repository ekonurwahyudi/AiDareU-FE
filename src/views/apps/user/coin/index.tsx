'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
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
import TablePagination from '@mui/material/TablePagination'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

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
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        console.error('No auth token found')
        return
      }

      const params = new URLSearchParams()

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
    setStartDate('')
    setEndDate('')
    setPage(0)
    setTimeout(() => {
      fetchTransactions()
      fetchSummary()
    }, 100)
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
              <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ width: 56, height: 56 }}>
                <Icon icon='mdi:coins' fontSize={32} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatNumber(summary.coin_saat_ini)}
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
                  +{formatNumber(summary.total_coin_masuk)}
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
                  -{formatNumber(summary.total_coin_keluar)}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Coin Keluar
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Filter & Search */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  placeholder='Cari keterangan...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit()
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='mdi:magnify' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Dari Tanggal'
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Sampai Tanggal'
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button fullWidth variant='contained' onClick={handleSearchSubmit} startIcon={<Icon icon='mdi:filter' />}>
                    Filter
                  </Button>
                  <Button fullWidth variant='outlined' onClick={handleResetFilter} startIcon={<Icon icon='mdi:refresh' />}>
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Table */}
      <Grid size={{ xs: 12 }}>
        <Card>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, pb: 0 }}>
            <Typography variant='h5' sx={{ fontWeight: 600 }}>
              Riwayat Transaksi Coin
            </Typography>
            <Button variant='outlined' onClick={handleExport} startIcon={<Icon icon='mdi:download' />}>
              Export Report
            </Button>
          </Box>

          <CardContent>
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
                                  + Rp. {formatNumber(transaction.coin_masuk)}
                                </Typography>
                              ) : (
                                <Typography variant='body2' sx={{ fontWeight: 600, color: 'error.main' }}>
                                  - Rp. {formatNumber(transaction.coin_keluar)}
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

                <TablePagination
                  component='div'
                  count={pagination.total}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={e => {
                    setRowsPerPage(parseInt(e.target.value, 10))
                    setPage(0)
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CoinAiDareU
