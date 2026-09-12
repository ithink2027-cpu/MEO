import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://icqkolpqyexqfmsdonqb.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcWtvbHBxeWV4cWZtc2RvbnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjE3ODksImV4cCI6MjEwNDc5Nzc4OX0.QQPUcCPYe4snPaof1pPjnqqiTbJLssD4N7LpazaA4HY'
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

export const supabase = createClient(normalizeSupabaseUrl(SUPABASE_URL), SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export async function uploadProjectImage(file) {
  if (!file) {
    return ''
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'application/octet-stream',
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName)

  return data?.publicUrl || ''
}
