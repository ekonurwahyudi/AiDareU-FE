'use client'

import { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'

interface TopUpModalProps {
  open: boolean
  onClose: () => void
  currentCoin: number
  requiredCoin: number
  onTopUp?: (amount: number) => void
}

const TopUpModal = ({ open, onClose, currentCoin, requiredCoin, onTopUp }: TopUpModalProps) => {
  const [selectedTopUp, setSelectedTopUp] = useState<number | null>(10) // Default 10 Pts
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('VC') // Default: Credit Card
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setSelectedTopUp(10) // Reset to default
    setCustomAmount('')
    setPaymentMethod('VC')
    setError(null)
    onClose()
  }

  const handleTopUp = async () => {
    if (selectedTopUp === null) return
    const amount = selectedTopUp === 0 ? parseInt(customAmount) : selectedTopUp

    if (!amount || amount < 1) {
      setError('Jumlah coin minimal 1')
      return
    }

    // If onTopUp callback is provided (for testing), use it
    if (onTopUp) {
      onTopUp(amount)
      return
    }

    // Otherwise, call Duitku API
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          coin_amount: amount,
          payment_method: paymentMethod
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to payment URL
        if (result.data.payment_url) {
          window.location.href = result.data.payment_url
        } else {
          setError('Payment URL tidak ditemukan')
        }
      } else {
        setError(result.message || 'Gagal membuat pembayaran')
      }
    } catch (err) {
      console.error('Top up error:', err)
      setError('Terjadi kesalahan saat membuat pembayaran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'warning.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i className='tabler-coin' style={{ fontSize: 32, color: '#f59e0b' }} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Coin Tidak Cukup
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
          Maaf, Anda tidak memiliki cukup coin untuk melakukan generate AI.
        </Typography>

        {/* Coin Info */}
        <Box
          sx={{
            p: 2.5,
            bgcolor: 'action.hover',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Box>
            <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
              Coin Anda Saat Ini
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 600, color: 'error.main' }}>
              {currentCoin} Pts
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>
              Coin yang Dibutuhkan
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 600, color: 'success.main' }}>
              {requiredCoin} Pts
            </Typography>
          </Box>
        </Box>

        {/* Price Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#FFF7ED', borderRadius: 2, border: '1px solid #FDBA74' }}>
          <Typography variant='body2' sx={{ fontWeight: 600, color: '#C2410C', textAlign: 'center' }}>
            💰 1 Coin = Rp 1.000
          </Typography>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Top Up Packages */}
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
          Pilih Paket Top Up
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          {[5, 10, 20, 50, 100].map(amount => (
            <Card
              key={amount}
              onClick={() => {
                setSelectedTopUp(amount)
                setCustomAmount('')
              }}
              sx={{
                cursor: 'pointer',
                border: 2,
                borderColor: selectedTopUp === amount ? 'warning.main' : 'divider',
                bgcolor: selectedTopUp === amount ? 'warning.lighter' : 'background.paper',
                transition: 'all 0.2s',
                flex: '1 1 auto',
                minWidth: '110px',
                boxShadow: selectedTopUp === amount ? 3 : 0,
                '&:hover': {
                  borderColor: 'warning.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                  bgcolor: selectedTopUp === amount ? 'warning.lighter' : 'action.hover'
                }
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
                <i className='tabler-coin' style={{ fontSize: 20, color: '#f59e0b', flexShrink: 0 }} />
                <Box>
                  <Typography variant='body2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {amount} Pts
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem', lineHeight: 1 }}>
                    Rp {(amount * 1000).toLocaleString('id-ID')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Payment Method Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
            Metode Pembayaran
          </Typography>
          <FormControl component='fieldset'>
            <RadioGroup
              row
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              sx={{ gap: 2 }}
            >
              <FormControlLabel
                value='VC'
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-credit-card' style={{ fontSize: 20 }} />
                    <Typography variant='body2'>Credit Card</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value='VA'
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-building-bank' style={{ fontSize: 20 }} />
                    <Typography variant='body2'>Virtual Account</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value='OV'
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='tabler-wallet' style={{ fontSize: 20 }} />
                    <Typography variant='body2'>E-Wallet</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Custom Amount */}
        <Card
          onClick={() => setSelectedTopUp(0)}
          sx={{
            cursor: 'pointer',
            border: 2,
            borderColor: selectedTopUp === 0 ? 'warning.main' : 'divider',
            bgcolor: selectedTopUp === 0 ? 'warning.lighter' : 'background.paper',
            transition: 'all 0.2s',
            boxShadow: selectedTopUp === 0 ? 3 : 0,
            '&:hover': {
              borderColor: 'warning.main',
              boxShadow: 4,
              bgcolor: selectedTopUp === 0 ? 'warning.lighter' : 'action.hover'
            }
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <i className='tabler-edit' style={{ fontSize: 24, color: '#f59e0b' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>
                  Custom Amount
                </Typography>
                {selectedTopUp === 0 && (
                  <TextField
                    fullWidth
                    size='small'
                    type='number'
                    placeholder='Masukkan jumlah coin...'
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    InputProps={{
                      endAdornment: <Typography variant='caption' sx={{ ml: 1 }}>Pts</Typography>
                    }}
                    sx={{ mt: 1 }}
                  />
                )}
                {selectedTopUp === 0 && customAmount && (
                  <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1, fontSize: '0.75rem' }}>
                    Total: Rp {(parseInt(customAmount || '0') * 1000).toLocaleString('id-ID')}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} color='inherit' disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleTopUp}
          variant='contained'
          color='warning'
          disabled={selectedTopUp === null || (selectedTopUp === 0 && !customAmount) || loading}
          startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-coin' />}
          sx={{ fontWeight: 600 }}
        >
          {loading ? 'Processing...' : `Top Up ${selectedTopUp === 0 && customAmount ? parseInt(customAmount) : selectedTopUp} Pts`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TopUpModal
