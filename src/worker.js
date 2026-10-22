import { createRemoteJWKSet, jwtVerify } from 'jose'

const BUCKET = 'image-storage'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function isAdmin(request, env) {
  const m = (request.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i)
  if (!m) return false
  try {
    const result = await jwtVerify(m[1].trim(), jwks, {
      issuer: 'https://securetoken.google.com/' + env.FIREBASE_PROJECT_ID,
      audience: env.FIREBASE_PROJECT_ID,
    })
    const admins = (env.ADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean)
    return admins.includes(result.payload.sub)
  } catch (e) {
    return false
  }
}

async function handleUpload(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!(await isAdmin(request, env))) return json({ error: 'Unauthorized' }, 401)

  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File) || !file.name) return json({ error: 'Missing image file' }, 400)
    if (!ALLOWED.includes(file.type)) return json({ error: 'Unsupported file type' }, 400)
    if (file.size > MAX_SIZE) return json({ error: 'File too large (max 5MB)' }, 413)
    if (!env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Storage not configured' }, 500)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const key = Date.now() + '-' + Math.random().toString(36).slice(2) + '-' + safeName
    const encoded = encodeURIComponent(key)

    const res = await fetch(
      env.SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + encoded,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': file.type,
        },
        body: file,
      }
    )

    if (!res.ok) return json({ error: 'Upload failed' }, 500)

    return json({
      url: env.SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + encoded,
    })
  } catch (e) {
    return json({ error: 'Internal server error' }, 500)
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/upload-image')) return handleUpload(request, env)
    return env.ASSETS.fetch(request)
  },
}
