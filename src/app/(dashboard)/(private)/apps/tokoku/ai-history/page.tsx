'use client'

import { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Chip from '@mui/material/Chip'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'

interface AiHistory {
  id: number
  keterangan: string
  hasil_generated: string
  coin_used: number
  created_at: string
}

interface PaginationType {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const AIHistoryPage = () => {
  const [histories, setHistories] = useState<AiHistory[]>([])
  const [pagination, setPagination] = useState<PaginationType>({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(12)
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
            per_page: result.data.per_page || 12,
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
      // Extract filename from URL or use keterangan
      const urlParts = imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]

      // Determine file extension from URL or default to png
      const extension = filename.includes('.') ? filename.split('.').pop() : 'png'

      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${keterangan.replace(/\s+/g, '_')}_${Date.now()}.${extension}`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    setOpenPreview(true)
  }

  const getAiType = (keterangan: string): string => {
    if (keterangan.toLowerCase().includes('logo')) {
      return 'AiDareU/Logo'
    } else if (keterangan.toLowerCase().includes('foto produk') || keterangan.toLowerCase().includes('product')) {
      return 'AiDareU/Photo-Product'
    } else if (keterangan.toLowerCase().includes('fashion')) {
      return 'AiDareU/Photo-Fashion'
    } else if (keterangan.toLowerCase().includes('merge') || keterangan.toLowerCase().includes('gabung')) {
      return 'AiDareU/Photo-Merge'
    }
    return 'AiDareU/Generated'
  }

  const isLogoType = (keterangan: string): boolean => {
    return keterangan.toLowerCase().includes('logo')
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
                mb: 4,
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {/* Left Side - Items Per Page */}
              <CustomTextField
                select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(0)
                }}
                sx={{ minWidth: 120 }}
                size='small'
              >
                <MenuItem value={12}>Show 12</MenuItem>
                <MenuItem value={24}>Show 24</MenuItem>
                <MenuItem value={48}>Show 48</MenuItem>
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

            {/* Gallery Grid */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : histories.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Typography color='text.secondary'>Tidak ada riwayat AI generation</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {histories.map(history => {
                  const isLogo = isLogoType(history.keterangan)
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={history.id}>
                      <Card
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        {/* Image Container */}
                        <Box
                          sx={{
                            position: 'relative',
                            paddingTop: '100%',
                            overflow: 'hidden',
                            bgcolor: isLogo ? 'white' : 'action.hover'
                          }}
                          onClick={() => handlePreview(history.hasil_generated)}
                        >
                          <Box
                            component='img'
                            src={history.hasil_generated}
                            alt={history.keterangan}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: isLogo ? 'contain' : 'cover',
                              padding: isLogo ? 2 : 0
                            }}
                          />

                        {/* Download Button Overlay */}
                        <IconButton
                          onClick={e => {
                            e.stopPropagation()
                            handleDownload(history.hasil_generated, history.keterangan)
                          }}
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            bgcolor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.8)'
                            }
                          }}
                          size='small'
                        >
                          <Icon icon='mdi:download' fontSize={20} />
                        </IconButton>

                        {/* Coin Badge */}
                        <Chip
                          label={`${history.coin_used} Pts`}
                          size='small'
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(245, 158, 11, 0.9)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>

                        {/* Card Content */}
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography
                              variant='body2'
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: '0.875rem'
                              }}
                            >
                              {getAiType(history.keterangan)}
                            </Typography>
                            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                              {new Date(history.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            )}

            {/* Pagination */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 4,
                gap: 2
              }}
            >
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
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='lg' fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'white' }}>
          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={() => setOpenPreview(false)}
          >
            <Icon icon='mdi:close' />
          </IconButton>
          {previewImage && (
            <Box
              component='img'
              src={previewImage}
              alt='Preview'
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  )
}

export default AIHistoryPage
