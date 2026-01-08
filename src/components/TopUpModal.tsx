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
import InputAdornment from '@mui/material/InputAdornment'
import { safeRedirect } from '@/utils/security'

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

  const handleClose = () => {
    setSelectedTopUp(10) // Reset to default
    setCustomAmount('')
    setError(null)
    setDebugInfo(null)
    onClose()
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

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/payment/duitku/create`
      console.log('[TopUpModal] Calling API:', apiUrl)
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
        // Use Duitku Pop-up SDK
        const reference = result.data.reference
        console.log('[TopUpModal] Got reference:', reference)

        // Load Duitku SDK if not already loaded
        if (typeof window !== 'undefined' && !(window as any).checkout) {
          const script = document.createElement('script')
          script.src = process.env.NEXT_PUBLIC_DUITKU_SANDBOX === 'true'
            ? 'https://app-sandbox.duitku.com/lib/js/duitku.js'
            : 'https://app.duitku.com/lib/js/duitku.js'
          script.async = true
          document.body.appendChild(script)

          script.onload = () => {
            initDuitkuCheckout(reference)
          }
        } else {
          initDuitkuCheckout(reference)
        }
      } else {
        // Handle errors with detailed information
        console.error('[TopUpModal] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: result
        })

        if (response.status === 401) {
          // Don't auto-redirect, show detailed error for debugging
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

  const initDuitkuCheckout = (reference: string) => {
    const checkout = (window as any).checkout
    if (checkout && checkout.process) {
      checkout.process(reference, {
        defaultLanguage: 'id',
        successEvent: function(result: any) {
          console.log('Payment success:', result)
          setLoading(false)
          handleClose()
          // Redirect to coin history using safe redirect
          safeRedirect('/apps/tokoku/coin-history')
        },
        pendingEvent: function(result: any) {
          console.log('Payment pending:', result)
          setLoading(false)
          handleClose()
          safeRedirect('/apps/tokoku/coin-history')
        },
        errorEvent: function(result: any) {
          console.log('Payment error:', result)
          setError('Pembayaran gagal. Silakan coba lagi.')
          setLoading(false)
        },
        closeEvent: function(result: any) {
          console.log('Payment closed:', result)
          setLoading(false)
        }
      })
    } else {
      setError('Duitku SDK belum ter-load. Silakan refresh halaman.')
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
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', margin: 0 }}>{error}</pre>
          </Alert>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <Alert severity='info' sx={{ mb: 3 }} onClose={() => setDebugInfo(null)}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>{debugInfo}</pre>
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
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} color='inherit' disabled={loading}>
          Batal
        </Button>
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
          {loading ? 'Processing...' : `Top Up ${selectedTopUp === 0 && customAmount ? parseInt(customAmount) : selectedTopUp} Pts`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TopUpModal
