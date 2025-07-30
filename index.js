import { getCardData } from './data.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/data') {
      const json = await getCardData(env);
      return new Response(JSON.stringify(json, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Welcome to Enigma Syndicate!", {
      headers: { "Content-Type": "text/plain" }
    });
  }
}
