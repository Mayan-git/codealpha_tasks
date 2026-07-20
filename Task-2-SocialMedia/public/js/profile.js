const params = new URLSearchParams(window.location.search);
const username = params.get("u");
const profileCard = document.getElementById("profileCard");
const userPostsEl = document.getElementById("userPosts");
const postsStatus = document.getElementById("postsStatus");

if (!username) {
  profileCard.innerHTML = `<div class="empty-state">No user specified.</div>`;
} else {
  loadProfile();
  loadUserPosts();
}

async function loadProfile() {
  try {
    const profile = await api(`/users/${encodeURIComponent(username)}`);
    renderProfile(profile);
  } catch (err) {
    profileCard.innerHTML = `<div class="empty-state">${escapeHtml(err.message)}</div>`;
  }
}

function renderProfile(profile) {
  profileCard.innerHTML = `
    <div class="profile-header">
      ${avatarHtml(profile.username, profile.avatarUrl, "avatar-lg")}
      <div class="profile-info">
        <div class="profile-username">@${escapeHtml(profile.username)}</div>
        ${profile.bio ? `<div class="profile-bio">${escapeHtml(profile.bio)}</div>` : '<div class="muted">No bio yet.</div>'}
        <div class="profile-stats">
          <span><strong>${profile.posts}</strong> posts</span>
          <span><strong>${profile.followers}</strong> followers</span>
          <span><strong>${profile.following}</strong> following</span>
        </div>
        <div class="profile-actions" id="profileActions"></div>
      </div>
    </div>
  `;

  const actions = document.getElementById("profileActions");
  if (profile.isSelf) {
    actions.innerHTML = `<button class="btn btn-outline btn-sm" id="editBtn">Edit profile</button>`;
    document.getElementById("editBtn").addEventListener("click", () => openEdit(profile));
  } else if (Auth.isLoggedIn()) {
    actions.innerHTML = `
      <button class="btn btn-sm ${profile.isFollowing ? "btn-following" : ""}" id="followBtn">
        ${profile.isFollowing ? "Following" : "Follow"}
      </button>`;
    document.getElementById("followBtn").addEventListener("click", () => toggleFollow(profile.username));
  }
}

async function toggleFollow(targetUsername) {
  if (!Auth.isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }
  const btn = document.getElementById("followBtn");
  btn.disabled = true;
  try {
    const result = await api(`/users/${encodeURIComponent(targetUsername)}/follow`, { method: "POST" });
    btn.textContent = result.following ? "Following" : "Follow";
    btn.classList.toggle("btn-following", result.following);
    loadProfile();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

function openEdit(profile) {
  document.getElementById("editCard").style.display = "block";
  document.getElementById("bioInput").value = profile.bio || "";
  document.getElementById("editCard").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("cancelEditBtn").addEventListener("click", () => {
  document.getElementById("editCard").style.display = "none";
});

document.getElementById("saveProfileBtn").addEventListener("click", async () => {
  const errorEl = document.getElementById("editError");
  errorEl.textContent = "";
  const bio = document.getElementById("bioInput").value;
  const avatarFile = document.getElementById("avatarInput").files[0];

  try {
    if (avatarFile) {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      const { avatarUrl } = await api("/users/me/avatar", { method: "POST", body: formData, isFormData: true });
      const user = Auth.getUser();
      user.avatarUrl = avatarUrl;
      Auth.setSession(Auth.getToken(), user);
    }
    await api("/users/me", { method: "PUT", body: { bio } });
    document.getElementById("editCard").style.display = "none";
    renderNav();
    loadProfile();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

async function loadUserPosts() {
  postsStatus.textContent = "Loading...";
  try {
    const posts = await api(`/posts/user/${encodeURIComponent(username)}`);
    postsStatus.textContent = "";
    if (posts.length === 0) {
      userPostsEl.innerHTML = `<div class="empty-state">No posts yet.</div>`;
      return;
    }
    userPostsEl.innerHTML = posts.map((p) => postCardHtml(p)).join("");
  } catch (err) {
    postsStatus.textContent = err.message;
  }
}

wirePostEvents(userPostsEl);
