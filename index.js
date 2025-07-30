import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Decode your base64 Firebase config
const FIREBASE_JSON = JSON.parse(atob(YOUR_FIREBASE_JSON_BASE64));
initializeApp({ credential: cert(FIREBASE_JSON) });
const db = getFirestore();

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Only POST requests are allowed', { status: 405 });
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return new Response('Missing prompt', { status: 400 });
    }

    // Call OpenAI Image Generation
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size: '1024x1024',
        response_format: 'url'
      })
    });

    const openaiData = await openaiRes.json();
    const imageUrl = openaiData?.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save metadata to Firestore
    const docRef = await db.collection('cards').add({
      prompt,
      imageUrl,
      createdAt: new Date().toISOString()
    });

    // Return result
    return new Response(JSON.stringify({
      success: true,
      prompt,
      imageUrl,
      firestoreId: docRef.id
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

