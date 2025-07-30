// data.js

import { GoogleAuth } from "@google-auth-library/cloudflare";

export async function generateCard(prompt, env) {
  const openAiKey = env.OPENAI_API_KEY;
  const firebaseKeyBase64 = env.YOUR_FIREBASE_JSON_BASE64;
  const firebaseKey = JSON.parse(atob(firebaseKeyBase64));

  // Generate image with OpenAI
  const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    }),
  });

  const imageData = await imageResponse.json();
  const imageUrl = imageData.data?.[0]?.url;
  if (!imageUrl) throw new Error("No image returned from OpenAI");

  // Generate unique ID for Firestore
  const uid = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Upload metadata to Firestore
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: await generateJWT(firebaseKey),
    }),
  });
  const token = await tokenResponse.json();

  await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseKey.project_id}/databases/(default)/documents/cards?documentId=${uid}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        prompt: { stringValue: prompt },
        imageUrl: { stringValue: imageUrl },
        created: { timestampValue: timestamp },
        source: { stringValue: "cloudflare" }
      },
    }),
  });

  return { imageUrl, uid };
}

async function generateJWT(key) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: key.client_email,
    sub: key.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/datastore",
  };

  const base64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const toSign = `${base64url(header)}.${base64url(payload)}`;

  const keydata = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(atob(key.private_key.replace(/-----\w+ PRIVATE KEY-----/g, ""))),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keydata,
    new TextEncoder().encode(toSign)
  );

  return `${toSign}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

