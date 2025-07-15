'use client'

import { useState, useEffect } from 'react'
import { User, Users } from 'lucide-react'
import { cacheUtils } from '@/lib/cache'

// Enhanced Image Component with error handling and fallback
interface EnhancedImageProps {
  src?: string | null
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
}

export function EnhancedImage({ src, alt, className = '', fallbackIcon, onError }: EnhancedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [proxiedSrc, setProxiedSrc] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [cachedImageUrl, setCachedImageUrl] = useState<string | null>(null)

  const loadImageWithCache = async (imageUrl: string) => {
    try {
      // Check if image is cached
      const cachedBlob = cacheUtils.getImageCache(imageUrl)
      if (cachedBlob) {
        const objectUrl = URL.createObjectURL(cachedBlob)
        setCachedImageUrl(objectUrl)
        setIsLoading(false)
        return
      }

      // Fetch image and cache it
      const response = await fetch(imageUrl)
      if (response.ok) {
        const blob = await response.blob()
        cacheUtils.setImageCache(imageUrl, blob)
        const objectUrl = URL.createObjectURL(blob)
        setCachedImageUrl(objectUrl)
        setIsLoading(false)
      } else {
        throw new Error('Failed to fetch image')
      }
    } catch (error) {
      console.error('Error loading image with cache:', error)
      // Fallback to regular image loading
      setCachedImageUrl(imageUrl)
      setIsLoading(false)
    }
  }

  const handleImageError = async () => {
    console.log(`Image error for ${src}, retry count: ${retryCount}`)

    // If this is a Supabase URL and we haven't retried too many times, try to get a fresh URL
    if (src && src.includes('supabase.co') && retryCount < 2) {
      try {
        setRetryCount(prev => prev + 1)
        setIsLoading(true)

        // Get fresh signed URL from our API using the original URL
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(src)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.signedUrl) {
            setProxiedSrc(data.signedUrl)
            // Try to load with cache
            await loadImageWithCache(data.signedUrl)
            return // Don't set error state, let the new URL try to load
          }
        }
      } catch (error) {
        console.error('Error getting fresh image URL:', error)
      }
    }

    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  // Reset error state when src changes and load with cache
  useEffect(() => {
    if (src) {
      console.log('EnhancedImage loading:', src)
      setImageError(false)
      setIsLoading(true)
      setProxiedSrc(null)
      setRetryCount(0)
      setCachedImageUrl(null)

      // Try to load with cache first
      loadImageWithCache(src)
    }

    // Cleanup object URLs on unmount
    return () => {
      if (cachedImageUrl && cachedImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cachedImageUrl)
      }
    }
  }, [src])

  // Listen for hard reload events
  useEffect(() => {
    const handleHardReload = () => {
      if (src) {
        setImageError(false)
        setIsLoading(true)
        setCachedImageUrl(null)
        setProxiedSrc(null)
        setRetryCount(0)
        loadImageWithCache(src)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cache-hard-reload', handleHardReload)
      return () => window.removeEventListener('cache-hard-reload', handleHardReload)
    }
  }, [src])

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallbackIcon || <User className="w-8 h-8 text-gray-400" />}
      </div>
    )
  }

  // Use cached URL if available, then proxied URL, then original
  const imageUrl = cachedImageUrl || proxiedSrc || src

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  )
}

// Student interface for the component
interface Student {
  id: string
  student_name: string
  father_name: string
  mother_name?: string
  student_photo_url?: string
  father_photo_url?: string
  mother_photo_url?: string
  class_id?: string
  section?: string
  date_of_birth?: string
  father_mobile?: string
  mother_mobile?: string
  class?: {
    name: string
    section: string
  }
}

// Child Details Component Props
interface ChildDetailsComponentProps {
  student: Student
  size?: 'small' | 'medium' | 'large'
  showParents?: boolean
  showBasicInfo?: boolean
  className?: string
  variant?: 'card' | 'modal' | 'inline'
}

export default function ChildDetailsComponent({ 
  student, 
  size = 'medium', 
  showParents = true, 
  showBasicInfo = true,
  className = '',
  variant = 'card'
}: ChildDetailsComponentProps) {
  
  // Size configurations
  const sizeConfig = {
    small: {
      student: 'w-16 h-16',
      parent: 'w-12 h-12',
      studentIcon: 'w-6 h-6',
      parentIcon: 'w-4 h-4'
    },
    medium: {
      student: 'w-24 h-24',
      parent: 'w-16 h-16',
      studentIcon: 'w-8 h-8',
      parentIcon: 'w-6 h-6'
    },
    large: {
      student: 'w-32 h-32',
      parent: 'w-20 h-20',
      studentIcon: 'w-12 h-12',
      parentIcon: 'w-8 h-8'
    }
  }

  const config = sizeConfig[size]

  // Variant-specific styling
  const variantStyles = {
    card: 'bg-white rounded-lg shadow-sm border p-4',
    modal: 'bg-transparent',
    inline: 'bg-transparent'
  }

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {/* Student Photo */}
      <div className="flex justify-center mb-4">
        <div className={`${config.student} rounded-full overflow-hidden border-4 border-amber-300 shadow-lg`}>
          <EnhancedImage
            src={student.student_photo_url}
            alt={student.student_name}
            className="w-full h-full object-cover"
            fallbackIcon={
              <div className="w-full h-full bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center">
                <Users className={`${config.studentIcon} text-amber-600`} />
              </div>
            }
          />
        </div>
      </div>

      {/* Basic Info */}
      {showBasicInfo && (
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{student.student_name}</h3>
          {student.class && (
            <p className="text-xs lg:text-sm text-gray-600">
              Class: {student.class.name} - {student.class.section}
            </p>
          )}
          {student.class_id && !student.class && (
            <p className="text-xs lg:text-sm text-gray-600">Class: {student.class_id}</p>
          )}
        </div>
      )}

      {/* Parent Photos */}
      {showParents && (
        <div className="flex justify-center gap-4">
          {(student.father_photo_url || student.father_name) && (
            <div className="text-center">
              <div className={`${config.parent} rounded-full overflow-hidden border-2 border-blue-300 shadow-md`}>
                <EnhancedImage
                  src={student.father_photo_url}
                  alt={student.father_name}
                  className="w-full h-full object-cover"
                  fallbackIcon={
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <User className={`${config.parentIcon} text-blue-500`} />
                    </div>
                  }
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">Father</p>
            </div>
          )}
          {(student.mother_photo_url || student.mother_name) && (
            <div className="text-center">
              <div className={`${config.parent} rounded-full overflow-hidden border-2 border-pink-300 shadow-md`}>
                <EnhancedImage
                  src={student.mother_photo_url}
                  alt={student.mother_name || 'Mother'}
                  className="w-full h-full object-cover"
                  fallbackIcon={
                    <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                      <User className={`${config.parentIcon} text-pink-500`} />
                    </div>
                  }
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">Mother</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
