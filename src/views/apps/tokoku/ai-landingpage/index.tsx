'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import TopUpModal from '@/components/TopUpModal'

// Types
interface LandingPageResult {
  id: string
  uuid: string
  slug: string
  data: any
  thumbnail?: string
}

const AILandingPageView = () => {
  // States
  const [storeName, setStoreName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [landingPageResults, setLandingPageResults] = useState<LandingPageResult[]>([])
  const [insufficientCoinModal, setInsufficientCoinModal] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ current: 0, required: 0 })

  const handleGenerate = async () => {
    // Validation
    if (!storeName.trim()) {
      toast.error('Silakan masukkan nama toko/bisnis')
      return
    }

    if (!storeDescription.trim()) {
      toast.error('Silakan masukkan deskripsi toko/bisnis')
      return
    }

    setIsGenerating(true)

    try {
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(`${backendUrl}/api/ai/generate-landing-page`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_name: storeName,
          store_description: storeDescription
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLandingPageResults([result.data])
        toast.success(result.message || 'Landing page berhasil di-generate!')

        // Reset form
        setStoreName('')
        setStoreDescription('')
      } else {
        // Check if it's insufficient coin error
        if (result.insufficient_coin) {
          setCoinInfo({
            current: result.current_coin || 0,
            required: result.required_coin || 0
          })
          setInsufficientCoinModal(true)
        } else {
          throw new Error(result.message || 'Gagal generate landing page')
        }
      }
    } catch (error) {
      console.error('Generate landing page error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal generate landing page. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewLandingPage = (landingPage: LandingPageResult) => {
    // Redirect to landing page preview
    window.location.href = `/pages/landing/${landingPage.uuid || landingPage.id}`
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
            AI Landing Page Generator
          </Typography>
          <Typography variant='body1' sx={{ color: '#6B7280' }}>
            Buat landing page profesional dengan AI dalam hitungan detik.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          color='primary'
          startIcon={<i className='tabler-history' />}
          onClick={() => window.location.href = '/apps/tokoku/ai-history'}
          sx={{
            borderRadius: 2,
            px: 3,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Riwayat AI
        </Button>
      </Box>

      {/* Input Section */}
      <Card sx={{ mb: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Store Name Input */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                1. Nama Toko / Bisnis
              </Typography>
              <TextField
                fullWidth
                placeholder='Contoh: Kopi Nusantara, Toko Bunga Indah, Warung Makan Sederhana'
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            {/* Store Description Input */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                2. Deskripsi Toko / Bisnis
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder='Deskripsikan bisnis Anda secara detail: produk/jasa yang ditawarkan, keunggulan, target pasar, dll.

Contoh:
- Kopi Nusantara adalah coffee shop modern yang menyajikan kopi specialty dari berbagai daerah di Indonesia dengan suasana cozy dan wifi gratis. Target pasar: mahasiswa dan pekerja kantoran.
- Toko Bunga Indah menjual berbagai jenis bunga segar dan artificial untuk berbagai acara seperti pernikahan, ulang tahun, dan ucapan. Kami melayani pengiriman same-day di area Jakarta.'
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            {/* Info Alert */}
            <Grid size={{ xs: 12 }}>
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                <Typography variant='body2'>
                  💡 <strong>Tips:</strong> Semakin detail deskripsi yang Anda berikan, semakin baik hasil landing page yang dihasilkan AI.
                  Jelaskan produk/jasa, keunggulan, target pasar, dan unique selling point bisnis Anda.
                </Typography>
              </Alert>
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                size='large'
                onClick={handleGenerate}
                disabled={isGenerating || !storeName.trim() || !storeDescription.trim()}
                startIcon={isGenerating ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-wand' />}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)'
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6
                  }
                }}
              >
                {isGenerating ? 'Sedang Generate Landing Page...' : 'Generate Landing Page (🪙 5 Coin)'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {landingPageResults.length > 0 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
              Landing Page Berhasil Dibuat
            </Typography>
            <Typography variant='body2' sx={{ color: '#6B7280' }}>
              Landing page Anda sudah siap! Klik tombol di bawah untuk melihat dan mengedit.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {landingPageResults.map((landingPage, index) => (
              <Grid key={landingPage.id} size={{ xs: 12 }}>
                <Card
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant='h6' sx={{ fontWeight: 700 }}>
                        {storeName}
                      </Typography>
                    </Box>

                    <Typography variant='body2' sx={{ color: '#6B7280', mb: 3 }}>
                      {storeDescription.substring(0, 150)}...
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        fullWidth
                        variant='contained'
                        color='primary'
                        startIcon={<i className='tabler-eye' />}
                        onClick={() => handleViewLandingPage(landingPage)}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          borderRadius: 1.5,
                          textTransform: 'none'
                        }}
                      >
                        Lihat & Edit Landing Page
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {landingPageResults.length === 0 && !isGenerating && (
        <Card
          sx={{
            borderRadius: 2,
            border: '2px dashed #D1D5DB',
            bgcolor: '#F9FAFB',
            textAlign: 'center',
            py: 6,
            px: 3
          }}
        >
          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                opacity: 0.9
              }}
            >
              <i className='tabler-wand' style={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Siap Membuat Landing Page dengan AI?
            </Typography>
            <Typography variant='body1' sx={{ color: '#6B7280', mb: 1 }}>
              Masukkan nama dan deskripsi bisnis Anda, AI akan menghasilkan landing page profesional lengkap dengan design modern, copywriting menarik, dan call-to-action yang efektif.
            </Typography>
            <Typography variant='body2' sx={{ color: '#9CA3AF' }}>
              Proses pembuatan membutuhkan 5 Coin dan selesai dalam 30-60 detik.
            </Typography>
          </Box>
        </Card>
      )}

      {/* Top Up Modal */}
      <TopUpModal
        open={insufficientCoinModal}
        onClose={() => setInsufficientCoinModal(false)}
        currentCoin={coinInfo.current}
        requiredCoin={coinInfo.required}
      />
    </Box>
  )
}

export default AILandingPageView
