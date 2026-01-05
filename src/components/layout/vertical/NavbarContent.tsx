'use client'

// React Imports
import { useEffect, useState } from 'react'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { ShortcutsType } from '@components/layout/shared/ShortcutsDropdown'
import type { NotificationsType } from '@components/layout/shared/NotificationsDropdown'

// Component Imports
import NavToggle from './NavToggle'
import NavSearch from '@components/layout/shared/search'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ShortcutsDropdown from '@components/layout/shared/ShortcutsDropdown'
import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Vars
const shortcuts: ShortcutsType[] = [
  {
    url: '/apps/calendar',
    icon: 'tabler-calendar',
    title: 'Calendar',
    subtitle: 'Appointments'
  },
  {
    url: '/apps/invoice/list',
    icon: 'tabler-file-dollar',
    title: 'Invoice App',
    subtitle: 'Manage Accounts'
  },
  {
    url: '/apps/user/list',
    icon: 'tabler-user',
    title: 'Users',
    subtitle: 'Manage Users'
  },
  {
    url: '/apps/roles',
    icon: 'tabler-users-group',
    title: 'Role Management',
    subtitle: 'Permissions'
  },
  {
    url: '/',
    icon: 'tabler-device-desktop-analytics',
    title: 'Dashboard',
    subtitle: 'User Dashboard'
  },
  {
    url: '/pages/account-settings',
    icon: 'tabler-settings',
    title: 'Settings',
    subtitle: 'Account Settings'
  }
]

const NavbarContent = () => {
  // States
  const [orderNotifications, setOrderNotifications] = useState<NotificationsType[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch order notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)

        // Get user data from localStorage
        const userDataStr = localStorage.getItem('user_data')

        if (!userDataStr) {
          console.warn('⚠️ [Notifications] No user data found in localStorage, using default notifications')
          return
        }

        const userData = JSON.parse(userDataStr)
        const userUuid = userData.uuid

        if (!userUuid) {
          console.warn('⚠️ [Notifications] No user UUID in user data:', userData)
          return
        }

        // console.log('📡 [Notifications] Fetching notifications for user:', userUuid)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`,
          {
            cache: 'no-store',
            headers: {
              'X-User-UUID': userUuid
            }
          }
        )

        const result = await response.json()

        // console.log('📬 [Notifications] API Response:', result)

        if (result.success) {
          const count = result.unread_count || 0
          // Set notification count for badge (not using setOrderNotifications anymore)
          // The actual notifications are handled by NotificationsDropdown component
        } else {
          // console.warn('⚠️ [Notifications] Invalid API response:', result)
        }
      } catch (error) {
        console.error('❌ [Notifications] Error fetching notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={classnames(verticalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}>
      <div className='flex items-center gap-4'>
        <NavToggle />
        <NavSearch />
      </div>
      <div className='flex items-center'>
        <ModeDropdown />
        <ShortcutsDropdown shortcuts={shortcuts} />
        <NotificationsDropdown notifications={orderNotifications} />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
