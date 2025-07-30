// index.js
import { Router } from 'itty-router'
import { OpenAI } from 'openai'
import admin from 'firebase-admin'

// Decode and init Firebase
const decoded = atob(YOUR_FIREBASE_JSON_BASE64)
const serviceAccount = JSON.parse(decoded)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "sandbox-mafia.appspot.com"
  })
}
const db = admin.firestore()

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
const router = Router()

router.get("/", async ({ query }) => {
  const { prompt, productId, customerId } = query
  if (!prompt) return new Response("Missing prompt", { status: 400 })

  // 1. Generate Image
  const image = await openai.images.generate({ prompt, n: 1, size: "1024x1024" })
  const imageUrl = image.data[0].url

  // 2. Upload to Shopify Files
  const fileRes = await fetch("https://enigmasyndicate.myshopify.com/admin/api/2024-01/files.json", {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ file: { alt: prompt, attachment: imageUrl } })
  })
  const fileData = await fileRes.json()
  const shopifyFileUrl = fileData.file?.url

  // 3. Attach Metafields
  const metafield = {
    namespace: "enigma",
    key: "card_image",
    value: shopifyFileUrl,
    type: "url"
  }
  if (productId) {
    await fetch(`https://enigmasyndicate.myshopify.com/admin/api/2024-01/products/${productId}/metafields.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ metafield })
    })
  }
  if (customerId) {
    await fetch(`https://enigmasyndicate.myshopify.com/admin/api/2024-01/customers/${customerId}/metafields.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ metafield })
    })
  }

  // 4. Save to Firestore
  const doc = await db.collection("cards").add({
    prompt,
    productId,
    customerId,
    imageUrl: shopifyFileUrl,
    createdAt: new Date().toISOString()
  })

  // 5. Return HTML preview
  const html = `
    <html><body>
      <h1>Card Preview</h1>
      <img src="${shopifyFileUrl}" width="300" />
      <p>Prompt: ${prompt}</p>
      <p>Firestore ID: ${doc.id}</p>
    </body></html>
  `

  return new Response(html, { headers: { "Content-Type": "text/html" } })
})

router.all("*", () => new Response("Not Found", { status: 404 }))

export default {
  fetch: router.handle
}
