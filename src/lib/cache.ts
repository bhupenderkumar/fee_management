// Enhanced cache utility for storing classes, students data, and images
// This will help reduce API calls and improve performance

import { Student } from '@/types/database'

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresIn: number
  type?: 'data' | 'image' | 'blob'
}

interface ImageCacheItem {
  url: string
  blob: Blob
  timestamp: number
  expiresIn: number
}

class DataCache {
  private cache = new Map<string, CacheItem<unknown>>()
  private imageCache = new Map<string, ImageCacheItem>()
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds
  private readonly IMAGE_EXPIRY = 30 * 60 * 1000 // 30 minutes for images

  // Set data in cache with optional expiry time
  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY, type: 'data' | 'image' | 'blob' = 'data'): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
      type
    }
    this.cache.set(key, item)

    // Also save to localStorage for persistence (except for large blobs)
    if (type === 'data' && typeof window !== 'undefined') {
      try {
        const persistentItem = {
          data,
          timestamp: Date.now(),
          expiresIn
        }
        localStorage.setItem(`cache_${key}`, JSON.stringify(persistentItem))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }

  // Get data from cache if not expired
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    // If not in memory cache, try localStorage
    if (!item && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`)
        if (stored) {
          const parsedItem = JSON.parse(stored)
          const now = Date.now()
          if (now - parsedItem.timestamp <= parsedItem.expiresIn) {
            // Restore to memory cache
            this.cache.set(key, {
              data: parsedItem.data,
              timestamp: parsedItem.timestamp,
              expiresIn: parsedItem.expiresIn,
              type: 'data'
            })
            return parsedItem.data as T
          } else {
            // Remove expired item from localStorage
            localStorage.removeItem(`cache_${key}`)
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
      }
    }

    if (!item) {
      return null
    }

    // Check if cache item has expired
    const now = Date.now()
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_${key}`)
      }
      return null
    }

    return item.data as T
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null
  }

  // Image caching methods
  setImage(url: string, blob: Blob): void {
    const item: ImageCacheItem = {
      url,
      blob,
      timestamp: Date.now(),
      expiresIn: this.IMAGE_EXPIRY
    }
    this.imageCache.set(url, item)
  }

  getImage(url: string): Blob | null {
    const item = this.imageCache.get(url)

    if (!item) {
      return null
    }

    // Check if image cache item has expired
    const now = Date.now()
    if (now - item.timestamp > item.expiresIn) {
      this.imageCache.delete(url)
      return null
    }

    return item.blob
  }

  // Clear specific cache entry
  delete(key: string): void {
    this.cache.delete(key)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.imageCache.clear()
    if (typeof window !== 'undefined') {
      // Clear all cache items from localStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  // Hard reload - clear all cache and force refresh
  hardReload(): void {
    console.log('🔄 Performing hard reload - clearing all cache')
    this.clear()

    // Dispatch custom event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cache-hard-reload'))
    }
  }

  // Get cache size
  size(): number {
    return this.cache.size
  }

  // Get image cache size
  imageCacheSize(): number {
    return this.imageCache.size
  }

  // Get cache statistics
  getStats(): { dataCache: number; imageCache: number; totalSize: number } {
    return {
      dataCache: this.cache.size,
      imageCache: this.imageCache.size,
      totalSize: this.cache.size + this.imageCache.size
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()

    // Clean up data cache
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key)
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`cache_${key}`)
        }
      }
    }

    // Clean up image cache
    for (const [url, item] of this.imageCache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        this.imageCache.delete(url)
      }
    }
  }
}

// Create singleton instance
export const dataCache = new DataCache()

// Cache keys for different data types
export const CACHE_KEYS = {
  CLASSES: 'classes',
  CLASSES_WITH_NAMES: 'classes_with_names',
  STUDENTS_BY_CLASS: (className: string) => `students_${className}`,
  STUDENT_BY_ID: (id: string) => `student_${id}`,
  ALL_STUDENTS: 'all_students',
  BIRTHDAY_STUDENTS: 'birthday_students',
  PENDING_FEES: 'pending_fees',
  PAYMENT_SUMMARY: 'payment_summary'
} as const

// Cache expiry times (in milliseconds)
export const CACHE_EXPIRY = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000  // 1 hour
} as const

// Utility functions for common cache operations
export const cacheUtils = {
  // Cache classes data
  setClasses: (classes: string[]) => {
    dataCache.set(CACHE_KEYS.CLASSES, classes, CACHE_EXPIRY.LONG)
  },

  getClasses: (): string[] | null => {
    return dataCache.get<string[]>(CACHE_KEYS.CLASSES)
  },

  // Cache classes with names
  setClassesWithNames: (classes: {id: string, name: string, section: string}[]) => {
    dataCache.set(CACHE_KEYS.CLASSES_WITH_NAMES, classes, CACHE_EXPIRY.LONG)
  },

  getClassesWithNames: (): {id: string, name: string, section: string}[] | null => {
    return dataCache.get<{id: string, name: string, section: string}[]>(CACHE_KEYS.CLASSES_WITH_NAMES)
  },

  // Cache students by class
  setStudentsByClass: (className: string, students: Student[]) => {
    dataCache.set(CACHE_KEYS.STUDENTS_BY_CLASS(className), students, CACHE_EXPIRY.MEDIUM)
  },

  getStudentsByClass: (className: string): Student[] | null => {
    return dataCache.get<Student[]>(CACHE_KEYS.STUDENTS_BY_CLASS(className))
  },

  // Cache individual student
  setStudent: (id: string, student: Student) => {
    dataCache.set(CACHE_KEYS.STUDENT_BY_ID(id), student, CACHE_EXPIRY.MEDIUM)
  },

  getStudent: (id: string): Student | null => {
    return dataCache.get<Student>(CACHE_KEYS.STUDENT_BY_ID(id))
  },

  // Cache birthday students
  setBirthdayStudents: (students: Student[]) => {
    dataCache.set(CACHE_KEYS.BIRTHDAY_STUDENTS, students, CACHE_EXPIRY.SHORT)
  },

  getBirthdayStudents: (): Student[] | null => {
    return dataCache.get<Student[]>(CACHE_KEYS.BIRTHDAY_STUDENTS)
  },

  // Cache pending fees
  setPendingFees: (fees: (Student & { totalPaid: number; totalPending: number; lastPaymentDate?: string; lastPaymentAmount?: number; pendingMonth?: number; pendingYear?: number; pendingReason?: string })[]) => {
    dataCache.set(CACHE_KEYS.PENDING_FEES, fees, CACHE_EXPIRY.SHORT)
  },

  getPendingFees: (): (Student & { totalPaid: number; totalPending: number; lastPaymentDate?: string; lastPaymentAmount?: number; pendingMonth?: number; pendingYear?: number; pendingReason?: string })[] | null => {
    return dataCache.get<(Student & { totalPaid: number; totalPending: number; lastPaymentDate?: string; lastPaymentAmount?: number; pendingMonth?: number; pendingYear?: number; pendingReason?: string })[]>(CACHE_KEYS.PENDING_FEES)
  },

  // Clear all student-related cache when data changes
  clearStudentCache: () => {
    dataCache.delete(CACHE_KEYS.ALL_STUDENTS)
    dataCache.delete(CACHE_KEYS.BIRTHDAY_STUDENTS)
    dataCache.delete(CACHE_KEYS.PENDING_FEES)
    // Clear all students by class cache
    for (const key of dataCache['cache'].keys()) {
      if (key.startsWith('students_') || key.startsWith('student_')) {
        dataCache.delete(key)
      }
    }
  },

  // Clear all cache
  clearAll: () => {
    dataCache.clear()
  },

  // Hard reload functionality
  hardReload: () => {
    dataCache.hardReload()
  },

  // Image caching utilities
  setImageCache: (url: string, blob: Blob) => {
    dataCache.setImage(url, blob)
  },

  getImageCache: (url: string): Blob | null => {
    return dataCache.getImage(url)
  },

  // Get cache statistics
  getCacheStats: () => {
    return dataCache.getStats()
  },

  // Force refresh specific data type
  forceRefreshStudents: () => {
    // Clear all student-related cache
    for (const key of dataCache['cache'].keys()) {
      if (key.startsWith('students_') || key.startsWith('student_') || key === CACHE_KEYS.ALL_STUDENTS) {
        dataCache.delete(key)
      }
    }
    console.log('🔄 Student cache cleared - will refresh on next request')
  },

  forceRefreshClasses: () => {
    dataCache.delete(CACHE_KEYS.CLASSES)
    dataCache.delete(CACHE_KEYS.CLASSES_WITH_NAMES)
    console.log('🔄 Classes cache cleared - will refresh on next request')
  },

  // Check if cache is stale (older than specified time)
  isCacheStale: (key: string, maxAge: number): boolean => {
    const item = dataCache['cache'].get(key)
    if (!item) return true

    const now = Date.now()
    return (now - item.timestamp) > maxAge
  }
}

// Auto cleanup expired cache entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup()
  }, 10 * 60 * 1000)
}
