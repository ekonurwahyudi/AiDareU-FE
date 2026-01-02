'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Pagination from '@mui/material/Pagination'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'

interface AiHistory {
  id: number
  keterangan: string
  hasil_generated: string
  coin_used: number
  created_at: string
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const AIHistoryPage = () => {
  const [histories, setHistories] = useState<AiHistory[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [openPreview, setOpenPreview] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchHistories()
  }, [page, rowsPerPage, search])

  const fetchHistories = async () => {
    try {
      setLoading(true)
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        console.error('No auth token found')
        return
      }

      const params = new URLSearchParams({
        page: (page + 1).toString(),
        per_page: rowsPerPage.toString(),
        ...(search && { search })
      })

      const response = await fetch(`${backendUrl}/api/ai-history?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setHistories(result.data.data || [])
          setPagination({
            current_page: result.data.current_page || 1,
            last_page: result.data.last_page || 1,
            per_page: result.data.per_page || 10,
            total: result.data.total || 0
          })
        }
      } else {
        console.error('Failed to fetch histories')
      }
    } catch (error) {
      console.error('Error fetching histories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = () => {
    setSearch(searchInput)
    setPage(0)
  }

  const handleReset = () => {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  const handleDownload = async (imageUrl: string, keterangan: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${keterangan.replace(/\s+/g, '_')}_${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    setOpenPreview(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus history ini?')) {
      return
    }

    try {
      const authToken = localStorage.getItem('auth_token')

      if (!authToken) {
        console.error('No auth token found')
        return
      }

      const response = await fetch(`${backendUrl}/api/ai-history/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        fetchHistories()
      } else {
        console.error('Failed to delete history')
      }
    } catch (error) {
      console.error('Error deleting history:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant='h4' sx={{ fontWeight: 600 }}>
                Riwayat AI Generation
              </Typography>
            </Box>

            {/* Filter Section */}
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                mb: 3,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
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
                <TextField
                  size='small'
                  placeholder='Cari keterangan...'
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit()
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-root': { height: '40px' },
                    '& .MuiInputBase-input': { fontSize: '0.875rem', py: 1 }
                  }}
                />
                <Button
                  variant='contained'
                  onClick={handleSearchSubmit}
                  startIcon={<Icon icon='mdi:magnify' />}
                  sx={{
                    height: '40px',
                    px: 2.5,
                    fontSize: '0.875rem',
                    textTransform: 'none'
                  }}
                >
                  Cari
                </Button>
                <Button
                  variant='outlined'
                  onClick={handleReset}
                  startIcon={<Icon icon='mdi:refresh' />}
                  sx={{
                    height: '40px',
                    px: 2.5,
                    fontSize: '0.875rem',
                    textTransform: 'none'
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Box>

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead
                  sx={{
                    backgroundColor: 'error.main',
                    '& .MuiTableCell-root': {
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      py: 2
                    }
                  }}
                >
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Keterangan</TableCell>
                    <TableCell align='center'>Preview</TableCell>
                    <TableCell align='center'>Coin Digunakan</TableCell>
                    <TableCell align='center'>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
                        <Typography>Loading...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : histories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
                        <Typography>Tidak ada riwayat AI generation</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    histories.map((history, index) => (
                      <TableRow
                        key={history.id}
                        sx={{
                          backgroundColor: index % 2 === 0 ? 'action.hover' : 'transparent',
                          '&:hover': { backgroundColor: 'action.selected' }
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.875rem' }}>
                          {page * rowsPerPage + index + 1}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{formatDate(history.created_at)}</TableCell>
                        <TableCell sx={{ fontSize: '0.875rem' }}>{history.keterangan}</TableCell>
                        <TableCell align='center'>
                          <Box
                            component='img'
                            src={history.hasil_generated}
                            alt={history.keterangan}
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onClick={() => handlePreview(history.hasil_generated)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'warning.main' }}>
                            {history.coin_used} Pts
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={() => handleDownload(history.hasil_generated, history.keterangan)}
                              title='Download'
                            >
                              <Icon icon='mdi:download' fontSize={20} />
                            </IconButton>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleDelete(history.id)}
                              title='Hapus'
                            >
                              <Icon icon='mdi:delete' fontSize={20} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
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
          </CardContent>
        </Card>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='md' fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', zIndex: 1 }}
            onClick={() => setOpenPreview(false)}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          {previewImage && (
            <Box
              component='img'
              src={previewImage}
              alt='Preview'
              sx={{ width: '100%', height: 'auto', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default AIHistoryPage
