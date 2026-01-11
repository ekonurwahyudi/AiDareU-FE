'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
  const { user } = useAuth()
  const ticketNumber = params.ticketNumber as string

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null)
  const [sendingReply, setSendingReply] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTicketDetail()
  }, [ticketNumber])

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
        fetchTicketDetail() // Refresh ticket detail
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
        fetchTicketDetail() // Refresh ticket detail
      } else {
        setError(result.message || 'Gagal membuka kembali tiket')
      }
    } catch (err) {
      setError('Terjadi kesalahan')
      console.error('Error reopening ticket:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
      open: { label: 'Open', variant: 'default' },
      waiting_reply: { label: 'Waiting Reply', variant: 'secondary' },
      replied: { label: 'Replied', variant: 'success' },
      closed: { label: 'Closed', variant: 'destructive' }
    }

    const config = statusConfig[status] || { label: status, variant: 'default' }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'Low', className: 'bg-blue-100 text-blue-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', className: 'bg-red-100 text-red-800' }
    }

    const config = priorityConfig[priority] || { label: priority, className: '' }

    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getUserRole = (detail: TicketDetail['details'][0]) => {
    if (detail.type === 'answer') {
      if (detail.pic) {
        return { role: 'Operator', color: 'bg-purple-100 text-purple-800' }
      }
      return { role: 'Admin', color: 'bg-green-100 text-green-800' }
    }
    return { role: 'Owner', color: 'bg-blue-100 text-blue-800' }
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
      <div className='container mx-auto p-6'>
        <p>Loading...</p>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className='container mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertDescription>{error || 'Tiket tidak ditemukan'}</AlertDescription>
        </Alert>
        <Button className='mt-4' onClick={() => router.push('/apps/helpdesk')}>
          Kembali ke Daftar Tiket
        </Button>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 max-w-5xl'>
      <Button variant='ghost' className='mb-4' onClick={() => router.push('/apps/helpdesk')}>
        <i className='tabler-arrow-left mr-2' />
        Kembali
      </Button>

      {/* Ticket Header */}
      <Card className='mb-6'>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <CardTitle className='text-2xl'>{ticket.title}</CardTitle>
              </div>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span>Tiket {ticket.ticket_number}</span>
                <span>•</span>
                <span>{ticket.department}</span>
                <span>•</span>
                <span>{ticket.category}</span>
              </div>
            </div>
            <div className='flex flex-col gap-2 items-end'>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ticket Messages */}
      <div className='space-y-4 mb-6'>
        {ticket.details.map((detail, index) => {
          const roleInfo = getUserRole(detail)
          const isOwner = detail.type === 'question'

          return (
            <Card key={detail.uuid}>
              <CardContent className='p-6'>
                <div className='flex gap-4'>
                  <Avatar className='w-10 h-10'>
                    <AvatarFallback>
                      {isOwner
                        ? user?.name?.charAt(0).toUpperCase()
                        : detail.pic?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='font-semibold'>
                        {isOwner ? ticket.user.name : detail.pic || 'Admin'}
                      </span>
                      <Badge className={roleInfo.color}>{roleInfo.role}</Badge>
                      <span className='text-sm text-muted-foreground'>{formatDate(detail.created_at)}</span>
                    </div>
                    <div
                      className='prose prose-sm max-w-none'
                      dangerouslySetInnerHTML={{ __html: detail.message }}
                    />
                    {detail.file_name && (
                      <div className='mt-4'>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${detail.file_path}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-2 text-sm text-blue-600 hover:underline'
                        >
                          <i className='tabler-paperclip' />
                          {detail.file_name}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reply Section */}
      {ticket.status === 'closed' ? (
        <Card>
          <CardContent className='p-6'>
            <Alert>
              <AlertDescription>
                Tiket ini sudah ditutup. Anda dapat membuka kembali tiket ini untuk melanjutkan percakapan.
              </AlertDescription>
            </Alert>
            <Button className='mt-4' onClick={handleReopenTicket}>
              Buka Kembali Tiket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tambahkan Balasan</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant='destructive' className='mb-4'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='reply-message'>Pesan</Label>
                <Textarea
                  id='reply-message'
                  placeholder='Tulis balasan Anda...'
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  maxLength={10000}
                  className='resize-none'
                />
                <p className='text-sm text-muted-foreground'>{replyMessage.length} / 10000 karakter</p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='reply-attachment'>Lampiran (Opsional)</Label>
                <Input id='reply-attachment' type='file' onChange={handleFileChange} accept='.jpg,.jpeg,.gif,.png,.zip,.gz,.txt,.pdf' />
                {replyAttachment && (
                  <div className='flex items-center gap-2 text-sm'>
                    <i className='tabler-file' />
                    <span>{replyAttachment.name}</span>
                    <Button type='button' variant='ghost' size='sm' onClick={() => setReplyAttachment(null)}>
                      <i className='tabler-x' />
                    </Button>
                  </div>
                )}
              </div>

              <Button onClick={handleSendReply} disabled={sendingReply || !replyMessage.trim()}>
                {sendingReply ? 'Mengirim...' : 'Kirim Balasan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
