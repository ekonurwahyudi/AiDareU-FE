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
  id: string
  title: string
  subtitle: string
  time: string
  read: boolean
  orderId?: string
} & (
  | {
      avatarImage?: string
      avatarIcon?: never
      avatarText?: never
      avatarColor?: never
      avatarSkin?: never
    }
  | {
      avatarIcon?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarText?: never
    }
  | {
      avatarText?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarIcon?: never
    }
)

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

const getAvatar = (
  params: Pick<NotificationsType, 'avatarImage' | 'avatarIcon' | 'title' | 'avatarText' | 'avatarColor' | 'avatarSkin'>
) => {
  const { avatarImage, avatarIcon, avatarText, title, avatarColor, avatarSkin } = params

  if (avatarImage) {
    return <Avatar src={avatarImage} />
  } else if (avatarIcon) {
    return (
      <CustomAvatar color={avatarColor} skin={avatarSkin || 'light-static'}>
        <i className={avatarIcon} />
      </CustomAvatar>
    )
  } else {
    return (
      <CustomAvatar color={avatarColor} skin={avatarSkin || 'light-static'}>
        {avatarText || getInitials(title)}
      </CustomAvatar>
    )
  }
}

// Helper function to format time ago
const formatTimeAgo = (date: string): string => {
  const now = new Date()
  const orderDate = new Date(date)
  const diffInMs = now.getTime() - orderDate.getTime()
  const diffInMins = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMins < 1) return 'Baru saja'
  if (diffInMins < 60) return `${diffInMins} menit yang lalu`
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`
  return orderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// Helper function to format currency
const formatRupiah = (amount: number): string => {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

const NotificationDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationsType[]>([])
  const [loading, setLoading] = useState(true)
  const [storeUuid, setStoreUuid] = useState<string | null>(null)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // Hooks
  const router = useRouter()
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  // Get unread notifications count
  const notificationCount = notifications.filter(n => !n.read).length
  const readAll = notifications.every(n => n.read)

  // Fetch store UUID and orders
  useEffect(() => {
    const fetchStoreUuid = async () => {
      try {
        const storedUserData = localStorage.getItem('user_data')
        const authToken = localStorage.getItem('auth_token')

        if (!storedUserData) return

        const userData = JSON.parse(storedUserData)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

        const headers: HeadersInit = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

        if (userData.uuid) {
          headers['X-User-UUID'] = userData.uuid
        }

        const response = await fetch(`${backendUrl}/api/users/me`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.data?.store?.uuid) {
            setStoreUuid(result.data.store.uuid)
          }
        }
      } catch (error) {
        console.error('Error fetching store UUID:', error)
      }
    }

    fetchStoreUuid()
  }, [])

  // Fetch orders when storeUuid is available
  useEffect(() => {
    if (!storeUuid) return

    const fetchOrders = async () => {
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

        const response = await fetch(`${backendUrl}/api/stores/${storeUuid}/orders?per_page=10&status=pending`, {
          headers,
          credentials: 'include',
          cache: 'no-store'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.data) {
            // Get read notifications from localStorage
            const readNotifications = JSON.parse(localStorage.getItem('read_order_notifications') || '[]')

            // Convert orders to notifications
            const orderNotifications: NotificationsType[] = result.data.data.map((order: any) => ({
              id: order.uuid,
              title: `Pesanan Baru #${order.nomor_order}`,
              subtitle: `${order.customer?.nama} - ${formatRupiah(order.total_harga)}`,
              time: formatTimeAgo(order.created_at),
              read: readNotifications.includes(order.uuid),
              orderId: order.uuid,
              avatarIcon: 'tabler-shopping-cart',
              avatarColor: 'success' as ThemeColor,
              avatarSkin: 'light-static' as CustomAvatarProps['skin']
            }))

            setNotifications(orderNotifications)
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000)

    return () => clearInterval(interval)
  }, [storeUuid])

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  // Navigate to order detail and mark as read
  const handleNotificationClick = (notification: NotificationsType) => {
    if (notification.orderId) {
      // Mark as read
      const readNotifications = JSON.parse(localStorage.getItem('read_order_notifications') || '[]')
      if (!readNotifications.includes(notification.id)) {
        readNotifications.push(notification.id)
        localStorage.setItem('read_order_notifications', JSON.stringify(readNotifications))
      }

      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ))

      // Navigate to order details
      router.push(`/apps/tokoku/orders/details/${notification.orderId}`)
      handleClose()
    }
  }

  // Read notification when notification is clicked
  const handleReadNotification = (event: MouseEvent<HTMLElement>, value: boolean, id: string) => {
    event.stopPropagation()

    const readNotifications = JSON.parse(localStorage.getItem('read_order_notifications') || '[]')

    if (value && !readNotifications.includes(id)) {
      readNotifications.push(id)
      localStorage.setItem('read_order_notifications', JSON.stringify(readNotifications))
    } else if (!value) {
      const index = readNotifications.indexOf(id)
      if (index > -1) {
        readNotifications.splice(index, 1)
        localStorage.setItem('read_order_notifications', JSON.stringify(readNotifications))
      }
    }

    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: value } : n
    ))
  }

  // Remove notification when close icon is clicked
  const handleRemoveNotification = (event: MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation()

    // Add to read notifications to hide it
    const readNotifications = JSON.parse(localStorage.getItem('read_order_notifications') || '[]')
    if (!readNotifications.includes(id)) {
      readNotifications.push(id)
      localStorage.setItem('read_order_notifications', JSON.stringify(readNotifications))
    }

    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Read or unread all notifications when read all icon is clicked
  const readAllNotifications = () => {
    const readNotifications = JSON.parse(localStorage.getItem('read_order_notifications') || '[]')

    if (readAll) {
      // Mark all as unread
      notifications.forEach(n => {
        const index = readNotifications.indexOf(n.id)
        if (index > -1) {
          readNotifications.splice(index, 1)
        }
      })
    } else {
      // Mark all as read
      notifications.forEach(n => {
        if (!readNotifications.includes(n.id)) {
          readNotifications.push(n.id)
        }
      })
    }

    localStorage.setItem('read_order_notifications', JSON.stringify(readNotifications))
    setNotifications(prev => prev.map(n => ({ ...n, read: !readAll })))
  }

  const handleViewAllNotifications = () => {
    router.push('/apps/tokoku/orders')
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
          badgeContent={notificationCount}
          className='cursor-pointer'
          overlap='circular'
          invisible={notificationCount === 0}
          sx={{
            '& .MuiBadge-badge': {
              minWidth: notificationCount > 9 ? '20px' : '16px',
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
                    {notificationCount > 0 && (
                      <Chip size='small' variant='tonal' color='primary' label={`${notificationCount} New`} />
                    )}
                    {notifications.length > 0 && (
                      <Tooltip
                        title={readAll ? 'Mark all as unread' : 'Mark all as read'}
                        placement={placement === 'bottom-end' ? 'left' : 'right'}
                        slotProps={{
                          popper: {
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                transformOrigin:
                                  placement === 'bottom-end' ? 'right center !important' : 'right center !important'
                              }
                            }
                          }
                        }}
                      >
                        <IconButton size='small' onClick={() => readAllNotifications()} className='text-textPrimary'>
                          <i className={readAll ? 'tabler-mail' : 'tabler-mail-opened'} />
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
                        const {
                          id,
                          title,
                          subtitle,
                          time,
                          read,
                          avatarImage,
                          avatarIcon,
                          avatarText,
                          avatarColor,
                          avatarSkin
                        } = notification

                        return (
                          <div
                            key={id}
                            className={classnames('flex plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover group', {
                              'border-be': true,
                              'bg-actionHover bg-opacity-10': !read
                            })}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            {getAvatar({ avatarImage, avatarIcon, title, avatarText, avatarColor, avatarSkin })}
                            <div className='flex flex-col flex-auto'>
                              <Typography variant='body2' className='font-medium mbe-1' color='text.primary'>
                                {title}
                              </Typography>
                              <Typography variant='caption' color='text.secondary' className='mbe-2'>
                                {subtitle}
                              </Typography>
                              <Typography variant='caption' color='text.disabled'>
                                {time}
                              </Typography>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                              <Badge
                                variant='dot'
                                color={read ? 'secondary' : 'primary'}
                                onClick={e => handleReadNotification(e, !read, id)}
                                className={classnames('mbs-1 mie-1', {
                                  'invisible group-hover:visible': read
                                })}
                              />
                              <i
                                className='tabler-x text-xl invisible group-hover:visible'
                                onClick={e => handleRemoveNotification(e, id)}
                              />
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
                      View All Orders
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
