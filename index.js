// index.js

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from 'hono/adapter'
import { decode } from 'js-base64'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const app = new Hono()
app.use('*', cors())

let firebaseApp, db

app.post('/generate', async (c) => {
  const { OPENAI_API_KEY, YOUR_FIREBASE_JSON_BASE64 } = env(c)
  const body = await c.req.json()
  const prompt = body.prompt || ''

  if (!prompt || !OPENAI_API_KEY || !YOUR_FIREBASE_JSON_BASE64) {
    return c.json({ error: 'Missing prompt or API keys' }, 400)
  }

  // Init Firebase if needed
  if (!firebaseApp) {
    const firebaseConfig = JSON.parse(decode(YOUR_FIREBASE_JSON_BASE64))
    firebaseApp = initializeApp({ credential: cert(firebaseConfig) })
    db = getFirestore()
  }

  // Generate image using OpenAI
  const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'hd',
      response_format: 'url'
    })
  })

  const openaiData = await openaiRes.json()
  const imageUrl = openaiData?.data?.[0]?.url

  if (!imageUrl) return c.json({ error: 'Image generation failed' }, 500)

  const ref = await db.collection('cards').add({
    prompt,
    imageUrl,
    created: Date.now()
  })

  return c.json({ imageUrl, id: ref.id })
})

app.get('/', (c) =>
  c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>Enigma Syndicate Generator</title></head>
    <body>
      <h1>🃏 Enigma Syndicate Card Generator</h1>
      <form id="genForm">
        <input name="prompt" placeholder="Enter card prompt" required />
        <button type="submit">Generate</button>
      </form>
      <div id="preview"></div>
      <script>
        const form = document.getElementById('genForm')
        const preview = document.getElementById('preview')
        form.onsubmit = async (e) => {
          e.preventDefault()
          const prompt = form.prompt.value
          preview.innerHTML = 'Generating...'
          const res = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          })
          const data = await res.json()
          if (data.imageUrl) {
            preview.innerHTML = `<p>Card ID: ${data.id}</p><img src="${data.imageUrl}" style="max-width:100%" />`
          } else {
            preview.innerHTML = '<p>Failed to generate image.</p>'
          }
        }
      </script>
    </body>
    </html>
  `)
)

export default app

