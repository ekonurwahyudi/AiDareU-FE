'use client'

import { useState, useEffect, useRef } from 'react'
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
import InputAdornment from '@mui/material/InputAdornment'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { safeRedirect } from '@/utils/security'
import QRCode from 'qrcode'

interface TopUpModalProps {
  open: boolean
  onClose: () => void
  currentCoin: number
  requiredCoin: number
  onTopUp?: (amount: number) => void
}

const TopUpModal = ({ open, onClose, currentCoin, requiredCoin, onTopUp }: TopUpModalProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [selectedTopUp, setSelectedTopUp] = useState<number | null>(10)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // QRIS Payment states
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [coinAmountDisplay, setCoinAmountDisplay] = useState<number>(0)
  const [expiryTime, setExpiryTime] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (expiryTime > 0) {
      countdownIntervalRef.current = setInterval(() => {
        const remaining = Math.floor((expiryTime - Date.now()) / 1000)
        if (remaining <= 0) {
          setTimeRemaining(0)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setError('Waktu pembayaran telah habis. Silakan buat pembayaran baru.')
          setShowQRCode(false)
        } else {
          setTimeRemaining(remaining)
        }
      }, 1000)
      return () => {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      }
    }
  }, [expiryTime])

  const handleClose = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setSelectedTopUp(10)
    setCustomAmount('')
    setError(null)
    setShowQRCode(false)
    setQrCodeDataUrl(null)
    setMerchantOrderId(null)
    setPaymentAmount(0)
    setCoinAmountDisplay(0)
    setExpiryTime(0)
    setTimeRemaining(0)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/status/${orderId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data.status === 'success') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          setLoading(false)
          setShowQRCode(false)
          alert('Pembayaran berhasil! Coin Anda telah ditambahkan.')
          safeRedirect('/apps/user/coin')
        } else if (result.data.status === 'failed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
          setError('Pembayaran gagal. Silakan coba lagi.')
          setLoading(false)
          setShowQRCode(false)
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
    }
  }

  const startPolling = (orderId: string) => {
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(orderId)
    }, 3000)
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return
    const link = document.createElement('a')
    link.download = `QRIS-TopUp-${merchantOrderId}.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  const handleTopUp = async () => {
    if (selectedTopUp === null) return
    const amount = selectedTopUp === 0 ? parseInt(customAmount) : selectedTopUp
    if (!amount || amount < 1) {
      setError('Jumlah coin minimal 1')
      return
    }
    if (onTopUp) {
      onTopUp(amount)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setShowQRCode(false)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ coin_amount: amount })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const { qr_string, merchant_order_id, amount: totalAmount, coin_amount } = result.data
        if (!qr_string) {
          setError('QR Code tidak tersedia. Silakan coba lagi.')
          setLoading(false)
          return
        }

        const qrDataUrl = await QRCode.toDataURL(qr_string, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        })

        setQrCodeDataUrl(qrDataUrl)
        setMerchantOrderId(merchant_order_id)
        setPaymentAmount(totalAmount)
        setCoinAmountDisplay(coin_amount)
        setShowQRCode(true)
        const expiryTimestamp = Date.now() + (60 * 60 * 1000)
        setExpiryTime(expiryTimestamp)
        setTimeRemaining(60 * 60)
        startPolling(merchant_order_id)
        setLoading(false)
      } else {
        if (response.status === 401) {
          setError('Sesi Anda telah berakhir. Silakan login kembali.')
        } else {
          setError(result.message || 'Gagal membuat pembayaran')
        }
        setLoading(false)
      }
    } catch (err: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth='sm' 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          m: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: isMobile ? 2 : 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '50%', bgcolor: 'warning.lighter',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <i className='tabler-coin' style={{ fontSize: 24, color: '#f59e0b' }} />
          </Box>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            {showQRCode ? 'Pembayaran QRIS' : 'Top Up Coin'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: isMobile ? 2 : 3, pb: 2 }}>
        {!showQRCode ? (
          <>
            {/* Coin Info */}
            <Box sx={{ 
              p: 2, bgcolor: 'action.hover', borderRadius: 2, 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              mb: 2, flexWrap: 'wrap', gap: 1 
            }}>
              <Box sx={{ minWidth: 100 }}>
                <Typography variant='caption' sx={{ color: 'text.secondary' }}>Coin Saat Ini</Typography>
                <Typography variant='h6' sx={{ fontWeight: 600, color: currentCoin < requiredCoin ? 'error.main' : 'success.main', lineHeight: 1.2 }}>
                  {currentCoin} Pts
                </Typography>
              </Box>
              {requiredCoin > 0 && (
                <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>Dibutuhkan</Typography>
                  <Typography variant='h6' sx={{ fontWeight: 600, color: 'success.main', lineHeight: 1.2 }}>{requiredCoin} Pts</Typography>
                </Box>
              )}
            </Box>

            {/* Price Info */}
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#FFF7ED', borderRadius: 2, border: '1px solid #FDBA74' }}>
              <Typography variant='body2' sx={{ fontWeight: 600, color: '#C2410C', textAlign: 'center' }}>
                💰 1 Coin = Rp 1.000
              </Typography>
            </Box>

            {error && <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1.5 }}>Pilih Paket Top Up</Typography>

            {/* Package Grid - 3 columns on mobile, 5 on desktop */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', 
              gap: 1, 
              mb: 2 
            }}>
              {[5, 10, 20, 50, 100].map(amount => (
                <Card
                  key={amount}
                  onClick={() => { setSelectedTopUp(amount); setCustomAmount('') }}
                  sx={{
                    cursor: 'pointer', border: 2,
                    borderColor: selectedTopUp === amount ? 'warning.main' : 'divider',
                    bgcolor: selectedTopUp === amount ? 'warning.lighter' : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: 'warning.main' }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                    <Typography variant='body2' sx={{ fontWeight: 700 }}>{amount}</Typography>
                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                      Rp {(amount * 1000 / 1000).toLocaleString('id-ID')}K
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Custom Amount */}
            <Card
              onClick={() => setSelectedTopUp(0)}
              sx={{
                cursor: 'pointer', border: 2,
                borderColor: selectedTopUp === 0 ? 'warning.main' : 'divider',
                bgcolor: selectedTopUp === 0 ? 'warning.lighter' : 'background.paper',
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: selectedTopUp === 0 ? 1 : 0 }}>
                  ✏️ Custom Amount
                </Typography>
                {selectedTopUp === 0 && (
                  <>
                    <TextField
                      fullWidth size='small' type='number' placeholder='Jumlah coin...'
                      value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                      slotProps={{ input: { endAdornment: <InputAdornment position='end'>Pts</InputAdornment> } }}
                    />
                    {customAmount && (
                      <Typography variant='caption' sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                        = Rp {(parseInt(customAmount || '0') * 1000).toLocaleString('id-ID')}
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* QRIS Payment View */
          <Box sx={{ textAlign: 'center' }}>
            {/* QRIS Logo */}
            <Box sx={{ mb: 2 }}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/1200px-Logo_QRIS.svg.png" 
                alt="QRIS Logo" 
                style={{ height: 40, objectFit: 'contain' }}
              />
            </Box>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <Box sx={{ 
                display: 'inline-block', 
                p: 2, 
                bgcolor: 'white', 
                borderRadius: 2, 
                boxShadow: 2,
                border: '1px solid #eee'
              }}>
                <img 
                  src={qrCodeDataUrl} 
                  alt='QR Code Payment' 
                  style={{ 
                    display: 'block', 
                    width: isMobile ? '200px' : '240px', 
                    height: isMobile ? '200px' : '240px' 
                  }} 
                />
              </Box>
            )}

            {/* Timer */}
            <Box sx={{ 
              mt: 2, 
              py: 1, 
              px: 2, 
              bgcolor: timeRemaining < 300 ? 'error.lighter' : 'warning.lighter', 
              borderRadius: 2,
              display: 'inline-block'
            }}>
              <Typography variant='body2' sx={{ color: timeRemaining < 300 ? 'error.dark' : 'warning.dark', fontWeight: 600 }}>
                ⏱️ {formatTime(timeRemaining)}
              </Typography>
            </Box>

            {/* Payment Details */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block' }}>
                Order: {merchantOrderId}
              </Typography>
              <Typography variant='body2' sx={{ fontWeight: 600, mt: 0.5 }}>
                {coinAmountDisplay} Coin
              </Typography>
              <Typography variant='h5' sx={{ fontWeight: 700, color: 'primary.main' }}>
                Rp {paymentAmount?.toLocaleString('id-ID')}
              </Typography>
            </Box>

            {/* Download Button */}
            <Button
              variant='outlined'
              size='small'
              startIcon={<i className='tabler-download' />}
              onClick={downloadQRCode}
              sx={{ mt: 2 }}
            >
              Download QRIS
            </Button>

            {error && <Alert severity='error' sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            {/* Instructions - Compact */}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#E0F2FE', borderRadius: 2, textAlign: 'left' }}>
              <Typography variant='caption' sx={{ fontWeight: 600, color: '#0369A1' }}>
                Cara Bayar:
              </Typography>
              <Typography variant='caption' sx={{ color: '#0369A1', display: 'block', mt: 0.5 }}>
                Buka e-wallet → Scan QR → Konfirmasi
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: isMobile ? 2 : 3, pb: isMobile ? 2 : 3, pt: 1 }}>
        <Button onClick={handleClose} color='inherit' size={isMobile ? 'medium' : 'large'}>
          {showQRCode ? 'Tutup' : 'Batal'}
        </Button>
        {!showQRCode && (
          <Button
            onClick={handleTopUp}
            variant='contained'
            color='warning'
            size={isMobile ? 'medium' : 'large'}
            disabled={selectedTopUp === null || (selectedTopUp === 0 && !customAmount) || loading}
            startIcon={loading ? <CircularProgress size={18} color='inherit' /> : <i className='tabler-coin' />}
            sx={{ fontWeight: 600, minWidth: 120 }}
          >
            {loading ? 'Proses...' : `Top Up`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TopUpModal
