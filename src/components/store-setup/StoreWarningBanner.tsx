'use client'

// React Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'

// Component Imports
import StoreSetupModal from './StoreSetupModal'

const StoreWarningBanner = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [hasStore, setHasStore] = useState(true) // Default true to prevent flash

  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('user_data')
        const authToken = localStorage.getItem('auth_token')

        if (!userData || !authToken) {
          setHasStore(false)
          setOpen(true)
          return
        }

        const user = JSON.parse(userData)

        // Check if user has store info locally
        if (user.has_store || user.store_id || user.store) {
          console.log('[StoreWarningBanner] User has store:', user.store || user.store_id)
          setHasStore(true)
          setOpen(false)
          return
        }

        // Check with backend to make sure
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

        const response = await fetch(`${backendUrl}/api/user/store-status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('[StoreWarningBanner] Store status from API:', data)

          if (data.has_store) {
            setHasStore(true)
            setOpen(false)

            // Update localStorage
            user.has_store = true
            user.store_id = data.store_id
            localStorage.setItem('user_data', JSON.stringify(user))
          } else {
            setHasStore(false)
            setOpen(true)
          }
        } else {
          console.warn('[StoreWarningBanner] Failed to check store status')
          // On API error, assume no store
          setHasStore(false)
          setOpen(true)
        }
      } catch (error) {
        console.error('[StoreWarningBanner] Error checking store status:', error)
        // On error, assume no store
        setHasStore(false)
        setOpen(true)
      }
    }

    checkStoreStatus()
  }, [])

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  const handleComplete = async () => {
    // Close modal and banner
    setModalOpen(false)
    setOpen(false)
    setHasStore(true)

    // Refresh the page to reload context with new store
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleDismiss = () => {
    setOpen(false)
    // Re-show after 30 seconds if user dismisses
    setTimeout(() => {
      if (!hasStore) {
        setOpen(true)
      }
    }, 30000)
  }

  // Don't render if user has store
  if (hasStore || !open) {
    return null
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Collapse in={open}>
          <Alert
            severity="warning"
            action={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  color="warning"
                  size="small"
                  variant="contained"
                  onClick={handleOpenModal}
                  startIcon={<i className="tabler-plus" />}
                >
                  Buat Toko Sekarang
                </Button>
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={handleDismiss}
                >
                  <i className="tabler-x" />
                </IconButton>
              </Box>
            }
            sx={{
              '& .MuiAlert-message': {
                width: '100%'
              },
              '& .MuiAlert-action': {
                alignItems: 'center',
                paddingTop: 0
              }
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>
              <i className="tabler-alert-triangle" style={{ marginRight: 8 }} />
              Anda Belum Memiliki Toko
            </AlertTitle>
            Untuk menggunakan fitur-fitur di halaman ini, Anda perlu membuat toko terlebih dahulu.
            Klik tombol "Buat Toko Sekarang" untuk memulai setup toko Anda.
          </Alert>
        </Collapse>
      </Box>

      <StoreSetupModal
        open={modalOpen}
        onClose={handleCloseModal}
        onComplete={handleComplete}
      />
    </>
  )
}

export default StoreWarningBanner
