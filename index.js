export default {
  async fetch(request, env, ctx) {
    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");

    if (!prompt) {
      return new Response(`
        <html><body>
          <h1>Welcome to Enigma Syndicate</h1>
          <p>No prompt provided. Add <code>?prompt=Your+Card+Prompt</code> to the URL.</p>
        </body></html>`, {
        headers: { "Content-Type": "text/html" }
      });
    }

    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          size: "1024x1024",
          response_format: "url"
        })
      });

      const data = await openaiResponse.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        return new Response(`<html><body><h1>❌ Failed to generate image.</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`, {
          headers: { "Content-Type": "text/html" }
        });
      }

      return new Response(`
        <html><body>
          <h1>✅ Generated Card</h1>
          <img src="${imageUrl}" style="width:100%;max-width:512px;" />
          <p>Prompt: <code>${prompt}</code></p>
        </body></html>`, {
        headers: { "Content-Type": "text/html" }
      });

    } catch (err) {
      return new Response(`<html><body><h1>🔥 Error generating image</h1><pre>${err.stack}</pre></body></html>`, {
        headers: { "Content-Type": "text/html" }
      });
    }
  }
};
