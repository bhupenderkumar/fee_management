/**
 * Test utility to verify image URL conversion and loading
 */

export function testImageUrlConversion() {
  console.log('Testing Image URL Conversion...')
  
  // Test cases with sample Supabase URLs
  const testUrls = [
    'https://ytfzqzjuhcdgcvvqihda.supabase.co/storage/v1/object/sign/File/id-cards/40b429e8-34e4-4f70-9d1b-0ffa39f0d13b/student/student_1745233741836.jpeg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJGaWxlL2lkLWNhcmRzLzQwYjQyOWU4LTM0ZTQtNGY3MC05ZDFiLTBmZmEzOWYwZDEzYi9zdHVkZW50L3N0dWRlbnRfMTc0NTIzMzc0MTgzNi5qcGVnIiwiaWF0IjoxNzQ1MjMzNzQxLCJleHAiOjE3NDU4Mzg1NDF9.TPNO_m4J4kRy2BMCnr-iw8S2KJBU_BiFBtVWEm30bnY',
    'https://ytfzqzjuhcdgcvvqihda.supabase.co/storage/v1/object/File/id-cards/test/photo.jpg',
    null,
    undefined,
    'https://example.com/regular-image.jpg'
  ]
  
  testUrls.forEach((url, index) => {
    console.log(`Test ${index + 1}:`)
    console.log(`  Input URL: ${url}`)
    
    const convertedUrl = convertToPublicUrl(url)
    console.log(`  Converted URL: ${convertedUrl}`)
    console.log(`  Status: ${convertedUrl !== url ? '✅ CONVERTED' : '⚪ NO CHANGE'}`)
    console.log('---')
  })
  
  console.log('URL conversion test completed!')
}

// Utility function to convert signed URLs to public URLs (same as in API)
function convertToPublicUrl(signedUrl: string | null | undefined): string | null {
  if (!signedUrl || !signedUrl.includes('supabase.co')) {
    return signedUrl || null
  }
  
  try {
    // Extract the file path from signed URL
    const urlParts = signedUrl.split('/storage/v1/object/')
    if (urlParts.length > 1) {
      const pathPart = urlParts[1].split('?')[0] // Remove query params
      const filePath = pathPart.replace('sign/', '') // Remove 'sign/' prefix if present
      
      // Generate public URL format
      const baseUrl = signedUrl.split('/storage/v1/object/')[0]
      const publicUrl = `${baseUrl}/storage/v1/object/public/File/${filePath}`
      
      return publicUrl
    }
  } catch (error) {
    console.error('Error converting to public URL:', error)
  }
  
  return signedUrl
}

// Test image loading function
export async function testImageLoading(imageUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      console.log(`✅ Image loaded successfully: ${imageUrl}`)
      resolve(true)
    }
    img.onerror = () => {
      console.log(`❌ Image failed to load: ${imageUrl}`)
      resolve(false)
    }
    img.src = imageUrl
  })
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to global scope for manual testing
  ;(window as unknown as Window & {
    testImageUrlConversion: typeof testImageUrlConversion;
    testImageLoading: typeof testImageLoading;
  }).testImageUrlConversion = testImageUrlConversion
  ;(window as unknown as Window & {
    testImageUrlConversion: typeof testImageUrlConversion;
    testImageLoading: typeof testImageLoading;
  }).testImageLoading = testImageLoading
}
