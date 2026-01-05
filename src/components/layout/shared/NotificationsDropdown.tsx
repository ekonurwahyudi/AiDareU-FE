'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'
import type { MouseEvent, ReactNode } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import useMediaQuery from '@mui/material/useMediaQuery'
import Button from '@mui/material/Button'
import type { Theme } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Third Party Components
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { CustomAvatarProps } from '@core/components/mui/Avatar'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getInitials } from '@/utils/getInitials'

export type NotificationsType = {
  id: number
  user_uuid: string
  type: string // order, topup, subscription, reminder, info
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

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <div className='overflow-x-hidden bs-full'>{children}</div>
  } else {
    return (
      <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
        {children}
      </PerfectScrollbar>
    )
  }
}

const getAvatar = (params: { icon?: string; color: ThemeColor; title: string }) => {
  const { icon, color, title } = params

  if (icon) {
    return (
      <CustomAvatar color={color} skin='light-static'>
        <i className={icon} />
      </CustomAvatar>
    )
  } else {
    return (
      <CustomAvatar color={color} skin='light-static'>
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
  return notifDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
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

const NotificationDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationsType[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // Hooks
  const router = useRouter()
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  // Check if all notifications are read
  const readAll = notifications.every(n => n.is_read)

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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

      const response = await fetch(`${backendUrl}/api/notifications?per_page=10`, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Ensure icon and color are set
          const processedNotifications = (result.data || []).map((notif: NotificationsType) => ({
            ...notif,
            icon: notif.icon || getIconByType(notif.type),
            color: notif.color || getColorByType(notif.type)
          }))

          setNotifications(processedNotifications)
          setUnreadCount(result.unread_count || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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

      const response = await fetch(`${backendUrl}/api/notifications/unread-count`, {
        headers,
        credentials: 'include',
        cache: 'no-store'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUnreadCount(result.unread_count || 0)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Refetch when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification: NotificationsType) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await markAsRead(notification.id)
      }

      // Navigate if action_url is provided
      if (notification.action_url) {
        router.push(notification.action_url)
        handleClose()
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  // Mark notification as read via API
  const markAsRead = async (id: number) => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
        setNotifications(prev => prev.map(n =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Toggle read status
  const handleReadNotification = async (event: MouseEvent<HTMLElement>, notification: NotificationsType) => {
    event.stopPropagation()

    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  // Remove notification (soft delete)
  const handleRemoveNotification = async (event: MouseEvent<HTMLElement>, id: number) => {
    event.stopPropagation()

    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
        fetchUnreadCount() // Update unread count
      }
    } catch (error) {
      console.error('Error removing notification:', error)
    }
  }

  // Mark all as read
  const readAllNotifications = async () => {
    try {
      const storedUserData = localStorage.getItem('user_data')
      const authToken = localStorage.getItem('auth_token')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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

  const handleViewAllNotifications = () => {
    router.push('/apps/notifications')
    handleClose()
  }

  useEffect(() => {
    const adjustPopoverHeight = () => {
      if (ref.current) {
        const availableHeight = window.innerHeight - 100
        ref.current.style.height = `${Math.min(availableHeight, 550)}px`
      }
    }

    window.addEventListener('resize', adjustPopoverHeight)
    return () => window.removeEventListener('resize', adjustPopoverHeight)
  }, [])

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <Badge
          color='error'
          badgeContent={unreadCount}
          className='cursor-pointer'
          overlap='circular'
          invisible={unreadCount === 0}
          sx={{
            '& .MuiBadge-badge': {
              minWidth: unreadCount > 9 ? '20px' : '16px',
              height: '16px',
              fontSize: '0.625rem',
              fontWeight: 600
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <i className='tabler-bell' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        ref={ref}
        anchorEl={anchorRef.current}
        {...(isSmallScreen
          ? {
              className: 'is-full !mbs-3 z-[1] max-bs-[550px] bs-[550px]',
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: {
                    padding: themeConfig.layoutPadding
                  }
                }
              ]
            }
          : { className: 'is-96 !mbs-3 z-[1] max-bs-[550px] bs-[550px]' })}
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={classnames('bs-full', settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg')}>
              <ClickAwayListener onClickAway={handleClose}>
                <div className='bs-full flex flex-col'>
                  <div className='flex items-center justify-between plb-3.5 pli-4 is-full gap-2'>
                    <Typography variant='h6' className='flex-auto'>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip size='small' variant='tonal' color='primary' label={`${unreadCount} New`} />
                    )}
                    {notifications.length > 0 && (
                      <Tooltip
                        title='Mark all as read'
                        placement={placement === 'bottom-end' ? 'left' : 'right'}
                      >
                        <IconButton size='small' onClick={() => readAllNotifications()} className='text-textPrimary'>
                          <i className='tabler-mail-opened' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                  <Divider />
                  <ScrollWrapper hidden={hidden}>
                    {loading ? (
                      <div className='flex flex-col items-center justify-center p-8'>
                        <CircularProgress size={32} />
                        <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                          Loading notifications...
                        </Typography>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => {
                        return (
                          <div
                            key={notification.id}
                            className={classnames('flex flex-col plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover group', {
                              'border-be': true,
                              'bg-actionHover bg-opacity-10': !notification.is_read
                            })}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className='flex gap-3'>
                              {getAvatar({
                                icon: notification.icon,
                                color: notification.color,
                                title: notification.title
                              })}
                              <div className='flex flex-col flex-auto'>
                                <Typography variant='body2' className='font-medium mbe-1' color='text.primary'>
                                  {notification.title}
                                </Typography>
                                {notification.description && (
                                  <Typography variant='caption' color='text.secondary' className='mbe-2'>
                                    {notification.description}
                                  </Typography>
                                )}
                                <Typography variant='caption' color='text.disabled'>
                                  {formatTimeAgo(notification.created_at)}
                                </Typography>
                              </div>
                              <div className='flex flex-col items-end gap-2'>
                                <Badge
                                  variant='dot'
                                  color={notification.is_read ? 'secondary' : 'primary'}
                                  onClick={e => handleReadNotification(e, notification)}
                                  className={classnames('mbs-1 mie-1', {
                                    'invisible group-hover:visible': notification.is_read
                                  })}
                                />
                                <i
                                  className='tabler-x text-xl invisible group-hover:visible cursor-pointer'
                                  onClick={e => handleRemoveNotification(e, notification.id)}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className='flex flex-col items-center justify-center p-8'>
                        <i className='tabler-bell-off text-6xl text-textDisabled mb-2' />
                        <Typography variant='body2' color='text.secondary'>
                          No notifications
                        </Typography>
                      </div>
                    )}
                  </ScrollWrapper>
                  <Divider />
                  <div className='p-4'>
                    <Button fullWidth variant='contained' size='small' onClick={handleViewAllNotifications}>
                      View All Notifications
                    </Button>
                  </div>
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationDropdown
