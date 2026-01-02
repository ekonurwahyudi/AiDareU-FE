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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Third-party Imports
import { toast } from 'react-toastify'

// Types
interface PhotoResult {
  id: string
  imageUrl: string
  filename: string
  prompt: string
}

const AIFashionPhotoTab = () => {
  // States
  const [clothingImage, setClothingImage] = useState<File | null>(null)
  const [clothingPreview, setClothingPreview] = useState<string | null>(null)
  const [modelType, setModelType] = useState('manusia')
  const [customModelImage, setCustomModelImage] = useState<File | null>(null)
  const [customModelPreview, setCustomModelPreview] = useState<string | null>(null)
  const [gender, setGender] = useState('pria')
  const [age, setAge] = useState('dewasa')
  const [location, setLocation] = useState('indoor')
  const [visualStyle, setVisualStyle] = useState('natural')
  const [customVisualStyle, setCustomVisualStyle] = useState('')
  const [additionalInstruction, setAdditionalInstruction] = useState('')
  const [aspectRatio, setAspectRatio] = useState('3:4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [photoResults, setPhotoResults] = useState<PhotoResult[]>([])
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)
  const [insufficientCoinModal, setInsufficientCoinModal] = useState(false)
  const [coinInfo, setCoinInfo] = useState({ current: 0, required: 0 })

  // Refs
  const clothingInputRef = useRef<HTMLInputElement>(null)
  const customModelInputRef = useRef<HTMLInputElement>(null)

  // Options
  const modelTypes = [
    { value: 'manusia', label: 'Manusia' },
    { value: 'manekin', label: 'Manekin' },
    { value: 'tanpa_model', label: 'Tanpa Model' },
    { value: 'custom', label: 'Kustom' }
  ]

  const genderOptions = [
    { value: 'pria', label: 'Pria' },
    { value: 'wanita', label: 'Wanita' }
  ]

  const ageOptions = [
    { value: 'bayi', label: 'Bayi' },
    { value: 'anak', label: 'Anak' },
    { value: 'remaja', label: 'Remaja' },
    { value: 'dewasa', label: 'Dewasa' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'kakek_nenek', label: 'Kakek/Nenek' }
  ]

  const locationOptions = [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' }
  ]

  const visualStyles = [
    { value: 'natural', label: 'Natural' },
    { value: 'minimalis', label: 'Minimalis' },
    { value: 'sunset', label: 'Sunset' },
    { value: 'urban', label: 'Urban' },
    { value: 'elegan', label: 'Elegan' },
    { value: 'custom', label: 'Kustom' }
  ]

  const aspectRatios = [
    { value: '1:1', label: '1:1' },
    { value: '3:4', label: '3:4' },
    { value: '9:16', label: '9:16' },
    { value: '16:9', label: '16:9' }
  ]

  const handleClothingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      setClothingImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setClothingPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveClothing = () => {
    setClothingImage(null)
    setClothingPreview(null)
    if (clothingInputRef.current) clothingInputRef.current.value = ''
  }

  const handleCustomModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      setCustomModelImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setCustomModelPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCustomModel = () => {
    setCustomModelImage(null)
    setCustomModelPreview(null)
    if (customModelInputRef.current) customModelInputRef.current.value = ''
  }

  const handleGenerate = async () => {
    if (!clothingImage) {
      toast.error('Silakan unggah foto pakaian terlebih dahulu')
      return
    }
    if (modelType === 'custom' && !customModelImage) {
      toast.error('Silakan unggah foto model untuk mode Kustom')
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('clothing_image', clothingImage)
      formData.append('model_type', modelType)
      formData.append('location', location)
      formData.append('visual_style', visualStyle === 'custom' ? customVisualStyle : visualStyle)
      formData.append('aspect_ratio', aspectRatio)
      
      if (additionalInstruction) {
        formData.append('additional_instruction', additionalInstruction)
      }

      if (modelType === 'manusia' || modelType === 'manekin') {
        formData.append('gender', gender)
        formData.append('age', age)
      }

      if (modelType === 'custom' && customModelImage) {
        formData.append('custom_model_image', customModelImage)
      }

      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(`${backendUrl}/api/ai/generate-fashion-photo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setPhotoResults(data.data)
        toast.success('Foto fashion berhasil di-generate!')
      } else {
        if (data.insufficient_coin) {
          setCoinInfo({
            current: data.current_coin || 0,
            required: data.required_coin || 0
          })
          setInsufficientCoinModal(true)
        } else {
          throw new Error(data.message || 'Gagal generate foto')
        }
      }
    } catch (error) {
      console.error('Generate error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal generate foto')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (photo: PhotoResult, index: number) => {
    try {
      setDownloadingIndex(index)
      const urlParts = photo.imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1]
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const downloadUrl = `${backendUrl}/api/ai/fashion-photo/download/${filename}`

      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: { 'Accept': 'image/png,image/*,*/*' }
      })

      if (!response.ok) throw new Error('Failed to download')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.filename || `fashion-photo-${index + 1}.png`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      toast.success('Foto berhasil didownload')
    } catch (error) {
      console.error('Download error:', error)
      window.open(photo.imageUrl, '_blank')
      toast.info('Silakan klik kanan dan pilih "Save Image As"')
    } finally {
      setDownloadingIndex(null)
    }
  }

  // Check if detail model should be shown
  const showDetailModel = modelType === 'manusia' || modelType === 'manekin'

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
          AI Foto Fashion
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280' }}>
          Buat foto fashion profesional dengan AI. Upload pakaian dan pilih model untuk hasil terbaik.
        </Typography>
      </Box>

      {/* Input Section */}
      <Card sx={{ mb: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* 1. Upload Pakaian */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                1. Unggah Pakaian
              </Typography>
              <input
                ref={clothingInputRef}
                type='file'
                accept='image/*'
                onChange={handleClothingUpload}
                style={{ display: 'none' }}
                id='clothing-upload'
              />
              {!clothingPreview ? (
                <Box
                  onClick={() => clothingInputRef.current?.click()}
                  sx={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: '#F9FAFB' }
                  }}
                >
                  <Box sx={{ fontSize: 48, color: '#9CA3AF', mb: 1 }}>👕</Box>
                  <Typography variant='body2' sx={{ color: '#6B7280' }}>
                    Klik atau seret untuk unggah
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '2px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                  <img src={clothingPreview} alt='Preview' style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block', padding: '12px' }} />
                  <IconButton
                    onClick={handleRemoveClothing}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: 'white', width: 32, height: 32, '&:hover': { bgcolor: 'error.dark' } }}
                    size='small'
                  >
                    <i className='tabler-x' />
                  </IconButton>
                </Box>
              )}
            </Grid>

            {/* 2. Jenis Model */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                2. Jenis Model
              </Typography>
              <ToggleButtonGroup
                value={modelType}
                exclusive
                onChange={(_, val) => val && setModelType(val)}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: '1 1 auto',
                    minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(25% - 9px)' },
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                    '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                  }
                }}
              >
                {modelTypes.map(opt => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* Custom Model Upload */}
            {modelType === 'custom' && (
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Unggah Foto Model
                </Typography>
                <input
                  ref={customModelInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleCustomModelUpload}
                  style={{ display: 'none' }}
                  id='custom-model-upload'
                />
                {!customModelPreview ? (
                  <Box
                    onClick={() => customModelInputRef.current?.click()}
                    sx={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', bgcolor: '#F9FAFB' }
                    }}
                  >
                    <Box sx={{ fontSize: 36, color: '#9CA3AF', mb: 1 }}>🧑</Box>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      Klik untuk unggah foto model
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '2px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                    <img src={customModelPreview} alt='Model Preview' style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block', padding: '12px' }} />
                    <IconButton
                      onClick={handleRemoveCustomModel}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: 'white', width: 32, height: 32, '&:hover': { bgcolor: 'error.dark' } }}
                      size='small'
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  </Box>
                )}
              </Grid>
            )}

            {/* 3. Detail Model */}
            {showDetailModel && (
              <Grid size={{ xs: 12 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  3. Detail Model
                </Typography>
                
                {/* Jenis Kelamin */}
                <Typography variant='body2' sx={{ mb: 1, color: '#6B7280' }}>Jenis Kelamin</Typography>
                <ToggleButtonGroup
                  value={gender}
                  exclusive
                  onChange={(_, val) => val && setGender(val)}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: 0,
                      borderRadius: '8px !important',
                      flex: 1,
                      '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                      '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                    }
                  }}
                >
                  {genderOptions.map(opt => (
                    <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {/* Usia */}
                <Typography variant='body2' sx={{ mb: 1, color: '#6B7280' }}>Usia</Typography>
                <ToggleButtonGroup
                  value={age}
                  exclusive
                  onChange={(_, val) => val && setAge(val)}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    '& .MuiToggleButtonGroup-grouped': {
                      border: 0,
                      borderRadius: '8px !important',
                      flex: '1 1 auto',
                      minWidth: { xs: 'calc(33% - 8px)', sm: 'calc(16.66% - 10px)' },
                      '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                      '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                    }
                  }}
                >
                  {ageOptions.map(opt => (
                    <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            )}

            {/* 4. Lokasi */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                {showDetailModel ? '4' : '3'}. Lokasi
              </Typography>
              <ToggleButtonGroup
                value={location}
                exclusive
                onChange={(_, val) => val && setLocation(val)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: 1,
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                    '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                  }
                }}
              >
                {locationOptions.map(opt => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            {/* 5. Gaya Visual */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                {showDetailModel ? '5' : '4'}. Gaya Visual
              </Typography>
              <ToggleButtonGroup
                value={visualStyle}
                exclusive
                onChange={(_, val) => val && setVisualStyle(val)}
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: '1 1 auto',
                    minWidth: { xs: 'calc(33% - 8px)', sm: 'calc(16.66% - 10px)' },
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                    '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                  }
                }}
              >
                {visualStyles.map(opt => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>

              {/* Custom Visual Style Input */}
              {visualStyle === 'custom' && (
                <TextField
                  fullWidth
                  placeholder='Tulis gaya visual custom...'
                  value={customVisualStyle}
                  onChange={(e) => setCustomVisualStyle(e.target.value)}
                  sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            </Grid>

            {/* 6. Instruksi Tambahan */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                {showDetailModel ? '6' : '5'}. Instruksi Tambahan (Opsional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Contoh: Model berpose candid, fokus pada detail kain'
                value={additionalInstruction}
                onChange={(e) => setAdditionalInstruction(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* 7. Pilih Rasio */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                {showDetailModel ? '7' : '6'}. Pilih Rasio
              </Typography>
              <ToggleButtonGroup
                value={aspectRatio}
                exclusive
                onChange={(_, val) => val && setAspectRatio(val)}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: 0,
                    borderRadius: '8px !important',
                    flex: 1,
                    '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', fontWeight: 600, '&:hover': { bgcolor: 'primary.dark' } },
                    '&:not(.Mui-selected)': { border: '2px solid #E5E7EB', bgcolor: 'white', color: '#374151', fontWeight: 500, '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' } }
                  }
                }}
              >
                {aspectRatios.map(opt => (
                  <ToggleButton key={opt.value} value={opt.value} sx={{ py: 1.5, textTransform: 'none' }}>{opt.label}</ToggleButton>
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
                disabled={isGenerating || !clothingImage || (modelType === 'custom' && !customModelImage)}
                startIcon={isGenerating ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-wand' />}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  '&:hover': { boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)' },
                  '&.Mui-disabled': { opacity: 0.6 }
                }}
              >
                {isGenerating ? 'Sedang Generate Foto...' : 'Generate Foto Fashion dengan AI (2 Coin)'}
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
              2 variasi foto fashion. Download yang paling sesuai.
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
                      alt={`Fashion Photo ${index + 1}`}
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
                    <Button
                      fullWidth
                      variant='contained'
                      color='primary'
                      size='small'
                      startIcon={downloadingIndex === index ? <CircularProgress size={16} color='inherit' /> : <i className='tabler-download' />}
                      onClick={() => handleDownload(photo, index)}
                      disabled={downloadingIndex === index}
                      sx={{ py: 1, fontWeight: 600, borderRadius: 1.5, textTransform: 'none' }}
                    >
                      {downloadingIndex === index ? 'Downloading...' : 'Download'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {photoResults.length === 0 && !isGenerating && (
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
              <i className='tabler-shirt' style={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1F2937', mb: 2 }}>
              Siap Membuat Foto Fashion dengan AI?
            </Typography>
            <Typography variant='body1' sx={{ color: '#6B7280', mb: 1 }}>
              Upload foto pakaian dan pilih jenis model untuk hasil terbaik.
            </Typography>
            <Typography variant='body2' sx={{ color: '#9CA3AF' }}>
              AI akan menghasilkan 2 variasi foto fashion profesional dalam hitungan detik.
            </Typography>
          </Box>
        </Card>
      )}

      {/* Insufficient Coin Modal */}
      <Dialog open={insufficientCoinModal} onClose={() => setInsufficientCoinModal(false)} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'warning.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className='tabler-coin' style={{ fontSize: 32, color: '#f59e0b' }} />
            </Box>
            <Typography variant='h5' sx={{ fontWeight: 600 }}>
              Coin Tidak Cukup
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
            Maaf, Anda tidak memiliki cukup coin untuk generate AI Foto Fashion.
          </Typography>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'action.hover',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                Coin Anda Saat Ini
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 600, color: 'error.main' }}>
                {coinInfo.current} Pts
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                Coin yang Dibutuhkan
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 600, color: 'success.main' }}>
                {coinInfo.required} Pts
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInsufficientCoinModal(false)} color='inherit'>
            Tutup
          </Button>
          <Button
            variant='contained'
            color='warning'
            startIcon={<i className='tabler-coin' />}
            href='#'
            sx={{ fontWeight: 600 }}
          >
            Top Up Coin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AIFashionPhotoTab
