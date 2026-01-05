'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Utils
import { getInitials } from '@/utils/getInitials'

type NotificationType = {
  id: number
  user_uuid: string
  type: string
  title: string
  description?: string
  data?: any
  icon?: string
  color: ThemeColor
  action_url?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

const getAvatar = (params: { icon?: string; color: ThemeColor; title: string }) => {
  const { icon, color, title } = params

  if (icon) {
    return (
      <CustomAvatar color={color} skin='light-static' size={48}>
        <i className={`${icon} text-2xl`} />
      </CustomAvatar>
    )
  } else {
    return (
      <CustomAvatar color={color} skin='light-static' size={48}>
        {getInitials(title)}
      </CustomAvatar>
    )
  }
}

// Helper function to format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date()
  const notifDate = new Date(date)
  const diffInMs = now.getTime() - notifDate.getTime()
  const diffInMins = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMins < 1) return 'Baru saja'
  if (diffInMins < 60) return `${diffInMins} menit yang lalu`
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`
  return notifDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Get icon based on notification type
const getIconByType = (type: string): string => {
  const icons: Record<string, string> = {
    order: 'tabler-shopping-cart',
    topup: 'tabler-coin',
    subscription: 'tabler-package',
    reminder: 'tabler-bell-ringing',
    info: 'tabler-info-circle'
  }
  return icons[type] || 'tabler-bell'
}

// Get color based on notification type
const getColorByType = (type: string): ThemeColor => {
  const colors: Record<string, ThemeColor> = {
    order: 'success',
    topup: 'warning',
    subscription: 'primary',
    reminder: 'info',
    info: 'secondary'
  }
  return colors[type] || 'primary'
}

const NotificationsPage = () => {
  // States
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState<string>('all') // all, order, topup, subscription, reminder, info
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadCount, setUnreadCount] = useState(0)

  // Hooks
  const router = useRouter()

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true)
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      // Build query params
      const params = new URLSearchParams({
        per_page: '20',
        page: page.toString()
      })

      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`${backendUrl}/api/notifications?${params}`, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Ensure icon and color are set
          let processedNotifications = (result.data || []).map((notif: NotificationType) => ({
            ...notif,
            icon: notif.icon || getIconByType(notif.type),
            color: notif.color || getColorByType(notif.type)
          }))

          // Apply read/unread filter
          if (filter === 'unread') {
            processedNotifications = processedNotifications.filter((n: NotificationType) => !n.is_read)
          } else if (filter === 'read') {
            processedNotifications = processedNotifications.filter((n: NotificationType) => n.is_read)
          }

          setNotifications(processedNotifications)
          setUnreadCount(result.unread_count || 0)
          setTotalPages(Math.ceil(result.total / 20))
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchNotifications(currentPage)
  }, [currentPage, typeFilter, filter])

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const response = await fetch(`${backendUrl}/api/notifications/${id}/read`, {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate if action_url is provided
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  // Delete notification
  const handleDelete = async (id: number) => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const response = await fetch(`${backendUrl}/api/notifications/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      if (storedUserData) {
        const userData = JSON.parse(storedUserData)
        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }
      }

      const response = await fetch(`${backendUrl}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Header */}
      <Card>
        <CardHeader
          title='Notifications'
          subheader={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
          action={
            <div className='flex gap-4 items-center'>
              {unreadCount > 0 && (
                <Button variant='outlined' size='small' onClick={handleMarkAllAsRead} startIcon={<i className='tabler-check' />}>
                  Mark All as Read
                </Button>
              )}
            </div>
          }
        />
      </Card>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className='flex flex-wrap gap-4'>
            <FormControl size='small' className='min-w-[150px]'>
              <InputLabel>Filter</InputLabel>
              <Select value={filter} label='Filter' onChange={e => setFilter(e.target.value)}>
                <MenuItem value='all'>All Notifications</MenuItem>
                <MenuItem value='unread'>Unread Only</MenuItem>
                <MenuItem value='read'>Read Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl size='small' className='min-w-[150px]'>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label='Type' onChange={e => setTypeFilter(e.target.value)}>
                <MenuItem value='all'>All Types</MenuItem>
                <MenuItem value='order'>Orders</MenuItem>
                <MenuItem value='topup'>Top Up</MenuItem>
                <MenuItem value='subscription'>Subscription</MenuItem>
                <MenuItem value='reminder'>Reminders</MenuItem>
                <MenuItem value='info'>Information</MenuItem>
              </Select>
            </FormControl>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex flex-col items-center justify-center p-12'>
              <CircularProgress size={40} />
              <Typography variant='body2' color='text.secondary' className='mt-4'>
                Loading notifications...
              </Typography>
            </div>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={classnames('flex gap-4 p-6 cursor-pointer hover:bg-actionHover transition-colors group', {
                      'bg-actionHover bg-opacity-5': !notification.is_read
                    })}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Avatar */}
                    <div className='flex-shrink-0'>
                      {getAvatar({
                        icon: notification.icon,
                        color: notification.color,
                        title: notification.title
                      })}
                    </div>

                    {/* Content */}
                    <div className='flex-grow min-w-0'>
                      <div className='flex items-start justify-between gap-2 mb-1'>
                        <Typography variant='subtitle1' className='font-medium' color='text.primary'>
                          {notification.title}
                        </Typography>
                        <div className='flex items-center gap-2'>
                          {!notification.is_read && (
                            <Chip label='New' size='small' color='primary' variant='tonal' />
                          )}
                          <Tooltip title='Delete'>
                            <IconButton
                              size='small'
                              className='opacity-0 group-hover:opacity-100 transition-opacity'
                              onClick={e => {
                                e.stopPropagation()
                                handleDelete(notification.id)
                              }}
                            >
                              <i className='tabler-trash text-xl' />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </div>

                      {notification.description && (
                        <Typography variant='body2' color='text.secondary' className='mb-2'>
                          {notification.description}
                        </Typography>
                      )}

                      <div className='flex items-center gap-3'>
                        <Typography variant='caption' color='text.disabled'>
                          <i className='tabler-clock text-sm mr-1' />
                          {formatTimeAgo(notification.created_at)}
                        </Typography>
                        <Chip label={notification.type} size='small' variant='outlined' />
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Divider />}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <Box className='flex justify-center p-6'>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, page) => setCurrentPage(page)}
                    color='primary'
                    shape='rounded'
                  />
                </Box>
              )}
            </>
          ) : (
            <div className='flex flex-col items-center justify-center p-12'>
              <i className='tabler-bell-off text-6xl text-textDisabled mb-4' />
              <Typography variant='h6' color='text.primary' className='mb-2'>
                No notifications
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {filter === 'unread'
                  ? "You don't have any unread notifications"
                  : typeFilter !== 'all'
                    ? `No ${typeFilter} notifications found`
                    : "You don't have any notifications yet"}
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationsPage
