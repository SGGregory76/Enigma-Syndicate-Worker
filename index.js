// index.js — Enigma Syndicate Generator Worker

import { OpenAI } from "openai";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { decode } from "base64-arraybuffer";

let firebaseApp; // cache instance

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { prompt, customer = "test-customer", product = "test-product" } = body;

        // OpenAI image generation
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
        });

        const imageUrl = response.data[0].url;

        // Firebase Admin
        if (!firebaseApp) {
          const firebaseJson = JSON.parse(
            new TextDecoder().decode(decode(env.YOUR_FIREBASE_JSON_BASE64))
          );
          firebaseApp = initializeApp({ credential: cert(firebaseJson) });
        }
        const db = getFirestore(firebaseApp);
        const doc = await db.collection("cards").add({
          prompt,
          imageUrl,
          customer,
          product,
          created: Date.now(),
        });

        // Return HTML response
        const html = `
          <!DOCTYPE html>
          <html><head><title>Card Created</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>🎴 Card Created</h1>
            <img src="${imageUrl}" style="max-width:100%;border-radius:12px;border:4px solid black"/>
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Customer:</strong> ${customer}</p>
            <p><strong>Product:</strong> ${product}</p>
            <p><em>Firestore ID: ${doc.id}</em></p>
          </body></html>
        `;
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }

    return new Response("Welcome to Enigma Syndicate Generator!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
