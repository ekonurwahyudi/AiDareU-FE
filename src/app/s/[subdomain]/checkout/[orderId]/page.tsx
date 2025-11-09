'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { Container } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PrintIcon from '@mui/icons-material/Print'

// Component Imports
import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import CartDrawer from '@/components/store/CartDrawer'

// Cart Context
import { useCart } from '@/contexts/CartContext'

// Custom Hook
import { useStoreMetadata } from '../../useStoreMetadata'

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${Math.round(amount).toLocaleString('id-ID')}`
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const subdomain = (params?.subdomain as string) || 'store'
  const orderId = (params?.orderId as string) || ''

  // Use cart context
  const {
    cartItems,
    cartDrawerOpen,
    setCartDrawerOpen,
    removeFromCart,
    updateCartQuantity,
    handleCartClick
  } = useCart()

  const [orderData, setOrderData] = useState<any>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [storeLoading, setStoreLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#E91E63')

  // Fetch store data
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setStoreLoading(true)
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/api/store/${subdomain}`, {
          cache: 'no-store'
        })
        const data = await response.json()

        if (data.success && data.data) {
          setStoreData(data.data)
          // Set primary color from store settings
          if (data.data.settings?.primary_color) {
            setPrimaryColor(data.data.settings.primary_color)
          }
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      } finally {
        setStoreLoading(false)
      }
    }

    if (subdomain) {
      fetchStoreData()
    }
  }, [subdomain])

  // Fetch order details
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    } else {
      setError('Order ID tidak ditemukan')
      setLoading(false)
    }
  }, [orderId])

  // Update metadata
  useStoreMetadata({
    title: storeData
      ? `${storeData.settings?.site_title || storeData.store?.name} - Konfirmasi Pesanan`
      : 'Konfirmasi Pesanan',
    description: 'Detail pesanan dan instruksi pembayaran',
    keywords: 'konfirmasi pesanan, invoice, pembayaran',
    ogTitle: 'Konfirmasi Pesanan',
    ogDescription: 'Detail pesanan Anda',
    ogImage: storeData?.settings?.logo,
    favicon: storeData?.settings?.favicon
  })

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)

      // Use backend URL directly
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const apiUrl = `${backendUrl}/api/order/${orderId}`

      console.log('[Order Details] Fetching from:', apiUrl)

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      })

      console.log('[Order Details] Response status:', response.status)

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('[Order Details] Non-JSON response:', textResponse)
        throw new Error('API returned non-JSON response')
      }

      const result = await response.json()
      console.log('[Order Details] Full response:', result)
      console.log('[Order Details] Result data:', result.data)

      if (result.success && result.data) {
        // Transform data to match frontend expectations (camelCase)
        // Laravel relationships use camelCase (detailOrders, bankAccount)
        const transformedData = {
          ...result.data,
          nomorOrder: result.data.nomor_order || result.data.nomorOrder,
          totalHarga: result.data.total_harga || result.data.totalHarga,
          estimasiTiba: result.data.estimasi_tiba || result.data.estimasiTiba,
          uuidStore: result.data.uuid_store || result.data.uuidStore,
          uuidCustomer: result.data.uuid_customer || result.data.uuidCustomer,
          uuidBankAccount: result.data.uuid_bank_account || result.data.uuidBankAccount,
          // Priority: camelCase from Laravel relationships first
          detailOrders: result.data.detailOrders || result.data.detail_orders || [],
          bankAccount: result.data.bankAccount || result.data.bank_account,
          customer: result.data.customer,
          store: result.data.store,
          createdAt: result.data.created_at || result.data.createdAt,
          updatedAt: result.data.updated_at || result.data.updatedAt
        }

        console.log('[Order Details] Transformed data:', transformedData)
        console.log('[Order Details] Detail orders count:', transformedData.detailOrders?.length || 0)
        setOrderData(transformedData)
      } else {
        console.error('[Order Details] API returned success:false', result)
        setError(result.message || 'Gagal mengambil data order')
      }
    } catch (err) {
      console.error('[Order Details] Exception:', err)
      console.error('[Order Details] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      setError(`Gagal mengambil data order: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!orderData) return ''

    const orderNumber = orderData.nomorOrder || orderData.nomor_order || 'N/A'
    const totalHarga = formatRupiah(orderData.totalHarga || orderData.total_harga || 0)
    const customerName = orderData.customer?.nama || 'Customer'

    // Get bank account details
    const bankAccount = orderData.bankAccount || orderData.bank_account
    const bankName = bankAccount?.nama_bank || 'N/A'
    const accountNumber = bankAccount?.nomor_rekening || 'N/A'
    const accountName = bankAccount?.nama_pemilik || 'N/A'

    // Build product list
    const products = orderData.detailOrders || []
    const productList = products.map((item: any) => {
      const product = item.product || {}
      const productName = product.nama_produk || 'Product'
      const quantity = item.quantity || 1
      const price = formatRupiah(item.price || 0)
      return `- ${productName} (${quantity}x) = ${price}`
    }).join('\n')

    const message = `Halo, saya ${customerName}

Saya sudah melakukan pemesanan dengan detail:

*Nomor Order:* ${orderNumber}
*Total Pembayaran:* ${totalHarga}

*Produk yang dipesan:*
${productList}

*Informasi Transfer:*
Bank: ${bankName}
No. Rekening: ${accountNumber}
Atas Nama: ${accountName}

Mohon konfirmasi setelah saya melakukan pembayaran. Terima kasih!`

    return encodeURIComponent(message)
  }

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage()
    const storePhone = orderData?.store?.no_hp_toko || storeData?.store?.no_hp_toko || ''
    const phoneNumber = storePhone.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  // Show loading skeleton
  if (storeLoading || loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#FAFBFC' }}>
        <Box sx={{
          height: 80,
          bgcolor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          px: 3
        }}>
          <Box sx={{
            width: 150,
            height: 40,
            bgcolor: '#F3F4F6',
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Box>
    )
  }

  const orderNumber = orderData?.nomorOrder || orderData?.nomor_order || 'N/A'
  const totalHarga = orderData?.totalHarga || orderData?.total_harga || 0
  const estimasiTiba = orderData?.estimasiTiba || orderData?.estimasi_tiba || '-'
  const ekspedisi = orderData?.ekspedisi || '-'
  const createdAt = orderData?.createdAt || orderData?.created_at
  const bankAccount = orderData?.bankAccount || orderData?.bank_account
  const customer = orderData?.customer
  const detailOrders = orderData?.detailOrders || []

  // Backend URL for images
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // Debug log for bank account
  console.log('[Order Confirmation] Bank Account:', bankAccount)
  console.log('[Order Confirmation] Full Order Data:', orderData)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Apply dynamic primary color and print styles */}
      <style jsx global>{`
        :root,
        body,
        #__next {
          --primary-color: ${primaryColor};
          --primary-color-rgb: ${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)};
        }

        /* Remove all button shadows */
        .MuiButton-root {
          box-shadow: none !important;
        }

        /* Buttons */
        .MuiButton-containedPrimary {
          background-color: ${primaryColor} !important;
        }
        .MuiButton-containedPrimary:hover {
          background-color: ${primaryColor}dd !important;
        }

        /* Print Styles - Professional Invoice Layout */
        @media print {
          /* Hide all web UI elements */
          header, footer, .no-print, .MuiAlert-root, button {
            display: none !important;
          }

          /* Reset page styling */
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          /* Hide success card and grid layout for print */
          .print-hide {
            display: none !important;
          }

          /* Show print-only invoice */
          .print-invoice {
            display: block !important;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
            background: white;
            color: black;
          }

          /* Remove all cards, borders, shadows */
          .MuiCard-root, .MuiCardContent-root {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }

          /* Make sticky elements static */
          [style*="sticky"] {
            position: static !important;
          }

          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page break control */
          .page-break {
            page-break-after: always;
          }

          .no-page-break {
            page-break-inside: avoid;
          }
        }

        /* Print Invoice Styles - Hidden on screen */
        .print-invoice {
          display: none;
        }

        @media print {
          .print-invoice {
            font-family: 'Arial', sans-serif;
            font-size: 10pt;
            line-height: 1.4;
          }

          .invoice-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }

          .invoice-title {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .invoice-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .invoice-section {
            margin-bottom: 15px;
          }

          .invoice-section-title {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
          }

          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }

          .invoice-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-weight: bold;
          }

          .invoice-table td {
            border: 1px solid #000;
            padding: 8px;
          }

          .invoice-table .text-right {
            text-align: right;
          }

          .invoice-table .text-center {
            text-align: center;
          }

          .invoice-total {
            margin-top: 10px;
            text-align: right;
          }

          .invoice-total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 5px;
          }

          .invoice-total-label {
            width: 150px;
            font-weight: bold;
          }

          .invoice-total-value {
            width: 150px;
            text-align: right;
          }

          .invoice-grand-total {
            border-top: 2px solid #000;
            padding-top: 8px;
            font-size: 12pt;
            font-weight: bold;
          }

          .invoice-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
          }

          .payment-instructions {
            background-color: #fffacd;
            border: 1px solid #000;
            padding: 10px;
            margin: 20px 0;
          }

          .payment-instructions-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 11pt;
          }
        }
      `}</style>

      <StoreHeader
        cartItemCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={handleCartClick}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        storeName={storeData?.store?.name || 'AiDareU Store'}
        storeLogo={storeData?.settings?.logo ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/storage/${storeData.settings.logo}` : undefined}
        primaryColor={primaryColor}
      />

      <Box sx={{ flex: 1, py: { xs: 3, md: 6 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="lg">
          {error || !orderData ? (
            <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || 'Order tidak ditemukan'}
              </Alert>
              <Button
                component={Link}
                href="/"
                variant="contained"
                sx={{ backgroundColor: primaryColor }}
              >
                Kembali ke Store
              </Button>
            </Box>
          ) : (
            <>
              {/* Success Message - Hidden on Print */}
              <Card className="print-hide" sx={{ mb: 3, backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ fontSize: 60, mb: 2 }}>✅</Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#16a34a', mb: 1 }}>
                    Pesanan Berhasil!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Terima kasih atas pesanan Anda. Silakan lakukan pembayaran sesuai instruksi di bawah.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handlePrint}
                    sx={{
                      borderColor: '#16a34a',
                      color: '#16a34a',
                      '&:hover': {
                        borderColor: '#15803d',
                        backgroundColor: '#f0fdf4'
                      },
                      '@media print': {
                        display: 'none'
                      }
                    }}
                  >
                    🖨️ Print Invoice
                  </Button>
                </CardContent>
              </Card>

              <Grid className="print-hide" container spacing={3}>
                {/* Order Information */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Informasi Pesanan
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Nomor Pesanan</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{orderNumber}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Tanggal Pesanan</Typography>
                        <Typography variant="body1">{createdAt ? formatDate(createdAt) : '-'}</Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip label="Menunggu Pembayaran" color="warning" size="small" sx={{ mt: 0.5 }} />
                      </Box>

                      {ekspedisi !== 'Digital Product' && (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Ekspedisi</Typography>
                            <Typography variant="body1">{ekspedisi}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="body2" color="text.secondary">Estimasi Tiba</Typography>
                            <Typography variant="body1">{estimasiTiba}</Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer Information */}
                  {customer && (
                    <Card sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Informasi Penerima
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Nama</Typography>
                          <Typography variant="body1">{customer.nama}</Typography>
                        </Box>

                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">No. HP</Typography>
                          <Typography variant="body1">{customer.no_hp || customer.noHp}</Typography>
                        </Box>

                        {customer.email && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{customer.email}</Typography>
                          </Box>
                        )}

                        {customer.alamat && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Alamat</Typography>
                            <Typography variant="body1">
                              {customer.alamat}<br />
                              {customer.kecamatan}, {customer.kota}<br />
                              {customer.provinsi}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Product Details */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Detail Produk
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {detailOrders.map((item: any, index: number) => {
                        const product = item.product || {}
                        const productName = product.nama_produk || 'Product'
                        const quantity = item.quantity || 1
                        const price = item.price || 0
                        const subtotal = quantity * price
                        const productImage = product.foto_produk || product.fotoProduk
                        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
                        const imageUrl = productImage ? `${backendUrl}/storage/${productImage}` : '/images/placeholder-product.png'

                        return (
                          <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < detailOrders.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                              {/* Product Image */}
                              <Box
                                component="img"
                                src={imageUrl}
                                alt={productName}
                                sx={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: '1px solid #e0e0e0'
                                }}
                                onError={(e: any) => {
                                  e.target.src = '/images/placeholder-product.png'
                                }}
                              />

                              {/* Product Details */}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {productName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {quantity}x {formatRupiah(price)}
                                </Typography>
                              </Box>

                              {/* Subtotal */}
                              <Typography variant="body1" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                {formatRupiah(subtotal)}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      })}

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Total
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
                          {formatRupiah(totalHarga)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Payment Information */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ position: 'sticky', top: 20 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Informasi Pembayaran
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      {bankAccount ? (
                        <>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Bank</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {bankAccount.bank_name || bankAccount.bankName || bankAccount.nama_bank}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">No. Rekening</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {bankAccount.account_number || bankAccount.accountNumber || bankAccount.nomor_rekening}
                            </Typography>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary">Atas Nama</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {bankAccount.account_holder_name || bankAccount.accountHolderName || bankAccount.nama_pemilik}
                            </Typography>
                          </Box>

                          <Box sx={{ backgroundColor: '#fef3c7', padding: 2, borderRadius: 1, mb: 3 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              💰 Total Transfer
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: primaryColor }}>
                              {formatRupiah(totalHarga)}
                            </Typography>
                          </Box>

                          <Alert severity="info" sx={{ mb: 2 }}>
                            Silakan transfer sesuai nominal di atas dan konfirmasi pembayaran melalui WhatsApp
                          </Alert>

                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<WhatsAppIcon />}
                            onClick={handleWhatsAppClick}
                            sx={{
                              backgroundColor: '#25D366',
                              '&:hover': { backgroundColor: '#128C7E' },
                              mb: 2
                            }}
                          >
                            Konfirmasi via WhatsApp
                          </Button>

                          <Button
                            fullWidth
                            variant="outlined"
                            component={Link}
                            href="/"
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              '&:hover': {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}11`
                              }
                            }}
                          >
                            Belanja Lagi
                          </Button>
                        </>
                      ) : (
                        <Alert severity="warning">
                          Informasi pembayaran tidak tersedia
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Professional Print Invoice - Hidden on Screen */}
              <Box
                className="print-invoice"
                dangerouslySetInnerHTML={{
                  __html: `
                    <!-- Invoice Header -->
                    <div class="invoice-header">
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                          ${storeData?.settings?.logo
                            ? `<img src="${backendUrl}/storage/${storeData.settings.logo}" alt="${storeData?.store?.name || 'Store'}" style="height: 50px; margin-bottom: 10px;" />`
                            : `<div class="invoice-title">${storeData?.store?.name || 'Invoice'}</div>`
                          }
                          <div style="font-size: 9pt;">
                            <strong>${storeData?.store?.name || ''}</strong><br />
                            ${storeData?.store?.phone ? `Tel: ${storeData.store.phone}<br />` : ''}
                            ${storeData?.store?.alamat || ''}
                          </div>
                        </div>
                        <div style="text-align: right;">
                          <div class="invoice-title">INVOICE</div>
                          <div style="font-size: 10pt;">
                            <strong>No: ${orderNumber}</strong><br />
                            Tanggal: ${createdAt ? formatDate(createdAt) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Customer & Order Info -->
                    <div class="invoice-info-grid">
                      <div class="invoice-section">
                        <div class="invoice-section-title">INFORMASI PENERIMA</div>
                        <div>
                          <strong>Nama:</strong> ${customer?.nama || '-'}<br />
                          <strong>No. HP:</strong> ${customer?.no_hp || '-'}<br />
                          ${customer?.email ? `<strong>Email:</strong> ${customer.email}<br />` : ''}
                          <strong>Alamat:</strong><br />
                          ${customer?.alamat || ''}<br />
                          ${customer?.kecamatan || ''}, ${customer?.kota || ''}<br />
                          ${customer?.provinsi || ''}
                        </div>
                      </div>

                      <div class="invoice-section">
                        <div class="invoice-section-title">INFORMASI PENGIRIMAN</div>
                        <div>
                          <strong>Ekspedisi:</strong> ${ekspedisi}<br />
                          <strong>Estimasi Tiba:</strong> ${estimasiTiba}<br />
                          <strong>Status:</strong> <span style="background-color: #fff3cd; padding: 2px 8px; border: 1px solid #000; font-weight: bold;">Menunggu Pembayaran</span>
                        </div>
                      </div>
                    </div>

                    <!-- Products Table -->
                    <div class="invoice-section">
                      <div class="invoice-section-title">DETAIL PRODUK</div>
                      <table class="invoice-table">
                        <thead>
                          <tr>
                            <th style="width: 50px;" class="text-center">No</th>
                            <th>Nama Produk</th>
                            <th style="width: 80px;" class="text-center">Qty</th>
                            <th style="width: 120px;" class="text-right">Harga</th>
                            <th style="width: 120px;" class="text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${detailOrders.map((item: any, index: number) => {
                            const product = item.product || {}
                            const productName = product.nama_produk || 'Product'
                            const quantity = item.quantity || 1
                            const price = item.price || 0
                            const subtotal = quantity * price

                            return `
                              <tr>
                                <td class="text-center">${index + 1}</td>
                                <td>${productName}</td>
                                <td class="text-center">${quantity}</td>
                                <td class="text-right">${formatRupiah(price)}</td>
                                <td class="text-right"><strong>${formatRupiah(subtotal)}</strong></td>
                              </tr>
                            `
                          }).join('')}
                        </tbody>
                      </table>
                    </div>

                    <!-- Total -->
                    <div class="invoice-total">
                      <div class="invoice-total-row invoice-grand-total">
                        <div class="invoice-total-label">TOTAL PEMBAYARAN:</div>
                        <div class="invoice-total-value">${formatRupiah(totalHarga)}</div>
                      </div>
                    </div>

                    <!-- Payment Instructions -->
                    ${bankAccount ? `
                      <div class="payment-instructions no-page-break">
                        <div class="payment-instructions-title">INSTRUKSI PEMBAYARAN</div>
                        <div style="margin-bottom: 10px;">
                          Silakan transfer ke rekening berikut:
                        </div>
                        <table style="width: 100%; font-size: 10pt;">
                          <tr>
                            <td style="width: 120px;"><strong>Bank</strong></td>
                            <td>: ${bankAccount.bank_name || bankAccount.bankName || bankAccount.nama_bank}</td>
                          </tr>
                          <tr>
                            <td><strong>No. Rekening</strong></td>
                            <td>: <strong style="font-size: 12pt;">${bankAccount.account_number || bankAccount.accountNumber || bankAccount.nomor_rekening}</strong></td>
                          </tr>
                          <tr>
                            <td><strong>Atas Nama</strong></td>
                            <td>: ${bankAccount.account_holder_name || bankAccount.accountHolderName || bankAccount.nama_pemilik}</td>
                          </tr>
                          <tr>
                            <td><strong>Jumlah Transfer</strong></td>
                            <td>: <strong style="font-size: 12pt; color: #d32f2f;">${formatRupiah(totalHarga)}</strong></td>
                          </tr>
                        </table>
                        <div style="margin-top: 10px; font-size: 9pt; font-style: italic;">
                          * Harap transfer sesuai dengan jumlah yang tertera di atas<br />
                          * Konfirmasi pembayaran melalui WhatsApp setelah melakukan transfer
                        </div>
                      </div>
                    ` : ''}

                    <!-- Footer -->
                    <div class="invoice-footer">
                      <div style="text-align: center; margin-bottom: 10px;">
                        Terima kasih atas kepercayaan Anda berbelanja di ${storeData?.store?.name || 'toko kami'}
                      </div>
                      <div style="text-align: center; font-size: 8pt; color: #666;">
                        Invoice ini digenerate secara otomatis pada ${new Date().toLocaleString('id-ID')}
                      </div>
                    </div>
                  `
                }}
              />
            </>
          )}
        </Container>
      </Box>

      <StoreFooter />

      <CartDrawer
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
      />
    </Box>
  )
}
