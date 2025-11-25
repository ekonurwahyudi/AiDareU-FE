'use client'

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

interface DomainResult {
  extension: string
  available: boolean
  price: string
  isFree: boolean
}

interface DomainResultsProps {
  domain: string
  results: DomainResult[]
  onClaim: (domain: string, extension: string, isFree: boolean) => void
}

const DomainResults = ({ domain, results, onClaim }: DomainResultsProps) => {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            mb: 2,
            fontSize: { xs: '1.75rem', md: '2.5rem' }
          }}
        >
          Hasil Pencarian untuk "{domain}"
        </Typography>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mb: 6,
            fontSize: { xs: '0.95rem', md: '1.1rem' }
          }}
        >
          Pilih ekstensi domain yang sesuai dengan kebutuhan Anda
        </Typography>

        <Grid container spacing={3}>
          {results.map((result) => (
            <Grid item xs={12} sm={6} md={3} key={result.extension}>
              <Card
                elevation={result.available ? 4 : 1}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: result.available ? '2px solid #667eea' : '2px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  opacity: result.available ? 1 : 0.6,
                  '&:hover': result.available
                    ? {
                        transform: 'translateY(-8px)',
                        boxShadow: 6
                      }
                    : {}
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 }, textAlign: 'center' }}>
                  {/* Domain Name */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: result.available ? '#1e293b' : '#94a3b8',
                      wordBreak: 'break-word',
                      fontSize: { xs: '1rem', sm: '1.125rem' }
                    }}
                  >
                    {domain}.{result.extension}
                  </Typography>

                  {/* Availability Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      mb: 2,
                      py: 1
                    }}
                  >
                    {result.available ? (
                      <>
                        <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 32 }} />
                        <Typography
                          variant="body1"
                          sx={{ color: '#22c55e', fontWeight: 600, fontSize: '1rem' }}
                        >
                          Tersedia
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CancelIcon sx={{ color: '#ef4444', fontSize: 32 }} />
                        <Typography
                          variant="body1"
                          sx={{ color: '#ef4444', fontWeight: 600, fontSize: '1rem' }}
                        >
                          Sudah Digunakan
                        </Typography>
                      </>
                    )}
                  </Box>

                  {/* Price & Action */}
                  {result.available ? (
                    <>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#667eea',
                          mb: 2,
                          fontWeight: 700,
                          fontSize: { xs: '1.1rem', sm: '1.25rem' }
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
                        onClick={() => onClaim(domain, result.extension, result.isFree)}
                        sx={{
                          bgcolor: result.extension === 'com' ? '#3b82f6' : '#25d366',
                          '&:hover': {
                            bgcolor: result.extension === 'com' ? '#2563eb' : '#20bd5a'
                          },
                          borderRadius: 2,
                          py: 1.25,
                          fontWeight: 600,
                          position: 'relative',
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Claim Domain
                        {result.isFree && (
                          <Chip
                            label="GRATIS"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: -10,
                              right: -10,
                              bgcolor: '#fbbf24',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 22,
                              boxShadow: 2
                            }}
                          />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        mt: 2
                      }}
                    >
                      Domain tidak tersedia
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default DomainResults
