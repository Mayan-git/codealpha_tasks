const postId = new URLSearchParams(window.location.search).get("id");
const postCard = document.getElementById("postCard");
const commentsCard = document.getElementById("commentsCard");
const commentsList = document.getElementById("commentsList");

if (!postId) {
  postCard.innerHTML = `<div class="empty-state">No post specified.</div>`;
} else {
  loadPost();
}

function commentHtml(c) {
  return `
    <div class="comment" data-comment-id="${c.id}">
      <a href="profile.html?u=${encodeURIComponent(c.authorUsername)}">
        ${avatarHtml(c.authorUsername, c.authorAvatarUrl, "avatar-sm")}
      </a>
      <div class="comment-body">
        <div class="comment-header">
          <a class="comment-author" href="profile.html?u=${encodeURIComponent(c.authorUsername)}">@${escapeHtml(c.authorUsername)}</a>
          <span class="comment-time">· ${timeAgo(c.createdAt)}</span>
          ${
            Auth.getUser() && Auth.getUser().username === c.authorUsername
              ? `<button class="action-btn btn-danger" data-action="delete-comment" data-id="${c.id}">Delete</button>`
              : ""
          }
        </div>
        <p class="comment-content">${escapeHtml(c.content)}</p>
      </div>
    </div>
  `;
}

async function loadPost() {
  try {
    const post = await api(`/posts/${postId}`);
    postCard.innerHTML = postCardHtml(post, { linkToPost: false });
    commentsCard.style.display = "block";
    commentsList.innerHTML = post.comments.length
      ? post.comments.map(commentHtml).join("")
      : `<p class="muted">No comments yet. Be the first to reply.</p>`;
  } catch (err) {
    postCard.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

document.getElementById("commentBtn").addEventListener("click", async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  const input = document.getElementById("commentInput");
  const errorEl = document.getElementById("commentError");
  errorEl.textContent = "";
  const content = input.value.trim();
  if (!content) {
    errorEl.textContent = "Comment cannot be empty.";
    return;
  }
  try {
    const comment = await api(`/posts/${postId}/comments`, { method: "POST", body: { content } });
    input.value = "";
    const empty = commentsList.querySelector(".muted");
    if (empty) empty.remove();
    commentsList.insertAdjacentHTML("beforeend", commentHtml(comment));
    const countEl = postCard.querySelector(".post-actions a span");
    if (countEl) countEl.textContent = Number(countEl.textContent) + 1;
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

commentsList.addEventListener("click", async (e) => {
  const btn = e.target.closest('[data-action="delete-comment"]');
  if (!btn) return;
  if (!confirm("Delete this comment?")) return;
  try {
    const id = btn.dataset.id;
    await api(`/posts/${postId}/comments/${id}`, { method: "DELETE" });
    commentsList.querySelector(`[data-comment-id="${id}"]`).remove();
    const countEl = postCard.querySelector(".post-actions a span");
    if (countEl) countEl.textContent = Math.max(0, Number(countEl.textContent) - 1);
  } catch (err) {
    alert(err.message);
  }
});

wirePostEvents(postCard, {
  onDeleted: () => {
    window.location.href = "index.html";
  },
});
