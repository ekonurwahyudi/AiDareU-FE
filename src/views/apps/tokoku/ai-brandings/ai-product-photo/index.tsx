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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import TopUpModal from '@/components/TopUpModal'

// Icon Imports
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CleanHandsIcon from '@mui/icons-material/CleanHands'
import PeopleIcon from '@mui/icons-material/People'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import Crop32Icon from '@mui/icons-material/Crop32'
import Crop169Icon from '@mui/icons-material/Crop169'
import CropPortraitIcon from '@mui/icons-material/CropPortrait'

// Types
interface PhotoResult {
  id: string
  imageUrl: string
  filename: string
  prompt: string
}

const AIProductPhotoTab = () => {
  // States
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lighting, setLighting] = useState('light')
  const [ambiance, setAmbiance] = useState('clean')
  const [location, setLocation] = useState('indoor')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [photoResults, setPhotoResults] = useState<PhotoResult[]>([])
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [insufficientCoinModal, setInsufficientCoinModal] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ current: 0, required: 0 })

  // Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lighting options
  const lightingOptions = [
    { value: 'light', label: 'Light', icon: <LightModeIcon /> },
    { value: 'dark', label: 'Dark', icon: <DarkModeIcon /> }
  ]

  // Ambiance options
  const ambianceOptions = [
    { value: 'clean', label: 'Clean', icon: <CleanHandsIcon /> },
    { value: 'crowd', label: 'Crowd', icon: <PeopleIcon /> }
  ]

  // Location options (only shown when ambiance is 'crowd')
  const locationOptions = [
    { value: 'indoor', label: 'Indoor', icon: <i className='tabler-home' /> },
    { value: 'outdoor', label: 'Outdoor', icon: <i className='tabler-trees' /> }
  ]

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: '1:1', label: '1:1', icon: <CropSquareIcon /> },
    { value: '3:4', label: '3:4', icon: <CropPortraitIcon /> },
    { value: '16:9', label: '16:9', icon: <Crop169Icon /> },
    { value: '9:16', label: '9:16', icon: <Crop32Icon /> }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }

      setProductImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProductImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    // Validation
    if (!productImage) {
      toast.error('Silakan upload foto produk terlebih dahulu')
      return
    }

    setIsGenerating(true)

    try {
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const formData = new FormData()
      formData.append('image', productImage)
      formData.append('lighting', lighting)
      formData.append('ambiance', ambiance)
      if (ambiance === 'crowd') {
        formData.append('location', location)
      }
      formData.append('aspect_ratio', aspectRatio)
      formData.append('additional_instructions', additionalInstructions)

      console.log('Auth token:', authToken ? 'Present' : 'Missing')
      console.log('Backend URL:', backendUrl)
      console.log('Request URL:', `${backendUrl}/api/ai/generate-product-photo`)

      const response = await fetch(`${backendUrl}/api/ai/generate-product-photo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const data = await response.json()
      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (data.success) {
        console.log('Product photo results:', data.data)
        setPhotoResults(data.data)
        toast.success(data.message || 'Foto produk berhasil di-generate!')
      } else {
        console.error('API Error:', data.message)
        if (data.insufficient_coin) {
          setCoinInfo({
            current: data.current_coin || 0,
            required: data.required_coin || 0
          })
          setInsufficientCoinModal(true)
        } else {
          toast.error(data.message || 'Gagal generate foto produk')
        }
      }
    } catch (error) {
      console.error('Generate error:', error)
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat generate foto produk')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (photo: PhotoResult, index: number) => {
    try {
      setDownloadingIndex(index)
      
      // Extract filename from storage URL
      const urlParts = photo.imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      
      // Use API download endpoint (Laravel handles CORS via cors.php)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const downloadUrl = `${backendUrl}/api/ai/product-photo/download/${filename}`
      
      // Try API download
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'image/png,image/*,*/*'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename || `product-photo-${index + 1}.png`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      toast.success('Foto berhasil didownload')
    } catch (error) {
      console.error('Download error:', error)
      
      // Fallback: open in new tab for manual download
      window.open(photo.imageUrl, '_blank')
      toast.info('Silakan klik kanan dan pilih "Save Image As" untuk download')
    } finally {
      setDownloadingIndex(null)
    }
  }

  const handleEdit = () => {
    toast.info('Silakan ubah pengaturan dan klik Generate untuk membuat variasi baru')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
            AI Foto Produk Profesional
          </Typography>
          <Typography variant='body1' sx={{ color: '#6B7280' }}>
            Upload foto produk, AI akan transform dengan background dan lighting profesional.
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

      {/* Alert
      <Alert severity='success' sx={{ mb: 4, borderRadius: 2 }}>
        <strong>Powered by fal.ai Nano-Banana:</strong> Teknologi AI Gemini 2.5 Flash Image yang mempertahankan produk asli dan hanya mengubah background/setting dengan kualitas profesional.
      </Alert> */}

      {/* Input Section */}
      <Card sx={{ mb: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Section 1: Upload Foto Produk */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                1. Unggah Foto Produk
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => !imagePreview && fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px'
                      }}
                    />
                    <IconButton
                      size='small'
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper'
                      }}
                      onClick={e => {
                        e.stopPropagation()
                        handleRemoveImage()
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant='body1' color='text.secondary'>
                      Klik atau seret foto produk
                    </Typography>
                    <Typography variant='body2' color='text.disabled'>
                      PNG, JPG, WEBP (Max 10MB)
                    </Typography>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </Box>
            </Grid>

            {/* Section 2: Pilih Pencahayaan */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                2. Pilih Pencahayaan
              </Typography>
              <ToggleButtonGroup
                value={lighting}
                exclusive
                onChange={(_, newValue) => newValue && setLighting(newValue)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: 1,
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
                {lightingOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value} sx={{ py: 1.5, textTransform: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Section 3: Pilih Suasana */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                3. Pilih Suasana
              </Typography>
              <ToggleButtonGroup
                value={ambiance}
                exclusive
                onChange={(_, newValue) => newValue && setAmbiance(newValue)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: 1,
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
                {ambianceOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value} sx={{ py: 1.5, textTransform: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Section 3.5: Pilih Lokasi (only shown when ambiance is 'crowd') */}
            {ambiance === 'crowd' && (
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Pilih Lokasi
                </Typography>
                <ToggleButtonGroup
                  value={location}
                  exclusive
                  onChange={(_, newValue) => newValue && setLocation(newValue)}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: 0,
                      borderRadius: '8px !important',
                      flex: 1,
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
                  {locationOptions.map(option => (
                    <ToggleButton key={option.value} value={option.value} sx={{ py: 1.5, textTransform: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            )}

            {/* Section 4: Pilih Rasio */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                4. Pilih Rasio
              </Typography>
              <ToggleButtonGroup
                value={aspectRatio}
                exclusive
                onChange={(_, newValue) => newValue && setAspectRatio(newValue)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: 1,
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
                {aspectRatioOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value} sx={{ py: 1.5, textTransform: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Section 5: Instruksi Tambahan */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                Instruksi Tambahan (Opsional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Contoh: Letakkan di atas meja kayu, tambahkan bunga di sampingnya, background hijau natural'
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                size='large'
                onClick={handleGenerate}
                disabled={isGenerating || !productImage}
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
                {isGenerating ? 'Sedang Generate Foto...' : 'Generate Foto Produk (2 Coin)'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {photoResults.length > 0 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
              Hasil Generate
            </Typography>
            <Typography variant='body2' sx={{ color: '#6B7280' }}>
              2 variasi foto produk profesional. Download yang paling sesuai atau klik Edit untuk variasi baru
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {photoResults.map((photo, index) => (
              <Grid key={photo.id} size={{ xs: 12, md: 6 }}>
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
                      src={photo.imageUrl}
                      alt={`Product Photo ${index + 1}`}
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
                        startIcon={downloadingIndex === index ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-download' />}
                        onClick={() => handleDownload(photo, index)}
                        disabled={downloadingIndex === index}
                        sx={{
                          py: 1,
                          fontWeight: 600,
                          borderRadius: 1.5,
                          textTransform: 'none'
                        }}
                      >
                        {downloadingIndex === index ? 'Downloading...' : 'Download'}
                      </Button>
                      <Button
                        fullWidth
                        variant='outlined'
                        color='primary'
                        size='small'
                        startIcon={<i className='tabler-edit' />}
                        onClick={() => handleEdit()}
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

export default AIProductPhotoTab
