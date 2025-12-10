/* PWA install prompt */
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

/* Service worker */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

/* Year */
document.getElementById('year').textContent = new Date().getFullYear();

/* Filters & search */
const grid = document.getElementById('latest');
const searchInput = document.getElementById('searchInput');
const chips = document.querySelectorAll('.chip');

let POSTS = [];
let FILTER = 'all';
let QUERY = '';

/* Fetch posts with cache fallback */
async function fetchPosts() {
  try {
    const res = await fetch('./posts.json', { cache: 'no-store' });
    POSTS = await res.json();
  } catch (err) {
    console.warn('Using offline cached posts');
  }
  render();
}

/* Render cards */
function render() {
  const query = QUERY.trim().toLowerCase();
  const filtered = POSTS.filter(p => {
    const matchFilter =
      FILTER === 'all' ? true : (p.tags?.includes(FILTER) || p.category === FILTER);
    const text = `${p.title} ${p.content} ${p.tags?.join(' ')}`.toLowerCase();
    const matchQuery = query ? text.includes(query) : true;
    return matchFilter && matchQuery;
  });

  grid.innerHTML = filtered.map(toCardHTML).join('') || emptyState();
}

/* Card template */
function toCardHTML(p) {
  const date = new Date(p.date).toLocaleDateString('rw-RW', { year:'numeric', month:'short', day:'numeric' });
  const img = p.image || 'images/placeholder.jpg';
  const permalink = p.permalink || '#';
  return `
    <article class="card">
      <div class="media"><img src="${img}" alt="${p.title}" loading="lazy"></div>
      <div class="content">
        <h3>${escapeHTML(p.title)}</h3>
        <p>${escapeHTML(p.content.slice(0,160))}…</p>
        <div class="meta"><span>${date}</span><span>${p.language || 'Kirundi'}</span></div>
        <div class="actions">
          <a class="btn ghost" href="${permalink}" target="_blank" rel="noopener">Soma kuri Facebook</a>
          <button class="btn primary" onclick="shareWhatsApp('${serializeShare(p)}')">Share 📲</button>
        </div>
      </div>
    </article>
  `;
}

/* Empty state */
function emptyState(){
  return `
    <div class="glass" style="padding:18px;border-radius:18px">
      <h3>Ntazo tubonye 😌</h3>
      <p>Gerageza guhitamo "Zose" cyangwa andika ijambo rishakishwa.</p>
    </div>
  `;
}

/* Share to WhatsApp */
function shareWhatsApp(text){
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}
function serializeShare(p){
  const site = location.href.split('#')[0];
  return `${p.title} 🤣\n${p.content}\nSoma yose: ${p.permalink || site}`;
}

/* Escape HTML */
function escapeHTML(str){
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* Search & filter listeners */
searchInput?.addEventListener('input', (e) => { QUERY = e.target.value; render(); });
chips.forEach(ch => ch.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  ch.classList.add('active');
  FILTER = ch.dataset.filter;
  render();
}));

/* Spin jokes */
const spinBtn = document.getElementById('spinJokeBtn');
spinBtn?.addEventListener('click', () => {
  const j = randomJoke();
  alert(`${j.title} 🤣\n\n${j.text}`);
});

/* Load initial */
fetchPosts();
