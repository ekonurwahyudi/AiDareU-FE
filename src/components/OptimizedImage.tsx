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
  
  // Check if image is from backend storage
  const isFromBackend = isBackendStorageUrl(optimizedSrc)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          position: fill ? 'absolute' : 'relative',
          top: fill ? 0 : undefined,
          left: fill ? 0 : undefined,
          right: fill ? 0 : undefined,
          bottom: fill ? 0 : undefined,
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

  // For backend storage images, use native <img> tag with lazy loading
  // This avoids Next.js Image Optimization issues with custom domains
  if (isFromBackend) {
    // For fill mode, we need the parent to have position:relative and defined dimensions
    if (fill) {
      return (
        <>
          {isLoading && (
            <Skeleton
              variant="rectangular"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%'
              }}
            />
          )}
          <img
            src={optimizedSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={className}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit,
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              ...style
            }}
          />
        </>
      )
    }
    
    // For non-fill mode with explicit dimensions
    return (
      <Box sx={{ position: 'relative', width, height, display: 'inline-block' }}>
        {isLoading && (
          <Skeleton
            variant="rectangular"
            width={width}
            height={height}
          />
        )}
        <img
          src={optimizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            width: width,
            height: height,
            objectFit,
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            ...style
          }}
        />
      </Box>
    )
  }

  // For local/static images, use Next.js Image component
  if (fill) {
    return (
      <>
        {isLoading && (
          <Skeleton
            variant="rectangular"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          />
        )}
        <Image
          src={optimizedSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          className={className}
          quality={quality}
          placeholder={placeholder}
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
      </>
    )
  }

  // For non-fill mode with local images
  return (
    <Box sx={{ position: 'relative', width, height, ...style }}>
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
        />
      )}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className={className}
        quality={quality}
        placeholder={placeholder}
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
