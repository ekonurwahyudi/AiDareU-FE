// React Imports
import { useEffect, useState } from 'react'
import type { SyntheticEvent } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import TabContext from '@mui/lab/TabContext'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Fade from '@mui/material/Fade'
import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'
import CustomTextField from '@core/components/mui/TextField'

// Bank Account Type
type BankAccount = {
  uuid: string
  store_uuid: string
  account_name: string
  bank_name: string
  account_number: string
  is_primary: boolean
  created_at: string
  updated_at: string
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

const StepPayment = ({ handleNext }: { handleNext: () => void }) => {
  const params = useParams()
  const subdomain = (params?.subdomain as string) || 'store'

  // States
  const [value, setValue] = useState<string>('bank-transfer')
  const [openCollapse, setOpenCollapse] = useState<boolean>(true)
  const [openFade, setOpenFade] = useState<boolean>(true)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [selectedBank, setSelectedBank] = useState<string>('')

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue)
  }

  // Fetch bank accounts dari store
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setLoadingBanks(true)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

        // Fetch store data dulu untuk mendapatkan store_uuid
        const storeResponse = await fetch(`${backendUrl}/api/store/${subdomain}`)
        const storeData = await storeResponse.json()

        if (storeData.success && storeData.data.store?.uuid) {
          const storeUuid = storeData.data.store.uuid

          // Fetch bank accounts
          const response = await fetch(`${backendUrl}/api/public/bank-accounts?store_uuid=${storeUuid}`)
          const result = await response.json()

          if (result.success && result.data) {
            setBankAccounts(result.data)
            // Set primary bank as default
            const primaryBank = result.data.find((bank: BankAccount) => bank.is_primary)
            if (primaryBank) {
              setSelectedBank(primaryBank.uuid)
            } else if (result.data.length > 0) {
              setSelectedBank(result.data[0].uuid)
            }
          }
        }
      } catch (error) {
        // Error fetching bank accounts - silently fail
      } finally {
        setLoadingBanks(false)
      }
    }

    fetchBankAccounts()
  }, [subdomain])

  useEffect(() => {
    if (!openFade) {
      setTimeout(() => {
        setOpenCollapse(false)
      }, 300)
    }
  }, [openFade])

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return ''
    if (accountNumber.length <= 4) return accountNumber
    const maskedPart = '*'.repeat(accountNumber.length - 4)
    const lastFour = accountNumber.slice(-4)
    return maskedPart + lastFour
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 8 }} className='flex flex-col gap-6'>
        <Collapse in={openCollapse}>
          <Fade in={openFade} timeout={{ exit: 300 }}>
            <Alert
              icon={<i className='tabler-percentage' />}
              action={
                <IconButton
                  aria-label='close'
                  color='inherit'
                  size='small'
                  onClick={() => {
                    setOpenFade(false)
                  }}
                >
                  <i className='tabler-x' />
                </IconButton>
              }
            >
              <AlertTitle>Available Offers</AlertTitle>
              <Typography color='success.main'>
                - 10% Instant Discount on Bank of America Corp Bank Debit and Credit cards
              </Typography>
              <Typography color='success.main'>
                - 25% Cashback Voucher of up to $60 on first ever PayPal transaction. TCA
              </Typography>
            </Alert>
          </Fade>
        </Collapse>
        <TabContext value={value}>
          <CustomTabList
            variant='scrollable'
            scrollButtons='auto'
            onChange={handleChange}
            aria-label='customized tabs example'
            pill='true'
          >
            <Tab value='bank-transfer' label='Transfer Bank' />
            <Tab value='cash-on-delivery' label='Bayar di Tempat (COD)' />
          </CustomTabList>
          <Grid container>
            <Grid size={{ xs: 12, md: 12 }}>
              <TabPanel value='bank-transfer'>
                {loadingBanks ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Memuat metode pembayaran...</Typography>
                  </Box>
                ) : bankAccounts.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 4 }}>
                    <AlertTitle>Metode Pembayaran Belum Tersedia</AlertTitle>
                    Toko belum menambahkan rekening bank untuk pembayaran. Silakan hubungi penjual.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Pilih Rekening Tujuan Transfer
                    </Typography>
                    <RadioGroup value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                      <Grid container spacing={3}>
                        {bankAccounts.map((account) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={account.uuid}>
                            <Box
                              onClick={() => setSelectedBank(account.uuid)}
                              sx={{
                                border: '2px solid',
                                borderColor: selectedBank === account.uuid ? 'primary.main' : '#E5E7EB',
                                borderRadius: 2,
                                p: 3,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                bgcolor: selectedBank === account.uuid ? 'primary.lighter' : 'background.paper',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  boxShadow: 2
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Radio
                                  checked={selectedBank === account.uuid}
                                  value={account.uuid}
                                  sx={{ mt: -1 }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box
                                      sx={{
                                        width: 80,
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'white',
                                        borderRadius: 1,
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
                                    {account.is_primary && (
                                      <Chip label="Utama" size="small" color="primary" variant="tonal" />
                                    )}
                                  </Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {account.bank_name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    {account.account_name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {maskAccountNumber(account.account_number)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </RadioGroup>

                    <Alert severity="info" sx={{ mt: 4, mb: 3 }}>
                      <AlertTitle>Cara Pembayaran</AlertTitle>
                      <Typography variant="body2">
                        1. Lakukan transfer ke rekening yang dipilih<br/>
                        2. Simpan bukti transfer<br/>
                        3. Upload bukti transfer pada halaman konfirmasi
                      </Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button
                        variant='contained'
                        onClick={handleNext}
                        disabled={!selectedBank}
                      >
                        Lanjut ke Konfirmasi
                      </Button>
                    </Box>
                  </>
                )}
              </TabPanel>
              <TabPanel value='cash-on-delivery'>
                <Typography className='mbe-6'>
                  Bayar di Tempat (COD) adalah metode pembayaran dimana Anda membayar pesanan saat barang diterima.
                </Typography>
                <Button variant='contained' onClick={handleNext}>
                  Bayar di Tempat
                </Button>
              </TabPanel>
            </Grid>
          </Grid>
        </TabContext>
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <div className='border rounded'>
          <CardContent className='flex flex-col gap-4'>
            <Typography color='text.primary' className='font-medium'>
              Price Details
            </Typography>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>Order Total</Typography>
                <Typography color='text.primary'>$1198.00</Typography>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <Typography color='text.primary'>Delivery Charges</Typography>
                <div className='flex gap-2'>
                  <Typography color='text.disabled' className='line-through'>
                    $5.00
                  </Typography>
                  <Chip variant='tonal' size='small' color='success' label='Free' />
                </div>
              </div>
            </div>
          </CardContent>
          <Divider />
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                Total
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                $1198.00
              </Typography>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <Typography color='text.primary' className='font-medium'>
                Deliver to:
              </Typography>
              <Chip variant='tonal' size='small' color='primary' label='Home' />
            </div>
            <div>
              <Typography color='text.primary' className='font-medium'>
                John Doe (Default),
              </Typography>
              <Typography>4135 Parkway Street,</Typography>
              <Typography>Los Angeles, CA, 90017.</Typography>
              <Typography>Mobile : +1 906 568 2332</Typography>
            </div>
            <Typography
              href='/'
              component={Link}
              onClick={e => e.preventDefault()}
              className='font-medium'
              color='primary.main'
            >
              Change address
            </Typography>
          </CardContent>
        </div>
      </Grid>
    </Grid>
  )
}

export default StepPayment
