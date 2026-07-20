function renderNav() {
  const root = document.getElementById('nav-root');
  if (!root) return;

  const auth = getAuth();

  root.innerHTML = `
    <header class="site-header">
      <div class="nav-inner">
        <a class="brand" href="index.html">ShopEasy</a>
        <nav class="nav-links">
          <a href="index.html">Products</a>
          <a href="cart.html">Cart <span id="cart-badge" class="cart-badge" style="display:none">0</span></a>
          ${
            auth
              ? `<a href="orders.html">My Orders</a>
                 <span class="muted">Hi, ${escapeHtml(auth.name)}</span>
                 <button class="link-btn" id="logout-btn">Logout</button>`
              : `<a href="login.html">Login</a>
                 <a href="register.html">Register</a>`
          }
        </nav>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'index.html';
    });
  }

  refreshCartBadge();
}

async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  if (!isLoggedIn()) {
    badge.style.display = 'none';
    return;
  }

  try {
    const cart = await apiFetch('/cart');
    if (cart.totalItems > 0) {
      badge.textContent = cart.totalItems;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', renderNav);
