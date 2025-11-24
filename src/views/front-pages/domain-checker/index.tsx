'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PublicIcon from '@mui/icons-material/Public'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

interface DomainResult {
  extension: string
  available: boolean
  price: string
  isFree: boolean
}

const DomainCheckerWrapper = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState('')

  const extensions = [
    { ext: 'com', isFree: false },
    { ext: 'web.id', isFree: true },
    { ext: 'biz.id', isFree: true },
    { ext: 'my.id', isFree: true }
  ]

  const checkDomain = async () => {
    if (!searchQuery.trim()) {
      setError('Masukkan nama domain yang ingin Anda cek')
      return
    }

    setLoading(true)
    setError('')
    setSearchPerformed(true)

    try {
      // Simulate API call for domain availability check
      // In production, replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      const domainResults: DomainResult[] = extensions.map(({ ext, isFree }) => ({
        extension: ext,
        available: Math.random() > 0.5, // Random availability for demo
        price: isFree ? 'Gratis' : 'Rp 150.000/tahun',
        isFree
      }))

      setResults(domainResults)
    } catch (err) {
      setError('Terjadi kesalahan saat mengecek domain. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = (domain: string, extension: string, isFree: boolean) => {
    if (extension === 'com') {
      // Redirect to Domainesia
      window.open(`https://www.domainesia.com/domain/?domain=${domain}`, '_blank', 'noopener,noreferrer')
    } else {
      // Redirect to WhatsApp
      const message = `Halo, saya ingin claim domain ${domain}.${extension}`
      const encodedMessage = encodeURIComponent(message)
      window.open(`https://wa.me/628121555423?text=${encodedMessage}`, '_blank', 'noopener,noreferrer')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkDomain()
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            mb: 6
          }}
        >
          <PublicIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            Cek Ketersediaan Domain
          </Typography>
          <Typography
            variant="h6"
            sx={{
              opacity: 0.95,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Temukan domain sempurna untuk bisnis online Anda
          </Typography>
        </Box>

        {/* Search Card */}
        <Card
          elevation={8}
          sx={{
            mb: 4,
            borderRadius: 4,
            overflow: 'visible'
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                placeholder="Masukkan nama domain (tanpa ekstensi)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '1.1rem'
                  }
                }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={checkDomain}
                disabled={loading}
                sx={{
                  minWidth: { xs: '100%', sm: 150 },
                  height: 56,
                  borderRadius: 2,
                  bgcolor: '#667eea',
                  '&:hover': { bgcolor: '#5568d3' },
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Cek Domain'}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Domain Extensions Info */}
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {extensions.map(({ ext, isFree }) => (
                <Chip
                  key={ext}
                  label={`.${ext}`}
                  size="small"
                  sx={{
                    bgcolor: isFree ? '#4ade80' : '#60a5fa',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Results Section */}
        {searchPerformed && (
          <Box>
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress size={60} sx={{ color: 'white' }} />
                <Typography variant="h6" sx={{ color: 'white', mt: 3 }}>
                  Mengecek ketersediaan domain...
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {results.map((result) => (
                  <Grid item xs={12} sm={6} md={3} key={result.extension}>
                    <Card
                      elevation={4}
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        {/* Domain Name */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 2,
                            color: '#1e293b',
                            wordBreak: 'break-word'
                          }}
                        >
                          {searchQuery}.{result.extension}
                        </Typography>

                        {/* Availability Status */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            mb: 2
                          }}
                        >
                          {result.available ? (
                            <>
                              <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                              <Typography
                                variant="body1"
                                sx={{ color: '#22c55e', fontWeight: 600 }}
                              >
                                Tersedia
                              </Typography>
                            </>
                          ) : (
                            <>
                              <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                              <Typography
                                variant="body1"
                                sx={{ color: '#ef4444', fontWeight: 600 }}
                              >
                                Tidak Tersedia
                              </Typography>
                            </>
                          )}
                        </Box>

                        {/* Price */}
                        {result.available && (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#64748b',
                                mb: 2,
                                fontSize: '0.9rem'
                              }}
                            >
                              {result.price}
                            </Typography>

                            {/* Claim Button */}
                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={
                                result.extension === 'com' ? (
                                  <OpenInNewIcon fontSize="small" />
                                ) : (
                                  <WhatsAppIcon fontSize="small" />
                                )
                              }
                              onClick={() =>
                                handleClaim(searchQuery, result.extension, result.isFree)
                              }
                              sx={{
                                bgcolor: result.extension === 'com' ? '#3b82f6' : '#25d366',
                                '&:hover': {
                                  bgcolor: result.extension === 'com' ? '#2563eb' : '#20bd5a'
                                },
                                borderRadius: 2,
                                py: 1,
                                fontWeight: 600,
                                position: 'relative'
                              }}
                            >
                              Claim
                              {result.isFree && (
                                <Chip
                                  label="GRATIS"
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: '#fbbf24',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.65rem',
                                    height: 20
                                  }}
                                />
                              )}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Info Section */}
        {!searchPerformed && (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
              Kenapa Memilih Domain dari Kami?
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Domain Gratis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dapatkan domain .web.id, .biz.id, dan .my.id secara gratis
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <PublicIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Mudah & Cepat
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Proses claim domain hanya memerlukan beberapa langkah mudah
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <WhatsAppIcon sx={{ fontSize: 48, color: '#25d366', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Support 24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tim support kami siap membantu Anda via WhatsApp
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default DomainCheckerWrapper
