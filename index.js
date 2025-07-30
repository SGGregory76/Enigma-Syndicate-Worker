import { OpenAI } from "openai";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { decode } from "base64-arraybuffer";

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { prompt, customer, product } = body;

        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024"
        });

        const imageUrl = response.data[0].url;

        const firebaseJson = JSON.parse(
          new TextDecoder().decode(decode(env.YOUR_FIREBASE_JSON_BASE64))
        );
        const app = initializeApp({ credential: cert(firebaseJson) });
        const db = getFirestore(app);

        const cardRef = await db.collection("cards").add({
          prompt,
          imageUrl,
          customer,
          product,
          created: Date.now()
        });

        const html = `
          <html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>🎴 Card Generated!</h2>
          <img src="${imageUrl}" style="max-width:90%;border:4px solid #000;border-radius:10px"/>
          <p><strong>Prompt:</strong> ${prompt}</p>
          <p><em>Firestore ID: ${cardRef.id}</em></p>
          </body></html>
        `;
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      } catch (err) {
        return new Response(`❌ Error generating card: ${err}`, {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        });
      }
    }

    return new Response("Welcome to Enigma Syndicate", {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
