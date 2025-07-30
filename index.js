import { Router } from 'itty-router'
import { createOpenAIImage, saveToFirestore, uploadToShopify } from './data.js'

const router = Router()

router.get('/', () => {
  return new Response(`
    <html>
      <head><title>Enigma Syndicate Generator</title></head>
      <body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
        <h1>🎴 Enigma Syndicate Card Generator</h1>
        <form method="POST" action="/generate">
          <label>Enter Prompt:</label><br/>
          <textarea name="prompt" style="width:100%;height:120px;"></textarea><br/><br/>
          <button type="submit" style="padding:10px 20px;">Generate Card</button>
        </form>
      </body>
    </html>`, { headers: { 'Content-Type': 'text/html' } })
})

router.post('/generate', async (request) => {
  const form = await request.formData()
  const prompt = form.get('prompt')

  if (!prompt) {
    return new Response('No prompt submitted', { status: 400 })
  }

  // Step 1: Call OpenAI and get image
  const imageUrl = await createOpenAIImage(prompt)

  // Step 2: Store to Firestore
  const docId = await saveToFirestore({ prompt, imageUrl })

  // Step 3: Upload image to Shopify metafield
  const shopifyUrl = await uploadToShopify({ imageUrl, prompt })

  // Step 4: Show result page
  return new Response(`
    <html>
      <head><title>Card Created</title></head>
      <body style="font-family:sans-serif;padding:40px;background:#111;color:#fff;">
        <h2>✅ Card Created</h2>
        <p><strong>Prompt:</strong> ${prompt}</p>
        <img src="${imageUrl}" style="max-width:100%;border:4px solid #444"/><br/>
        <p>📁 <strong>Firestore ID:</strong> ${docId}</p>
        <p>🛒 <strong>Shopify URL:</strong> <a href="${shopifyUrl}" target="_blank">${shopifyUrl}</a></p>
        <p><a href="/">Generate Another</a></p>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
})

export default {
  fetch: router.handle
}
