'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box
} from '@mui/material'
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: id })
    } catch {
      return dateString
    }
  }

  return (
    <Box className='container mx-auto p-6'>
      <Box className='flex justify-between items-center mb-6'>
        <Box>
          <Typography variant='h4' className='font-bold'>My Tickets</Typography>
          <Typography variant='body2' color='text.secondary' className='mt-1'>
            Kelola semua tiket support Anda
          </Typography>
        </Box>
        <Button
          variant='contained'
          color='primary'
          onClick={() => router.push('/apps/helpdesk/new')}
          startIcon={<i className='tabler-plus' />}
        >
          Buat Tiket Baru
        </Button>
      </Box>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <Box className='text-center py-8'>
              <CircularProgress />
            </Box>
          ) : tickets.length === 0 ? (
            <Box className='text-center py-8'>
              <Typography color='text.secondary'>Belum ada tiket</Typography>
              <Button
                className='mt-4'
                variant='contained'
                onClick={() => router.push('/apps/helpdesk/new')}
              >
                Buat Tiket Pertama
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>No. Tiket</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Judul</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Update Terakhir</TableCell>
                    <TableCell align='right'>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow
                      key={ticket.uuid}
                      hover
                      onClick={() => router.push(`/apps/helpdesk/${ticket.uuid}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ fontWeight: 'bold' }}>{ticket.ticket_number}</TableCell>
                      <TableCell>{ticket.department}</TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>{ticket.title}</TableCell>
                      <TableCell>{getStatusChip(ticket.status)}</TableCell>
                      <TableCell>{getPriorityChip(ticket.priority)}</TableCell>
                      <TableCell>{formatDate(ticket.latest_update)}</TableCell>
                      <TableCell align='right'>
                        <Button
                          variant='text'
                          size='small'
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/apps/helpdesk/${ticket.uuid}`)
                          }}
                        >
                          Lihat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
