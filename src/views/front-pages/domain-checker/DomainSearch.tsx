'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PublicIcon from '@mui/icons-material/Public'

interface DomainSearchProps {
  onSearch: (domain: string) => void
  loading: boolean
  error: string
}

const DomainSearch = ({ onSearch, loading, error }: DomainSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      return
    }
    onSearch(searchQuery)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 12, md: 15 },
        pb: { xs: 8, md: 10 },
        background: 'linear-gradient(180deg, #F4F5FA 0%, #FFFFFF 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(118, 75, 162, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Cek Ketersediaan Domain
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: 700,
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.125rem' },
              fontWeight: 500,
              color: 'text.secondary',
              lineHeight: 1.6
            }}
          >
            Temukan domain sempurna untuk bisnis online Anda. Gratis untuk domain lokal Indonesia!
          </Typography>
        </Box>

        {/* Search Box */}
        <Box
          sx={{
            maxWidth: 800,
            mx: 'auto',
            bgcolor: 'white',
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            boxShadow: '0 8px 40px rgba(102, 126, 234, 0.12)',
            border: '1px solid rgba(102, 126, 234, 0.08)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              placeholder="Masukkan nama domain (contoh: tokosaya)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onKeyPress={handleKeyPress}
              disabled={loading}
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
                  fontSize: { xs: '1rem', sm: '1.1rem' }
                }
              }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              sx={{
                minWidth: { xs: '100%', sm: 180 },
                height: 56,
                borderRadius: 2,
                bgcolor: '#E91E63',
                '&:hover': { bgcolor: '#C2185B' },
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none'
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

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: 'text.secondary',
              textAlign: 'center',
              fontSize: '0.875rem'
            }}
          >
            Cek ketersediaan untuk .com, .web.id, .biz.id, dan .my.id
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default DomainSearch
