function postCardHtml(post, { linkToPost = true } = {}) {
  const me = Auth.getUser();
  const isMine = me && me.username === post.authorUsername;
  const content = escapeHtml(post.content).replace(/\n/g, "<br>");
  const contentBlock = linkToPost
    ? `<a href="post.html?id=${post.id}" class="post-content" style="color:inherit;text-decoration:none;display:block;">${content}</a>`
    : `<div class="post-content">${content}</div>`;

  return `
    <article class="card post" data-post-id="${post.id}">
      <a href="profile.html?u=${encodeURIComponent(post.authorUsername)}">
        ${avatarHtml(post.authorUsername, post.authorAvatarUrl)}
      </a>
      <div class="post-body">
        <div class="post-header">
          <a class="post-author" href="profile.html?u=${encodeURIComponent(post.authorUsername)}">@${escapeHtml(post.authorUsername)}</a>
          <span class="post-time">· ${timeAgo(post.createdAt)}</span>
        </div>
        ${contentBlock}
        ${post.imageUrl ? `<img class="post-image" src="${post.imageUrl}" alt="">` : ""}
        <div class="post-actions">
          <button class="action-btn like-btn ${post.likedByMe ? "liked" : ""}" data-action="like" data-id="${post.id}">
            ${post.likedByMe ? "♥" : "♡"} <span class="like-count">${post.likeCount}</span>
          </button>
          <a class="action-btn" href="post.html?id=${post.id}">💬 <span>${post.commentCount}</span></a>
          ${isMine ? `<button class="action-btn btn-danger post-delete" data-action="delete-post" data-id="${post.id}">Delete</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function wirePostEvents(container, { onDeleted } = {}) {
  container.addEventListener("click", async (e) => {
    const likeBtn = e.target.closest('[data-action="like"]');
    const deleteBtn = e.target.closest('[data-action="delete-post"]');

    if (likeBtn) {
      if (!Auth.isLoggedIn()) {
        window.location.href = "login.html";
        return;
      }
      likeBtn.disabled = true;
      try {
        const id = likeBtn.dataset.id;
        const result = await api(`/posts/${id}/like`, { method: "POST" });
        likeBtn.classList.toggle("liked", result.liked);
        likeBtn.querySelector(".like-count").textContent = result.likeCount;
        likeBtn.innerHTML = `${result.liked ? "♥" : "♡"} <span class="like-count">${result.likeCount}</span>`;
        likeBtn.classList.toggle("liked", result.liked);
      } catch (err) {
        alert(err.message);
      } finally {
        likeBtn.disabled = false;
      }
    }

    if (deleteBtn) {
      if (!confirm("Delete this post?")) return;
      try {
        const id = deleteBtn.dataset.id;
        await api(`/posts/${id}`, { method: "DELETE" });
        const card = container.querySelector(`[data-post-id="${id}"]`);
        if (card) card.remove();
        if (onDeleted) onDeleted(id);
      } catch (err) {
        alert(err.message);
      }
    }
  });
}
