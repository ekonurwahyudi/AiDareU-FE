'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Component Imports
import { toast } from 'react-hot-toast'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

const ImgStyled = styled('img')(({ theme }) => ({
  width: 200,
  height: 100,
  marginInlineEnd: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  objectFit: 'cover'
}))

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center'
  }
}))

const Seo = () => {
  // API Base URL
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

  // RBAC Context
  const { currentStore } = useRBAC()

  const [formData, setFormData] = useState({
    meta_title: '',
    deskripsi: '',
    keyword: '',
    og_title: '',
    og_deskripsi: ''
  })
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [deleteOgImage, setDeleteOgImage] = useState(false)

  const storeUuid = currentStore?.uuid || currentStore?.id

  useEffect(() => {
    if (storeUuid) {
      fetchSeoSettings(storeUuid)
    }
  }, [storeUuid])

  const fetchSeoSettings = async (uuid: string) => {
    try {
      // Add cache busting parameter to prevent caching
      const timestamp = new Date().getTime()
      const response = await fetch(`${apiUrl}/api/theme-settings?store_uuid=${uuid}&_t=${timestamp}`, {
        cache: 'no-store'
      })
      const data = await response.json()

      console.log('Fetched SEO data:', data)

      if (data.success && data.data.seo) {
        const seo = data.data.seo
        console.log('SEO object:', seo)

        setFormData({
          meta_title: seo.meta_title || '',
          deskripsi: seo.deskripsi || '',
          keyword: seo.keyword || '',
          og_title: seo.og_title || '',
          og_deskripsi: seo.og_deskripsi || ''
        })

        if (seo.og_image) {
          setOgImagePreview(`${apiUrl}/storage/${seo.og_image}`)
        }
      } else {
        console.log('No SEO settings found')
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setOgImage(file)
      setDeleteOgImage(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setOgImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteOgImage = () => {
    setOgImage(null)
    setOgImagePreview('')
    setDeleteOgImage(true)
  }

  const handleSubmit = async () => {
    if (!storeUuid) {
      toast.error('Store UUID not found')
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('uuid_store', storeUuid)
      formDataToSend.append('meta_title', formData.meta_title)
      formDataToSend.append('deskripsi', formData.deskripsi)
      formDataToSend.append('keyword', formData.keyword)
      formDataToSend.append('og_title', formData.og_title)
      formDataToSend.append('og_deskripsi', formData.og_deskripsi)

      if (ogImage) {
        formDataToSend.append('og_image', ogImage)
      }

      if (deleteOgImage) {
        formDataToSend.append('delete_og_image', '1')
      }

      // Get auth credentials
      const authToken = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      const userUuid = userData ? JSON.parse(userData).uuid : null

      const headers: HeadersInit = {}
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      if (userUuid) headers['X-User-UUID'] = userUuid

      const response = await fetch(`${apiUrl}/api/theme-settings/seo`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formDataToSend
      })

      console.log('SEO Response status:', response.status)

      const data = await response.json()
      console.log('SEO Response data:', data)

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        toast.success('SEO settings updated successfully')
        if (storeUuid) {
          fetchSeoSettings(storeUuid)
        }
      } else {
        toast.error(data.message || 'Failed to update SEO settings')
      }
    } catch (error) {
      console.error('Error updating SEO settings:', error)
      toast.error('An error occurred while updating SEO settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 1, fontWeight: 600 }}>
        SEO Settings
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Configure SEO meta tags for your store
      </Typography>
      <Box>
        <Grid container spacing={6}>
          {/* Meta Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Meta Title'
              placeholder='Your store name - Best products online'
              value={formData.meta_title}
              onChange={(e) => handleInputChange('meta_title', e.target.value)}
              helperText='Recommended length: 50-60 characters'
            />
          </Grid>

          {/* Meta Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Meta Description'
              placeholder='Shop the best products at the best prices...'
              value={formData.deskripsi}
              onChange={(e) => handleInputChange('deskripsi', e.target.value)}
              multiline
              rows={3}
              helperText='Recommended length: 150-160 characters'
            />
          </Grid>

          {/* Keywords */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Meta Keywords'
              placeholder='online shop, best products, affordable prices'
              value={formData.keyword}
              onChange={(e) => handleInputChange('keyword', e.target.value)}
              helperText='Separate keywords with commas'
            />
          </Grid>

          {/* Divider */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' className='mbs-4'>
              Open Graph (Social Media)
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Configure how your store appears when shared on social media
            </Typography>
          </Grid>

          {/* OG Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='OG Title'
              placeholder='Your store name - Best products online'
              value={formData.og_title}
              onChange={(e) => handleInputChange('og_title', e.target.value)}
            />
          </Grid>

          {/* OG Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='OG Description'
              placeholder='Shop the best products at the best prices...'
              value={formData.og_deskripsi}
              onChange={(e) => handleInputChange('og_deskripsi', e.target.value)}
              multiline
              rows={3}
            />
          </Grid>

          {/* OG Image */}
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='mbe-2'>
              OG Image
            </Typography>
            <Typography variant='caption' color='text.secondary' className='mbe-4'>
              Upload image size 1200x630px recommended
            </Typography>
            <Box className='flex items-center gap-4 mbs-4'>
              {ogImagePreview ? (
                <ImgStyled src={ogImagePreview} alt='OG Image' />
              ) : (
                <Box
                  sx={{
                    width: 200,
                    height: 100,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className='tabler-photo' style={{ fontSize: '2rem', opacity: 0.5 }} />
                </Box>
              )}
              <div className='flex flex-col gap-4'>
                <div className='flex gap-2'>
                  <label htmlFor='og-image-upload' style={{ cursor: 'pointer' }}>
                    <Button variant='contained' component='span'>
                      {ogImagePreview ? 'Change Image' : 'Upload OG Image'}
                    </Button>
                    <input
                      hidden
                      type='file'
                      accept='image/png, image/jpeg, image/jpg, image/gif'
                      onChange={handleOgImageChange}
                      id='og-image-upload'
                    />
                  </label>
                  {ogImagePreview && (
                    <Button variant='outlined' color='error' onClick={handleDeleteOgImage}>
                      Delete
                    </Button>
                  )}
                </div>
                <Typography variant='caption' color='text.secondary'>
                  Allowed PNG, JPG or GIF. Max size of 2MB
                </Typography>
              </div>
            </Box>
          </Grid>

          {/* Live Preview Open Graph */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant='h6' sx={{ mb: 2 }}>
                Social Media Preview
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mb: 3, display: 'block' }}>
                This is how your store will appear when shared on WhatsApp, Facebook, Twitter, etc.
              </Typography>

              {/* WhatsApp/Facebook Style Preview */}
              <Box
                sx={{
                  maxWidth: 500,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'background.default'
                }}
              >
                {ogImagePreview && (
                  <Box
                    component='img'
                    src={ogImagePreview}
                    alt='OG Preview'
                    sx={{
                      width: '100%',
                      height: 250,
                      objectFit: 'cover'
                    }}
                  />
                )}
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontSize: '0.75rem', mb: 0.5 }}
                  >
                    {typeof window !== 'undefined' ? window.location.hostname : 'aidareu.com'}
                  </Typography>
                  <Typography
                    variant='subtitle1'
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      color: '#1877f2'
                    }}
                  >
                    {formData.og_title || formData.meta_title || 'Your Store Title'}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {formData.og_deskripsi || formData.deskripsi || 'Your store description will appear here...'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Submit Button */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-end gap-4'>
              <Button variant='tonal' color='secondary' onClick={() => storeUuid && fetchSeoSettings(storeUuid)}>
                Reset
              </Button>
              <Button variant='contained' onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Seo
