'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Box,
  Divider
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    department: 'Support IT',
    category: '',
    customCategory: '',
    priority: 'low',
    message: ''
  })

  const [attachment, setAttachment] = useState<File | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: 'include'
        })
        if (response.ok) {
          const result = await response.json()
          if (result.user) {
            setUserData({
              name: result.user.name || '',
              email: result.user.email || ''
            })
          }
        }
      } catch (err) {
        // Silent error
      }
    }

    fetchUserData()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 30 * 1024 * 1024) {
        setError('Ukuran file maksimal 30MB')
        return
      }

      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/zip', 'application/x-gzip', 'application/gzip',
        'text/plain', 'application/pdf'
      ]

      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan: JPG, PNG, GIF, ZIP, GZ, TXT, PDF')
        return
      }

      setAttachment(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.title.trim()) {
        setError('Judul harus diisi')
        setLoading(false)
        return
      }

      if (!formData.message.trim() || formData.message === '<p></p>') {
        setError('Pesan harus diisi')
        setLoading(false)
        return
      }

      const submitData = new FormData()
      submitData.append('title', formData.title.trim())
      submitData.append('department', formData.department)

      if (formData.category === 'Lainnya' && formData.customCategory.trim()) {
        submitData.append('category', formData.customCategory.trim())
      } else {
        submitData.append('category', formData.category || 'Umum')
      }

      submitData.append('priority', formData.priority)
      submitData.append('message', formData.message.trim())

      if (attachment) {
        submitData.append('attachment', attachment)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk`, {
        method: 'POST',
        credentials: 'include',
        body: submitData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        router.push('/apps/helpdesk')
      } else {
        setError(result.message || 'Gagal membuat tiket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat tiket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 600, mb: 0.5 }}>
              Buat Tiket Baru
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sampaikan masalah atau pertanyaan Anda
            </Typography>
          </Box>
          <Button
            variant='text'
            onClick={() => router.back()}
            startIcon={<i className='tabler-arrow-left' />}
          >
            Kembali
          </Button>
        </Box>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={6}>
            {/* Left Column - Title, Description, Attachment */}
            <Grid size={{ xs: 12, md: 8 }}>
              {error && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Title Card */}
              <Card sx={{ mb: 3 }}>
                <CardHeader 
                  title='Informasi Tiket' 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <TextField
                    fullWidth
                    required
                    label='Judul Tiket'
                    placeholder='Jelaskan masalah Anda secara singkat'
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    inputProps={{ maxLength: 255 }}
                  />
                </CardContent>
              </Card>

              {/* Description Card */}
              <Card sx={{ mb: 3 }}>
                <CardHeader
                  title='Deskripsi Masalah'
                  subheader='Jelaskan masalah Anda secara detail'
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Box sx={{ '& .ProseMirror': { minHeight: '200px !important' } }}>
                    <TiptapEditor
                      content={formData.message}
                      onChange={(content) => setFormData({ ...formData, message: content })}
                      placeholder='Tulis deskripsi masalah Anda di sini...'
                    />
                  </Box>
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                    {formData.message.replace(/<[^>]*>/g, '').length} / 10000 karakter
                  </Typography>
                </CardContent>
              </Card>

              {/* Attachment Card */}
              <Card>
                <CardHeader 
                  title='Lampiran' 
                  subheader='Upload file pendukung (opsional)' 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<i className='tabler-paperclip' />}
                  >
                    Pilih File
                    <input
                      type='file'
                      hidden
                      onChange={handleFileChange}
                      accept='.jpg,.jpeg,.gif,.png,.zip,.gz,.txt,.pdf'
                    />
                  </Button>
                  <Typography variant='caption' display='block' color='text.secondary' sx={{ mt: 1 }}>
                    Allowed: JPG, PNG, GIF, ZIP, GZ, TXT, PDF (Max 30MB)
                  </Typography>
                  {attachment && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <i className='tabler-file' />
                      <Typography variant='body2' sx={{ flex: 1 }}>{attachment.name}</Typography>
                      <Button
                        size='small'
                        color='error'
                        onClick={() => setAttachment(null)}
                      >
                        Hapus
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column - User Info, Department, Category, Priority */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* User Info Card */}
              <Card sx={{ mb: 3 }}>
                <CardHeader 
                  title='Informasi Pengirim' 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      label='Nama'
                      value={userData?.name || ''}
                      disabled
                      size='small'
                    />
                    <TextField
                      fullWidth
                      label='Email'
                      type='email'
                      value={userData?.email || ''}
                      disabled
                      size='small'
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Category & Priority Card */}
              <Card sx={{ mb: 3 }}>
                <CardHeader 
                  title='Kategori Tiket' 
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControl fullWidth required size='small'>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={formData.department}
                        label='Department'
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        <MenuItem value='Support IT'>Support IT</MenuItem>
                        <MenuItem value='Sales/Billing'>Sales/Billing</MenuItem>
                        <MenuItem value='Abuse'>Abuse</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required size='small'>
                      <InputLabel>Kategori</InputLabel>
                      <Select
                        value={formData.category}
                        label='Kategori'
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <MenuItem value='Bugs/Error'>Bugs/Error</MenuItem>
                        <MenuItem value='Pembayaran'>Pembayaran</MenuItem>
                        <MenuItem value='Kecurangan'>Kecurangan</MenuItem>
                        <MenuItem value='Lainnya'>Lainnya</MenuItem>
                      </Select>
                    </FormControl>

                    {formData.category === 'Lainnya' && (
                      <TextField
                        fullWidth
                        required
                        size='small'
                        label='Kategori Lainnya'
                        placeholder='Masukkan kategori'
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        inputProps={{ maxLength: 100 }}
                      />
                    )}

                    <FormControl fullWidth required size='small'>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        label='Priority'
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <MenuItem value='low'>Low</MenuItem>
                        <MenuItem value='medium'>Medium</MenuItem>
                        <MenuItem value='high'>High</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      type='submit'
                      variant='contained'
                      fullWidth
                      disabled={loading}
                      startIcon={<i className='tabler-send' />}
                    >
                      {loading ? 'Mengirim...' : 'Kirim Tiket'}
                    </Button>
                    <Button
                      variant='outlined'
                      fullWidth
                      onClick={() => router.back()}
                    >
                      Batal
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </Grid>
    </Grid>
  )
}
