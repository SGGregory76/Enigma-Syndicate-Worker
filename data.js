export const defaultPrompt = `Ultra high-resolution GTA-style trading card featuring a hyper-realistic comic caricature of a Boss from the faction 'Enigma Syndicate'. Character is holding a Revolver and posed confidently. Background behind the card is a club interior with RGB neon lighting. Inside the card frame is a focused graffiti-lit urban scene. The card uses a carbon fiber full-frame border and features a 4x4 GTA-style stat grid with 8 labels: Stamina, Shooting, Strength, Stealth, Flying, Driving, Lung, Special. Leave bars empty for digital input. Resolution: 825x1125 px, 300 DPI. PNG, no transparency.`;

export const firestoreCollection = "cards";
export const firestoreFieldMap = {
  name: "name",
  prompt: "prompt",
  imageUrl: "imageUrl",
  timestamp: "createdAt"
};

export const shopifyUploadFolder = "enigma_cards"; // example use

export const htmlPreview = (cardUrl, name) => `
  <div style="text-align:center;padding:20px;">
    <h2>${name}</h2>
    <img src="${cardUrl}" alt="Generated Card" style="max-width:100%;border-radius:12px;box-shadow:0 0 15px rgba(0,0,0,0.6)">
  </div>
`;
