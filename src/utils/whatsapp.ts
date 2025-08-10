/**
 * WhatsApp sharing utilities for the fee management system
 */

export interface WhatsAppShareOptions {
  phoneNumber: string
  message: string
  fallbackDelay?: number
}

// Global variable to track WhatsApp tab
let whatsappTab: Window | null = null

/**
 * Opens WhatsApp with a pre-filled message
 * Reuses existing WhatsApp tab if available to avoid multiple sessions
 */
export function shareOnWhatsApp({ phoneNumber, message, fallbackDelay = 1000 }: WhatsAppShareOptions): void {
  // Clean phone number (remove any non-digit characters except +)
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '')

  if (!cleanNumber) {
    console.error('Invalid phone number provided for WhatsApp sharing')
    alert('Invalid phone number provided for WhatsApp sharing')
    return
  }

  // URLs for different WhatsApp clients
  const whatsappBusinessUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`

  // Check if we're on mobile or desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile) {
    // On mobile, try to open the app directly
    try {
      // Create a hidden link and click it to try opening the app
      const link = document.createElement('a')
      link.href = whatsappBusinessUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Fallback to web version after delay if app doesn't open
      setTimeout(() => {
        openWhatsAppTab(whatsappUrl)
      }, fallbackDelay)
    } catch {
      // If app opening fails, go directly to web version
      openWhatsAppTab(whatsappUrl)
    }
  } else {
    // On desktop, open web version with tab reuse
    openWhatsAppTab(whatsappUrl)
  }
}

/**
 * Opens WhatsApp in a tab, reusing existing tab if available
 */
function openWhatsAppTab(url: string): void {
  try {
    // Check if existing WhatsApp tab is still open and valid
    if (whatsappTab && !whatsappTab.closed) {
      // Focus the existing tab and navigate to new URL
      whatsappTab.focus()
      whatsappTab.location.href = url

      // Show user feedback that we're reusing the existing tab
      showWhatsAppFeedback('WhatsApp message loaded in existing tab')
    } else {
      // Open new tab and store reference
      whatsappTab = window.open(url, 'whatsapp_tab')

      // If popup was blocked, try opening in same tab
      if (!whatsappTab) {
        showWhatsAppFeedback('Please allow popups for WhatsApp sharing', 'warning')
        window.location.href = url
      } else {
        showWhatsAppFeedback('WhatsApp opened in new tab')
      }
    }
  } catch (error) {
    console.error('Error opening WhatsApp tab:', error)
    // Fallback: try to open in new tab without reuse
    try {
      window.open(url, '_blank')
      showWhatsAppFeedback('WhatsApp opened in new tab')
    } catch {
      // Last resort: navigate in current tab
      showWhatsAppFeedback('Redirecting to WhatsApp...', 'warning')
      window.location.href = url
    }
  }
}

/**
 * Shows user feedback for WhatsApp actions
 */
function showWhatsAppFeedback(message: string, type: 'success' | 'warning' = 'success'): void {
  // Create a temporary notification
  const notification = document.createElement('div')
  notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-amber-500'
  }`
  notification.textContent = message

  document.body.appendChild(notification)

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

/**
 * Checks if WhatsApp tab is currently open
 */
export function isWhatsAppTabOpen(): boolean {
  return whatsappTab !== null && !whatsappTab.closed
}

/**
 * Generates a fee receipt message for WhatsApp sharing
 */
export function generateReceiptMessage(options: {
  studentName: string
  receiptUrl: string
  amount?: number
  paymentDate?: string
  paymentMethod?: string
  schoolName?: string
}): string {
  const {
    studentName,
    receiptUrl,
    amount,
    paymentDate,
    paymentMethod,
    schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'
  } = options

  let message = `Fee Receipt - ${studentName}\n\nDear Parent,\n\nYour fee payment receipt is ready. Please view and download:\n\n${receiptUrl}`

  if (amount || paymentDate || paymentMethod) {
    message += '\n\nPayment Details:'
    if (amount) message += `\nAmount: ₹${amount.toLocaleString()}`
    if (paymentDate) message += `\nDate: ${paymentDate}`
    if (paymentMethod) message += `\nMethod: ${paymentMethod.toUpperCase()}`
  }

  message += `\n\nThank you!\n${schoolName}`

  return message
}

/**
 * Generates a fee reminder message for WhatsApp sharing
 */
export function generateReminderMessage(options: {
  studentName: string
  className?: string
  classSection?: string
  pendingAmount: number
  lastPaymentAmount?: number
  lastPaymentDate?: string
  schoolName?: string
}): string {
  const {
    studentName,
    className,
    classSection,
    pendingAmount,
    lastPaymentAmount,
    lastPaymentDate,
    schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'
  } = options

  let message = `Dear Parent,\n\nThis is a gentle reminder that the fee payment for ${studentName}`

  if (className && classSection) {
    message += ` (Class: ${className} ${classSection})`
  }

  message += ` is pending.\n\nOutstanding Amount: ₹${pendingAmount.toLocaleString()}`

  if (lastPaymentAmount && lastPaymentDate) {
    message += `\nLast Payment: ₹${lastPaymentAmount.toLocaleString()} on ${lastPaymentDate}`
  } else {
    message += '\nNo previous payments found'
  }

  message += `\n\nPlease make the payment at your earliest convenience.\n\nThank you,\n${schoolName}`

  return message
}

/**
 * Generates a birthday message for WhatsApp sharing
 */
export function generateBirthdayMessage(options: {
  studentName: string
  age: number
  birthdayDate: string
  parentName: string
  schoolName?: string
}): string {
  const {
    studentName,
    age,
    birthdayDate,
    parentName,
    schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME || 'First Step School'
  } = options

  // Format the birthday date nicely
  const birthDate = new Date(birthdayDate)
  const formattedDate = birthDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })

  const message = `🎉🎂 HAPPY BIRTHDAY ${studentName.toUpperCase()}! 🎂🎉

Dear ${parentName},

Today is a very special day! 🌟

${studentName} is celebrating their ${age}${getOrdinalSuffix(age)} birthday today (${formattedDate})! 🎈

On behalf of everyone at ${schoolName}, we want to wish ${studentName} a wonderful birthday filled with joy, laughter, and lots of cake! 🍰

May this new year of life bring:
🌟 Amazing adventures
📚 Exciting learning experiences
🤗 Wonderful friendships
💫 Dreams coming true

We feel so blessed to have ${studentName} as part of our school family. Watching them grow and learn has been such a joy!

Have a fantastic celebration! 🎊

With warm birthday wishes,
${schoolName} Family 💝

#HappyBirthday #${schoolName.replace(/\s+/g, '')} #SpecialDay`

  return message
}

/**
 * Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

/**
 * Formats phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // If it's an Indian number (10 digits), format it nicely
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  
  // If it already has country code, format it
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    const number = cleaned.slice(3)
    return `+91 ${number.slice(0, 5)} ${number.slice(5)}`
  }
  
  // Return as-is for other formats
  return cleaned
}

/**
 * Validates if a phone number is valid for WhatsApp
 */
export function isValidWhatsAppNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '')
  
  // Must have at least 10 digits
  if (cleaned.length < 10) return false
  
  // Must not be all zeros or same digit
  if (/^0+$/.test(cleaned) || /^(\d)\1+$/.test(cleaned)) return false
  
  return true
}
