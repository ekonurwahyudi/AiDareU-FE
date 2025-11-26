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

  // Check if image is from external source
  const isExternal = src?.startsWith('http') || src?.startsWith('//')

  // For external images or images from storage, use unoptimized
  const shouldOptimize = !isExternal && !src?.includes('/storage/')

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
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        sizes={sizes}
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
