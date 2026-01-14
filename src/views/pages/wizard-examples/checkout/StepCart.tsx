// React Imports
import { useState, useEffect, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Rating from '@mui/material/Rating'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import Fade from '@mui/material/Fade'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import DirectionalIcon from '@components/DirectionalIcon'
import CustomTextField from '@core/components/mui/TextField'
import ShippingOptions from '@/components/shipping/ShippingOptions'
import PaymentMethods from '@/components/payment/PaymentMethods'

// Cart Context
import { useCart } from '@/contexts/CartContext'
import type { CartItem } from '@/contexts/CartContext' // impor tipe untuk anotasi

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

interface StepCartProps {
  handleNext: (data?: any, uuid?: string) => void
  setCheckoutData: (data: any) => void
  primaryColor?: string
}

const StepCart = ({ handleNext, setCheckoutData, primaryColor = '#E91E63' }: StepCartProps) => {
  const params = useParams()
  const subdomain = (params?.subdomain as string) || 'store'
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // States
  const [openCollapse, setOpenCollapse] = useState<boolean>(true)
  const [openFade, setOpenFade] = useState<boolean>(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Customer Information States
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    city: '',
    district: ''
  })

  // Payment Method State
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Shipping State
  const [selectedShipping, setSelectedShipping] = useState<any>(null)

  // Store data state
  const [storeData, setStoreData] = useState<any>(null)

  // Location API States
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  // Cart Context
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    getTotalPrice,
    getTotalItems
  } = useCart()

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces()
    loadRecommendedProducts()
    loadStoreData()
  }, [])

  // Load cities when province changes
  useEffect(() => {
    if (customerInfo.province) {
      loadCities(customerInfo.province)
      setCustomerInfo(prev => ({ ...prev, city: '', district: '' }))
      setCities([])
      setDistricts([])
      // Reset shipping when address changes
      setSelectedShipping(null)
    }
  }, [customerInfo.province])

  // Load districts when city changes
  useEffect(() => {
    if (customerInfo.city) {
      loadDistricts(customerInfo.city)
      setCustomerInfo(prev => ({ ...prev, district: '' }))
      setDistricts([])
      // Reset shipping when address changes
      setSelectedShipping(null)
    }
  }, [customerInfo.city])

  // Reset shipping when district changes
  useEffect(() => {
    if (customerInfo.district) {
      // Reset shipping when address changes
      setSelectedShipping(null)
    }
  }, [customerInfo.district])

  useEffect(() => {
    if (!openFade) {
      setTimeout(() => {
        setOpenCollapse(false)
      }, 300)
    }
  }, [openFade])

  // API Functions
  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response')
      }

      const data = await response.json()
      setProvinces(data)
    } catch (error) {
      // Error loading provinces - silently fail
      setProvinces([]) // Set empty array on error
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadCities = async (provinceId: string) => {
    setLoadingCities(true)
    try {
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response')
      }

      const data = await response.json()
      setCities(data)
    } catch (error) {
      // Error loading cities - silently fail
      setCities([]) // Set empty array on error
    } finally {
      setLoadingCities(false)
    }
  }

  const loadDistricts = async (cityId: string) => {
    setLoadingDistricts(true)
    try {
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response')
      }

      const data = await response.json()
      setDistricts(data)
    } catch (error) {
      // Error loading districts - silently fail
      setDistricts([]) // Set empty array on error
    } finally {
      setLoadingDistricts(false)
    }
  }

  const loadRecommendedProducts = async () => {
    setLoadingProducts(true)
    try {
      const storeUuid = getStoreUuid()
      if (!storeUuid) return

      const response = await fetch(`/api/store/${subdomain}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data.products) {
        // Filter out products that are already in cart
        const cartProductIds = cartItems.map((item: CartItem) => item.uuid || item.id)
        const filteredProducts = data.data.products
          .filter((product: any) => !cartProductIds.includes(product.uuid || product.id))
          .slice(0, 10) // Limit to 10 products

        setRecommendedProducts(filteredProducts)
      }
    } catch (error) {
      // Error loading recommended products - silently fail
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadStoreData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/api/store/${subdomain}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setStoreData(data.data)
      }
    } catch (error) {
      // Error loading store data - silently fail
    }
  }

  // Handle product click
  const handleProductClick = (product: any) => {
    const uuid = product.uuid || product.id
    const slugWithUuid = `${product.slug}-${uuid}`
    router.push(`/${slugWithUuid}?uuid=${uuid}`)
  }

  // Scroll carousel left
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  // Scroll carousel right
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  // Handle form changes
  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  // Check if all products are digital
  const isAllDigitalProducts = () => {
    return cartItems.length > 0 && cartItems.every(item => item.jenis_produk === 'digital')
  }

  // Get store UUID from cart items (assuming all items are from the same store)
  const getStoreUuid = () => {
    if (cartItems.length > 0 && cartItems[0].storeUuid) {
      return cartItems[0].storeUuid
    }
    return ''
  }

  // Calculate total weight of cart items (in grams)
  const getTotalWeight = () => {
    if (isAllDigitalProducts()) return 0
    // Use berat_produk from cart item, default 1000g (1kg) if not specified
    return cartItems.reduce((total, item) => {
      const itemWeight = item.berat_produk || 1000 // 1000g (1kg) default
      return total + (itemWeight * item.quantity)
    }, 0)
  }

  // Get province name from ID
  const getProvinceName = (provinceId: string) => {
    const province = provinces.find(p => p.id === provinceId)
    return province ? province.name : ''
  }

  // Get city name from ID
  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    return city ? city.name : ''
  }

  // Get district name from ID
  const getDistrictName = (districtId: string) => {
    const district = districts.find(d => d.id === districtId)
    return district ? district.name : ''
  }

  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Helper function to validate phone number (Indonesian format)
  const isValidPhone = (phone: string): boolean => {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '')
    // Indonesian phone: starts with 0 or +62 or 62, followed by 8-13 digits
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
    return phoneRegex.test(cleanPhone)
  }

  // Validation function
  const isFormValid = () => {
    const isDigital = isAllDigitalProducts()

    // Basic validation for all products
    const basicValid = 
      customerInfo.name.trim().length >= 2 &&
      isValidPhone(customerInfo.phone) &&
      isValidEmail(customerInfo.email) &&
      cartItems.length > 0

    if (isDigital) {
      // For digital products, only require basic info
      return basicValid
    } else {
      // For physical products, require all info including address and shipping
      return (
        basicValid &&
        customerInfo.address.trim().length >= 5 &&
        customerInfo.province !== '' &&
        customerInfo.city !== '' &&
        customerInfo.district !== '' &&
        selectedShipping !== null
      )
    }
  }

  // Handle shipping option selection
  const handleShippingSelect = (shippingOption: any) => {
    setSelectedShipping(shippingOption)
  }

  // Handle payment method selection
  const handlePaymentSelect = (paymentMethod: any) => {
    setSelectedPayment(paymentMethod)
  }

  // Get total price including shipping
  const getTotalWithShipping = () => {
    const baseTotal = getTotalPrice()
    const shippingCost = selectedShipping ? selectedShipping.cost : 0
    return baseTotal + shippingCost
  }

  // Handle checkout - save to database
  const handleCheckout = async () => {
    // Validate form with specific error messages
    if (customerInfo.name.trim().length < 2) {
      alert('Nama harus minimal 2 karakter')
      return
    }
    if (!isValidPhone(customerInfo.phone)) {
      alert('Format nomor HP tidak valid. Gunakan format Indonesia (contoh: 08123456789)')
      return
    }
    if (!isValidEmail(customerInfo.email)) {
      alert('Format email tidak valid')
      return
    }
    if (!isAllDigitalProducts()) {
      if (customerInfo.address.trim().length < 5) {
        alert('Alamat harus minimal 5 karakter')
        return
      }
      if (!customerInfo.province || !customerInfo.city || !customerInfo.district) {
        alert('Silakan lengkapi provinsi, kota, dan kecamatan')
        return
      }
      if (!selectedShipping) {
        alert('Silakan pilih metode pengiriman')
        return
      }
    }
    if (!selectedPayment) {
      alert('Silakan pilih metode pembayaran')
      return
    }

    // Validate that all cart items have UUID
    const itemsWithoutUuid = cartItems.filter(item => !item.uuid || item.uuid === '')
    if (itemsWithoutUuid.length > 0) {
      alert('Error: Beberapa produk di cart tidak memiliki UUID. Silakan hapus dan tambahkan kembali produk ke cart.')
      return
    }

    setIsProcessing(true)

    try {
      const storeUuid = getStoreUuid()

      // Prepare customer data
      const customerData = {
        nama: customerInfo.name,
        noHp: customerInfo.phone,
        email: customerInfo.email,
        provinsi: getProvinceName(customerInfo.province) || '-',
        kota: getCityName(customerInfo.city) || '-',
        kecamatan: getDistrictName(customerInfo.district) || '-',
        alamat: customerInfo.address || '-'
      }

      // Prepare order data
      const estimasi = selectedShipping?.etd || selectedShipping?.duration || null
      const orderData = {
        uuidStore: storeUuid,
        voucher: null,
        totalHarga: getTotalWithShipping(),
        ekspedisi: selectedShipping ? `${selectedShipping.courier} - ${selectedShipping.service_name}` : 'Digital Product',
        estimasiTiba: estimasi,
        uuidBankAccount: selectedPayment.uuid
      }

      // Prepare items data
      const items = cartItems.map(item => ({
        uuidProduct: item.uuid || '',
        quantity: item.quantity,
        price: item.variantPrice || item.salePrice || item.price,
        variant_name: item.selectedVariant?.variant_name || null,
        variant_option: item.selectedVariant?.selectedOption?.option_name || null
      }))

      // Send to API - use backend URL directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const apiUrl = `${backendUrl}/api/checkout`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          customer: customerData,
          order: orderData,
          items: items
        })
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('API returned non-JSON response')
      }

      const result = await response.json()

      if (result.success) {
        // Clear cart after successful checkout
        localStorage.removeItem('store_cart_items')

        // Save checkout data for confirmation page
        setCheckoutData({
          customerInfo,
          payment: selectedPayment,
          shipping: selectedShipping
        })

        // Move to next step with order UUID
        handleNext(undefined, result.data.order.uuid)
      } else {
        // Show detailed error message
        let errorMessage = 'Gagal membuat order: ' + result.message

        if (result.errors) {
          const errorDetails = Object.entries(result.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n')
          errorMessage += '\n\nDetail Error:\n' + errorDetails
        }

        alert(errorMessage)
      }
    } catch (error) {
      alert('Terjadi kesalahan saat checkout. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Grid container spacing={{ xs: 3, md: 4, lg: 6 }}>
      <Grid size={{ xs: 12, lg: 8 }} className='flex flex-col gap-4'>
        <Collapse  in={openCollapse}>
          <Fade in={openFade} timeout={{ exit: 300 }}>
            <Alert
              severity='warning'
              icon={<i className='tabler-alert-triangle' />}
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
              <AlertTitle>Perhatian!!</AlertTitle>
              <Typography color='warning.main'>
                - Cek detail pesanan sebelum melanjutkan checkout
              </Typography>
              <Typography color='warning.main'>
                - Pastikan data informasi yang dimasukkan dengan benar
              </Typography>
            </Alert>
          </Fade>
        </Collapse>
        <Typography variant='h5'>Keranjang Belanja ({getTotalItems()} Item{getTotalItems() !== 1 ? 's' : ''})</Typography>

        {cartItems.length === 0 ? (
          <Box
            sx={{
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              p: 6,
              textAlign: 'center',
              bgcolor: '#f9f9f9'
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Keranjang belanja Anda kosong
            </Typography>
            <Typography color="text.disabled" sx={{ mb: 3 }}>
              Tambahkan produk ke keranjang untuk melanjutkan checkout
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/"
              sx={{ bgcolor: primaryColor, '&:hover': { bgcolor: `${primaryColor}dd` } }}
            >
              Lanjut Belanja
            </Button>
          </Box>
        ) : (
          <div className='border rounded'>
            {cartItems.map((product: CartItem, index: number) => (
              <Box
                key={product.uuid || product.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 2, sm: 3 },
                  p: { xs: 2, sm: 4 },
                  borderBottom: index !== cartItems.length - 1 ? '1px solid #e0e0e0' : 'none',
                  '&:hover': {
                    bgcolor: '#fafafa'
                  }
                }}
              >
                {/* Product Image */}
                <Box
                  sx={{
                    width: { xs: 60, sm: 80 },
                    height: { xs: 60, sm: 80 },
                    minWidth: { xs: 60, sm: 80 },
                    bgcolor: '#f5f5f5',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {product.image && product.image !== '/placeholder.jpg' ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>📦</Typography>
                  )}
                </Box>

                {/* Product Info - takes available space */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    color='text.primary'
                    sx={{
                      fontWeight: 'medium',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {product.name}
                  </Typography>

                  {/* Display variant information if available */}
                  {product.selectedVariant?.selectedOption && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: '#6B7280',
                        mb: 0.5,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      {product.selectedVariant.variant_name}: {product.selectedVariant.selectedOption.option_name}
                    </Typography>
                  )}

                  {/* Price */}
                  <Box sx={{ mb: 1 }}>
                    {product.variantPrice ? (
                      // If variant price exists, show it
                      <Typography
                        sx={{ fontWeight: 'medium', fontSize: { xs: '0.875rem', sm: '1rem' }, color: primaryColor }}
                      >
                        {formatRupiah(product.variantPrice)}
                      </Typography>
                    ) : product.salePrice ? (
                      // If no variant price but has sale price
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          sx={{ fontWeight: 'medium', fontSize: { xs: '0.875rem', sm: '1rem' }, color: primaryColor }}
                        >
                          {formatRupiah(product.salePrice)}
                        </Typography>
                        <Typography
                          className='line-through'
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          color='text.disabled'
                        >
                          {formatRupiah(product.price)}
                        </Typography>
                      </Box>
                    ) : (
                      // Regular price
                      <Typography
                        sx={{ fontWeight: 'medium', fontSize: { xs: '0.875rem', sm: '1rem' }, color: primaryColor }}
                      >
                        {formatRupiah(product.price)}
                      </Typography>
                    )}
                  </Box>

                  {/* Product Type Badge */}
                  {product.jenis_produk === 'digital' ? (
                    <Chip
                      size='small'
                      label='Digital'
                      color='info'
                      variant='outlined'
                      sx={{ fontSize: '0.7rem', height: '20px', mb: 1 }}
                    />
                  ) : (
                    <Chip
                      size='small'
                      label='Fisik'
                      color='default'
                      variant='outlined'
                      sx={{ fontSize: '0.7rem', height: '20px', mb: 1 }}
                    />
                  )}

                  {/* Quantity Selector */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant='caption' color='text.secondary' sx={{ mr: 1 }}>
                      Qty:
                    </Typography>
                    <CustomTextField
                      size='small'
                      type='number'
                      value={product.quantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1
                        if (newQuantity > 0) {
                          updateCartQuantity(product.uuid || product.id, newQuantity)
                        }
                      }}
                      inputProps={{ min: 1 }}
                      sx={{
                        width: { xs: '60px', sm: '80px' },
                        '& .MuiInputBase-input': {
                          padding: '4px 8px',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Delete Button */}
                <IconButton
                  size='small'
                  onClick={() => removeFromCart(product.uuid || product.id)}
                  sx={{
                    color: primaryColor,
                    border: `1px solid ${primaryColor}`,
                    borderRadius: '8px',
                    padding: { xs: '6px', sm: '8px' },
                    '&:hover': {
                      bgcolor: `${primaryColor}15`,
                      borderColor: `${primaryColor}dd`
                    }
                  }}
                >
                  <i className='tabler-trash' style={{ fontSize: '18px' }} />
                </IconButton>
              </Box>
            ))}
          </div>
        )}
        {cartItems.length > 0 && recommendedProducts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                Produk Menarik Lainnya
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size='small'
                  onClick={scrollLeft}
                  sx={{
                    border: `1px solid ${primaryColor}`,
                    color: primaryColor,
                    '&:hover': { bgcolor: `${primaryColor}15` }
                  }}
                >
                  <i className='tabler-chevron-left' />
                </IconButton>
                <IconButton
                  size='small'
                  onClick={scrollRight}
                  sx={{
                    border: `1px solid ${primaryColor}`,
                    color: primaryColor,
                    '&:hover': { bgcolor: `${primaryColor}15` }
                  }}
                >
                  <i className='tabler-chevron-right' />
                </IconButton>
              </Box>
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                pb: 2
              }}
            >
              {loadingProducts ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                  <CircularProgress size={30} sx={{ color: primaryColor }} />
                </Box>
              ) : (
                recommendedProducts.map((product: any) => {
                  const hargaAsli = product.harga || product.price || 0
                  const hargaJual = product.harga_jual || product.salePrice || hargaAsli
                  const hasDiscount = hargaJual < hargaAsli
                  const discountPercent = hasDiscount ? Math.round(((hargaAsli - hargaJual) / hargaAsli) * 100) : 0

                  return (
                    <Card
                      key={product.uuid || product.id}
                      sx={{
                        minWidth: 180,
                        maxWidth: 180,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: '1px solid #F1F5F9',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                          borderColor: '#E2E8F0'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 160,
                          bgcolor: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}
                        onClick={() => handleProductClick(product)}
                      >
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <Chip
                            label={`${discountPercent}%`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: '#fdc700',
                              color: '#804b08',
                              fontWeight: 'bold',
                              zIndex: 1,
                              fontSize: '0.65rem',
                              height: '20px'
                            }}
                          />
                        )}

                        {/* Favorite Icon */}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle favorite logic here
                          }}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'white',
                            color: 'text.secondary',
                            zIndex: 1,
                            width: 30,
                            height: 30,
                            '&:hover': {
                              bgcolor: 'white',
                              color: primaryColor
                            }
                          }}
                        >
                          <i className='tabler-heart' style={{ fontSize: '16px' }} />
                        </IconButton>

                        {/* Product Image */}
                        {(product.gambar_produk || product.image) ? (
                          <img
                            src={product.gambar_produk || product.image}
                            alt={product.nama_produk || product.name}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <Typography sx={{ fontSize: '4rem' }}>📦</Typography>
                        )}
                      </Box>

                      <CardContent sx={{ p: 1.5, bgcolor: 'white' }}>
                        {/* Product Name */}
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            color: '#1F2937',
                            fontSize: '0.75rem',
                            lineHeight: 1.3
                          }}
                        >
                          {product.nama_produk || product.name}
                        </Typography>

                        {/* Price Section - Horizontal Layout */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                          {hasDiscount ? (
                            <>
                              <Typography
                                variant='body2'
                                sx={{
                                  fontWeight: 'bold',
                                  color: '#22C55E',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {formatRupiah(hargaJual)}
                              </Typography>
                              <Typography
                                variant='caption'
                                sx={{
                                  textDecoration: 'line-through',
                                  color: '#9CA3AF',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {formatRupiah(hargaAsli)}
                              </Typography>
                            </>
                          ) : (
                            <Typography
                              variant='body2'
                              sx={{
                                fontWeight: 'bold',
                                color: '#1F2937',
                                fontSize: '0.875rem'
                              }}
                            >
                              {formatRupiah(hargaJual)}
                            </Typography>
                          )}
                        </Box>

                        {/* View Product Button */}
                        <Button
                          variant='contained'
                          size='small'
                          fullWidth
                          onClick={() => handleProductClick(product)}
                          startIcon={<i className='tabler-eye' style={{ fontSize: '14px' }} />}
                          sx={{
                            bgcolor: primaryColor,
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '8px',
                            py: 0.75,
                            fontSize: '0.75rem',
                            height: 32,
                            boxShadow: 'none',
                            '&:hover': {
                              bgcolor: primaryColor,
                              opacity: 0.9,
                              boxShadow: 'none'
                            }
                          }}
                        >
                          Lihat Produk
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </Box>
          </Box>
        )}

        {/* Customer Information Section */}
        <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 3, color: '#1E293B' }}>
              Informasi Data
            </Typography>

            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Nama Lengkap'
                  placeholder='Masukkan nama lengkap'
                  value={customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CustomTextField
                  fullWidth
                  label='Nomor HP'
                  placeholder='Masukkan nomor HP'
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  type='email'
                  placeholder='Masukkan alamat email'
                  value={customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                  required
                />
              </Grid>

              {/* Location Dropdowns - Hidden for digital products */}
              {!isAllDigitalProducts() && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Provinsi</InputLabel>
                      <Select
                        value={customerInfo.province}
                        label='Provinsi'
                        onChange={(e) => handleCustomerInfoChange('province', e.target.value)}
                        disabled={loadingProvinces}
                      >
                        {loadingProvinces ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : (
                          provinces.map((province) => (
                            <MenuItem key={province.id} value={province.id}>
                              {province.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Kota/Kabupaten</InputLabel>
                      <Select
                        value={customerInfo.city}
                        label='Kota/Kabupaten'
                        onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                        disabled={!customerInfo.province || loadingCities}
                      >
                        {loadingCities ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : (
                          cities.map((city) => (
                            <MenuItem key={city.id} value={city.id}>
                              {city.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Kecamatan</InputLabel>
                      <Select
                        value={customerInfo.district}
                        label='Kecamatan'
                        onChange={(e) => handleCustomerInfoChange('district', e.target.value)}
                        disabled={!customerInfo.city || loadingDistricts}
                      >
                        {loadingDistricts ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading...
                          </MenuItem>
                        ) : (
                          districts.map((district) => (
                            <MenuItem key={district.id} value={district.id}>
                              {district.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Address Detail */}
                  <Grid size={{ xs: 12 }}>
                    <CustomTextField
                      fullWidth
                      label='Alamat Lengkap'
                      placeholder='Masukkan alamat lengkap (nama jalan, nomor rumah, RT/RW, dll)'
                      multiline
                      rows={3}
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      required
                    />
                  </Grid>
                </>
              )}

              {/* Digital products note */}
              {isAllDigitalProducts() && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      p: 3,
                      border: '1px solid #E3F2FD',
                      borderRadius: 2,
                      bgcolor: '#F3F9FF',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 'medium' }}>
                      💾 Produk Digital
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Alamat pengiriman tidak diperlukan untuk produk digital
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Shipping Options Section - Only show for physical products */}
        {!isAllDigitalProducts() && customerInfo.province && customerInfo.city && customerInfo.district && (
          <ShippingOptions
            storeUuid={getStoreUuid()}
            destinationProvince={getProvinceName(customerInfo.province)}
            destinationCity={getCityName(customerInfo.city)}
            destinationDistrict={getDistrictName(customerInfo.district)}
            weight={getTotalWeight()}
            onShippingSelect={handleShippingSelect}
            selectedShipping={selectedShipping}
            storeAddress={storeData?.store?.alamat_toko || ''}
          />
        )}

        {/* Payment Method Section */}
        {getStoreUuid() && (
          <PaymentMethods
            storeUuid={getStoreUuid()}
            onPaymentSelect={handlePaymentSelect}
            selectedPayment={selectedPayment}
          />
        )}
      </Grid>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Box
          sx={{
            position: { xs: 'static', lg: 'sticky' },
            top: { lg: 20 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            height: 'fit-content',
            alignSelf: 'flex-start',
            zIndex: 1
          }}
        >
        <div className='border rounded'>
          <CardContent className='flex flex-col gap-4'>
            <Typography color='text.primary' className='font-medium'>
              Voucher
            </Typography>
            <div className='flex gap-4'>
              <CustomTextField fullWidth size='small' placeholder='Masukkan Kode Promo' />
              <Button variant='tonal' className='normal-case'>
                Gunakan
              </Button>
            </div>
          </CardContent>
          <Divider />
          <CardContent className='flex gap-4 flex-col'>
            <Typography color='text.primary' className='font-medium'>
              Detail Harga
            </Typography>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap justify-between'>
                <Typography color='text.primary'>Total Belanja</Typography>
                <Typography color='text.primary'>{formatRupiah(getTotalPrice())}</Typography>
              </div>
              <div className='flex items-center flex-wrap justify-between'>
                <Typography color='text.primary'>Diskon Kupon</Typography>
                <Typography href='/' component={Link} onClick={e => e.preventDefault()} sx={{ color: primaryColor }}>
                  0
                </Typography>
              </div>
              <div className='flex items-center flex-wrap justify-between'>
                <Typography color='text.primary'>Total Pesanan</Typography>
                <Typography color='text.primary'>{formatRupiah(getTotalPrice())}</Typography>
              </div>
              {!isAllDigitalProducts() && (
                <div className='flex items-center flex-wrap justify-between'>
                  <Typography color='text.primary'>Biaya Pengiriman</Typography>
                  {selectedShipping ? (
                    <div className='flex flex-col items-end'>
                      <Typography color='text.primary'>
                        {formatRupiah(selectedShipping.cost)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {selectedShipping.courier} - {selectedShipping.service_name}
                      </Typography>
                    </div>
                  ) : (
                    <Typography color='text.secondary'>
                      Pilih pengiriman
                    </Typography>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <Divider />
          <CardContent>
            <div className='flex items-center flex-wrap justify-between'>
              <Typography color='text.primary' className='font-medium'>
                Total
              </Typography>
              <Typography color='text.primary' className='font-medium'>
                {formatRupiah(getTotalWithShipping())}
              </Typography>
            </div>
          </CardContent>
        </div>
        <div className='flex justify-normal sm:justify-end xl:justify-normal'>
          <Button
            className='max-sm:is-full lg:is-full'
            variant='contained'
            onClick={handleCheckout}
            disabled={!isFormValid() || !selectedPayment || isProcessing}
            sx={{
              bgcolor: primaryColor,
              '&:hover': { bgcolor: `${primaryColor}dd` },
              '&:disabled': { bgcolor: '#ccc' },
              boxShadow: 'none !important'
            }}
          >
            {isProcessing ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                Memproses...
              </>
            ) : cartItems.length === 0 ? (
              'Keranjang Kosong'
            ) : !isFormValid() ? (
              'Lengkapi Data Dulu'
            ) : !selectedPayment ? (
              'Pilih Metode Pembayaran'
            ) : (
              `Bayar Sekarang - ${formatRupiah(getTotalWithShipping())}`
            )}
          </Button>
        </div>
        </Box>
      </Grid>
    </Grid>
  )
}

export default StepCart
