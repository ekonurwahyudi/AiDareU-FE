'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Radio from '@mui/material/Radio'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Types
interface BankAccount {
  uuid: string
  store_uuid: string
  account_name: string
  bank_name: string
  account_number: string
  is_primary: boolean
  is_active: boolean
  bank_code: string
  created_at: string
  updated_at: string
}

interface PaymentMethodsResponse {
  success: boolean
  data: BankAccount[]
}

interface PaymentMethodsProps {
  storeUuid: string
  onPaymentSelect?: (account: BankAccount) => void
  selectedPayment?: BankAccount | null
}

// Bank logo mapping (sesuai dengan RekeningBank.tsx)
const BANK_LOGOS: Record<string, string> = {
  'BCA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/1199px-Bank_Central_Asia.svg.png',
  'BNI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg/300px-Bank_Negara_Indonesia_logo_%282004%29.svg.png',
  'BRI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/189px-BANK_BRI_logo.svg.png',
  'BSI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bank_Syariah_Indonesia.svg/330px-Bank_Syariah_Indonesia.svg.png',
  'Mandiri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/320px-Bank_Mandiri_logo_2016.svg.png',
  'CIMB Niaga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/CIMB_Niaga_logo.svg/330px-CIMB_Niaga_logo.svg.png',
  'Danamon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Danamon.svg/330px-Danamon.svg.png',
  'Permata Bank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Permata_Bank_(2024).svg/330px-Permata_Bank_(2024).svg.png',
  'BTN': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/BTN_2024.svg/330px-BTN_2024.svg.png',
  'Panin Bank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logo_Panin_Bank.svg/330px-Logo_Panin_Bank.svg.png',
  'OCBC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Logo-ocbc.svg/330px-Logo-ocbc.svg.png',
  'Bank Mega': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Bank_Mega_2013.svg/330px-Bank_Mega_2013.svg.png',
  'Bank Jago': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Logo-jago.svg/120px-Logo-jago.svg.png',
  'Jenius': 'https://upload.wikimedia.org/wikipedia/id/thumb/8/89/Jenius-logo.png/330px-Jenius-logo.png',
  'SeaBank': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/SeaBank.svg/252px-SeaBank.svg.png',
  'Linkaja': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/LinkAja.svg/92px-LinkAja.svg.png',
  'Gopay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/320px-Gopay_logo.svg.png',
  'OVO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/320px-Logo_ovo_purple.svg.png',
  'Dana': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/320px-Logo_dana_blue.svg.png',
  'ShopeePay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopee_logo.svg/320px-Shopee_logo.svg.png'
}

const PaymentMethods = ({
  storeUuid,
  onPaymentSelect,
  selectedPayment
}: PaymentMethodsProps) => {
  // States
  const [loading, setLoading] = useState<boolean>(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [error, setError] = useState<string>('')

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    if (!storeUuid) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Use backend URL directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const apiUrl = `${backendUrl}/api/stores/${storeUuid}/bank-accounts`

      console.log('[Payment Methods] Fetching from:', apiUrl)

      const response = await fetch(apiUrl)

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response from payment API:', textResponse.substring(0, 500))
        throw new Error('Payment API returned non-JSON response')
      }

      const data: PaymentMethodsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil metode pembayaran')
      }

      if (data.success && data.data) {
        setBankAccounts(data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setBankAccounts([])
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch payment methods when store UUID changes
  useEffect(() => {
    fetchPaymentMethods()
  }, [storeUuid])

  // Handle payment method selection
  const handlePaymentSelect = (account: BankAccount) => {
    if (onPaymentSelect) {
      onPaymentSelect(account)
    }
  }

  // Don't render if no store UUID is provided
  if (!storeUuid) {
    return null
  }

  return (
    <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', mt: 3 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3, color: '#1E293B' }}>
          💳 Metode Pembayaran
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#E91E63' }} />
            <Typography sx={{ ml: 2, color: '#64748B' }}>
              Memuat metode pembayaran...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && bankAccounts.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Belum ada metode pembayaran yang terdaftar untuk toko ini
          </Alert>
        )}

        {!loading && !error && bankAccounts.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bankAccounts.map((account) => (
              <Box
                key={account.uuid}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 3,
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: selectedPayment?.uuid === account.uuid
                    ? '#FFF1F5'
                    : 'transparent',
                  borderColor: selectedPayment?.uuid === account.uuid
                    ? '#E91E63'
                    : '#E2E8F0',
                  '&:hover': {
                    bgcolor: '#F8F9FA',
                    borderColor: '#E91E63'
                  }
                }}
                onClick={() => handlePaymentSelect(account)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
                  {/* Bank Logo/Icon */}
                  <Box
                    sx={{
                      width: 60,
                      height: 40,
                      bgcolor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1
                    }}
                  >
                    <img
                      src={BANK_LOGOS[account.bank_name] || BANK_LOGOS['BCA']}
                      alt={account.bank_name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Box>

                  {/* Bank Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontWeight: '600', color: '#1E293B', fontSize: '16px' }}>
                        {account.bank_name}
                      </Typography>
                      {account.is_primary && (
                        <Chip
                          size='small'
                          label='Utama'
                          sx={{
                            bgcolor: '#DBEAFE',
                            color: '#1E40AF',
                            fontSize: '10px',
                            height: '20px'
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant='body2' sx={{ color: '#64748B', mb: 1 }}>
                      {account.account_name}
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#059669', fontWeight: '500' }}>
                      {account.account_number}
                    </Typography>
                  </Box>
                </Box>

                {/* Selection Radio */}
                <Radio
                  checked={selectedPayment?.uuid === account.uuid}
                  sx={{
                    color: '#E91E63',
                    '&.Mui-checked': {
                      color: '#E91E63'
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {!loading && !error && bankAccounts.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant='body2' sx={{ color: '#64748B' }}>
                💡 Silakan transfer ke salah satu rekening yang dipilih
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentMethods