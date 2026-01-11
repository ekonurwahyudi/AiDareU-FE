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
  const [selectedTopUp, setSelectedTopUp] = useState<number | null>(10)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // QRIS Payment states
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
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
        const { qr_string, merchant_order_id, amount: totalAmount } = result.data

        if (!qr_string) {
          setError('QR Code tidak tersedia. Silakan coba lagi.')
          setLoading(false)
          return
        }

        const qrDataUrl = await QRCode.toDataURL(qr_string, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        })

        setQrCodeDataUrl(qrDataUrl)
        setMerchantOrderId(merchant_order_id)
        setPaymentAmount(totalAmount)
        setShowQRCode(true)

        const expiryTimestamp = Date.now() + (60 * 60 * 1000) // 60 minutes
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
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '50%', bgcolor: 'warning.lighter',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className='tabler-coin' style={{ fontSize: 32, color: '#f59e0b' }} />
          </Box>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            {showQRCode ? 'Pembayaran QRIS' : 'Top Up Coin'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showQRCode ? (
          <>
            <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
              {currentCoin < requiredCoin 
                ? 'Maaf, Anda tidak memiliki cukup coin untuk melakukan generate AI.'
                : 'Tambah coin untuk menggunakan fitur AI.'}
            </Typography>

            <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>Coin Anda Saat Ini</Typography>
                <Typography variant='h6' sx={{ fontWeight: 600, color: currentCoin < requiredCoin ? 'error.main' : 'success.main' }}>
                  {currentCoin} Pts
                </Typography>
              </Box>
              {requiredCoin > 0 && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 0.5 }}>Coin yang Dibutuhkan</Typography>
                  <Typography variant='h6' sx={{ fontWeight: 600, color: 'success.main' }}>{requiredCoin} Pts</Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: '#FFF7ED', borderRadius: 2, border: '1px solid #FDBA74' }}>
              <Typography variant='body2' sx={{ fontWeight: 600, color: '#C2410C', textAlign: 'center' }}>
                💰 1 Coin = Rp 1.000
              </Typography>
            </Box>

            {error && (
              <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>Pilih Paket Top Up</Typography>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
              {[5, 10, 20, 50, 100].map(amount => (
                <Card
                  key={amount}
                  onClick={() => { setSelectedTopUp(amount); setCustomAmount('') }}
                  sx={{
                    cursor: 'pointer', border: 2,
                    borderColor: selectedTopUp === amount ? 'warning.main' : 'divider',
                    bgcolor: selectedTopUp === amount ? 'warning.lighter' : 'background.paper',
                    transition: 'all 0.2s', flex: '1 1 auto', minWidth: '110px',
                    boxShadow: selectedTopUp === amount ? 3 : 0,
                    '&:hover': { borderColor: 'warning.main', transform: 'translateY(-2px)', boxShadow: 4 }
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, px: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <i className='tabler-coin' style={{ fontSize: 20, color: '#f59e0b', flexShrink: 0 }} />
                    <Box>
                      <Typography variant='body2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>{amount} Pts</Typography>
                      <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        Rp {(amount * 1000).toLocaleString('id-ID')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Card
              onClick={() => setSelectedTopUp(0)}
              sx={{
                cursor: 'pointer', border: 2,
                borderColor: selectedTopUp === 0 ? 'warning.main' : 'divider',
                bgcolor: selectedTopUp === 0 ? 'warning.lighter' : 'background.paper',
                boxShadow: selectedTopUp === 0 ? 3 : 0,
                '&:hover': { borderColor: 'warning.main', boxShadow: 4 }
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <i className='tabler-edit' style={{ fontSize: 24, color: '#f59e0b' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>Custom Amount</Typography>
                    {selectedTopUp === 0 && (
                      <>
                        <TextField
                          fullWidth size='small' type='number' placeholder='Masukkan jumlah coin...'
                          value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                          slotProps={{ input: { endAdornment: <InputAdornment position='end'>Pts</InputAdornment> } }}
                          sx={{ mt: 1 }}
                        />
                        {customAmount && (
                          <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1, fontSize: '0.75rem' }}>
                            Total: Rp {(parseInt(customAmount || '0') * 1000).toLocaleString('id-ID')}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
              Scan QR Code di bawah ini menggunakan aplikasi e-wallet Anda
            </Typography>

            {qrCodeDataUrl && (
              <Box sx={{ display: 'inline-block', p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 3, mb: 2 }}>
                <img src={qrCodeDataUrl} alt='QR Code Payment' style={{ display: 'block', width: '280px', height: '280px' }} />
              </Box>
            )}

            <Box sx={{ mt: 2, p: 2, bgcolor: timeRemaining < 300 ? 'error.lighter' : 'warning.lighter', borderRadius: 2 }}>
              <Typography variant='body2' sx={{ color: timeRemaining < 300 ? 'error.dark' : 'warning.dark', fontWeight: 600 }}>
                ⏱️ Waktu tersisa: {formatTime(timeRemaining)}
              </Typography>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Order ID: {merchantOrderId}
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 600, color: 'primary.main' }}>
                Total: Rp {paymentAmount?.toLocaleString('id-ID')}
              </Typography>
            </Box>

            <Button
              variant='outlined'
              color='primary'
              startIcon={<i className='tabler-download' />}
              onClick={downloadQRCode}
              sx={{ mt: 2 }}
            >
              Download Gambar QRIS
            </Button>

            {error && (
              <Alert severity='error' sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            <Alert severity='info' sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>Cara Pembayaran:</Typography>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                <li>Buka aplikasi e-wallet (GoPay, OVO, Dana, ShopeePay, dll)</li>
                <li>Pilih menu Scan QR / QRIS</li>
                <li>Arahkan kamera ke QR Code di atas</li>
                <li>Konfirmasi pembayaran</li>
              </ol>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} color='inherit'>
          {showQRCode ? 'Tutup' : 'Batal'}
        </Button>
        {!showQRCode && (
          <Button
            onClick={handleTopUp}
            variant='contained'
            color='warning'
            disabled={selectedTopUp === null || (selectedTopUp === 0 && !customAmount) || loading}
            startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-coin' />}
            sx={{ fontWeight: 600 }}
          >
            {loading ? 'Memproses...' : `Top Up ${selectedTopUp === 0 && customAmount ? parseInt(customAmount) : selectedTopUp} Pts`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TopUpModal
