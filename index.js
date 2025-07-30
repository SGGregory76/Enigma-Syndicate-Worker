// index.js — Enigma Syndicate Generator Worker

import { OpenAI } from "openai";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { decode } from "base64-arraybuffer";

const DROPDOWN_PROMPTS = {
  "arsonist": "Character with matches in hand and can of gas in the other. Background burning houses.",
  "assassin": "Sleek futuristic hitman standing on neon rooftop, city glowing behind.",
  "hacker": "Masked figure surrounded by holographic code in dark room with monitors."
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "POST") {
      const body = await request.json();
      const { choice, product, test = false } = body;
      const prompt = DROPDOWN_PROMPTS[choice] || "Default mysterious figure in the shadows.";

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

      const cardData = {
        prompt,
        imageUrl,
        product,
        created: Date.now(),
        test
      };

      const cardRef = await db.collection("cards").add(cardData);

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Card Created</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:40px">
            <h1>🎴 Card Created</h1>
            <img src="${imageUrl}" style="max-width:100%;border-radius:12px;border:4px solid black"/>
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Product:</strong> ${product}</p>
            <p><em>Firestore ID: ${cardRef.id}</em></p>
          </body>
        </html>
      `;

      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    const form = `
      <!DOCTYPE html>
      <html>
        <head><title>Enigma Syndicate Generator</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h1>🎨 Enigma Syndicate Generator</h1>
          <form method="POST" id="genForm">
            <label>Select Card Type:</label><br/>
            <select name="choice">
              <option value="arsonist">🔥 Arsonist</option>
              <option value="assassin">🗡️ Assassin</option>
              <option value="hacker">💻 Hacker</option>
            </select><br/><br/>
            <input type="hidden" name="product" value="test-product" />
            <input type="hidden" name="test" value="true" />
            <button type="submit">Generate Card</button>
          </form>
          <script>
            document.getElementById('genForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              const res = await fetch('', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              const html = await res.text();
              document.body.innerHTML = html;
            });
          </script>
        </body>
      </html>
    `;

    return new Response(form, { headers: { "Content-Type": "text/html" } });
  },
};

