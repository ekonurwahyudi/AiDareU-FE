'use client'

// React Imports
import { useState, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import { styled } from '@mui/material/styles'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

// Icon Imports
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageIcon from '@mui/icons-material/Image'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const ProductSizeGuide = () => {
  const { setFormData } = useProductForm()
  const [sizeGuideImage, setSizeGuideImage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setErrorMessage('')

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Format gambar tidak didukung. Gunakan JPG, PNG, atau GIF')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
        setErrorMessage(`Ukuran file terlalu besar (${fileSizeMB} MB). Maksimal 5 MB`)
        return
      }

      setFileName(file.name)

      // Set file to context
      setFormData({ sizeGuideImage: file })

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setSizeGuideImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSizeGuideImage(null)
    setFileName('')
    setErrorMessage('')
    setFormData({ sizeGuideImage: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader
        title='Panduan Ukuran'
        subheader='Opsional - Upload gambar panduan ukuran produk'
      />
      <CardContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        {!sizeGuideImage ? (
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: '#fafafa',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: '#9e9e9e',
                bgcolor: '#f5f5f5'
              }
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload gambar panduan ukuran produk
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
              Format: JPG, PNG, atau JPEG. Maksimal 5MB
            </Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
            >
              Pilih Gambar
              <VisuallyHiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                position: 'relative',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#fafafa'
              }}
            >
              <img
                src={sizeGuideImage}
                alt="Size Guide Preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  }
                }}
                onClick={handleRemoveImage}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {fileName}
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{ mt: 2 }}
              size="small"
            >
              Ganti Gambar
              <VisuallyHiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductSizeGuide
