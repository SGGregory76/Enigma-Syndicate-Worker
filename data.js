export async function generateCard(promptText, firebaseApp) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // 1. Generate Image from OpenAI
  const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: promptText,
      n: 1,
      size: "1024x1024" // You can change to 512x512 or 1792x1024 if needed
    })
  });

  const openaiData = await openaiResponse.json();
  const imageUrl = openaiData.data?.[0]?.url;

  if (!imageUrl) throw new Error("Image generation failed.");

  // 2. Save to Firestore
  const db = getFirestore(firebaseApp);
  const cardRef = await addDoc(collection(db, "cards"), {
    prompt: promptText,
    imageUrl,
    createdAt: Timestamp.now()
  });

  return {
    id: cardRef.id,
    imageUrl
  };
}
