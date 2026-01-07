'use client'

// React Imports
import { useState, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import TopUpModal from '@/components/TopUpModal'

// Types
interface LogoResult {
  id: string
  imageUrl: string
  filename?: string
  prompt: string
}

const AILogoTab = () => {
  // States
  const [businessName, setBusinessName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logoResults, setLogoResults] = useState<LogoResult[]>([])
  const [insufficientCoinModal, setInsufficientCoinModal] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ current: 0, required: 0 })

  // Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Logo styles
  const logoStyles = [
    { value: 'modern', label: 'Modern' },
    { value: 'simple', label: 'Simple' },
    { value: 'creative', label: 'Creative' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'professional', label: 'Professional' },
    { value: 'playful', label: 'Playful' },
    { value: 'elegant', label: 'Elegant' },
    { value: 'bold', label: 'Bold' }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB')
        return
      }

      setUploadedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    // Validation
    if (!businessName.trim()) {
      toast.error('Silakan masukkan nama usaha/logo')
      return
    }

    if (!prompt.trim() && !uploadedImage) {
      toast.error('Silakan masukkan deskripsi atau upload gambar sketsa')
      return
    }

    setIsGenerating(true)

    try {
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const formData = new FormData()
      formData.append('business_name', businessName)
      formData.append('prompt', prompt)
      formData.append('style', selectedStyle)
      if (uploadedImage) {
        formData.append('image', uploadedImage)
      }

      const response = await fetch(`${backendUrl}/api/ai/generate-logo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLogoResults(result.data)
        toast.success(result.message || 'Logo berhasil di-generate!')
      } else {
        // Check if it's insufficient coin error
        if (result.insufficient_coin) {
          setCoinInfo({
            current: result.current_coin || 0,
            required: result.required_coin || 0
          })
          setInsufficientCoinModal(true)
        } else {
          throw new Error(result.message || 'Gagal generate logo')
        }
      }
    } catch (error) {
      console.error('Generate logo error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal generate logo. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (logo: LogoResult, index: number) => {
    try {
      // Extract filename from storage URL
      const urlParts = logo.imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      
      // Use API download endpoint (Laravel handles CORS via cors.php)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const downloadUrl = `${backendUrl}/api/ai/logo/download/${filename}`
      
      // Try API download first
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'image/png,image/*,*/*'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download logo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = logo.filename || `ai-logo-${index + 1}.png`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      toast.success('Logo berhasil didownload')
    } catch (error) {
      console.error('Download error:', error)
      
      // Fallback: open in new tab for manual download
      window.open(logo.imageUrl, '_blank')
      toast.info('Silakan klik kanan dan pilih "Save Image As" untuk download')
    }
  }

  const handleEdit = (logo: LogoResult) => {
    // Set the prompt from the selected logo and regenerate
    setPrompt(logo.prompt + ' (refined)')
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('Silakan ubah prompt dan klik Generate untuk membuat variasi baru')
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
            AI Logo & Brand Kit Generator
          </Typography>
          <Typography variant='body1' sx={{ color: '#6B7280' }}>
            Buat logo profesional dengan AI. Upload sketsa atau gunakan prompt untuk hasil terbaik.
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
            {/* Business Name Input */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                1. Nama Usaha / Nama Logo
              </Typography>
              <TextField
                fullWidth
                placeholder='Contoh: Kopi Nusantara, Toko Bunga Indah, Warung Makan Sederhana'
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                // helperText='Masukkan nama usaha atau brand yang akan dibuatkan logo'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            {/* Prompt Input */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                2. Intruksi Logo
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder='Contoh: Modern minimalist logo for coffee shop with geometric shapes, warm colors, professional'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                // helperText='Deskripsikan logo yang Anda inginkan secara detail untuk hasil terbaik'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            {/* Upload Image */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                3. Upload Sketsa/Referensi Gambar (Opsional)
              </Typography>
              <Box>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id='logo-upload'
                />
                <label htmlFor='logo-upload'>
                  <Button
                    component='span'
                    variant='outlined'
                    color='primary'
                    fullWidth
                    startIcon={<i className='tabler-upload' />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2
                      }
                    }}
                  >
                    Pilih Gambar
                  </Button>
                </label>
                {imagePreview && (
                  <Box
                    sx={{
                      mt: 2,
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid #E5E7EB',
                      bgcolor: '#F9FAFB'
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt='Preview'
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        display: 'block',
                        padding: '12px'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'error.main',
                        color: 'white',
                        width: 32,
                        height: 32,
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                      size='small'
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Style Selection */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                4. Gaya Logo
              </Typography>
              <ToggleButtonGroup
                value={selectedStyle}
                exclusive
                onChange={(e, newStyle) => {
                  if (newStyle !== null) {
                    setSelectedStyle(newStyle)
                  }
                }}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: '1 1 auto',
                    minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    },
                    '&:not(.Mui-selected)': {
                      border: '2px solid #E5E7EB',
                      bgcolor: 'white',
                      color: '#374151',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: '#F9FAFB',
                        borderColor: 'primary.main'
                      }
                    }
                  }
                }}
              >
                {logoStyles.map(style => (
                  <ToggleButton
                    key={style.value}
                    value={style.value}
                    sx={{ py: 1.5, textTransform: 'none' }}
                  >
                    {style.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                size='large'
                onClick={handleGenerate}
                disabled={isGenerating || !businessName.trim() || (!prompt.trim() && !uploadedImage)}
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
                {isGenerating ? 'Sedang Generate Logo...' : 'Generate Logo (🪙 2 Coin)'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {logoResults.length > 0 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
              Hasil Generate
            </Typography>
            <Typography variant='body2' sx={{ color: '#6B7280' }}>
              Pilih logo yang paling sesuai, atau klik Edit untuk membuat variasi baru
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {logoResults.map((logo, index) => (
              <Grid key={logo.id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    height: '100%',
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
                  <Box
                    sx={{
                      position: 'relative',
                      minHeight: '300px',
                      bgcolor: '#F9FAFB',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3
                    }}
                  >
                    <img
                      src={logo.imageUrl}
                      alt={`Logo ${index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                    <Chip
                      label={`Variasi ${index + 1}`}
                      size='small'
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                      <Button
                        fullWidth
                        variant='contained'
                        color='primary'
                        size='small'
                        startIcon={<i className='tabler-download' />}
                        onClick={() => handleDownload(logo, index)}
                        sx={{
                          py: 1,
                          fontWeight: 600,
                          borderRadius: 1.5,
                          textTransform: 'none'
                        }}
                      >
                        Download
                      </Button>
                      <Button
                        fullWidth
                        variant='outlined'
                        color='primary'
                        size='small'
                        startIcon={<i className='tabler-edit' />}
                        onClick={() => handleEdit(logo)}
                        sx={{
                          py: 1,
                          fontWeight: 600,
                          borderRadius: 1.5,
                          borderWidth: 2,
                          textTransform: 'none',
                          '&:hover': {
                            borderWidth: 2
                          }
                        }}
                      >
                        Edit/Refine
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {logoResults.length === 0 && !isGenerating && (
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
              Siap Membuat Logo dengan AI?
            </Typography>
            <Typography variant='body1' sx={{ color: '#6B7280', mb: 1 }}>
              Masukkan deskripsi logo yang Anda inginkan atau upload sketsa sebagai referensi.
            </Typography>
            <Typography variant='body2' sx={{ color: '#9CA3AF' }}>
              AI akan menghasilkan 2 variasi logo profesional dalam hitungan detik.
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

export default AILogoTab
