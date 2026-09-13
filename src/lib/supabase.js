import { auth } from '../firebase'

export const SUPABASE_URL = 'https://icqkolpqyexqfmsdonqb.supabase.co'
export const SUPABASE_BUCKET = 'image-storage'

export function normalizeSupabaseUrl(rawUrl = '') {
  const sanitized = rawUrl.trim().replace(/\/+$/, '')

  if (!sanitized) {
    return SUPABASE_URL
  }

  return sanitized.replace(/\/rest\/v1$/, '')
}

export function getSupabaseBucketUrl(bucketName = SUPABASE_BUCKET) {
  return `${normalizeSupabaseUrl(SUPABASE_URL)}/storage/v1/object/public/${bucketName}`
}

export async function uploadProjectImage(file) {
  if (!file) {
    return ''
  }

  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('User is not authenticated')
  }

  const idToken = await currentUser.getIdToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(errorData.error || 'Upload failed')
  }

  const data = await response.json()
  return data.url || ''
}
