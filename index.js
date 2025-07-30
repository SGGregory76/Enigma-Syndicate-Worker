// index.js — Enigma Syndicate Generator Worker

import { OpenAI } from "openai";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { decode } from "base64-arraybuffer";

let firebaseApp = null;

export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Enigma Syndicate Generator</title>
          </head>
          <body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>Enigma Syndicate Generator</h1>
            <form method="POST">
              <label for="prompt">Choose a prompt:</label><br/>
              <select name="prompt" id="prompt">
                <option value="A cyberpunk dog wearing sunglasses in the rain">Cyberpunk Dog</option>
                <option value="A mafia boss made of cheese in a speakeasy">Mafia Cheese Boss</option>
                <option value="A character with matches on hand and a gas can — burning buildings behind">Arsonist</option>
              </select><br/><br/>
              <input type="hidden" name="customer" value="demo_customer_id" />
              <input type="hidden" name="product" value="demo_product_id" />
              <button type="submit">Generate Card</button>
            </form>
          </body>
        </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    if (request.method === "POST") {
      let formData;
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        formData = await request.json();
      } else {
        const body = await request.text();
        formData = Object.fromEntries(new URLSearchParams(body));
      }

      const { prompt, customer, product } = formData;

      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024"
      });

      const imageUrl = response.data[0].url;

      if (!firebaseApp) {
        const firebaseJson = JSON.parse(
          new TextDecoder().decode(decode(env.YOUR_FIREBASE_JSON_BASE64))
        );
        firebaseApp = initializeApp({ credential: cert(firebaseJson) });
      }

      const db = getFirestore(firebaseApp);

      const cardRef = await db.collection("cards").add({
        prompt,
        imageUrl,
        customer,
        product,
        created: Date.now()
      });

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Card Created</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>🎴 Card Created</h1>
            <img src="${imageUrl}" style="max-width:100%;border-radius:12px;border:4px solid black"/>
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Customer:</strong> ${customer}</p>
            <p><strong>Product:</strong> ${product}</p>
            <p><em>Firestore ID: ${cardRef.id}</em></p>
          </body>
        </html>
      `;

      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
