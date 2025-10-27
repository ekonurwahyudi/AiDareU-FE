'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function CustomDomainPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const domain = params.domain as string

  useEffect(() => {
    const fetchStoreByDomain = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

        // Fetch store by custom domain
        const response = await fetch(`${backendUrl}/api/public/stores?domain=${encodeURIComponent(domain)}`)

        if (!response.ok) {
          throw new Error('Store not found')
        }

        const result = await response.json()

        if (result.success && result.data?.subdomain) {
          // Redirect to /s/[subdomain] internally
          router.replace(`/s/${result.data.subdomain}`)
        } else {
          setError('Toko tidak ditemukan')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error fetching store:', err)
        setError('Domain belum terhubung atau toko tidak ditemukan')
        setLoading(false)
      }
    }

    if (domain) {
      fetchStoreByDomain()
    }
  }, [domain, router])

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Memuat toko...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <Typography variant="h4" color="error">
          {error}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Pastikan domain Anda sudah terhubung dengan benar
        </Typography>
      </Box>
    )
  }

  return null
}
