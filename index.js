import { promptList } from './data.js';

export default {
  async fetch(request) {
    const prompt = promptList[0]; // Use your first prompt or dynamic one

    return new Response(`Using prompt: ${prompt}`, {
      headers: { "Content-Type": "text/plain" }
    });
  }
};
