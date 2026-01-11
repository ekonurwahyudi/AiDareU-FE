'use client'

// React Imports
import { useState, useRef, useEffect } from 'react'

// Next.js Imports
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

// MUI Imports
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Paper,
  ClickAwayListener,
  Popper
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Icon Imports
import MenuIcon from '@mui/icons-material/Menu'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'

// Components
import CartDropdown from './CartDropdown'

// Custom Styled Components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  color: theme.palette.text.primary
}))

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.5rem',
  color: '#E91E63',
  cursor: 'pointer',
  textDecoration: 'none',
  '&:hover': {
    opacity: 0.8
  }
}))

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: '500',
  textTransform: 'none',
  fontSize: '1rem',
  padding: '8px 16px',
  marginRight: '8px',
  '&:hover': {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    color: '#E91E63'
  }
}))

const CartButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E91E63',
  color: 'white',
  fontWeight: 'bold',
  textTransform: 'none',
  borderRadius: '8px',
  padding: '8px 20px',
  '&:hover': {
    backgroundColor: '#C2185B'
  }
}))

interface CartItem {
  id: string
  name: string
  price: number
  salePrice?: number
  image: string
  quantity: number
}

interface Product {
  id: string
  uuid: string
  name: string
  price: number
  salePrice?: number | null
  image: string
  jenis_produk?: string
}

interface StoreHeaderProps {
  cartItemCount?: number
  onCartClick?: () => void
  cartItems?: CartItem[]
  onRemoveItem?: (productId: string) => void
  onUpdateQuantity?: (productId: string, quantity: number) => void
  onAddToCart?: (productId: string, event: React.MouseEvent) => void
  storeName?: string
  storeLogo?: string
  primaryColor?: string
  products?: Product[]
  onProductClick?: (product: Product) => void
}

const StoreHeader = ({
  cartItemCount = 0,
  onCartClick,
  cartItems = [],
  onRemoveItem,
  storeName = 'AiDareU Store',
  storeLogo,
  onUpdateQuantity,
  onAddToCart,
  primaryColor = '#E91E63',
  products = [],
  onProductClick
}: StoreHeaderProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) // Limit to 5 results

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Produk', href: '/#products' },
    { label: 'Testimoni', href: '/#testimonial' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Kontak', href: '/#contact' }
  ]

  const handleMenuClick = (href: string) => {
    setMobileMenuOpen(false)

    // If clicking "Home" menu
    if (href === '/') {
      router.push(href)
      return
    }

    // Extract section ID from href (e.g., "/#products" -> "products")
    const sectionId = href.replace('/#', '')

    // Check if we're on the home page
    const isHomePage = pathname === '/' || pathname.startsWith('/s/')

    if (isHomePage) {
      // If on home page, just scroll to section
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // If on another page, navigate to home then scroll
      router.push('/')
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchQuery(value)
    setSearchOpen(value.length > 0)
  }

  const handleProductSelect = (product: Product) => {
    setSearchQuery('')
    setSearchOpen(false)
    if (onProductClick) {
      onProductClick(product)
    }
  }

  const handleSearchClose = () => {
    setSearchOpen(false)
  }

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <>
      <StyledAppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
            {/* Logo */}
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {storeLogo ? (
                  <Box
                    component="img"
                    src={storeLogo}
                    alt={storeName}
                    sx={{ height: 40, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
                  />
                ) : (
                  <Logo variant="h6" sx={{ color: primaryColor }}>
                    ❤️ {storeName}
                  </Logo>
                )}
              </Box>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <NavButton
                    key={item.label}
                    onClick={() => handleMenuClick(item.href)}
                    sx={{
                      '&:hover': {
                        backgroundColor: `${primaryColor}22`,
                        color: primaryColor
                      }
                    }}
                  >
                    {item.label}
                  </NavButton>
                ))}
              </Box>
            )}

            {/* Search Box */}
            <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' }, mx: 2 }} ref={searchRef}>
              <ClickAwayListener onClickAway={handleSearchClose}>
                <Box>
                  <TextField
                    size="small"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{
                      width: 250,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: 'white',
                        '&:hover fieldset': {
                          borderColor: primaryColor
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: primaryColor
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* Search Results Dropdown */}
                  {searchOpen && filteredProducts.length > 0 && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        maxHeight: 400,
                        overflowY: 'auto',
                        zIndex: 1300,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: 2
                      }}
                    >
                      {filteredProducts.map((product) => (
                        <Box
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            '&:hover': {
                              bgcolor: `${primaryColor}11`
                            },
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.name}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 1,
                              bgcolor: '#f5f5f5'
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                mb: 0.5
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: primaryColor,
                                fontWeight: 700
                              }}
                            >
                              {formatRupiah(product.salePrice || product.price)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  )}

                  {/* No Results */}
                  {searchOpen && searchQuery.length > 0 && filteredProducts.length === 0 && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        p: 3,
                        zIndex: 1300,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Produk tidak ditemukan
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </ClickAwayListener>
            </Box>

            {/* Cart Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={() => setMobileSearchOpen(true)}
                    sx={{ mr: 0.5 }}
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    color="inherit"
                    onClick={() => setMobileMenuOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                </>
              )}

              {/* Desktop: Use CartDropdown, Mobile: Use CartDrawer button */}
              {!isMobile ? (
                <CartDropdown
                  cartItems={cartItems}
                  onRemoveItem={onRemoveItem || (() => {})}
                  onUpdateQuantity={onUpdateQuantity || (() => {})}
                  onAddToCart={onAddToCart || (() => {})}
                  autoOpen={true}
                  primaryColor={primaryColor}
                />
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <Button
                    onClick={onCartClick}
                    sx={{
                      backgroundColor: primaryColor,
                      color: 'white',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      borderRadius: '8px',
                      padding: '8px 20px',
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: `${primaryColor}dd`
                      }
                    }}
                  >
                    <ShoppingCartIcon />
                  </Button>
                  {cartItemCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: primaryColor,
                        color: 'white',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        border: '2px solid white'
                      }}
                    >
                      {cartItemCount}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </StyledAppBar>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            bgcolor: 'white'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {storeLogo ? (
                <Box
                  component="img"
                  src={storeLogo}
                  alt={storeName}
                  sx={{ height: 32, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
                />
              ) : (
                <Logo variant="h6">❤️ {storeName}</Logo>
              )}
            </Box>
          </Link>
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              key={item.label}
              onClick={() => handleMenuClick(item.href)}
              sx={{
                borderRadius: 2,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.1)'
                }
              }}
            >
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: '500',
                    fontSize: '1rem'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Mobile Search Drawer */}
      <Drawer
        anchor="top"
        open={mobileSearchOpen}
        onClose={() => {
          setMobileSearchOpen(false)
          setSearchQuery('')
          setSearchOpen(false)
        }}
        sx={{
          '& .MuiDrawer-paper': {
            bgcolor: 'white',
            borderRadius: '0 0 16px 16px'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cari Produk
            </Typography>
            <IconButton
              onClick={() => {
                setMobileSearchOpen(false)
                setSearchQuery('')
                setSearchOpen(false)
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            autoFocus
            size="small"
            placeholder="Ketik nama produk..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&:hover fieldset': {
                  borderColor: primaryColor
                },
                '&.Mui-focused fieldset': {
                  borderColor: primaryColor
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Search Results */}
          <Box sx={{ mt: 2, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {searchQuery.length > 0 && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Box
                  key={product.id}
                  onClick={() => {
                    handleProductSelect(product)
                    setMobileSearchOpen(false)
                  }}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': {
                      bgcolor: `${primaryColor}11`
                    }
                  }}
                >
                  <Box
                    component="img"
                    src={product.image}
                    alt={product.name}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                      bgcolor: '#f5f5f5'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 0.5
                      }}
                    >
                      {product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: primaryColor,
                        fontWeight: 700
                      }}
                    >
                      {formatRupiah(product.salePrice || product.price)}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : searchQuery.length > 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Produk tidak ditemukan
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Mulai ketik untuk mencari produk...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default StoreHeader