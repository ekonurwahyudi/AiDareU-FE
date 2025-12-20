'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Snackbar from '@mui/material/Snackbar'

// Context Imports
import { useProductForm } from '@/contexts/ProductFormContext'

const ProductAddHeader = () => {
  const router = useRouter()
  const { submitForm, isSubmitting, setFormData, errors, successMessage, setSuccessMessage } = useProductForm()

  // Get all error messages
  const errorMessages = Object.entries(errors).filter(([key]) => key !== 'submit').map(([key, value]) => value)
  const hasValidationErrors = errorMessages.length > 0

  const handleCloseSuccess = () => {
    setSuccessMessage('')
  }

  const handleBack = () => {
    router.push('/apps/tokoku/products')
  }

  const handleSaveDraft = async () => {
    await submitForm({ status_produk: 'draft' })
  }

  const handlePublish = async () => {
    await submitForm({ status_produk: 'active' })
  }

  return (
    <>
      <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
        <div>
          <Typography variant='h4' className='mbe-1'>
            Tambah Produk
          </Typography>
          <Typography>Tambahkan produk kamu disini</Typography>
        </div>

        {(errors.submit || hasValidationErrors) && (
          <Alert severity="error" className="w-full" sx={{ maxWidth: '100%' }}>
            <AlertTitle>{errors.submit || 'Validasi gagal'}</AlertTitle>
            {hasValidationErrors && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Mohon perbaiki kesalahan berikut:
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {errorMessages.map((message, index) => (
                    <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                      <ListItemText
                        primary={`• ${message}`}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Alert>
        )}

        <div className='flex flex-wrap max-sm:flex-col gap-4'>
          <Button
            variant='outlined'
            color='primary'
            startIcon={<i className="tabler-chevrons-left" />}
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Kembali
          </Button>
          <Button
            variant='outlined'
            color='warning'
            startIcon={isSubmitting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-file-plus" />}
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Draft'}
          </Button>
          <Button
            variant='contained'
            color='success'
            startIcon={isSubmitting ? <i className="tabler-loader animate-spin" /> : <i className="tabler-rocket" />}
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mempublish...' : 'Publish Product'}
          </Button>
        </div>
      </div>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" variant="filled" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ProductAddHeader
