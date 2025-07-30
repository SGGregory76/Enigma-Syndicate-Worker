// data.js — Enigma Syndicate Generator Form

export function renderForm() {
  return `
    <form id="card-generator-form" style="display:flex;flex-direction:column;gap:12px;padding:20px;max-width:500px;margin:auto">
      <h2 style="text-align:center">🧠 Enigma Syndicate Generator</h2>

      <label for="prompt">🎨 Prompt</label>
      <textarea id="prompt" name="prompt" required placeholder="Enter your character prompt here..." style="min-height:80px;padding:10px"></textarea>

      <label for="customer">👤 Customer Email</label>
      <input type="email" id="customer" name="customer" required placeholder="example@email.com" style="padding:10px" />

      <label for="product">🛒 Product Name</label>
      <input type="text" id="product" name="product" required placeholder="Card Tier, Item Name, etc." style="padding:10px" />

      <button type="submit" style="padding:12px;background:black;color:white;font-weight:bold;border:none;border-radius:6px;cursor:pointer">Generate Card</button>
    </form>

    <div id="card-preview" style="margin-top:40px;text-align:center"></div>

    <script>
      document.getElementById('card-generator-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const prompt = document.getElementById('prompt').value;
        const customer = document.getElementById('customer').value;
        const product = document.getElementById('product').value;

        const res = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, customer, product })
        });

        const html = await res.text();
        document.getElementById('card-preview').innerHTML = html;
      });
    </script>
  `;
}
