'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  TextField,
  Alert,
  Typography,
  Box,
  Divider,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useRBAC } from '@/contexts/rbacContext'

interface TicketDetail {
  uuid: string
  ticket_number: string
  title: string
  department: string
  category: string
  status: string
  priority: string
  created_at: string
  user: {
    name: string
    email: string
  }
  details: Array<{
    uuid: string
    message: string
    type: 'question' | 'answer'
    pic: string | null
    file_path: string | null
    file_name: string | null
    created_at: string
    user: {
      name: string
      email: string
    } | null
  }>
}

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.ticketNumber as string
  const { hasRole } = useRBAC()
  const isSuperadmin = hasRole('superadmin')

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null)
  const [sendingReply, setSendingReply] = useState(false)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [openPreview, setOpenPreview] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'

  // Helper to check if file is an image
  const isImageFile = (fileName: string | null): boolean => {
    if (!fileName) return false
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const ext = fileName.split('.').pop()?.toLowerCase()
    return imageExtensions.includes(ext || '')
  }

  // Handle image preview
  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl)
    setOpenPreview(true)
  }

  // Handle file download
  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl, {
        mode: 'cors',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
    } catch (error) {
      console.error('Error downloading file:', error)
      // Fallback: open in new tab
      window.open(fileUrl, '_blank')
    }
  }

  useEffect(() => {
    fetchTicketDetail()
  }, [ticketId])

  const fetchTicketDetail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTicket(result.data)
        }
      } else {
        setError('Tiket tidak ditemukan')
      }
    } catch (err) {
      setError('Gagal memuat detail tiket')
      console.error('Error fetching ticket detail:', err)
    } finally {
      setLoading(false)
    }
  }

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
        setError('Format file tidak didukung')
        return
      }

      setReplyAttachment(file)
      setError('')
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      setError('Pesan tidak boleh kosong')
      return
    }

    setSendingReply(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('message', replyMessage.trim())

      if (replyAttachment) {
        formData.append('attachment', replyAttachment)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketId}/reply`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setReplyMessage('')
        setReplyAttachment(null)
        setShowReplyForm(false)
        setError('')
        fetchTicketDetail()
      } else {
        setError(result.message || 'Gagal mengirim balasan')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengirim balasan')
      console.error('Error sending reply:', err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    
    setUpdatingStatus(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTicket({ ...ticket, status: newStatus })
      } else {
        setError(result.message || 'Gagal mengubah status')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengubah status')
      console.error('Error updating status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleReopenTicket = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketId}/reopen`, {
        method: 'POST',
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        fetchTicketDetail()
      } else {
        setError(result.message || 'Gagal membuka kembali tiket')
      }
    } catch (err) {
      setError('Terjadi kesalahan')
      console.error('Error reopening ticket:', err)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
      open: 'warning',
      waiting_reply: 'warning',
      in_progress: 'info',
      replied: 'success',
      closed: 'error'
    }
    return colors[status] || 'default'
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy (HH:mm)', { locale: id })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!ticket) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Alert severity='error'>{error || 'Tiket tidak ditemukan'}</Alert>
          <Button sx={{ mt: 2 }} variant='contained' onClick={() => router.push('/apps/helpdesk')}>
            Kembali ke Daftar Tiket
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant='h4' sx={{ fontWeight: 600, mb: 0.5 }}>
              Ticket {ticket.ticket_number}
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              {ticket.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {ticket.status !== 'closed' && (
              <Button 
                variant='contained' 
                color='primary'
                onClick={() => setShowReplyForm(!showReplyForm)} 
                startIcon={<i className={showReplyForm ? 'tabler-x' : 'tabler-message-plus'} />}
              >
                {showReplyForm ? 'Tutup' : 'Balas Tiket'}
              </Button>
            )}
            <Button 
              variant='text' 
              onClick={() => router.push('/apps/helpdesk')} 
              startIcon={<i className='tabler-arrow-left' />}
            >
              Kembali
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Main Content */}
      <Grid size={{ xs: 12, md: 8 }}>
        {/* Alert jika closed */}
        {ticket.status === 'closed' && (
          <Alert severity='warning' sx={{ mb: 3 }}>
            Tiket ini sudah ditutup. Anda dapat membalas tiket ini untuk membuka kembali.
          </Alert>
        )}

        {/* Reply Section - Show when button clicked */}
        {showReplyForm && ticket.status !== 'closed' && (
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title='Tambahkan Balasan' 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <IconButton onClick={() => setShowReplyForm(false)} size='small'>
                  <i className='tabler-x' style={{ fontSize: 18 }} />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              {error && <Alert severity='error' sx={{ mb: 3 }}>{error}</Alert>}

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder='Tulis balasan Anda...'
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 10000 } }}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant='outlined'
                  component='label'
                  size='small'
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
                {replyAttachment && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2'>{replyAttachment.name}</Typography>
                    <Button
                      size='small'
                      color='error'
                      onClick={() => setReplyAttachment(null)}
                    >
                      Hapus
                    </Button>
                  </Box>
                )}
              </Box>

              <Button
                variant='contained'
                color='success'
                onClick={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
                startIcon={<i className='tabler-send' />}
              >
                {sendingReply ? 'Mengirim...' : 'Kirim Balasan'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ticket.details.map((detail) => {
            const isOwner = detail.type === 'question'
            const roleColor = isOwner ? 'success' : (detail.pic ? 'info' : 'primary')
            const roleLabel = isOwner ? 'Owner' : (detail.pic ? 'Operator' : 'Admin')

            return (
              <Card key={detail.uuid}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant='body2'>
                      Posted by{' '}
                      <Typography component='span' sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {isOwner ? ticket.user.name : detail.pic || 'Admin'}
                      </Typography>{' '}
                      on {formatDate(detail.created_at)}
                    </Typography>
                    <Chip label={roleLabel} color={roleColor} size='small' variant='tonal' />
                  </Box>

                  <Box
                    dangerouslySetInnerHTML={{ __html: detail.message }}
                    sx={{
                      '& p': { mb: 1, mt: 0 },
                      '& ul, & ol': { pl: 3, mb: 1 },
                      color: 'text.primary',
                      lineHeight: 1.7,
                      fontSize: '0.875rem'
                    }}
                  />

                  {detail.file_name && detail.file_path && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant='caption' sx={{ mb: 1, fontWeight: 600, display: 'block' }}>
                        Attachments
                      </Typography>
                      {isImageFile(detail.file_name) ? (
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Box
                            component='img'
                            src={`${backendUrl}/storage/${detail.file_path}`}
                            alt={detail.file_name}
                            sx={{
                              maxWidth: 200,
                              maxHeight: 150,
                              borderRadius: 1,
                              cursor: 'pointer',
                              objectFit: 'cover',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            onClick={() => handlePreview(`${backendUrl}/storage/${detail.file_path}`)}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                            <IconButton
                              size='small'
                              onClick={() => handlePreview(`${backendUrl}/storage/${detail.file_path}`)}
                              sx={{ bgcolor: 'action.hover' }}
                            >
                              <i className='tabler-eye' style={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size='small'
                              onClick={() => handleDownload(`${backendUrl}/storage/${detail.file_path}`, detail.file_name || 'download')}
                              sx={{ bgcolor: 'action.hover' }}
                            >
                              <i className='tabler-download' style={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Button
                          variant='outlined'
                          size='small'
                          onClick={() => handleDownload(`${backendUrl}/storage/${detail.file_path}`, detail.file_name || 'download')}
                          startIcon={<i className='tabler-file' />}
                        >
                          {detail.file_name}
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>

        {/* Reopen button if closed */}
        {ticket.status === 'closed' && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Alert severity='info' sx={{ mb: 2 }}>
                Tiket ini sudah ditutup. Anda dapat membuka kembali tiket ini untuk melanjutkan percakapan.
              </Alert>
              <Button variant='contained' onClick={handleReopenTicket}>
                Buka Kembali Tiket
              </Button>
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Sidebar */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardHeader
            title='Ticket Information'
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          />
          <Divider />
          <CardContent>
            {/* Requestor */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                Requestor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {ticket.user.name}
                </Typography>
                <Chip label='Owner' color='success' size='small' variant='tonal' />
              </Box>
            </Box>

            {/* Department */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                Department
              </Typography>
              <Typography variant='body2'>{ticket.department}</Typography>
            </Box>

            {/* Category */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                Category
              </Typography>
              <Typography variant='body2'>{ticket.category}</Typography>
            </Box>

            {/* Submitted */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                Submitted
              </Typography>
              <Typography variant='body2'>{formatDate(ticket.created_at)}</Typography>
            </Box>

            {/* Last Updated */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: 'text.secondary' }}>
                Last Updated
              </Typography>
              <Typography variant='body2'>
                {ticket.details.length > 0
                  ? formatDate(ticket.details[ticket.details.length - 1].created_at)
                  : formatDate(ticket.created_at)}
              </Typography>
            </Box>

            {/* Status - Dropdown for superadmin */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                Status
              </Typography>
              {isSuperadmin ? (
                <FormControl fullWidth size='small'>
                  <Select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                  >
                    <MenuItem value='open'>Open</MenuItem>
                    <MenuItem value='in_progress'>In Progress</MenuItem>
                    <MenuItem value='waiting_reply'>Waiting Reply</MenuItem>
                    <MenuItem value='replied'>Replied</MenuItem>
                    <MenuItem value='closed'>Closed</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Chip
                  label={ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                  color={getStatusColor(ticket.status)}
                  size='small'
                  variant='tonal'
                />
              )}
            </Box>

            {/* Priority */}
            <Box>
              <Typography variant='caption' sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'text.secondary' }}>
                Priority
              </Typography>
              <Chip
                label={ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                color={ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'success'}
                size='small'
                variant='tonal'
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Image Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='lg' fullWidth>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'white' }}>
          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={() => setOpenPreview(false)}
          >
            <i className='tabler-x' style={{ fontSize: 20 }} />
          </IconButton>
          {previewImage && (
            <Box
              component='img'
              src={previewImage}
              alt='Preview'
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Grid>
  )
}
