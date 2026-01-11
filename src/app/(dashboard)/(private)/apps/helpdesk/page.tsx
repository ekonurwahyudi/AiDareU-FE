'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Ticket {
  uuid: string
  ticket_number: string
  title: string
  department: string
  category: string
  status: string
  priority: string
  latest_update: string
  created_at: string
}

export default function MyTicketPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk`, {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTickets(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: id })
    } catch {
      return dateString
    }
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>My Tickets</h1>
          <p className='text-muted-foreground mt-1'>Kelola semua tiket support Anda</p>
        </div>
        <Button onClick={() => router.push('/apps/helpdesk/new')}>
          <i className='tabler-plus mr-2' />
          Buat Tiket Baru
        </Button>
      </div>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='text-center py-8'>
              <p>Loading...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>Belum ada tiket</p>
              <Button className='mt-4' onClick={() => router.push('/apps/helpdesk/new')}>
                Buat Tiket Pertama
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[100px]'>No. Tiket</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                  <TableHead className='text-right'>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.uuid}
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() => router.push(`/apps/helpdesk/${ticket.ticket_number}`)}
                  >
                    <TableCell className='font-medium'>{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.department}</TableCell>
                    <TableCell className='max-w-md truncate'>{ticket.title}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{formatDate(ticket.latest_update)}</TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/apps/helpdesk/${ticket.ticket_number}`)
                        }}
                      >
                        Lihat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
