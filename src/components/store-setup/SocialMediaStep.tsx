'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

interface SocialMediaStepProps {
  handlePrev: () => void
  onComplete: () => void
  storeData: any
  setStoreData: (data: any) => void
}

// Validation Schema
const schema = yup.object().shape({
  instagram: yup.string(), // Optional, no validation
  facebook: yup.string(), // Optional, no validation
  tiktok: yup.string(), // Optional, no validation
  youtube: yup.string() // Optional, no validation
})

const SocialMediaStep = ({ handlePrev, onComplete, storeData, setStoreData }: SocialMediaStepProps) => {
  // States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      instagram: storeData.instagram || '',
      facebook: storeData.facebook || '',
      tiktok: storeData.tiktok || '',
      youtube: storeData.youtube || ''
    }
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Build full URLs from usernames
      const buildUrl = (platform: string, username: string) => {
        if (!username || username.trim() === '') return ''

        const cleanUsername = username.trim()

        switch (platform) {
          case 'instagram':
            return `https://instagram.com/${cleanUsername}`
          case 'facebook':
            return `https://facebook.com/${cleanUsername}`
          case 'tiktok':
            return `https://tiktok.com/@${cleanUsername}`
          case 'youtube':
            return `https://youtube.com/@${cleanUsername}`
          default:
            return cleanUsername
        }
      }

      // Update store data
      const finalData = {
        ...storeData,
        instagram: buildUrl('instagram', data.instagram),
        facebook: buildUrl('facebook', data.facebook),
        tiktok: buildUrl('tiktok', data.tiktok),
        youtube: buildUrl('youtube', data.youtube)
      }

      setStoreData(finalData)

      // Submit to backend
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      
      // Ensure subdomain field is correctly named
      const dataToSubmit = {
        ...finalData,
        subdomain: finalData.subdomain // Make sure this matches the backend validation field
      }
      
      console.log('Submitting store data:', dataToSubmit)
      
      const response = await fetch(`${backendUrl}/api/store/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        },
        body: JSON.stringify(dataToSubmit)
      })

      const result = await response.json()

      if (response.ok) {
        // Update user data in localStorage to mark store as setup
        const userData = localStorage.getItem('user_data')
        if (userData) {
          const user = JSON.parse(userData)
          user.has_store = true
          user.store_id = result.store?.id
          localStorage.setItem('user_data', JSON.stringify(user))
        }
        
        onComplete()
      } else {
        setError(result.message || 'Terjadi kesalahan saat menyimpan data toko')
      }
    } catch (error) {
      console.error('Store setup error:', error)
      setError('Terjadi kesalahan saat menyimpan data toko. Silakan coba lagi atau hubungi administrator.')
    }

    setIsSubmitting(false)
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Controller
            name='instagram'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Instagram'
                placeholder='username'
                error={!!errors.instagram}
                helperText={errors.instagram?.message || 'Opsional - Masukkan username saja'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-instagram" style={{ color: '#E1306C', marginRight: 4 }} />
                      <span style={{ color: '#666' }}>instagram.com/</span>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='facebook'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='Facebook'
                placeholder='username'
                error={!!errors.facebook}
                helperText={errors.facebook?.message || 'Opsional - Masukkan username saja'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-facebook" style={{ color: '#1877F2', marginRight: 4 }} />
                      <span style={{ color: '#666' }}>facebook.com/</span>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='tiktok'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='TikTok'
                placeholder='username'
                error={!!errors.tiktok}
                helperText={errors.tiktok?.message || 'Opsional - Masukkan username saja'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-tiktok" style={{ color: '#000000', marginRight: 4 }} />
                      <span style={{ color: '#666' }}>tiktok.com/@</span>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name='youtube'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label='YouTube'
                placeholder='username'
                error={!!errors.youtube}
                helperText={errors.youtube?.message || 'Opsional - Masukkan username saja'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-brand-youtube" style={{ color: '#FF0000', marginRight: 4 }} />
                      <span style={{ color: '#666' }}>youtube.com/@</span>
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
        </Grid>
      </Grid>

        <Box className='flex justify-between mt-8'>
          <Button
            variant='outlined'
            onClick={handlePrev}
            disabled={isSubmitting}
            startIcon={<i className='tabler-arrow-left' />}
          >
            Sebelumnya
          </Button>
          <Button
            variant='contained'
            type='submit'
            disabled={isSubmitting}
            endIcon={isSubmitting ? <CircularProgress size={16} /> : <i className='tabler-check' />}
          >
            {isSubmitting ? 'Menyimpan...' : 'Selesai'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default SocialMediaStep