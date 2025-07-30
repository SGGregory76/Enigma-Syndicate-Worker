import { OpenAI } from "openai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { decode } from "base64-arraybuffer";

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { prompt, customer, product } = body;

        if (!env.OPENAI_API_KEY || !env.YOUR_FIREBASE_JSON_BASE64) {
          return new Response("Missing environment variables.", { status: 500 });
        }

        // 🔑 OpenAI Image Generation
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const aiResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024"
        });

        const imageUrl = aiResponse.data?.[0]?.url;
        if (!imageUrl) {
          return new Response("Image generation failed.", { status: 500 });
        }

        // 🔐 Decode Firebase credentials from base64
        const firebaseJson = JSON.parse(
          new TextDecoder().decode(decode(env.YOUR_FIREBASE_JSON_BASE64))
        );

        const firebaseApp = initializeApp({ credential: cert(firebaseJson) });
        const db = getFirestore(firebaseApp);

        // 🗂 Save card metadata to Firestore
        const cardRef = await db.collection("cards").add({
          prompt,
          imageUrl,
          customer,
          product,
          created: Date.now()
        });

        // 🖼️ Return HTML card preview
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Card Created</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 40px; background: #111; color: #fff; }
                img { max-width: 100%; border-radius: 12px; border: 4px solid #fff; margin-bottom: 20px; }
                p { margin: 0.5em 0; }
              </style>
            </head>
            <body>
              <h1>🎴 Card Created</h1>
              <img src="${imageUrl}" alt="Generated card" />
              <p><strong>Prompt:</strong> ${prompt}</p>
              <p><strong>Customer:</strong> ${customer}</p>
              <p><strong>Product:</strong> ${product}</p>
              <p><em>Firestore ID: ${cardRef.id}</em></p>
            </body>
          </html>
        `;

        return new Response(html, { headers: { "Content-Type": "text/html" } });

      } catch (err) {
        return new Response(`❌ Error: ${err.message}`, { status: 500 });
      }
    }

    return new Response("Welcome to Enigma Syndicate Generator!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};

