'use client'

import { Box, Container, Typography, Grid, Card } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PublicIcon from '@mui/icons-material/Public'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import SpeedIcon from '@mui/icons-material/Speed'

const DomainBenefits = () => {
  const benefits = [
    {
      icon: <CheckCircleIcon sx={{ fontSize: 56, color: '#22c55e' }} />,
      title: 'Domain Gratis',
      description: 'Dapatkan domain .web.id, .biz.id, dan .my.id secara gratis untuk bisnis Anda'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 56, color: '#3b82f6' }} />,
      title: 'Proses Cepat',
      description: 'Proses claim domain hanya memerlukan beberapa langkah mudah dan cepat'
    },
    {
      icon: <PublicIcon sx={{ fontSize: 56, color: '#8b5cf6' }} />,
      title: 'Domain Profesional',
      description: 'Tingkatkan kredibilitas bisnis Anda dengan domain profesional'
    },
    {
      icon: <WhatsAppIcon sx={{ fontSize: 56, color: '#25d366' }} />,
      title: 'Support 24/7',
      description: 'Tim support kami siap membantu Anda via WhatsApp kapan saja'
    }
  ]

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
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
          Kenapa Memilih Domain dari Kami?
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
          Solusi domain terbaik untuk mengembangkan bisnis online Anda
        </Typography>

        <Grid container spacing={4}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 4,
                    borderColor: '#667eea'
                  }
                }}
              >
                <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  {benefit.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7, fontSize: '0.95rem' }}
                >
                  {benefit.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default DomainBenefits
