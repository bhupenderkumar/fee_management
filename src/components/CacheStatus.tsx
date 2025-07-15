'use client'

import { useState, useEffect } from 'react'
import { dataCache, cacheUtils } from '@/lib/cache'
import { Database, Trash2, RefreshCw, RotateCcw, Users, GraduationCap, Image } from 'lucide-react'

export default function CacheStatus() {
  const [cacheStats, setCacheStats] = useState({ dataCache: 0, imageCache: 0, totalSize: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [lastReloadTime, setLastReloadTime] = useState<Date | null>(null)

  useEffect(() => {
    const updateCacheStats = () => {
      setCacheStats(cacheUtils.getCacheStats())
    }

    // Update cache stats initially
    updateCacheStats()

    // Update cache stats every 5 seconds
    const interval = setInterval(updateCacheStats, 5000)

    // Listen for hard reload events
    const handleHardReload = () => {
      setLastReloadTime(new Date())
      setTimeout(updateCacheStats, 100) // Update stats after reload
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('cache-hard-reload', handleHardReload)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('cache-hard-reload', handleHardReload)
      }
    }
  }, [])

  const handleClearCache = () => {
    cacheUtils.clearAll()
    setCacheStats({ dataCache: 0, imageCache: 0, totalSize: 0 })
    console.log('🗑️ Cache cleared manually')
  }

  const handleCleanupCache = () => {
    dataCache.cleanup()
    setCacheStats(cacheUtils.getCacheStats())
    console.log('🧹 Cache cleanup completed')
  }

  const handleHardReload = () => {
    cacheUtils.hardReload()
    setLastReloadTime(new Date())
    console.log('🔄 Hard reload initiated')
  }

  const handleForceRefreshStudents = () => {
    cacheUtils.forceRefreshStudents()
    setCacheStats(cacheUtils.getCacheStats())
  }

  const handleForceRefreshClasses = () => {
    cacheUtils.forceRefreshClasses()
    setCacheStats(cacheUtils.getCacheStats())
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Show cache status"
      >
        <Database className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[250px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Cache Status
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Data Cache:</span>
          <span className="font-medium text-gray-900">{cacheStats.dataCache}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Image Cache:</span>
          <span className="font-medium text-gray-900">{cacheStats.imageCache}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Items:</span>
          <span className="font-medium text-gray-900">{cacheStats.totalSize}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`font-medium ${cacheStats.totalSize > 0 ? 'text-green-600' : 'text-gray-500'}`}>
            {cacheStats.totalSize > 0 ? 'Active' : 'Empty'}
          </span>
        </div>

        {lastReloadTime && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last Reload:</span>
            <span className="font-medium text-blue-600 text-xs">
              {lastReloadTime.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-4">
        {/* Hard Reload Button */}
        <button
          onClick={handleHardReload}
          className="w-full bg-purple-600 text-white px-3 py-2 rounded text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 font-medium"
          title="Hard reload - Clear all cache and force refresh"
        >
          <RotateCcw className="w-3 h-3" />
          Hard Reload
        </button>

        {/* Quick Actions */}
        <div className="flex gap-1">
          <button
            onClick={handleForceRefreshStudents}
            className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            title="Force refresh student data"
          >
            <Users className="w-3 h-3" />
            Students
          </button>
          <button
            onClick={handleForceRefreshClasses}
            className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            title="Force refresh class data"
          >
            <GraduationCap className="w-3 h-3" />
            Classes
          </button>
        </div>

        {/* Maintenance Actions */}
        <div className="flex gap-1">
          <button
            onClick={handleCleanupCache}
            className="flex-1 bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center justify-center gap-1"
            title="Clean up expired cache entries"
          >
            <RefreshCw className="w-3 h-3" />
            Cleanup
          </button>
          <button
            onClick={handleClearCache}
            className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
            title="Clear all cache"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Cache improves performance by storing frequently accessed data locally.
      </div>
    </div>
  )
}
