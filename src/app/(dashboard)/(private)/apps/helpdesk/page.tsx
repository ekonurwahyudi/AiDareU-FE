'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Box,
  Divider
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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
          console.log('Fetched tickets:', result.data)
          console.log('Is superadmin:', result.is_superadmin)
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
    const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
      open: { label: 'Open', color: 'warning' },
      waiting_reply: { label: 'Waiting Reply', color: 'warning' },
      replied: { label: 'Replied', color: 'success' },
      closed: { label: 'Closed', color: 'error' }
    }

    const config = statusConfig[status] || { label: status, color: 'default' }

    return <Chip label={config.label} color={config.color} size='small' variant='tonal' />
  }

  const getPriorityChip = (priority: string) => {
    const priorityConfig: Record<string, { label: string; color: 'default' | 'error' | 'warning' | 'success' }> = {
      low: { label: 'Low', color: 'success' },
      medium: { label: 'Medium', color: 'warning' },
      high: { label: 'High', color: 'error' }
    }

    const config = priorityConfig[priority] || { label: priority, color: 'default' }

    return <Chip label={config.label} color={config.color} size='small' variant='tonal' />
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: id })
    } catch {
      return dateString
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>
          My Tickets
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Kelola semua tiket support Anda
        </Typography>
      </Box>

      <Card>
        <CardHeader
          title='Daftar Tiket'
          action={
            <Button
              variant='contained'
              onClick={() => router.push('/apps/helpdesk/new')}
              startIcon={<i className='tabler-plus' />}
            >
              Buat Tiket Baru
            </Button>
          }
          sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : tickets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color='text.secondary' sx={{ mb: 3 }}>
                Belum ada tiket
              </Typography>
              <Button variant='contained' onClick={() => router.push('/apps/helpdesk/new')}>
                Buat Tiket Pertama
              </Button>
            </Box>
          ) : (
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>NO. TIKET</th>
                    <th>DEPARTMENT</th>
                    <th>JUDUL</th>
                    <th>STATUS</th>
                    <th>PRIORITY</th>
                    <th>UPDATE TERAKHIR</th>
                    <th className='text-center'>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, index) => (
                    <tr
                      key={ticket.uuid}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/apps/helpdesk/${ticket.uuid}`)}
                    >
                      <td style={{ fontWeight: 'bold' }}>{ticket.ticket_number}</td>
                      <td>{ticket.department}</td>
                      <td style={{ maxWidth: 400 }}>{ticket.title}</td>
                      <td>{getStatusChip(ticket.status)}</td>
                      <td>{getPriorityChip(ticket.priority)}</td>
                      <td>{formatDate(ticket.latest_update)}</td>
                      <td className='text-center'>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
