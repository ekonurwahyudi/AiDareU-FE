'use client'

// React Imports
import { useState } from 'react'
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

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

const StoreWarningBanner = () => {
  const { currentStore } = useRBAC()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Don't show banner if user has a store
  if (currentStore) {
    return null
  }

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
  }

  const handleComplete = async () => {
    // Close modal
    setModalOpen(false)
    setOpen(false)

    // Refresh the page to reload RBAC context with new store
    router.refresh()

    // Small delay then reload
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (!open) {
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
                  onClick={() => setOpen(false)}
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
