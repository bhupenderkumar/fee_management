'use client'

import { useState, useEffect } from 'react'
import { format, isToday, isThisWeek, isThisMonth, differenceInYears } from 'date-fns'
import { Calendar, Gift, Share2, Download, Users, Cake, Heart, User } from 'lucide-react'
import { Student } from '@/types/database'
import { shareOnWhatsApp, generateBirthdayMessage, formatPhoneNumber, isValidWhatsAppNumber } from '@/utils/whatsapp'

interface BirthdayStudent extends Student {
  age: number
  daysUntilBirthday: number
  isToday: boolean
  isThisWeek: boolean
  isThisMonth: boolean
}

type FilterType = 'today' | 'week' | 'month' | 'all'

// Enhanced Image Component with error handling and fallback
interface EnhancedImageProps {
  src?: string | null
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  onError?: () => void
}

function EnhancedImage({ src, alt, className = '', fallbackIcon, onError }: EnhancedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [proxiedSrc, setProxiedSrc] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

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

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      console.log('EnhancedImage loading:', src)
      setImageError(false)
      setIsLoading(true)
      setProxiedSrc(null)
      setRetryCount(0)
    }
  }, [src])

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallbackIcon || <User className="w-8 h-8 text-gray-400" />}
      </div>
    )
  }

  // Use proxied URL if available, otherwise use original
  const imageUrl = proxiedSrc || src

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

export default function BirthdayManagement() {
  const [birthdayStudents, setBirthdayStudents] = useState<BirthdayStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<BirthdayStudent | null>(null)
  const [showPamphlet, setShowPamphlet] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchBirthdayStudents()
  }, [])

  const fetchBirthdayStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/birthdays')
      if (!response.ok) throw new Error('Failed to fetch birthday data')
      const students: BirthdayStudent[] = await response.json()
      setBirthdayStudents(students)
    } catch (error) {
      console.error('Error fetching birthday students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = birthdayStudents.filter(student => {
    // Apply filter
    let matchesFilter = true
    switch (filter) {
      case 'today':
        matchesFilter = student.isToday
        break
      case 'week':
        matchesFilter = student.isThisWeek
        break
      case 'month':
        matchesFilter = student.isThisMonth
        break
      case 'all':
        matchesFilter = true
        break
    }

    // Apply search
    const matchesSearch = student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.father_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.mother_name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const handleShareBirthday = async (student: BirthdayStudent, phoneNumber: string, parentType: 'father' | 'mother') => {
    if (isValidWhatsAppNumber(phoneNumber)) {
      // First generate and show the pamphlet
      setSelectedStudent(student)
      setShowPamphlet(true)

      // Wait a bit for the modal to render
      setTimeout(async () => {
        try {
          // Import html2canvas dynamically
          const html2canvas = (await import('html2canvas')).default

          // Find the pamphlet content element
          const pamphletElement = document.querySelector('.birthday-pamphlet-content') as HTMLElement

          if (pamphletElement) {
            // Generate canvas from the pamphlet
            const canvas = await html2canvas(pamphletElement, {
              backgroundColor: '#ffffff',
              scale: 2, // Higher quality
              useCORS: true,
              allowTaint: true
            })

            // Convert to blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                // Create a temporary URL for the image
                const imageUrl = URL.createObjectURL(blob)

                // Generate the message
                const message = generateBirthdayMessage({
                  studentName: student.student_name,
                  age: student.age,
                  birthdayDate: student.date_of_birth!,
                  parentName: parentType === 'father' ? student.father_name : student.mother_name
                })

                // Add image sharing note to message
                const messageWithImage = `${message}\n\n🎨 Birthday pamphlet image is attached above!`

                // For WhatsApp Web, we can't directly attach images, but we can open WhatsApp with the message
                // and the user can manually attach the downloaded image
                shareOnWhatsApp({
                  phoneNumber,
                  message: messageWithImage
                })

                // Also trigger download of the image for manual sharing
                const link = document.createElement('a')
                link.href = imageUrl
                link.download = `${student.student_name}_birthday_pamphlet.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Clean up
                URL.revokeObjectURL(imageUrl)

                // Show success message
                alert('Birthday message sent to WhatsApp! The pamphlet image has been downloaded - you can attach it manually in WhatsApp.')
              }
            }, 'image/png', 0.9)
          } else {
            throw new Error('Pamphlet element not found')
          }
        } catch (error) {
          console.error('Error generating pamphlet image:', error)

          // Fallback to text-only message
          const message = generateBirthdayMessage({
            studentName: student.student_name,
            age: student.age,
            birthdayDate: student.date_of_birth!,
            parentName: parentType === 'father' ? student.father_name : student.mother_name
          })

          shareOnWhatsApp({
            phoneNumber,
            message
          })

          alert('Sent birthday message to WhatsApp (image generation failed, text-only message sent)')
        }
      }, 500)
    } else {
      alert('Invalid phone number for WhatsApp sharing')
    }
  }

  const generatePamphlet = (student: BirthdayStudent) => {
    setSelectedStudent(student)
    setShowPamphlet(true)
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  const getFilterCounts = () => {
    return {
      today: birthdayStudents.filter(s => s.isToday).length,
      week: birthdayStudents.filter(s => s.isThisWeek).length,
      month: birthdayStudents.filter(s => s.isThisMonth).length,
      all: birthdayStudents.length
    }
  }

  const counts = getFilterCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-amber-50 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <p className="ml-3 text-amber-800">Loading birthday information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-amber-50 min-h-screen p-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Cake className="w-8 h-8 text-pink-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Today</p>
              <p className="text-2xl font-bold text-black">{counts.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">This Week</p>
              <p className="text-2xl font-bold text-black">{counts.week}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Gift className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">This Month</p>
              <p className="text-2xl font-bold text-black">{counts.month}</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-amber-800">Total</p>
              <p className="text-2xl font-bold text-black">{counts.all}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-amber-100 rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today', count: counts.today },
              { key: 'week', label: 'This Week', count: counts.week },
              { key: 'month', label: 'This Month', count: counts.month },
              { key: 'all', label: 'All Birthdays', count: counts.all }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Birthday Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => {
          const isSelected = selectedStudentIds.has(student.id)
          return (
            <div
              key={student.id}
              className={`rounded-lg shadow-sm border overflow-hidden cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-amber-200 border-amber-400 shadow-lg transform scale-105'
                  : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
              }`}
              onClick={() => toggleStudentSelection(student.id)}
            >
              {/* Student Photo */}
              <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
              <EnhancedImage
                src={student.student_photo_url}
                alt={student.student_name}
                className="w-full h-full object-cover"
                fallbackIcon={
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-500" />
                  </div>
                }
              />
              
              {/* Selection Badge */}
              {isSelected && (
                <div className="absolute top-2 left-2 bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  ✓ Selected
                </div>
              )}

              {/* Birthday Badge */}
              {student.isToday && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  🎂 TODAY!
                </div>
              )}
              
              {/* Age Badge */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-full text-sm font-medium">
                Age {student.age}
              </div>
            </div>

            {/* Student Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-black mb-1">{student.student_name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {student.date_of_birth && format(new Date(student.date_of_birth), 'MMMM dd, yyyy')}
              </p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Father:</span> {student.father_name}
                  {student.father_mobile && (
                    <span className="text-gray-500 ml-1">({formatPhoneNumber(student.father_mobile)})</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Mother:</span> {student.mother_name}
                  {student.mother_mobile && (
                    <span className="text-gray-500 ml-1">({formatPhoneNumber(student.mother_mobile)})</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    generatePamphlet(student)
                  }}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Generate Pamphlet
                </button>
                
                {/* WhatsApp Share Buttons */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 text-center">Share Birthday Pamphlet</p>
                  <div className="grid grid-cols-2 gap-2">
                    {student.father_mobile && isValidWhatsAppNumber(student.father_mobile) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareBirthday(student, student.father_mobile!, 'father')
                        }}
                        className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <Share2 className="w-3 h-3" />
                        Father
                      </button>
                    )}
                    {student.mother_mobile && isValidWhatsAppNumber(student.mother_mobile) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleShareBirthday(student, student.mother_mobile!, 'mother')
                        }}
                        className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <Share2 className="w-3 h-3" />
                        Mother
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 bg-amber-100 rounded-lg border border-amber-200">
          <Cake className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-amber-900 mb-2">No birthdays found</h3>
          <p className="text-amber-700">
            {filter === 'today' && 'No birthdays today.'}
            {filter === 'week' && 'No birthdays this week.'}
            {filter === 'month' && 'No birthdays this month.'}
            {filter === 'all' && 'No birthday information available.'}
          </p>
        </div>
      )}

      {/* Birthday Pamphlet Modal */}
      {showPamphlet && selectedStudent && (
        <BirthdayPamphletModal
          student={selectedStudent}
          onClose={() => {
            setShowPamphlet(false)
            setSelectedStudent(null)
          }}
        />
      )}
    </div>
  )
}

// Birthday Pamphlet Modal Component
interface BirthdayPamphletModalProps {
  student: BirthdayStudent
  onClose: () => void
}

function BirthdayPamphletModal({ student, onClose }: BirthdayPamphletModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default

      // Find the pamphlet content element
      const pamphletElement = document.querySelector('.birthday-pamphlet-content') as HTMLElement

      if (pamphletElement) {
        // Generate canvas from the pamphlet
        const canvas = await html2canvas(pamphletElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true
        })

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${student.student_name}_birthday_pamphlet.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
        }, 'image/png', 0.9)
      }
    } catch (error) {
      console.error('Error generating pamphlet image:', error)
      // Fallback to print
      window.print()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <h3 className="text-lg font-semibold">Birthday Pamphlet</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Image
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Pamphlet Content */}
        <div className="birthday-pamphlet-content p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
          <div className="text-center space-y-6">
            {/* School Header */}
            <div className="border-b-2 border-purple-200 pb-4">
              <h1 className="text-3xl font-bold text-purple-800 mb-2">🎉 First Step School 🎉</h1>
              <p className="text-purple-600">Celebrating Another Year of Joy!</p>
            </div>

            {/* Birthday Celebration */}
            <div className="space-y-4">
              <div className="text-6xl">🎂</div>
              <h2 className="text-4xl font-bold text-pink-600">Happy Birthday!</h2>
              <h3 className="text-2xl font-semibold text-purple-700">{student.student_name}</h3>
            </div>

            {/* Student Photo */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-300 shadow-lg">
                <EnhancedImage
                  src={student.student_photo_url}
                  alt={student.student_name}
                  className="w-full h-full object-cover"
                  fallbackIcon={
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <Users className="w-16 h-16 text-purple-500" />
                    </div>
                  }
                />
              </div>
            </div>

            {/* Birthday Details */}
            <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-pink-200">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Birthday</p>
                  <p className="font-semibold text-purple-700">
                    {student.date_of_birth && format(new Date(student.date_of_birth), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-semibold text-purple-700">{student.age} years old</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Father</p>
                  <p className="font-semibold text-purple-700">{student.father_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mother</p>
                  <p className="font-semibold text-purple-700">{student.mother_name}</p>
                </div>
              </div>
            </div>

            {/* Parent Photos */}
            <div className="flex justify-center gap-8">
              {(student.father_photo_url || student.father_name) && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-300 shadow-md">
                    <EnhancedImage
                      src={student.father_photo_url}
                      alt={student.father_name}
                      className="w-full h-full object-cover"
                      fallbackIcon={
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-blue-500" />
                        </div>
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Father</p>
                </div>
              )}
              {(student.mother_photo_url || student.mother_name) && (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-pink-300 shadow-md">
                    <EnhancedImage
                      src={student.mother_photo_url}
                      alt={student.mother_name}
                      className="w-full h-full object-cover"
                      fallbackIcon={
                        <div className="w-full h-full bg-pink-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-pink-500" />
                        </div>
                      }
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Mother</p>
                </div>
              )}
            </div>

            {/* Birthday Message */}
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 border-2 border-pink-200">
              <div className="text-lg text-purple-800 leading-relaxed">
                <p className="mb-3">🌟 <strong>Wishing you a day filled with happiness and joy!</strong> 🌟</p>
                <p className="mb-3">May this new year of life bring you wonderful adventures, amazing discoveries, and lots of fun learning experiences!</p>
                <p className="text-base">
                  <Heart className="inline w-4 h-4 text-red-500" /> With love from all of us at First Step School <Heart className="inline w-4 h-4 text-red-500" />
                </p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="text-4xl space-x-4">
              🎈 🎁 🎊 🎉 🎂 🎈 🎁
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 border-t-2 border-purple-200 pt-4">
              <p>First Step School, Saurabh Vihar, Jaitpur, Delhi</p>
              <p className="text-xs mt-1">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
