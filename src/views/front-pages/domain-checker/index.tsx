'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import DomainSearch from './DomainSearch'
import DomainResults from './DomainResults'
import DomainBenefits from './DomainBenefits'
import { useSettings } from '@core/hooks/useSettings'

interface DomainResult {
  extension: string
  available: boolean
  price: string
  isFree: boolean
}

const DomainCheckerWrapper = () => {
  const { updatePageSettings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [searchedDomain, setSearchedDomain] = useState('')
  const [error, setError] = useState('')

  const extensions = [
    { ext: 'com', isFree: false, price: 'Rp 150.000/tahun' },
    { ext: 'web.id', isFree: true, price: 'Gratis' },
    { ext: 'biz.id', isFree: true, price: 'Gratis' },
    { ext: 'my.id', isFree: true, price: 'Gratis' }
  ]

  // Force light mode for this page
  useEffect(() => {
    return updatePageSettings({
      skin: 'default'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkDomainAvailability = async (domain: string) => {
    if (!domain.trim()) {
      setError('Masukkan nama domain yang ingin Anda cek')
      return
    }

    setLoading(true)
    setError('')
    setSearchedDomain(domain)
    setSearchPerformed(true)

    try {
      // Call WHOIS API untuk cek ketersediaan domain
      const domainResults: DomainResult[] = await Promise.all(
        extensions.map(async ({ ext, isFree, price }) => {
          try {
            // Gunakan API WHOIS untuk cek domain
            const response = await fetch(
              `https://domain-availability.whoisxmlapi.com/api/v1?apiKey=at_YOUR_API_KEY&domainName=${domain}.${ext}`
            )

            if (response.ok) {
              const data = await response.json()
              return {
                extension: ext,
                available: data.DomainInfo?.domainAvailability === 'AVAILABLE',
                price,
                isFree
              }
            }

            // Fallback: jika API gagal, gunakan logic sederhana
            // Domain dianggap available jika bukan domain populer
            const popularDomains = [
              'google',
              'facebook',
              'youtube',
              'amazon',
              'twitter',
              'instagram',
              'linkedin',
              'microsoft',
              'apple',
              'netflix',
              'aidareu',
              'tokopedia',
              'shopee',
              'bukalapak',
              'gojek',
              'grab'
            ]

            const isPopular = popularDomains.includes(domain.toLowerCase())

            return {
              extension: ext,
              available: !isPopular,
              price,
              isFree
            }
          } catch (err) {
            console.error(`Error checking ${domain}.${ext}:`, err)
            // Default: anggap tersedia jika error
            return {
              extension: ext,
              available: true,
              price,
              isFree
            }
          }
        })
      )

      setResults(domainResults)
    } catch (err) {
      setError('Terjadi kesalahan saat mengecek domain. Silakan coba lagi.')
      console.error('Domain check error:', err)
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
      const message = `Halo, saya ingin claim domain gratis ${domain}.${extension}`
      const encodedMessage = encodeURIComponent(message)
      window.open(`https://wa.me/628121555423?text=${encodedMessage}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        color: '#000000',
        minHeight: '100vh'
      }}
    >
      {/* Hero Section with Search */}
      <DomainSearch onSearch={checkDomainAvailability} loading={loading} error={error} />

      {/* Results Section */}
      {searchPerformed && !loading && results.length > 0 && (
        <DomainResults domain={searchedDomain} results={results} onClaim={handleClaim} />
      )}

      {/* Benefits Section */}
      {!searchPerformed && <DomainBenefits />}
    </Box>
  )
}

export default DomainCheckerWrapper
