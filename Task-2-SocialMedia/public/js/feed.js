const feedEl = document.getElementById("feed");
const feedStatus = document.getElementById("feedStatus");
const composerAvatar = document.getElementById("composerAvatar");
let currentScope = "all";

function renderComposer() {
  const user = Auth.getUser();
  if (!user) {
    document.querySelector(".composer").innerHTML = `
      <div class="empty-state" style="width:100%;">
        <a href="login.html">Log in</a> to share what's on your mind.
      </div>`;
    return;
  }
  composerAvatar.innerHTML = avatarHtml(user.username, user.avatarUrl);
}

async function loadFeed(scope) {
  currentScope = scope;
  feedEl.innerHTML = "";
  feedStatus.textContent = "Loading...";
  try {
    const posts = await api(`/posts${scope === "following" ? "?scope=following" : ""}`);
    feedStatus.textContent = "";
    if (posts.length === 0) {
      feedEl.innerHTML = `<div class="empty-state">${
        scope === "following"
          ? "No posts yet. Follow people to see their posts here."
          : "No posts yet. Be the first to share something!"
      }</div>`;
      return;
    }
    feedEl.innerHTML = posts.map((p) => postCardHtml(p)).join("");
  } catch (err) {
    feedStatus.textContent = err.message;
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.scope === "following" && !Auth.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    loadFeed(tab.dataset.scope);
  });
});

document.getElementById("postBtn").addEventListener("click", async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  const textarea = document.getElementById("postContent");
  const errorEl = document.getElementById("composerError");
  const content = textarea.value.trim();
  errorEl.textContent = "";
  if (!content) {
    errorEl.textContent = "Post cannot be empty.";
    return;
  }
  try {
    const post = await api("/posts", { method: "POST", body: { content } });
    textarea.value = "";
    if (currentScope === "all" || currentScope === "following") {
      const empty = feedEl.querySelector(".empty-state");
      if (empty) empty.remove();
      feedEl.insertAdjacentHTML("afterbegin", postCardHtml(post));
    }
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

wirePostEvents(feedEl);
renderComposer();
loadFeed("all");
