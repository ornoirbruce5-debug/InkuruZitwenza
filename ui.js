document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chatLog");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const toneSelect = document.getElementById("toneSelect");
  const profileNameInput = document.getElementById("profileName");
  const saveProfileBtn = document.getElementById("saveProfile");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const dailyContent = document.getElementById("dailyContent");
  const darkToggle = document.getElementById("darkToggle");
  const stockTable = document.getElementById("stockTable");

  // Restore theme preference
  const savedTheme = localStorage.getItem("lp_theme");
  if (savedTheme) {
    document.body.classList.toggle("light", savedTheme === "light");
    document.body.classList.toggle("dark", savedTheme !== "light");
  }

  // Session bump + lastSeen check
  LPBot.bumpSession();
  LPBot.setLastSeen();

  // Init tone
  toneSelect.value = LPBot.getTone();

  // Daily joke/tip render
  function renderDaily() {
    const resp = LPBot.replyFor("amakuru");
    dailyContent.textContent = resp.replace(/^💙 |^🛒 |^💼 /, "");
  }
  renderDaily();

  // Missed you message auto-insert
  appendAssistant(LPBot.replyFor("mwaramutse"));

  // Stock grid render
  renderStock();

  // Events
  sendBtn.addEventListener("click", handleSend);
  chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

  toneSelect.addEventListener("change", () => {
    LPBot.setTone(toneSelect.value);
    appendAssistant(`Imvugiro yahinduwe: ${toneSelect.value}.`);
  });

  saveProfileBtn.addEventListener("click", () => {
    const name = profileNameInput.value.trim();
    if (!name) return;
    LPBot.setProfileName(name);
    appendAssistant(`Ndabika izina: ${name}. Uzajya usuhuzwa mu izina ryawe.`);
  });

  darkToggle.addEventListener("click", () => {
    const toLight = !document.body.classList.contains("light");
    document.body.classList.toggle("light", toLight);
    document.body.classList.toggle("dark", !toLight);
    localStorage.setItem("lp_theme", toLight ? "light" : "dark");
  });

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    appendUser(text);
    const reply = LPBot.replyFor(text);
    appendAssistant(reply);
    chatInput.value = "";
    renderCart();
  }

  function renderCart() {
    const { items, subtotal, discountRate, discount, total } = LPBot.cartSummary();
    cartItems.innerHTML = items.length
      ? items.map(it => `<div class="cart-item"><span>${it.name} x${it.qty}</span><span>${it.price} Fbu</span></div>`).join("")
      : "<div class='cart-item'>Nta kintu muri igare kugeza ubu.</div>";
    cartTotal.innerHTML = `
      <div class="cart-total">Subtotal: ${subtotal} Fbu</div>
      <div class="cart-total">Discount: ${Math.round(discountRate * 100)}% → -${discount} Fbu</div>
      <div class="cart-total">Total: ${total} Fbu</div>
    `;
  }
  renderCart();

  function appendUser(text) {
    const wrap = document.createElement("div");
    wrap.className = "msg user";
    wrap.innerHTML = `<div class="bubble">${escapeHtml(text)}</div><div class="meta">wowe</div>`;
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function appendAssistant(text) {
    const wrap = document.createElement("div");
    wrap.className = "msg assistant";
    const withBr = text.replace(/\n/g, "<br/>");
    wrap.innerHTML = `<div class="bubble">${withBr}</div><div class="meta">assistant</div>`;
    chatLog.appendChild(wrap);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function escapeHtml(s) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
    return s.replace(/[&<>]/g, (c) => map[c]);
  }

  function renderStock() {
    const grid = document.createElement("div");
    grid.className = "grid";
    grid.innerHTML = window.PRODUCTS.map(p => `
      <div class="card" style="animation: fadeUp .5s ease both;">
        <img src="${p.image}" alt="${p.name}" />
        <div class="info">
          <div><strong>${p.name}</strong></div>
          <div class="desc">${p.desc}</div>
          <div class="price">${p.price} Fbu</div>
          <button data-id="${p.id}">Fata #${p.id}</button>
        </div>
      </div>
    `).join("");
    stockTable.innerHTML = "";
    stockTable.appendChild(grid);
    grid.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const reply = LPBot.replyFor(`fata ${id}`);
        appendAssistant(reply);
        renderCart();
      });
    });
  }
});
