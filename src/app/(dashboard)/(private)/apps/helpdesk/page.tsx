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
  Divider,
  MenuItem,
  Pagination
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'

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

interface TicketStats {
  open: number
  in_progress: number
  closed: number
  total: number
}

export default function MyTicketPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TicketStats>({
    open: 0,
    in_progress: 0,
    closed: 0,
    total: 0
  })
  
  // Pagination states
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/helpdesk?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setTickets(result.data)
          
          // Calculate stats from tickets
          const ticketStats = result.data.reduce((acc: TicketStats, ticket: Ticket) => {
            acc.total++
            if (ticket.status === 'open') {
              acc.open++
            } else if (ticket.status === 'in_progress') {
              acc.in_progress++
            } else if (ticket.status === 'closed') {
              acc.closed++
            }
            return acc
          }, { open: 0, in_progress: 0, closed: 0, total: 0 })
          
          setStats(ticketStats)
        }
      }
    } catch (error) {
      // Silent error - already handled by setLoading
    } finally {
      setLoading(false)
    }
  }

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
      open: { label: 'Open', color: 'warning' },
      in_progress: { label: 'In Progress', color: 'info' },
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

  // Paginated tickets
  const paginatedTickets = tickets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const totalPages = Math.ceil(tickets.length / rowsPerPage)

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          My Tickets
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Kelola semua tiket support Anda
        </Typography>
      </Grid>

      {/* Stats Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='warning' sx={{ width: 56, height: 56 }}>
                <i className='tabler-ticket' style={{ fontSize: 28 }} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'warning.main' }}>
                  {stats.open}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Tiket Open
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='info' sx={{ width: 56, height: 56 }}>
                <i className='tabler-loader' style={{ fontSize: 28 }} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'info.main' }}>
                  {stats.in_progress}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Tiket Proses
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='success' sx={{ width: 56, height: 56 }}>
                <i className='tabler-check' style={{ fontSize: 28 }} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.closed}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Tiket Closed
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ width: 56, height: 56 }}>
                <i className='tabler-list' style={{ fontSize: 28 }} />
              </CustomAvatar>
              <Box>
                <Typography variant='h4' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {stats.total}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Total Tiket
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Ticket List */}
      <Grid size={{ xs: 12 }}>
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
          <CardContent>
            {/* Show dropdown */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <CustomTextField
                select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value))
                  setPage(0)
                }}
                sx={{ minWidth: 120 }}
                size='small'
              >
                <MenuItem value={10}>Show 10</MenuItem>
                <MenuItem value={25}>Show 25</MenuItem>
                <MenuItem value={50}>Show 50</MenuItem>
                <MenuItem value={100}>Show 100</MenuItem>
              </CustomTextField>
            </Box>

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
              <>
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
                      {paginatedTickets.map((ticket) => (
                        <tr key={ticket.uuid}>
                          <td style={{ fontWeight: 'bold' }}>{ticket.ticket_number}</td>
                          <td>{ticket.department}</td>
                          <td style={{ maxWidth: 400 }}>{ticket.title}</td>
                          <td>{getStatusChip(ticket.status)}</td>
                          <td>{getPriorityChip(ticket.priority)}</td>
                          <td>{formatDate(ticket.latest_update)}</td>
                          <td className='text-center'>
                            <Button
                              variant='tonal'
                              color='primary'
                              size='small'
                              onClick={() => router.push(`/apps/helpdesk/${ticket.uuid}`)}
                              startIcon={<i className='tabler-eye' style={{ fontSize: 16 }} />}
                            >
                              Lihat
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mt: 4, gap: 2 }}>
                  <Typography color='text.disabled' sx={{ fontSize: '0.8125rem' }}>
                    {`Showing ${tickets.length === 0 ? 0 : page * rowsPerPage + 1} to ${Math.min(
                      (page + 1) * rowsPerPage,
                      tickets.length
                    )} of ${tickets.length} entries`}
                  </Typography>
                  <Pagination
                    shape='rounded'
                    color='primary'
                    variant='tonal'
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, newPage) => setPage(newPage - 1)}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
