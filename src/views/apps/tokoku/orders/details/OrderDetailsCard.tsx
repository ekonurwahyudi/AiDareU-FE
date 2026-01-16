'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

// Component Imports
import { ProductPlaceholder } from '@/components/ProductPlaceholder'

// Voucher Type
type VoucherData = {
  uuid?: string
  kode_voucher?: string
  jenis_voucher?: 'ongkir' | 'potongan_harga'
  tipe_diskon?: 'persen' | 'nominal'
  nilai_diskon?: number
  diskon_terapkan?: number
}

// Order Type
type Order = {
  total_harga: number
  ekspedisi: string
  voucher?: string | VoucherData | null
  detailOrders?: Array<{
    uuid: string
    quantity: number
    price: number
    variant_name?: string
    variant_option?: string
    product?: {
      uuid: string
      nama_produk: string
      upload_gambar_produk?: string | string[]
      sku?: string
    }
  }>
}

// Utility function to generate proper image URLs
const getImageUrl = (imagePath: string): string => {
  // Use BACKEND_URL for storage files, not API_URL
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  return `${baseUrl}/storage/${imagePath}`
}

// Utility function to extract images from product data
const getProductImages = (imageData: any): string[] => {
  if (!imageData) return []

  if (typeof imageData === 'string') {
    try {
      const parsed = JSON.parse(imageData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [imageData]
    }
  }

  return Array.isArray(imageData) ? imageData : []
}

// Parse voucher data from JSON string or object
const parseVoucherData = (voucher: string | VoucherData | null | undefined): VoucherData | null => {
  if (!voucher) return null

  if (typeof voucher === 'string') {
    try {
      return JSON.parse(voucher)
    } catch {
      return null
    }
  }

  return voucher
}

const OrderDetailsCard = ({ order }: { order: Order }) => {
  // Parse voucher data
  const voucherData = parseVoucherData(order.voucher)
  const voucherDiscount = voucherData?.diskon_terapkan || 0

  // Calculate subtotal from products
  const subtotal = order.detailOrders?.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0) || 0

  // Calculate ongkir: total_harga + voucher_discount - subtotal
  // Because total_harga already has discount applied
  const ongkir = (order.total_harga + voucherDiscount) - subtotal

  return (
    <Card>
      <CardHeader title='Order Details' />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="center">SKU</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.detailOrders && order.detailOrders.length > 0 ? (
                order.detailOrders.map((item) => {
                  const images = getProductImages(item.product?.upload_gambar_produk)
                  const mainImagePath = images.length > 0 ? images[0] : null
                  const imageUrl = mainImagePath ? getImageUrl(mainImagePath) : null

                  return (
                    <TableRow key={item.uuid}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.product?.nama_produk || 'Product'}
                              width={50}
                              height={50}
                              className='rounded bg-actionHover object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <ProductPlaceholder width={50} height={50} />
                          )}
                          <div className='flex flex-col'>
                            <Typography className='font-medium' color='text.primary'>
                              {item.product?.nama_produk || 'Unknown Product'}
                            </Typography>
                            {item.variant_name && item.variant_option && (
                              <Typography variant="caption" color="text.secondary">
                                {item.variant_name}: {item.variant_option}
                              </Typography>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">
                          {item.product?.sku || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography>
                          Rp {new Intl.NumberFormat('id-ID').format(item.price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography>{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography className="font-medium">
                          Rp {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No products found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider className="my-4" />

        <div className='flex justify-end'>
          <div className="min-w-[300px]">
            <div className='flex justify-between items-center mb-2'>
              <Typography color='text.primary'>Subtotal:</Typography>
              <Typography color='text.primary' className='font-medium'>
                Rp {new Intl.NumberFormat('id-ID').format(subtotal)}
              </Typography>
            </div>
            <div className='flex justify-between items-center mb-2'>
              <Typography color='text.primary'>Ongkir:</Typography>
              <Typography color='text.primary' className='font-medium'>
                Rp {new Intl.NumberFormat('id-ID').format(ongkir)}
              </Typography>
            </div>
            {voucherData && voucherDiscount > 0 && (
              <div className='flex justify-between items-center mb-2'>
                <div className='flex flex-col'>
                  <Typography color='success.main' className='font-medium'>
                    {voucherData.jenis_voucher === 'ongkir' ? 'Diskon Ongkir' : 'Diskon Voucher'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {voucherData.kode_voucher}
                  </Typography>
                </div>
                <Typography color='success.main' className='font-medium'>
                  - Rp {new Intl.NumberFormat('id-ID').format(voucherDiscount)}
                </Typography>
              </div>
            )}
            <Divider className="my-2" />
            <div className='flex justify-between items-center'>
              <Typography color='text.primary' className='font-medium text-lg'>
                Total:
              </Typography>
              <Typography color='primary.main' className='font-bold text-lg'>
                Rp {new Intl.NumberFormat('id-ID').format(order.total_harga)}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderDetailsCard
