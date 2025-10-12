(function () {
  const LS = {
    profile: "lp_profile",
    prefs: "lp_prefs",
    history: "lp_history",
    lastSeen: "lp_last_seen",
    jokes: "lp_joke_day",
    cart: "lp_cart",
    sessions: "lp_sessions",
    tone: "lp_tone",
    theme: "lp_theme",
  };

  const EMOJIS = { warm: "🌸", neutral: "🛒", professional: "💼" };

  const TIPS = [
    "Gura mu byiciro: snacks, beauty, lifestyle—biroroshya kugenzura igiciro.",
    "Koresha ‘munsi ya [igiciro]’ kugira ngo ubone deals byihuse.",
    "Shyira amahitamo mu igare mbere yo gu-checkout—biragufasha kugereranya.",
    "Saba invoice buri gihe—inyungu mu kugenzura expenses zawe.",
  ];

  const JOKES_RW = [
    "Umukobwa ati: ‘Lip gloss iraboneka?’ Umukozi ati: ‘Yego, ariko ntuyisige ku ticket!’ 😄",
    "Popcorn ikunda ibirori—kuko iyo yatekewe iravuga ‘pop!’ 🎉",
    "Bubble tea iravuga: ‘Ndi icyayi gifite personality’ 🌸",
  ];

  // Basic sentiment keywords
  const SENTIMENT = {
    stress: ["mpagaritse", "guhangayika", "stress", "ndafashwa", "birankomerera", "problem", "ndakomeye"],
    joy: ["byiza", "nishimiye", "urakoze", "neza", "ndanezerewe", "yooo", "wow"],
  };

  // State
  let tone = localStorage.getItem(LS.tone) || "warm";
  let cart = JSON.parse(localStorage.getItem(LS.cart) || "[]");

  // Helpers
  const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const read = (k, d = null) => JSON.parse(localStorage.getItem(k) || (d ? JSON.stringify(d) : "null"));
  const setLastSeen = () => localStorage.setItem(LS.lastSeen, String(Date.now()));

  const setProfileName = (name) => {
    const p = read(LS.profile) || {};
    p.name = name;
    save(LS.profile, p);
  };
  const getProfileName = () => (read(LS.profile) || {}).name;

  const pushHistory = (msg) => {
    const hist = read(LS.history, []);
    hist.push({ t: Date.now(), msg });
    save(LS.history, hist);
  };

  const bumpSession = () => {
    const s = Number(localStorage.getItem(LS.sessions) || "0") + 1;
    localStorage.setItem(LS.sessions, String(s));
    return s;
  };

  // Promotions
  function computeDiscount(subtotal) {
    const sessions = Number(localStorage.getItem(LS.sessions) || "0");
    if (sessions >= 5 && subtotal >= 5000) {
      return subtotal >= 20000 ? 0.07 : 0.05;
    }
    return 0;
  }

  // Catalogue queries
  function searchQuery(q) {
    const txt = q.toLowerCase();
    // "munsi ya 2000"
    const underMatch = txt.match(/munsi\s+ya\s+(\d+)/);
    if (underMatch) {
      const threshold = Number(underMatch[1]);
      return window.PRODUCTS.filter(p => p.price <= threshold);
    }
    // category keyword
    const categories = [...new Set(window.PRODUCTS.map(p => p.category.toLowerCase()))];
    const hitCat = categories.find(c => txt.includes(c.toLowerCase()));
    if (hitCat) {
      return window.PRODUCTS.filter(p => p.category.toLowerCase() === hitCat);
    }
    // “ndashaka amata” or name includes
    const nameTerm = txt.replace(/^ndashaka\s+/, "").trim();
    if (nameTerm.length > 0) {
      return window.PRODUCTS.filter(p => p.name.toLowerCase().includes(nameTerm));
    }
    return [];
  }

  // Sentiment detection
  function detectSentiment(text) {
    const t = text.toLowerCase();
    const stressed = SENTIMENT.stress.some(k => t.includes(k));
    const happy = SENTIMENT.joy.some(k => t.includes(k));
    if (stressed) return "stress";
    if (happy) return "joy";
    return "neutral";
  }

  // Daily hooks: joke/tip every day + missed you after 3+ days
  function dailyHook() {
    const key = read(LS.jokes) || {};
    const today = new Date().toDateString();
    if (key.date !== today) {
      const pick = Math.random() < 0.5 ? { type: "tip", content: pickRandom(TIPS) } : { type: "joke", content: pickRandom(JOKES_RW) };
      save(LS.jokes, { date: today, pick });
    }
    return read(LS.jokes).pick;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function missedYouMessage() {
    const last = Number(localStorage.getItem(LS.lastSeen) || "0");
    if (!last) return null;
    const d = daysBetween(Date.now(), last);
    if (d >= 3) {
      const name = getProfileName();
      return `Ndaguhaye ikaze ${name ? name : "sha"} — twaragutakambye, hari iminsi 3 ishize utagaruka. 💙`;
    }
    return null;
  }

  // Cart ops
  function addToCartById(id) {
    const prod = window.PRODUCTS.find(p => p.id === Number(id));
    if (!prod) return { ok: false, msg: "Icyo kintu ntikibaho." };
    cart.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
    save(LS.cart, cart);
    return { ok: true, msg: `Nyongeyemwo: ${prod.name} 🛒` };
  }

  function addBundle(name) {
    const ids = window.BUNDLES[name];
    if (!ids) return { ok: false, msg: "Bundle ntibashije kuboneka." };
    ids.forEach(id => addToCartById(id));
    return { ok: true, msg: `Bundle "${name}" yongewe mu igare 🎉` };
  }

  function cartSummary() {
    const items = JSON.parse(localStorage.getItem(LS.cart) || "[]");
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discountRate = computeDiscount(subtotal);
    const discount = Math.round(subtotal * discountRate);
    const total = subtotal - discount;
    return { items, subtotal, discountRate, discount, total };
  }

  // Invoice text
  function buildInvoice() {
    const { items, subtotal, discountRate, discount, total } = cartSummary();
    if (items.length === 0) return "Igare ririmo ubusa.";
    const lines = items.map(it => `- ${it.name} x${it.qty} → ${it.price} Fbu`);
    const promoLine = discountRate > 0 ? `Discount: ${Math.round(discountRate * 100)}% → -${discount} Fbu` : "Discount: Nta yo";
    return [
      "Invoice 🧾",
      ...lines,
      `Subtotal: ${subtotal} Fbu`,
      `${promoLine}`,
      `Total: ${total} Fbu`,
    ].join("\n");
  }

  // Core reply builder
  function replyFor(inputRaw) {
    const input = inputRaw.trim();
    pushHistory(input);
    const s = detectSentiment(input);

    // Sentiment-aware opening
    if (s === "stress") {
      return toneWrap("Ndabumva—turi kumwe, reka ngufashe buhoro buhoro 💙. Vuga icyo ushaka: ‘Ibinyobwa’, ‘Snacks’, ‘munsi ya 2000’.", tone);
    }
    if (s === "joy") {
      return toneWrap("Ndanezerewe kubibona! Reka tugume ku muvuduko mwiza 🎉. Ushobora kuvuga: ‘fata 3’ cyangwa ‘checkout’.", tone);
    }

    const low = input.toLowerCase();

    if (low === "amakuru") {
      const pick = dailyHook();
      const label = pick.type === "tip" ? "Tip y’umunsi" : "Joke y’umunsi";
      return toneWrap(`${label}: ${pick.content}`, tone);
    }

    // Greeting + missed you
    if (["salut","mwaramutse","bonjour","hello","hey"].includes(low)) {
      const name = getProfileName();
      const miss = missedYouMessage();
      setLastSeen();
      return toneWrap(`${miss ? miss + " " : ""}Mwaramutse ${name ? name : "sha"}! Vuga: ‘Snacks’, ‘Beauty’, ‘munsi ya 2000’, ‘checkout’. ${EMOJIS[tone]}`, tone);
    }

    // add single product: "fata 3" or bundle
    if (low.startsWith("fata ")) {
      const tail = input.slice(5).trim();
      // bundle?
      if (tail.toLowerCase().startsWith("bundle ")) {
        const bundleName = tail.slice(7).trim();
        const res = addBundle(bundleName);
        return toneWrap(res.msg, tone);
      }
      const idNum = Number(tail);
      if (!Number.isFinite(idNum)) {
        return toneWrap("Andika: ‘fata [id]’ urugero: ‘fata 3’.", tone);
      }
      const res = addToCartById(idNum);
      return toneWrap(res.msg, tone);
    }

    if (low === "checkout") {
      const inv = buildInvoice();
      return toneWrap(inv, tone);
    }

    // Catalogue queries
    const results = searchQuery(input);
    if (results.length > 0) {
      const rendered = results.slice(0, 12).map(p => `#${p.id} ${p.name} — ${p.price} Fbu\n${p.desc}`).join("\n\n");
      return toneWrap(`Ibisubizo:\n\n${rendered}\n\nTegeka ukoresheje: ‘fata [id]’ cyangwa ‘fata bundle [izina]’.`, tone);
    }

    // Help fallback
    return toneWrap(
      "Ndagufasha gushakisha. Gerageza: ‘amakuru’, ‘Snacks’, ‘Beauty’, ‘munsi ya 2000’, ‘ndashaka bubble’, ‘fata 3’, ‘fata bundle Self-care Starter’, ‘checkout’.",
      tone
    );
  }

  // Tone wrapper
  function toneWrap(text, t) {
    const prefix = t === "warm" ? "💙 " : t === "neutral" ? "🛒 " : "💼 ";
    return `${prefix}${text}`;
  }

  // Public API to ui.js
  window.LPBot = {
    replyFor,
    setProfileName,
    getProfileName,
    setTone: (t) => { tone = t; localStorage.setItem(LS.tone, t); },
    getTone: () => tone,
    cartSummary,
    bumpSession,
    setLastSeen,
  };
})();
