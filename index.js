import { OpenAI } from "openai";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { decode } from "base64-arraybuffer";

let app, db;

export default {
  async fetch(request, env, ctx) {
    if (!app) {
      const firebaseJson = JSON.parse(
        new TextDecoder().decode(decode(env.YOUR_FIREBASE_JSON_BASE64))
      );
      app = initializeApp({ credential: cert(firebaseJson) });
      db = getFirestore(app);
    }

    if (request.method === "POST") {
      const formData = await request.formData();
      const prompt = formData.get("prompt");
      const customer = formData.get("customer") || "test_customer";
      const product = formData.get("product") || "test_product";

      try {
        const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024"
        });

        const imageUrl = response.data[0].url;

        const cardRef = await db.collection("cards").add({
          prompt,
          imageUrl,
          customer,
          product,
          created: Date.now()
        });

        const html = `
          <!DOCTYPE html>
          <html><head><title>Card Created</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>🎴 Card Created</h1>
            <img src="${imageUrl}" style="max-width:100%;border-radius:12px;border:4px solid black"/>
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Customer:</strong> ${customer}</p>
            <p><strong>Product:</strong> ${product}</p>
            <p><em>Firestore ID: ${cardRef.id}</em></p>
          </body></html>
        `;
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      } catch (err) {
        return new Response("❌ Failed to generate image: " + err.message, { status: 500 });
      }
    }

    // Default GET request: show a test form
    return new Response(`
      <!DOCTYPE html>
      <html><head><title>Enigma Generator</title></head>
      <body style="font-family:sans-serif;padding:40px;">
        <h1>🎴 Enigma Syndicate Card Generator</h1>
        <form method="POST">
          <select name="prompt" style="padding:8px;">
            <option value="A cyberpunk dog wearing sunglasses">Cyberpunk Dog</option>
            <option value="Mafia cheese boss in a speakeasy">Mafia Boss</option>
          </select>
          <input type="hidden" name="customer" value="test_customer"/>
          <input type="hidden" name="product" value="test_product"/>
          <button type="submit" style="padding:10px 20px;">Generate Card</button>
        </form>
      </body></html>
    `, { headers: { "Content-Type": "text/html" } });
  }
};
