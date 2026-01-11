'use client'

import { useState } from 'react'
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
  Grid
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function NewTicketPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    department: 'Support IT',
    category: '',
    customCategory: '',
    priority: 'low',
    message: ''
  })

  const [attachment, setAttachment] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > 30 * 1024 * 1024) {
        setError('Ukuran file maksimal 30MB')
        return
      }

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/zip',
        'application/x-gzip',
        'application/gzip',
        'text/plain',
        'application/pdf'
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

      if (!formData.message.trim()) {
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
        router.push(`/apps/helpdesk/${result.data.ticket_number}`)
      } else {
        setError(result.message || 'Gagal membuat tiket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat tiket')
      console.error('Error creating ticket:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className='container mx-auto p-6' sx={{ maxWidth: 900 }}>
      <Button
        variant='text'
        className='mb-4'
        onClick={() => router.back()}
        startIcon={<i className='tabler-arrow-left' />}
      >
        Kembali
      </Button>

      <Card>
        <CardHeader
          title='Buat Tiket Support Baru'
          subheader='Isi formulir di bawah untuk membuat tiket support. Tim kami akan segera membantu Anda.'
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {error && (
                <Grid item xs={12}>
                  <Alert severity='error'>{error}</Alert>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nama'
                  value={user?.name || ''}
                  disabled
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Email'
                  type='email'
                  value={user?.email || ''}
                  disabled
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label='Judul'
                  placeholder='Jelaskan masalah Anda secara singkat'
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  inputProps={{ maxLength: 255 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
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
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
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
              </Grid>

              {formData.category === 'Lainnya' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label='Kategori Lainnya'
                    placeholder='Masukkan kategori'
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    inputProps={{ maxLength: 100 }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth required>
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
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={8}
                  label='Pesan'
                  placeholder='Jelaskan masalah Anda secara detail'
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  inputProps={{ maxLength: 10000 }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {formData.message.length} / 10000 karakter
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='outlined'
                  component='label'
                  startIcon={<i className='tabler-paperclip' />}
                >
                  Upload Lampiran
                  <input
                    type='file'
                    hidden
                    onChange={handleFileChange}
                    accept='.jpg,.jpeg,.gif,.png,.zip,.gz,.txt,.pdf'
                  />
                </Button>
                <Typography variant='caption' display='block' color='text.secondary' sx={{ mt: 1 }}>
                  Allowed File Extensions: .jpg, .jpeg, .gif, .png, .zip, .gz, .txt, .pdf (Max 30MB)
                </Typography>
                {attachment && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <i className='tabler-file' />
                    <Typography variant='body2'>{attachment.name}</Typography>
                    <Button
                      size='small'
                      onClick={() => setAttachment(null)}
                      startIcon={<i className='tabler-x' />}
                    >
                      Hapus
                    </Button>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type='submit'
                    variant='contained'
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Mengirim...' : 'Submit'}
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
