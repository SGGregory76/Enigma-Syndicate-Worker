// data.js — Card Generator Configuration

export const config = {
  projectName: "Enigma Syndicate",
  description: "Ultra High-Res GTA-style card generator",
  statLabels: [
    "Stamina", "Shooting", "Strength", "Stealth",
    "Flying", "Driving", "Lung", "Special"
  ],
  image: {
    size: { width: 825, height: 1125 },
    dpi: 300,
    format: "png",
    background: "club interior with RGB neon lighting",
    style: "hyper-realistic comic caricature",
    frame: "carbon fiber full-frame border",
    insideFrame: "graffiti-lit urban scene",
    safetyMargin: 50,
    mascot: {
      faction: "Enigma Syndicate",
      pose: "Boss holding revolver, confident"
    }
  },
  firebase: {
    collection: "cards"
  },
  shopify: {
    uploadToFiles: true,
    linkToProduct: true,
    linkToCustomer: true,
    metafieldNamespace: "custom_cards",
    metafieldKey: "generated_image_url"
  }
};
