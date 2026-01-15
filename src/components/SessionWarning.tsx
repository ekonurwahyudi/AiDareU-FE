'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

// Utils
import { SessionManager } from '@/utils/sessionManager'

const SessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't initialize on public pages
    const publicPaths = ['/', '/login', '/register', '/forgot-password']
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/s/'))

    if (isPublicPath) {
      return
    }

    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token')

    if (!authToken) {
      return
    }

    // Initialize session manager
    const sessionManager = SessionManager.getInstance()

    sessionManager.init({
      onExpired: () => {
        // Clear auth data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('unverified_user')
        localStorage.removeItem('last_activity')

        // Redirect to login
        router.push(`/login?expired=true&redirect=${encodeURIComponent(pathname)}`)
      },
      onWarning: (seconds: number) => {
        setRemainingTime(seconds)
        setShowWarning(true)
      }
    })

    return () => {
      sessionManager.stop()
    }
  }, [router, pathname])

  const handleStayLoggedIn = () => {
    // Trigger activity to extend session
    const sessionManager = SessionManager.getInstance()

    sessionManager.updateActivity()
    setShowWarning(false)
  }

  const handleClose = () => {
    setShowWarning(false)
  }

  const hours = Math.floor(remainingTime / 3600)
  const minutes = Math.floor((remainingTime % 3600) / 60)
  const seconds = remainingTime % 60

  // Format time display
  let timeDisplay = ''
  if (hours > 0) {
    timeDisplay = `${hours} jam ${minutes} menit`
  } else if (minutes > 0) {
    timeDisplay = `${minutes} menit ${seconds} detik`
  } else {
    timeDisplay = `${seconds} detik`
  }

  return (
    <Snackbar
      open={showWarning}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClose={handleClose}
      sx={{ top: { xs: 16, sm: 24 } }}
    >
      <Alert
        severity='warning'
        variant='filled'
        onClose={handleClose}
        action={
          <Button color='inherit' size='small' onClick={handleStayLoggedIn}>
            Tetap Login
          </Button>
        }
        sx={{ width: '100%', maxWidth: 600 }}
      >
        Sesi Anda akan berakhir dalam {timeDisplay} karena tidak ada aktivitas. Klik "Tetap Login" atau lakukan
        aktivitas apapun untuk memperpanjang sesi.
      </Alert>
    </Snackbar>
  )
}

export default SessionWarning
