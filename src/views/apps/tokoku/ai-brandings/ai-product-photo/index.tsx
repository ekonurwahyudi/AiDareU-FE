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
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { toast } from 'react-toastify'

// Icon Imports
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
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
  prompt: string
}

const AIProductPhotoTab = () => {
  // States
  const [productImage, setProductImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lighting, setLighting] = useState('light')
  const [ambiance, setAmbiance] = useState('clean')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [photoResults, setPhotoResults] = useState<PhotoResult[]>([])

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
      const formData = new FormData()
      formData.append('image', productImage)
      formData.append('lighting', lighting)
      formData.append('ambiance', ambiance)
      formData.append('aspect_ratio', aspectRatio)
      formData.append('additional_instructions', additionalInstructions)

      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'

      const response = await fetch(`${backendUrl}/api/ai/generate-product-photo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setPhotoResults(data.data)
        toast.success('Foto produk berhasil di-generate!')
      } else {
        toast.error(data.message || 'Gagal generate foto produk')
      }
    } catch (error) {
      console.error('Generate error:', error)
      toast.error('Terjadi kesalahan saat generate foto produk')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (photoUrl: string, index: number) => {
    try {
      const response = await fetch(photoUrl)

      if (!response.ok) {
        throw new Error('Failed to download photo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-product-photo-${index + 1}.png`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      toast.success('Foto berhasil didownload')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Gagal mendownload foto. Silakan coba lagi.')
    }
  }

  return (
    <Box>
      <Typography variant='h4' sx={{ fontWeight: 600, mb: 2 }}>
        AI Foto Produk
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Ubah foto produk biasa menjadi foto profesional dengan AI
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          {/* Section 1: Upload Foto Produk */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 2 }}>
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
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 2 }}>
                2. Pilih Pencahayaan
              </Typography>
              <ToggleButtonGroup
                value={lighting}
                exclusive
                onChange={(e, newValue) => newValue && setLighting(newValue)}
                fullWidth
              >
                {lightingOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value}>
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
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 2 }}>
                3. Pilih Suasana
              </Typography>
              <ToggleButtonGroup
                value={ambiance}
                exclusive
                onChange={(e, newValue) => newValue && setAmbiance(newValue)}
                fullWidth
              >
                {ambianceOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Section 4: Pilih Rasio */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 2 }}>
                4. Pilih Rasio
              </Typography>
              <ToggleButtonGroup
                value={aspectRatio}
                exclusive
                onChange={(e, newValue) => newValue && setAspectRatio(newValue)}
                fullWidth
              >
                {aspectRatioOptions.map(option => (
                  <ToggleButton key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {option.icon}
                      <Typography variant='caption'>{option.label}</Typography>
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Section 5: Instruksi Tambahan */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 2 }}>
                Instruksi Tambahan (Opsional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Contoh: Letakkan di atas meja kayu, tambahkan bunga di samping...'
                value={additionalInstructions}
                onChange={e => setAdditionalInstructions(e.target.value)}
              />
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                size='large'
                startIcon={isGenerating ? <CircularProgress size={20} color='inherit' /> : <AutoFixHighIcon />}
                onClick={handleGenerate}
                disabled={isGenerating || !productImage}
              >
                {isGenerating ? 'Sedang Generate...' : 'Generate Foto Profesional'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {photoResults.length > 0 && (
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 600, mb: 2 }}>
            Hasil Generate
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Pilih foto yang paling sesuai, atau klik Edit untuk membuat variasi baru
          </Typography>

          <Grid container spacing={3}>
            {photoResults.map((photo, index) => (
              <Grid key={photo.id} size={{ xs: 12, md: 6 }}>
                <Card>
                  <Box
                    sx={{
                      minHeight: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      bgcolor: 'action.hover'
                    }}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={`Variation ${index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>
                      Variasi {index + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant='contained'
                        color='primary'
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(photo.imageUrl, index)}
                      >
                        Download
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  )
}

export default AIProductPhotoTab
