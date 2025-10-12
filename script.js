/* ===========================
   Config: API keys & providers (PuterAdapter)
   =========================== */
/*
  Banza ushyiremo API keys zawe:
  - OPENAI_API_KEY (GPT‑4o)
  - ANTHROPIC_API_KEY (Claude 3.x)
  - GOOGLE_API_KEY (Gemini 1.5)
  NOTE:
  - Kugira ngo bikore neza mu browser, shyira proxy/backend itwikira keys (recommended).
  - Niba uri mu dev local, ushobora gukoresha keys muri browser ariko si byiza mu production.
*/

const puterConfig = {
  defaultProvider: 'openai', // 'openai' | 'anthropic' | 'gemini'
  providers: {
    openai: { baseUrl: 'https://api.openai.com/v1', apiKey: 'YOUR_OPENAI_API_KEY' },
    anthropic: { baseUrl: 'https://api.anthropic.com/v1', apiKey: 'YOUR_ANTHROPIC_API_KEY' },
    gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', apiKey: 'YOUR_GOOGLE_API_KEY' }
  }
};

/* ===========================
   PuterAdapter: routes to GPT‑4o / Claude / Gemini
   - messages: [{role:'system'|'user'|'assistant', content:'...'}]
   - returns plain string
   =========================== */
const PuterAdapter = {
  async chat({ provider, messages, temperature = 0.7 }) {
    const prov = provider || puterConfig.defaultProvider;

    if (prov === 'openai') {
      // OpenAI: gpt-4o (or gpt-4o-mini) chat completions
      const url = `${puterConfig.providers.openai.baseUrl}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${puterConfig.providers.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature
        })
      });
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || 'Ndabigusubiza vuba...';
    }

    if (prov === 'anthropic') {
      // Anthropic Claude: messages endpoint
      const url = `${puterConfig.providers.anthropic.baseUrl}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': puterConfig.providers.anthropic.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          temperature,
          system: messages.find(m => m.role === 'system')?.content || '',
          messages: messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: [{ type: 'text', text: m.content }]
          }))
        })
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || data?.output_text || '';
      return text || 'Ndabigusubiza vuba...';
    }

    if (prov === 'gemini') {
      // Google Gemini: generateContent
      const url = `${puterConfig.providers.gemini.baseUrl}/models/gemini-1.5-flash:generateContent?key=${puterConfig.providers.gemini.apiKey}`;
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const parts = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ text: `${m.role.toUpperCase()}: ${m.content}` }));
      const payload = {
        contents: [{ role: 'user', parts }],
        safetySettings: [],
        generationConfig: { temperature }
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
      return text || 'Ndabigusubiza vuba...';
    }

    return 'Provider itazwi. Hindura “puterConfig.defaultProvider”.';
  }
};

/* ===========================
   UX Helpers & Initial Setup
   =========================== */

const themeToggle = document.getElementById('themeToggle');
const ctaBtn = document.getElementById('ctaBtn');
const audioFR = document.getElementById('audioFR');

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeToggle.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
});

// CTA -> scroll to stock + play audio
ctaBtn.addEventListener('click', () => {
  document.getElementById('stock').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    audioFR.currentTime = 0;
    audioFR.play().catch(() => {/* autoplay policy */});
  }, 500);
});

// Video fallback
const bgVideo = document.getElementById('bgVideo');
bgVideo?.addEventListener('error', () => {
  bgVideo.style.display = 'none';
});

/* ===========================
   Load Stock (products.json)
   =========================== */

const stockBody = document.getElementById('stockBody');

async function loadStock() {
  try {
    const res = await fetch('products.json');
    const items = await res.json();
    let delay = 0;

    items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.className = 'row-animate';
      tr.style.animationDelay = `${delay}ms`;
      delay += 120;

      tr.innerHTML = `
        <td><img class="stock-img" src="${item.image}" alt="${item.name}" loading="lazy" /></td>
        <td>
          <strong>${item.name}</strong><br/>
          <small>${item.description}</small>
        </td>
        <td><strong>${item.price}</strong></td>
        <td><button class="buy-btn" data-id="${item.id}">Shora</button></td>
      `;
      stockBody.appendChild(tr);
    });

    stockBody.addEventListener('click', (e) => {
      const btn = e.target.closest('.buy-btn');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      showBotMessage(`Twakiriye icyifuzo cyawe kuri <strong>${id}</strong>. Tuguhamagara vuba! 🛒`);
    });

  } catch (err) {
    showBotMessage('Kuboneka kwa stock byananiranye. Gerageza kongera gufungura page.');
  }
}
loadStock();

/* ===========================
   Daily Joke (Kirundi) & localStorage
   =========================== */

const jokes = [
  'Umupfumu yaravuze ati: “Ndi mu kazi.” Umukiriya ati: “Nawe urabeshya nk’akazi kawe.” 😂',
  'Umujeri abaza igiciro, bamubwira: “Ni ubuntu.” Ati: “Ndabona n’ubuntu bwahenze.” 🤣',
  'Umugenzi ati: “Taxi yaheze?” Shoferi ati: “Nayo irashaka kuruhuka.” 😅',
  'Umuriro wabuze, umwana ati: “Mami, internet irashonje.” 🙃',
  'Umucuruzi ati: “Ibiciro vyazamutse.” Umuguzi ati: “Nawe uzamuke uduhe discount.” 😜'
];

const jokeText = document.getElementById('jokeText');
const newJokeBtn = document.getElementById('newJokeBtn');

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function loadDailyJoke() {
  const key = getTodayKey();
  const saved = localStorage.getItem('daily_joke_key');
  const savedIndex = localStorage.getItem('daily_joke_index');

  if (saved === key && savedIndex !== null) {
    jokeText.textContent = jokes[Number(savedIndex)];
  } else {
    let idx = Math.floor(Math.random() * jokes.length);
    localStorage.setItem('daily_joke_key', key);
    localStorage.setItem('daily_joke_index', String(idx));
    jokeText.textContent = jokes[idx];
  }
}
loadDailyJoke();

newJokeBtn.addEventListener('click', () => {
  loadDailyJoke();
  showBotMessage('Urwenya rw’uyu munsi ruvuguruwe 😄.');
});

/* ===========================
   Chatbot UI & logic
   =========================== */

const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

function showUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'msg user';
  el.innerHTML = text;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function showBotMessage(html) {
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.innerHTML = html;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function showBotImage(src, alt = 'Preview') {
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.innerHTML = `<img src="${src}" alt="${alt}" />`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function enrichWithEmoji(text) {
  const t = text.toLowerCase();
  if (t.includes('price') || t.includes('igiciro') || t.includes('giciro')) return '💰';
  if (t.includes('hello') || t.includes('muraho') || t.includes('bonjour')) return '👋';
  if (t.includes('merci') || t.includes('thanks') || t.includes('urakoze')) return '🙏';
  if (t.includes('video') || t.includes('media')) return '🎬';
  if (t.includes('whatsapp')) return '📲';
  if (t.includes('map') || t.includes('location') || t.includes('gihosha')) return '📍';
  return '✨';
}

const systemPersona = `Uri umukozi wa Boutique ya Digital Dropshipping Media.
Ufasha abakiriya kumenya ibicuruzwa, ibiciro, support ya WhatsApp, na location ya Gihosha Gisandema.
Saba amakuru y’ingenzi mu bwitonzi, utange emojis ziryoshya ibiganiro, kandi ube wiyoroshye.`;

// Choose provider selector (optional UI hook if ushaka switcher)
let currentProvider = puterConfig.defaultProvider;

async function askAI(userText) {
  const messages = [
    { role: 'system', content: systemPersona },
    { role: 'user', content: userText }
  ];
  try {
    const reply = await PuterAdapter.chat({ provider: currentProvider, messages, temperature: 0.7 });
    return reply;
  } catch (e) {
    return localBrain(userText);
  }
}

// Local fallback (rule-based)
function localBrain(userText) {
  const t = userText.toLowerCase();
  if (t.includes('giciro') || t.includes('price')) {
    return 'Ibiciro biratandukanye: Starter 45k BIF, Pro 85k BIF, Voice-over FR 30k BIF, IG Kit 55k BIF. 💰';
  }
  if (t.includes('whatsapp')) {
    return 'Ushobora kuduhamagara kuri WhatsApp: wa.me/25771633859 📲';
  }
  if (t.includes('aho muri') || t.includes('location') || t.includes('gihosha')) {
    return 'Turi Gihosha Gisandema, coordinates: -3.4590 / 29.378 📍';
  }
  if (t.includes('bonjour') || t.includes('muraho') || t.includes('hello')) {
    return 'Muraho neza! Nishimiye kugufasha kuri media dropshipping. 👋';
  }
  if (t.includes('media') || t.includes('video')) {
    return 'Dufite media packs: videos, reels, thumbnails, ads templates. 🎬';
  }
  return 'Nditeguye kugufasha! Bwira icyo ukeneye ku bicuruzwa, igiciro, cyangwa support. ✨';
}

sendBtn.addEventListener('click', async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  showUserMessage(text);
  chatInput.value = '';

  const emoji = enrichWithEmoji(text);
  const reply = await askAI(text);
  showBotMessage(`${reply} ${emoji}`);

  const t = text.toLowerCase();
  if (t.includes('pack') || t.includes('media')) {
    showBotImage('assets/products/media-pack-pro.jpg', 'Sample Media Pack');
  }
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// Initial greet
showBotMessage('Murakaza neza kuri Boutique ya Digital Dropshipping Media! Ndahari kugufasha kugura no gutanga ibitekerezo. 👋');

/* ===========================
   Performance small tweaks
   =========================== */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.row-animate').forEach(el => el.style.animation = 'none');
}
