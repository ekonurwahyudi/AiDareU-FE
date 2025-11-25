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
      // Check domain availability
      const domainResults: DomainResult[] = await Promise.all(
        extensions.map(async ({ ext, isFree, price }) => {
          try {
            const fullDomain = `${domain}.${ext}`

            // Method 1: Check DNS records first (quick check)
            const dnsResponse = await fetch(`https://dns.google/resolve?name=${fullDomain}&type=A`)

            if (dnsResponse.ok) {
              const dnsData = await dnsResponse.json()

              // If DNS resolves successfully, domain is definitely taken
              const hasDNS = dnsData.Status === 0 && dnsData.Answer && dnsData.Answer.length > 0

              if (hasDNS) {
                return {
                  extension: ext,
                  available: false, // Domain has DNS = definitely taken
                  price,
                  isFree
                }
              }
            }

            // Method 2: For .id domains, check WHOIS via rdap
            if (ext.includes('.id')) {
              try {
                // Use RDAP (Registration Data Access Protocol) for .id domains
                const rdapResponse = await fetch(`https://rdap.pandi.id/rdap/domain/${fullDomain}`)

                if (rdapResponse.ok) {
                  const rdapData = await rdapResponse.json()

                  // If RDAP returns valid data, domain is registered
                  const isRegistered = rdapData.objectClassName === 'domain' ||
                                      (rdapData.events && rdapData.events.length > 0)

                  return {
                    extension: ext,
                    available: !isRegistered,
                    price,
                    isFree
                  }
                } else if (rdapResponse.status === 404) {
                  // 404 means domain not found = available
                  return {
                    extension: ext,
                    available: true,
                    price,
                    isFree
                  }
                }
              } catch (rdapErr) {
                console.log(`RDAP check failed for ${fullDomain}, falling back`)
              }
            }

            // Method 3: For .com, check via RDAP
            if (ext === 'com') {
              try {
                const rdapResponse = await fetch(`https://rdap.verisign.com/com/v1/domain/${fullDomain}`)

                if (rdapResponse.ok) {
                  return {
                    extension: ext,
                    available: false, // Found in RDAP = registered
                    price,
                    isFree
                  }
                } else if (rdapResponse.status === 404) {
                  return {
                    extension: ext,
                    available: true, // Not found = available
                    price,
                    isFree
                  }
                }
              } catch (rdapErr) {
                console.log(`RDAP check failed for ${fullDomain}`)
              }
            }

            // Fallback: If no DNS and RDAP check inconclusive, assume available
            return {
              extension: ext,
              available: true,
              price,
              isFree
            }
          } catch (err) {
            console.error(`Error checking ${domain}.${ext}:`, err)
            // On error, assume available to be safe
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
