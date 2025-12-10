/* Lightweight random jokes spinner (offline-friendly) */
const JOKES = [
  { title: 'Clinic vibes', text: 'Muganga: “Ntaco numva.” Umukecuru: “Ni hearing ishaje, si smell!” 🤣' },
  { title: 'Buja taxi', text: 'Uwinjira ati: “Vayo mu nguni!”—Driver ati: “Nguni ni y’uko ucishamwo amajambo!” 😆' },
  { title: 'Fan zone', text: 'Real Madrid fan ati: “Goal ni discipline”—Uwundi ati: “KirikouAkili yarabivuze!” ⚽🐊' }
];
function randomJoke(){
  return JOKES[Math.floor(Math.random() * JOKES.length)];
}
