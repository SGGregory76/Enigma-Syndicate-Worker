import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const FIREBASE_JSON = JSON.parse(atob(YOUR_FIREBASE_JSON_BASE64));
initializeApp({ credential: cert(FIREBASE_JSON) });

const db = getFirestore();

export default {
  async fetch(req, env, ctx) {
    if (req.method !== 'POST') return new Response('Only POST allowed');

    const { prompt } = await req.json();

    // 1. Generate image from OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size: '1024x1024',
        response_format: 'url',
      }),
    });

    const { data } = await openaiRes.json();
    const imageUrl = data?.[0]?.url;

    if (!imageUrl) return new Response('Failed to generate image', { status: 500 });

    // 2. Write metadata to Firestore
    const doc = await db.collection('cards').add({
      prompt,
      imageUrl,
      createdAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      imageUrl,
      prompt,
      firestoreId: doc.id
    });
  }
};
