import { Hono } from 'hono'

const app = new Hono()

app.get('/', async (c) => {
  const prompt = c.req.query('prompt') || 'Ultra high-resolution trading card of a mafia boss in Enigma Syndicate';

  const OPENAI_API_KEY = c.env.OPENAI_API_KEY;
  const apiURL = 'https://api.openai.com/v1/images/generations';

  const openaiResponse = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024'
    })
  });

  const data = await openaiResponse.json();
  const imageUrl = data?.data?.[0]?.url;

  if (!imageUrl) {
    return c.html(`
      <html>
        <body style="font-family: sans-serif; background: #111; color: white;">
          <h1>❌ No image returned</h1>
          <p>Check if your API key has access to DALL·E.</p>
          <pre style="white-space: pre-wrap; background: #222; padding: 1em; border-radius: 6px;">
${JSON.stringify(data, null, 2)}
          </pre>
        </body>
      </html>
    `)
  }

  return c.html(`
    <html>
      <body style="font-family: sans-serif; text-align: center; background: #000; color: #fff;">
        <h1>✅ Enigma Syndicate Card Generated</h1>
        <p><strong>Prompt:</strong> ${prompt}</p>
        <img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; border: 4px solid #0ff; border-radius: 12px;" />
      </body>
    </html>
  `)
})

export default app

