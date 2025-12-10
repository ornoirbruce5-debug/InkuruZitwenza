const posts = [
  { message: "Inkuru itwengeje!", image: "assets/sample.jpg", created_time: "2025-12-10T08:00:00Z" },
  { message: "Video iryoshe!", video: "assets/sample.mp4", created_time: "2025-12-09T15:00:00Z" }
];

const grid = document.querySelector('.posts-grid');
if (grid) {
  grid.innerHTML = posts.map(post => `
    <div class="card">
      ${post.image ? `<img src="${post.image}" alt="post media">` : ""}
      ${post.video ? `<video controls><source src="${post.video}" type="video/mp4"></video>` : ""}
      <p>${post.message}</p>
      <span>${new Date(post.created_time).toLocaleDateString()}</span>
    </div>
  `).join('');
}
