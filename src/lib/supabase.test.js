import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeSupabaseUrl, getSupabaseBucketUrl } from './supabase.js'

test('normalizeSupabaseUrl strips the REST suffix from the provided endpoint', () => {
  const url = normalizeSupabaseUrl('https://icqkolpqyexqfmsdonqb.supabase.co/rest/v1/')
  assert.equal(url, 'https://icqkolpqyexqfmsdonqb.supabase.co')
})

test('getSupabaseBucketUrl builds the public storage URL for the configured bucket', () => {
  const url = getSupabaseBucketUrl('image-storage')
  assert.equal(url, 'https://icqkolpqyexqfmsdonqb.supabase.co/storage/v1/object/public/image-storage')
})
