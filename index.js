// index.js - Full OpenAI + Firestore Integration

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { generateCard } from './data';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCiFF0giW60YhEF9MPF8RMMETXkNW9vv2Y",
  authDomain: "sandbox-mafia.firebaseapp.com",
  projectId: "sandbox-mafia",
  storageBucket: "sandbox-mafia.appspot.com",
  messagingSenderId: "966783573980",
  appId: "1:966783573980:web:a07a7b66d7d9a057dab919"
};

const firebaseApp = initializeApp(firebaseConfig);

// HTML Template
const htmlForm = `
<!DOCTYPE html>
<html>
<head>
  <title>Enigma Syndicate Generator</title>
</head>
<body>
  <h1>Generate Your Syndicate Card</h1>
  <form method="POST">
    <textarea name="prompt" rows="4" cols="50" placeholder="Enter your image prompt..."></textarea><br>
    <button type="submit">Generate</button>
  </form>
</body>
</html>
`;

// Worker Export
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'GET') {
      return new Response(htmlForm, { headers: { 'Content-Type': 'text/html' } });
    }

    if (request.method === 'POST') {
      const formData = await request.formData();
      const prompt = formData.get('prompt');

      try {
        const result = await generateCard(prompt, firebaseApp);

        const html = `
          <!DOCTYPE html>
          <html>
          <body>
            <h2>Card Generated</h2>
            <img src="${result.imageUrl}" width="512" /><br>
            <p><strong>ID:</strong> ${result.id}</p>
          </body>
          </html>
        `;

        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
      } catch (e) {
        return new Response(`Error: ${e.message}`);
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
};
