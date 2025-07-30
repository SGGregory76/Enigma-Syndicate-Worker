// index.js — Full Cloudflare Worker for Enigma Syndicate Card Generator

import { decode } from 'https://esm.sh/@firebase/util@1.10.4';
import { initializeApp, applicationDefault, cert } from 'https://esm.sh/firebase-admin/app';
import { getFirestore } from 'https://esm.sh/firebase-admin/firestore';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("prompt");
    const productId = url.searchParams.get("productId") || null;
    const customerId = url.searchParams.get("customerId") || null;

    if (!prompt) {
      return new Response(`
        <html><body>
          <h1>Card Generator</h1>
          <form method="GET">
            <label>Prompt: <input name="prompt" required /></label><br/>
            <label>Product ID: <input name="productId" /></label><br/>
            <label>Customer ID: <input name="customerId" /></label><br/>
            <button type="submit">Generate</button>
          </form>
        </body></html>
      `, { headers: { 'content-type': 'text/html' }});
    }

    // Decode and initialize Firebase
    const firebaseJson = JSON.parse(atob(env.YOUR_FIREBASE_JSON_BASE64));
    const app = initializeApp({ credential: cert(firebaseJson) });
    const db = getFirestore(app);

    // Call OpenAI API for image generation
    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "url"
      })
    });

    const aiData = await aiResponse.json();
    const imageUrl = aiData.data?.[0]?.url || "";

    const cardData = {
      prompt,
      imageUrl,
      productId,
      customerId,
      created: new Date().toISOString()
    };

    const docRef = await db.collection("cards").add(cardData);

    const html = `
      <html><body>
        <h1>🃏 Card Generated</h1>
        <img src="${imageUrl}" style="max-width: 300px; border: 5px solid black;" /><br/>
        <p><strong>ID:</strong> ${docRef.id}</p>
        <p><strong>Prompt:</strong> ${prompt}</p>
        <p><strong>Saved to Firestore and ready for Shopify linkage.</strong></p>
      </body></html>
    `;

    return new Response(html, { headers: { 'content-type': 'text/html' }});
  }
}
