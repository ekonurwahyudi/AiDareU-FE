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

// Icon Imports
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import Crop169Icon from '@mui/icons-material/Crop169'
import Crop32Icon from '@mui/icons-material/Crop32'

// Types
interface PhotoResult {
  id: string
  imageUrl: string
  filename: string
  prompt: string
}

interface UploadedImage {
  id: string
  file: File
  preview: string
}

const AIMergePhotoTab = () => {
  // States
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [instruction, setInstruction] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingInstruction, setIsGeneratingInstruction] = useState(false)
  const [photoResults, setPhotoResults] = useState<PhotoResult[]>([])
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null)

  // Ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: '1:1', label: '1:1', icon: <CropSquareIcon /> },
    { value: '16:9', label: '16:9', icon: <Crop169Icon /> },
    { value: '9:16', label: '9:16', icon: <Crop32Icon /> }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: UploadedImage[] = []

    Array.from(files).forEach(file => {
      // Validate
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      if (uploadedImages.length + newImages.length >= 5) {
        toast.error('Maksimal 5 gambar')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: reader.result as string
        }
        setUploadedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const handleGenerateInstruction = async () => {
    if (uploadedImages.length < 2) {
      toast.error('Upload minimal 2 gambar terlebih dahulu')
      return
    }

    setIsGeneratingInstruction(true)

    try {
      const formData = new FormData()
      uploadedImages.forEach(img => {
        formData.append('images[]', img.file)
      })

      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(`${backendUrl}/api/ai/generate-instruction`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const data = await response.json()
      console.log('Generate instruction response:', data)

      if (data.success && data.instruction) {
        setInstruction(data.instruction)
        toast.success('Instruksi berhasil di-generate!')
      } else {
        throw new Error(data.message || 'Gagal generate instruksi')
      }
    } catch (error) {
      console.error('Generate instruction error:', error)
      // Set default instruction on error
      setInstruction('Gabungkan semua elemen dari foto-foto ini menjadi satu komposisi yang harmonis dan menarik.')
      toast.info('Menggunakan instruksi default')
    } finally {
      setIsGeneratingInstruction(false)
    }
  }

  const handleGenerate = async () => {
    if (uploadedImages.length < 2) {
      toast.error('Upload minimal 2 gambar')
      return
    }
    if (!instruction.trim()) {
      toast.error('Masukkan instruksi terlebih dahulu')
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      uploadedImages.forEach(img => {
        formData.append('images[]', img.file)
      })
      formData.append('instruction', instruction)
      formData.append('aspect_ratio', aspectRatio)

      const authToken = localStorage.getItem('auth_token')
      console.log('Auth token:', authToken ? 'Present' : 'Missing')
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      console.log('Backend URL:', backendUrl)
      console.log('Request URL:', `${backendUrl}/api/ai/generate-merged-photo`)

      const response = await fetch(`${backendUrl}/api/ai/generate-merged-photo`, {
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
        setPhotoResults(data.data)
        toast.success('Foto berhasil di-generate!')
      } else {
        throw new Error(data.message || 'Gagal generate foto')
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
      const downloadUrl = `${backendUrl}/api/ai/merged-photo/download/${filename}`

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
      a.download = photo.filename || `merged-photo-${index + 1}.png`
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 700, color: '#1F2937', mb: 1 }}>
          AI Gabung Foto
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280' }}>
          Gabungkan beberapa foto menjadi satu komposisi yang menarik dengan AI.
        </Typography>
      </Box>

      {/* Input Section */}
      <Card sx={{ mb: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Section 1: Upload Images */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600, color: '#374151' }}>
                1. Unggah Gambar (min 2, maks 5)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {/* Uploaded Images */}
                {uploadedImages.map(img => (
                  <Box
                    key={img.id}
                    sx={{
                      position: 'relative',
                      width: 120,
                      height: 120,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid #E5E7EB'
                    }}
                  >
                    <img
                      src={img.preview}
                      alt='Preview'
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveImage(img.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        width: 24,
                        height: 24,
                        '&:hover': { bgcolor: 'error.main' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}

                {/* Add Button */}
                {uploadedImages.length < 5 && (
                  <Box
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      width: 120,
                      height: 120,
                      border: '2px dashed #D1D5DB',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <AddIcon sx={{ fontSize: 32, color: '#9CA3AF' }} />
                  </Box>
                )}

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </Box>
            </Grid>

            {/* Section 2: Instruction */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, color: '#374151' }}>
                  2. Instruksi
                </Typography>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={isGeneratingInstruction ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                  onClick={handleGenerateInstruction}
                  disabled={isGeneratingInstruction || uploadedImages.length < 2}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  {isGeneratingInstruction ? 'Generating...' : 'Generate Instruksi AI'}
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Contoh: Gabungkan wanita di foto pertama dengan produk di foto kedua, buat seolah wanita sedang memegang produk tersebut'
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>

            {/* Section 3: Aspect Ratio */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                3. Pilih Rasio
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
                      '&:hover': { bgcolor: 'primary.dark' }
                    },
                    '&:not(.Mui-selected)': {
                      border: '2px solid #E5E7EB',
                      bgcolor: 'white',
                      color: '#374151',
                      fontWeight: 500,
                      '&:hover': { bgcolor: '#F9FAFB', borderColor: 'primary.main' }
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

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                size='large'
                onClick={handleGenerate}
                disabled={isGenerating || uploadedImages.length < 2 || !instruction.trim()}
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
                {isGenerating ? 'Sedang Generate Foto...' : 'Generate Foto dengan AI'}
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
              2 variasi foto gabungan. Download yang paling sesuai.
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
                      alt={`Merged Photo ${index + 1}`}
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
    </Box>
  )
}

export default AIMergePhotoTab
