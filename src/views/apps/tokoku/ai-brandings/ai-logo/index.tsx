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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { toast } from 'react-toastify'

// Types
interface LogoResult {
  id: string
  imageUrl: string
  prompt: string
}

const AILogoTab = () => {
  // States
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [logoResults, setLogoResults] = useState<LogoResult[]>([])

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
    if (!prompt && !uploadedImage) {
      toast.error('Silakan masukkan prompt atau upload gambar sketsa')
      return
    }

    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('style', selectedStyle)
      if (uploadedImage) {
        formData.append('image', uploadedImage)
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/ai/generate-logo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Generate 4 results with different variations
        setLogoResults(result.data)
        toast.success('Logo berhasil di-generate!')
      } else {
        throw new Error(result.message || 'Gagal generate logo')
      }
    } catch (error) {
      console.error('Generate logo error:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal generate logo. Silakan coba lagi.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (logoUrl: string, index: number) => {
    try {
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-logo-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Logo berhasil didownload')
    } catch (error) {
      toast.error('Gagal mendownload logo')
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
      <Box sx={{ mb: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
          AI Logo & Brand Kit Generator
        </Typography>
        <Typography variant='body2' sx={{ color: '#6B7280' }}>
          Buat logo profesional dengan AI. Upload sketsa atau gunakan prompt untuk hasil terbaik.
        </Typography>
      </Box>

      {/* Input Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Prompt Input */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Deskripsi Logo (Prompt)'
                placeholder='Contoh: Modern minimalist logo for coffee shop with geometric shapes, warm colors, professional'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                helperText='Deskripsikan logo yang Anda inginkan secara detail'
              />
            </Grid>

            {/* Upload Image */}
            <Grid size={{ xs: 12, md: 6 }}>
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
                    fullWidth
                    startIcon={<i className='tabler-upload' />}
                    sx={{ py: 1.5 }}
                  >
                    Upload Sketsa/Foto (Opsional)
                  </Button>
                </label>
                {imagePreview && (
                  <Box sx={{ mt: 2, position: 'relative' }}>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Gaya Logo</InputLabel>
                <Select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} label='Gaya Logo'>
                  {logoStyles.map(style => (
                    <MenuItem key={style.value} value={style.value}>
                      {style.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant='contained'
                size='large'
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt && !uploadedImage)}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <i className='tabler-wand' />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4293 100%)'
                  }
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Logo'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Section */}
      {logoResults.length > 0 && (
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 600, mb: 3 }}>
            Hasil Generate (4 Variasi)
          </Typography>

          <Grid container spacing={3}>
            {logoResults.map((logo, index) => (
              <Grid key={logo.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      bgcolor: '#F9FAFB',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={logo.imageUrl}
                      alt={`Logo ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        padding: '16px'
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                      <Button
                        fullWidth
                        variant='contained'
                        size='small'
                        startIcon={<i className='tabler-download' />}
                        onClick={() => handleDownload(logo.imageUrl, index)}
                      >
                        Download
                      </Button>
                      <Button
                        fullWidth
                        variant='outlined'
                        size='small'
                        startIcon={<i className='tabler-edit' />}
                        onClick={() => handleEdit(logo)}
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
        <Alert severity='info' icon={<i className='tabler-info-circle' />}>
          Masukkan prompt atau upload sketsa logo, pilih gaya yang diinginkan, lalu klik Generate untuk membuat logo
          dengan AI
        </Alert>
      )}
    </Box>
  )
}

export default AILogoTab
