import { createRemoteJWKSet, jwtVerify } from 'jose'

const SUPABASE_URL = 'https://icqkolpqyexqfmsdonqb.supabase.co'
const SUPABASE_BUCKET = 'image-storage'
const FIREBASE_ISSUER = 'https://securetoken.google.com/marwan-engineering-office'
const FIREBASE_AUDIENCE = 'marwan-engineering-office'

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || ''
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : ''
}

async function verifyFirebaseToken(token) {
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: FIREBASE_ISSUER,
      audience: FIREBASE_AUDIENCE,
    })

    if (!payload || !payload.uid) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}

async function handleUploadImage(request, env) {
  try {
    const token = getBearerToken(request)
    const verifiedPayload = await verifyFirebaseToken(token)

    if (!verifiedPayload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || !file.name) {
      return new Response(JSON.stringify({ error: 'Missing image file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: 'Supabase service key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const objectKey = `${timestamp}-${Math.random().toString(36).slice(2)}-${safeName}`

    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURIComponent(objectKey)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      return new Response(JSON.stringify({ error: 'Supabase upload failed', details: errorText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${encodeURIComponent(objectKey)}`

    return new Response(JSON.stringify({ url: publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/upload-image')) {
      return handleUploadImage(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}
