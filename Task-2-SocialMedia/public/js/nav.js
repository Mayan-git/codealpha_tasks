function renderNav() {
  const el = document.getElementById("navbar");
  if (!el) return;

  const user = Auth.getUser();
  el.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="index.html">MiniSocial</a>
      <div class="nav-links">
        ${
          user
            ? `
              <a href="index.html">Home</a>
              <a href="profile.html?u=${encodeURIComponent(user.username)}">Profile</a>
              <span class="nav-user">@${escapeHtml(user.username)}</span>
              <button id="logoutBtn" class="btn btn-ghost">Log out</button>
            `
            : `
              <a href="login.html">Log in</a>
              <a href="register.html">Sign up</a>
            `
        }
      </div>
    </div>
  `;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.clearSession();
      window.location.href = "login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", renderNav);
