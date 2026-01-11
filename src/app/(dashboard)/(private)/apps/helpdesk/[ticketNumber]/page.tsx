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
  Avatar,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

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
  const ticketNumber = params.ticketNumber as string

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null)
  const [sendingReply, setSendingReply] = useState(false)
  const [error, setError] = useState('')
  const [userData, setUserData] = useState<{ name: string } | null>(null)

  useEffect(() => {
    fetchTicketDetail()
    fetchUserData()
  }, [ticketNumber])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.user) {
          setUserData({ name: result.user.name || '' })
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  const fetchTicketDetail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketNumber}`, {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketNumber}/reply`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setReplyMessage('')
        setReplyAttachment(null)
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

  const handleReopenTicket = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk/${ticketNumber}/reopen`, {
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

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' }> = {
      open: { label: 'Open', color: 'info' },
      waiting_reply: { label: 'Waiting Reply', color: 'warning' },
      replied: { label: 'Replied', color: 'success' },
      closed: { label: 'Closed', color: 'error' }
    }

    const config = statusConfig[status] || { label: status, color: 'default' }
    return <Chip label={config.label} color={config.color} size='small' />
  }

  const getPriorityChip = (priority: string) => {
    const priorityConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' }> = {
      low: { label: 'Low', color: 'info' },
      medium: { label: 'Medium', color: 'warning' },
      high: { label: 'High', color: 'error' }
    }

    const config = priorityConfig[priority] || { label: priority, color: 'default' }
    return <Chip label={config.label} color={config.color} size='small' />
  }

  const getUserRole = (detail: TicketDetail['details'][0]) => {
    if (detail.type === 'answer') {
      if (detail.pic) {
        return { role: 'Operator', color: 'secondary' as const }
      }
      return { role: 'Admin', color: 'success' as const }
    }
    return { role: 'Owner', color: 'primary' as const }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: id })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <Box className='container mx-auto p-6' sx={{ textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!ticket) {
    return (
      <Box className='container mx-auto p-6'>
        <Alert severity='error'>{error || 'Tiket tidak ditemukan'}</Alert>
        <Button className='mt-4' variant='contained' onClick={() => router.push('/apps/helpdesk')}>
          Kembali ke Daftar Tiket
        </Button>
      </Box>
    )
  }

  return (
    <Box className='container mx-auto p-6' sx={{ maxWidth: 1200 }}>
      <Button
        variant='text'
        className='mb-4'
        onClick={() => router.push('/apps/helpdesk')}
        startIcon={<i className='tabler-arrow-left' />}
      >
        Kembali
      </Button>

      {/* Ticket Header */}
      <Card className='mb-6'>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <Box>
                <Typography variant='h5' sx={{ mb: 1 }}>{ticket.title}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Tiket {ticket.ticket_number} • {ticket.department} • {ticket.category}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                {getStatusChip(ticket.status)}
                {getPriorityChip(ticket.priority)}
              </Box>
            </Box>
          }
        />
      </Card>

      {/* Ticket Messages */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ticket.details.map((detail) => {
          const roleInfo = getUserRole(detail)
          const isOwner = detail.type === 'question'

          return (
            <Card key={detail.uuid}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${roleInfo.color}.main` }}>
                    {isOwner
                      ? userData?.name?.charAt(0).toUpperCase() || 'U'
                      : detail.pic?.charAt(0).toUpperCase() || 'A'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                        {isOwner ? ticket.user.name : detail.pic || 'Admin'}
                      </Typography>
                      <Chip label={roleInfo.role} color={roleInfo.color} size='small' />
                      <Typography variant='caption' color='text.secondary'>
                        {formatDate(detail.created_at)}
                      </Typography>
                    </Box>
                    <Typography
                      variant='body2'
                      dangerouslySetInnerHTML={{ __html: detail.message }}
                      sx={{ whiteSpace: 'pre-wrap' }}
                    />
                    {detail.file_name && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant='outlined'
                          size='small'
                          component='a'
                          href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${detail.file_path}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          startIcon={<i className='tabler-paperclip' />}
                        >
                          {detail.file_name}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* Reply Section */}
      {ticket.status === 'closed' ? (
        <Card>
          <CardContent>
            <Alert severity='info' sx={{ mb: 2 }}>
              Tiket ini sudah ditutup. Anda dapat membuka kembali tiket ini untuk melanjutkan percakapan.
            </Alert>
            <Button variant='contained' onClick={handleReopenTicket}>
              Buka Kembali Tiket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader title='Tambahkan Balasan' />
          <CardContent>
            {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder='Tulis balasan Anda...'
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  inputProps={{ maxLength: 10000 }}
                />
                <Typography variant='caption' color='text.secondary'>
                  {replyMessage.length} / 10000 karakter
                </Typography>
              </Box>

              <Box>
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
                {replyAttachment && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <i className='tabler-file' />
                    <Typography variant='body2'>{replyAttachment.name}</Typography>
                    <Button
                      size='small'
                      onClick={() => setReplyAttachment(null)}
                      startIcon={<i className='tabler-x' />}
                    >
                      Hapus
                    </Button>
                  </Box>
                )}
              </Box>

              <Button
                variant='contained'
                onClick={handleSendReply}
                disabled={sendingReply || !replyMessage.trim()}
              >
                {sendingReply ? 'Mengirim...' : 'Kirim Balasan'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
