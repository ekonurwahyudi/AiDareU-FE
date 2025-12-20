'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter, useParams, usePathname } from 'next/navigation'

// MUI Imports
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Icon Imports
import CloseIcon from '@mui/icons-material/Close'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DeleteIcon from '@mui/icons-material/Delete'

// Helper function to format currency in Rupiah
const formatRupiah = (amount: number): string => {
  return `Rp. ${amount.toLocaleString('id-ID')}`
}

const CartDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 380,
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: '100vw',
      height: '70vh',
      borderRadius: '20px 20px 0 0'
    }
  }
}))

interface VariantOption {
  id: string
  uuid?: string
  option_name: string
  harga: number
  stock: number
}

interface ProductVariant {
  id: string
  uuid?: string
  variant_name: string
  selectedOption?: VariantOption
}

interface CartItem {
  id: string
  name: string
  price: number
  salePrice?: number
  image: string
  quantity: number
  selectedVariant?: ProductVariant
  variantPrice?: number
}

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  cartItems: CartItem[]
  onRemoveItem: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}

const CartDrawerComponent = ({
  open,
  onClose,
  cartItems,
  onRemoveItem,
  onUpdateQuantity
}: CartDrawerProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()

  // Detect if we're in subdomain route or store route
  const subdomain = params?.subdomain as string | undefined
  const isSubdomainRoute = pathname?.startsWith('/s/')

  const totalPrice = cartItems.reduce((total, item) => {
    // Use variant price if available, otherwise use sale price or regular price
    const price = item.variantPrice || item.salePrice || item.price
    return total + (price * item.quantity)
  }, 0)

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0)

  const handleCheckout = () => {
    console.log('CartDrawer handleCheckout called')
    onClose()
    console.log('Navigating to checkout from drawer...')

    // Route to checkout - Clean URL without /s/ or /store/ prefix
    // Cloudflare Worker handles routing
    router.push('/checkout')
  }

  return (
    <CartDrawer anchor={isMobile ? "bottom" : "right"} open={open} onClose={onClose}>
      {/* Mobile handle bar */}
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              bgcolor: '#E5E7EB',
              borderRadius: 2
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon sx={{ color: '#E91E63' }} />
          Keranjang Belanja
          <Badge
            badgeContent={totalItems}
            color="error"
            sx={{
              ml: 5,
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                minWidth: '18px',
                height: '18px'
              }
            }}
          />
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {cartItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Keranjang Anda kosong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tambahkan produk untuk mulai berbelanja
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, maxHeight: 400, overflow: 'auto' }}>
            {cartItems.map((item, index) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid #E5E7EB', borderRadius: 2 }}>
                  {/* Product Image */}
                  <Avatar
                    src={item.image}
                    sx={{ width: 48, height: 48, borderRadius: 2 }}
                    variant="rounded"
                  >
                    📦
                  </Avatar>

                  {/* Product Info */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: '600', mb: 0.5, color: '#374151' }}>
                      {item.name}
                    </Typography>

                    {/* Display variant information if available */}
                    {item.selectedVariant?.selectedOption && (
                      <Typography variant="caption" sx={{ display: 'block', color: '#6B7280', mb: 0.5 }}>
                        {item.selectedVariant.variant_name}: {item.selectedVariant.selectedOption.option_name}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.variantPrice ? (
                        // If variant price exists, show it
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                          {formatRupiah(item.variantPrice)}
                        </Typography>
                      ) : item.salePrice ? (
                        // If no variant price but has sale price
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                            {formatRupiah(item.salePrice)}
                          </Typography>
                          <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#9CA3AF' }}>
                            {formatRupiah(item.price)}
                          </Typography>
                        </>
                      ) : (
                        // Regular price
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                          {formatRupiah(item.price)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => onUpdateQuantity(item.uuid || item.id, Math.max(1, item.quantity - 1))}
                      sx={{ width: 28, height: 28, border: '1px solid #E5E7EB' }}
                    >
                      <Typography variant="body2">-</Typography>
                    </IconButton>
                    <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', fontWeight: '600' }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onUpdateQuantity(item.uuid || item.id, item.quantity + 1)}
                      sx={{ width: 28, height: 28, border: '1px solid #E5E7EB' }}
                    >
                      <Typography variant="body2">+</Typography>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveItem(item.uuid || item.id)}
                      sx={{ ml: 1, color: '#EF4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#374151' }}>
                Total:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                {formatRupiah(totalPrice)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCheckout}
              sx={{
                bgcolor: '#E91E63',
                '&:hover': { bgcolor: '#C2185B' },
                borderRadius: 2,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              Checkout ({totalItems} items)
            </Button>
          </Box>
        </>
      )}
    </CartDrawer>
  )
}

export default CartDrawerComponent