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
  const [selectedTopUp, setSelectedTopUp] = useState<number | null>(10) // Default 10 Pts
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // QRIS Payment states
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [merchantOrderId, setMerchantOrderId] = useState<string | null>(null)
  const [expiryTime, setExpiryTime] = useState<number>(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  // Countdown timer
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
    // Stop polling
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    setSelectedTopUp(10) // Reset to default
    setCustomAmount('')
    setError(null)
    setDebugInfo(null)
    setShowQRCode(false)
    setQrCodeDataUrl(null)
    setMerchantOrderId(null)
    setExpiryTime(0)
    setTimeRemaining(0)
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const testAuth = async () => {
    try {
      console.log('[TopUpModal] Testing authentication...')
      setDebugInfo('Testing authentication...')

      // Test session endpoint first
      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-session`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('[TopUpModal] Session test status:', sessionResponse.status)
      console.log('[TopUpModal] Session test headers:', Object.fromEntries(sessionResponse.headers.entries()))
      const sessionResult = await sessionResponse.json()
      console.log('[TopUpModal] Session test result:', sessionResult)

      // Test auth endpoint
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('[TopUpModal] Auth test status:', authResponse.status)
      const authResult = await authResponse.json()
      console.log('[TopUpModal] Auth test result:', authResult)

      // Get all cookies
      const cookies = document.cookie.split(';').map(c => c.trim())
      console.log('[TopUpModal] Cookies:', cookies)

      const debugOutput = [
        '=== SESSION TEST ===',
        JSON.stringify(sessionResult, null, 2),
        '',
        '=== AUTH TEST RESULT ===',
        `Status: ${authResponse.status}`,
        `Authenticated: ${authResponse.ok ? 'YES' : 'NO'}`,
        '',
        '=== USER INFO ===',
        JSON.stringify(authResult, null, 2),
        '',
        '=== COOKIES ===',
        cookies.join('\n'),
        '',
        '=== ENVIRONMENT ===',
        `API URL: ${process.env.NEXT_PUBLIC_API_URL}`,
        `Current URL: ${window.location.href}`,
        `Origin: ${window.location.origin}`
      ].join('\n')

      setDebugInfo(debugOutput)
      console.log('[TopUpModal] Debug output:', debugOutput)

    } catch (err: any) {
      console.error('[TopUpModal] Auth test error:', err)
      setDebugInfo(`Error testing auth: ${err.message}`)
    }
  }

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/status/${orderId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[TopUpModal] Payment status:', result)

        if (result.success && result.data.status === 'success') {
          // Payment successful!
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

          console.log('[TopUpModal] Payment completed successfully!')
          setLoading(false)
          setShowQRCode(false)

          // Show success message
          alert('Pembayaran berhasil! Coin Anda telah ditambahkan.')

          // Redirect to coin history
          safeRedirect('/apps/tokoku/coin-history')
        } else if (result.data.status === 'failed') {
          // Payment failed
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
          setError('Pembayaran gagal. Silakan coba lagi.')
          setLoading(false)
          setShowQRCode(false)
        }
      }
    } catch (err) {
      console.error('[TopUpModal] Error checking payment status:', err)
    }
  }

  const startPolling = (orderId: string) => {
    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkPaymentStatus(orderId)
    }, 3000)
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

    // Call Duitku QRIS API
    try {
      setLoading(true)
      setError(null)
      setShowQRCode(false)

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/create`
      console.log('[TopUpModal] Calling QRIS API:', apiUrl)
      console.log('[TopUpModal] Request body:', { coin_amount: amount })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          coin_amount: amount
        })
      })

      console.log('[TopUpModal] Response status:', response.status)
      console.log('[TopUpModal] Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('[TopUpModal] Response body:', result)

      if (response.ok && result.success) {
        const { qr_string, merchant_order_id, expiry_period } = result.data

        if (!qr_string) {
          setError('QR Code tidak tersedia. Silakan coba lagi.')
          setLoading(false)
          return
        }

        console.log('[TopUpModal] Got QR string, generating QR code...')

        // Generate QR code dari qr_string
        try {
          const qrDataUrl = await QRCode.toDataURL(qr_string, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })

          setQrCodeDataUrl(qrDataUrl)
          setMerchantOrderId(merchant_order_id)
          setShowQRCode(true)

          // Set expiry time (60 minutes from now)
          const expiryTimestamp = Date.now() + (expiry_period * 60 * 1000)
          setExpiryTime(expiryTimestamp)
          setTimeRemaining(expiry_period * 60)

          // Start polling for payment status
          startPolling(merchant_order_id)

          setLoading(false)

          console.log('[TopUpModal] QR Code displayed successfully')
        } catch (qrError) {
          console.error('[TopUpModal] Error generating QR code:', qrError)
          setError('Gagal membuat QR Code. Silakan coba lagi.')
          setLoading(false)
        }
      } else {
        // Handle errors with detailed information
        console.error('[TopUpModal] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })

        if (response.status === 401) {
          const errorDetails = [
            'Error 401: Unauthorized',
            `Message: ${result.message || 'No message'}`,
            `API URL: ${apiUrl}`,
            'Credentials: include',
            '',
            'Debug Info:',
            '- Pastikan Anda sudah login',
            '- Cek browser Console untuk detail lengkap',
            '- Cek Network tab untuk melihat cookies yang terkirim',
            '- Cek apakah session cookie ada di Application > Cookies'
          ].join('\n')

          setError(errorDetails)
          setLoading(false)
          return
        }

        const errorMsg = result.message || result.error || 'Gagal membuat pembayaran'
        setError(`Error ${response.status}: ${errorMsg}`)
        setLoading(false)
      }
    } catch (err: any) {
      console.error('[TopUpModal] Exception:', err)
      const errorDetails = [
        'Terjadi kesalahan:',
        err.message || 'Unknown error',
        '',
        'Stack trace tersedia di browser console',
        'Cek Network tab di DevTools untuk detail request'
      ].join('\n')
      setError(errorDetails)
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
        {!showQRCode ? (
          <>
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
          </>
        ) : (
          <>
            {/* QR Code Display */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                Scan QR Code untuk Bayar
              </Typography>
              <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                Gunakan aplikasi e-wallet Anda untuk memindai kode QR di bawah ini
              </Typography>

              {/* QR Code Image */}
              {qrCodeDataUrl && (
                <Box
                  sx={{
                    display: 'inline-block',
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: 3,
                    mb: 2
                  }}
                >
                  <img
                    src={qrCodeDataUrl}
                    alt='QR Code Payment'
                    style={{ display: 'block', width: '300px', height: '300px' }}
                  />
                </Box>
              )}

              {/* Countdown Timer */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                <Typography variant='body2' sx={{ color: 'warning.dark', fontWeight: 600 }}>
                  <i className='tabler-clock' style={{ marginRight: 8 }} />
                  Waktu tersisa: {formatTime(timeRemaining)}
                </Typography>
              </Box>

              {/* Payment Info */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'left' }}>
                <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Order ID: {merchantOrderId}
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Total: Rp {(selectedTopUp === 0 ? parseInt(customAmount || '0') : selectedTopUp || 0) * 1000}
                </Typography>
              </Box>

              {/* Instructions */}
              <Alert severity='info' sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                  Cara Pembayaran:
                </Typography>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem' }}>
                  <li>Buka aplikasi e-wallet (Shopee, Dana, OVO, GoPay, dll)</li>
                  <li>Pilih menu Scan QR / QRIS</li>
                  <li>Arahkan kamera ke QR Code di atas</li>
                  <li>Konfirmasi pembayaran di aplikasi</li>
                  <li>Tunggu notifikasi pembayaran berhasil</li>
                </ol>
              </Alert>
            </Box>
          </>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', margin: 0 }}>{error}</pre>
          </Alert>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <Alert severity='info' sx={{ mb: 3 }} onClose={() => setDebugInfo(null)}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>{debugInfo}</pre>
          </Alert>
        )}

        {/* Top Up Packages - Only show when not displaying QR */}
        {!showQRCode && (
          <>
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
                    slotProps={{
                      input: {
                        endAdornment: <InputAdornment position='end'>Pts</InputAdornment>
                      }
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
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} color='inherit' disabled={loading && !showQRCode}>
          {showQRCode ? 'Tutup' : 'Batal'}
        </Button>
        {!showQRCode && (
          <>
            <Button
              onClick={testAuth}
              variant='outlined'
              color='info'
              disabled={loading}
              startIcon={<i className='tabler-bug' />}
              sx={{ fontWeight: 600 }}
            >
              Test Auth
            </Button>
            <Button
              onClick={handleTopUp}
              variant='contained'
              color='warning'
              disabled={selectedTopUp === null || (selectedTopUp === 0 && !customAmount) || loading}
              startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-coin' />}
              sx={{ fontWeight: 600 }}
            >
              {loading ? 'Membuat QR Code...' : `Top Up ${selectedTopUp === 0 && customAmount ? parseInt(customAmount) : selectedTopUp} Pts`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default TopUpModal
