import { createRemoteJWKSet, jwtVerify } from 'jose'

const BUCKET = 'image-storage'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function isAdmin(request, env) {
  const m = (request.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i)
  if (!m) return false
  try {
    const { payload } = await jwtVerify(m[1].trim(), jwks, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    })
    return Boolean(env.ADMIN_UID) && payload.sub === env.ADMIN_UID
  } catch {
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
    const key =
  }
}

async function handleUpload(request, env) {
  if (request.me
    const res = await fetch(
     ify } from 'jose'

const BUCKET = 'image-storage'
const MAX_SIZE = 5 * 1024 * 
      {
        method: 'POST',
        headers: {
          Authorization:storage'
const MAX_SIZE = 5 * 1024 * 1024
c
          'Content-Type': file.type,
        },
        body: file,
      }
    )

    if (!res.ok) return json({ error: 'Upload failed' }, 500)

    return json({
      url:

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_acco
    })
  } catch {
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
