// data.js

export async function createOpenAIImage(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    })
  })
  const data = await res.json()
  return data.data[0].url
}

export async function saveToFirestore(cardData) {
  const res = await fetch("https://firestore.googleapis.com/v1/projects/sandbox-mafia/databases/(default)/documents/cards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: mapToFirestoreFields(cardData) })
  })
  const json = await res.json()
  return json.name.split("/").pop()
}

function mapToFirestoreFields(data) {
  const fields = {}
  for (const key in data) {
    fields[key] = { stringValue: data[key] }
  }
  return fields
}

export async function uploadToShopify({ imageUrl, prompt }) {
  const shopifyDomain = "enigmasyndicate.myshopify.com"
  const shopifyToken = SHOPIFY_ADMIN_TOKEN

  const productData = {
    product: {
      title: prompt.slice(0, 30),
      body_html: `<img src='${imageUrl}' style='max-width:100%;' />`,
      images: [{ src: imageUrl }]
    }
  }

  const res = await fetch(`https://${shopifyDomain}/admin/api/2024-04/products.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyToken
    },
    body: JSON.stringify(productData)
  })

  const data = await res.json()
  return `https://${shopifyDomain}/products/${data.product.handle}`
}

// You need to provide OPENAI_API_KEY and SHOPIFY_ADMIN_TOKEN as environment variables or bindings
