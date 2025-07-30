// index.js
import { generateCard } from './data.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      return new Response(`<!DOCTYPE html>
<html>
  <head><title>Enigma Syndicate Card Generator</title></head>
  <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
    <h1>🎴 Enigma Syndicate Generator</h1>
    <form method="POST">
      <input name="prompt" placeholder="Enter prompt..." style="width: 300px;" required>
      <br><br>
      <button type="submit">Generate</button>
    </form>
  </body>
</html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (request.method === 'POST') {
      const form = await request.formData();
      const prompt = form.get('prompt');
      if (!prompt) return new Response('Missing prompt', { status: 400 });

      try {
        const result = await generateCard(prompt, env);

        return new Response(`<!DOCTYPE html>
<html>
  <body style="text-align: center; font-family: sans-serif;">
    <h2>✅ Card Generated</h2>
    <img src="${result.imageUrl}" style="max-width: 400px; border: 2px solid #000;" />
    <p>Stored in Firestore under ID: <code>${result.id}</code></p>
  </body>
</html>`, {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
}
