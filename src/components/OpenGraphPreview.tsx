'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'

const PreviewCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden'
}))

const PreviewImage = styled('div')({
  width: '100%',
  height: 315,
  backgroundColor: '#f5f5f5',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid #e0e0e0'
})

const PreviewContent = styled(Box)({
  padding: '12px 16px',
  backgroundColor: '#fff'
})

type OpenGraphPreviewProps = {
  title?: string
  description?: string
  image?: string
  url?: string
  siteName?: string
}

const OpenGraphPreview = ({ title, description, image, url, siteName }: OpenGraphPreviewProps) => {
  // Truncate text to fit preview
  const truncatedTitle = useMemo(() => {
    if (!title) return 'Your Store Title'
    return title.length > 60 ? title.substring(0, 60) + '...' : title
  }, [title])

  const truncatedDescription = useMemo(() => {
    if (!description) return 'Your store description will appear here when shared on social media.'
    return description.length > 150 ? description.substring(0, 150) + '...' : description
  }, [description])

  const displayUrl = useMemo(() => {
    if (!url) return 'yourstore.com'
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }, [url])

  return (
    <Box>
      <Typography variant='body2' sx={{ mb: 2, fontWeight: 600 }}>
        Preview (Social Media Share)
      </Typography>
      <PreviewCard>
        <PreviewImage
          style={{
            backgroundImage: image ? `url(${image})` : 'none'
          }}
        >
          {!image && (
            <Box sx={{ textAlign: 'center', color: '#999' }}>
              <i className='tabler-photo' style={{ fontSize: '3rem' }} />
              <Typography variant='caption' display='block'>
                1200 x 630px
              </Typography>
            </Box>
          )}
        </PreviewImage>
        <PreviewContent>
          <Typography
            variant='caption'
            sx={{
              color: '#606770',
              textTransform: 'uppercase',
              fontSize: '12px',
              lineHeight: '11px',
              display: 'block',
              mb: 0.5
            }}
          >
            {displayUrl}
          </Typography>
          <Typography
            variant='body1'
            sx={{
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
              color: '#1c1e21',
              mb: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {truncatedTitle}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: '#606770',
              fontSize: '14px',
              lineHeight: '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {truncatedDescription}
          </Typography>
        </PreviewContent>
      </PreviewCard>
    </Box>
  )
}

export default OpenGraphPreview
