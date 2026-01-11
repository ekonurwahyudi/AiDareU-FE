'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Box, Skeleton } from '@mui/material'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  style?: React.CSSProperties
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  quality?: number
  placeholder?: 'blur' | 'empty'
  onLoad?: () => void
}

// Helper to check if URL is from our backend storage
const isBackendStorageUrl = (url: string): boolean => {
  if (!url) return false
  
  // Check for backend storage URLs
  const backendPatterns = [
    'api.aidareu.com/storage',
    'aidareu.com/storage',
    'localhost:8000/storage',
    'localhost:8080/storage',
    '/storage/'
  ]
  
  return backendPatterns.some(pattern => url.includes(pattern))
}

// Helper to transform URL for optimization
const getOptimizedUrl = (src: string): string => {
  if (!src) return src
  
  // If it's a relative storage path, convert to full URL
  if (src.startsWith('/storage/')) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.aidareu.com'
    return `${backendUrl}${src}`
  }
  
  return src
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  className,
  style,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'empty',
  onLoad
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Transform URL if needed
  const optimizedSrc = getOptimizedUrl(src)
  
  // Check if image is from external source (not our backend)
  const isExternal = optimizedSrc?.startsWith('http') || optimizedSrc?.startsWith('//')
  const isFromBackend = isBackendStorageUrl(optimizedSrc)
  
  // Enable optimization for:
  // 1. Local images (not starting with http)
  // 2. Images from our backend storage (api.aidareu.com, etc.)
  // Disable optimization for other external sources
  const shouldOptimize = !isExternal || isFromBackend

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
  }

  if (error) {
    return (
      <Box
        sx={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          color: '#999',
          fontSize: '0.875rem',
          ...style
        }}
      >
        Image not found
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: fill ? '100%' : width, height: fill ? '100%' : height, ...style }}>
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width={fill ? '100%' : width}
          height={fill ? '100%' : height}
          sx={{
            position: fill ? 'absolute' : 'static',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes || (fill ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined)}
        className={className}
        quality={quality}
        placeholder={placeholder}
        unoptimized={!shouldOptimize}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
          ...style
        }}
        loading={priority ? undefined : 'lazy'}
      />
    </Box>
  )
}

export default OptimizedImage
