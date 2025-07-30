// index.js
import { OpenAI } from "openai-edge";
import { createClient } from "@supabase/supabase-js";
import { decode } from "@firebase/util";

export default {
  async fetch(request, env, ctx) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");
    const customerId = searchParams.get("customerId") || "anonymous";
    const productId = searchParams.get("productId") || "none";

    if (!prompt) {
      return new Response("Missing prompt", { status: 400 });
    }

    // Decode and init Firebase Admin
    const adminJson = JSON.parse(atob(env.YOUR_FIREBASE_JSON_BASE64));
    const projectId = adminJson.project_id;

    // Generate Image from OpenAI
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const imageResp = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "url",
    });

    const imageUrl = imageResp.data[0]?.url;

    if (!imageUrl) {
      return new Response("Failed to generate image", { status: 500 });
    }

    // Save metadata to Firestore
    const id = crypto.randomUUID();
    const now = Date.now();

    const write = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/cards/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${env.GOOGLE_OAUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            prompt: { stringValue: prompt },
            imageUrl: { stringValue: imageUrl },
            createdAt: { integerValue: now },
            customerId: { stringValue: customerId },
            productId: { stringValue: productId },
          },
        }),
      }
    );

    // Return preview
    const html = `
      <html><head><title>Card Preview</title></head><body>
        <h1>Generated Card</h1>
        <img src="${imageUrl}" style="max-width: 100%; height: auto;" />
        <p><strong>Prompt:</strong> ${prompt}</p>
        <p><strong>Saved to Firestore ID:</strong> ${id}</p>
      </body></html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
