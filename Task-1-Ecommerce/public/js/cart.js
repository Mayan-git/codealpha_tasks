const cartRoot = document.getElementById('cart-root');
const cartAlertArea = document.getElementById('alert-area');

function showCartAlert(message, type = 'error') {
  cartAlertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  setTimeout(() => (cartAlertArea.innerHTML = ''), 3000);
}

async function loadCart() {
  if (!requireLogin('cart.html')) return;

  try {
    const cart = await apiFetch('/cart');
    renderCart(cart);
  } catch (err) {
    showCartAlert(err.message);
  }
}

function renderCart(cart) {
  if (!cart.items.length) {
    cartRoot.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a class="btn btn-primary" href="index.html">Browse Products</a>
      </div>
    `;
    return;
  }

  const rows = cart.items
    .map(
      (item) => `
      <tr data-id="${item.product._id}">
        <td>
          <div class="cart-item-info">
            <img src="${escapeHtml(item.product.image)}" alt="${escapeHtml(item.product.name)}" />
            <a href="product.html?id=${item.product._id}">${escapeHtml(item.product.name)}</a>
          </div>
        </td>
        <td>${formatPrice(item.product.price)}</td>
        <td>
          <input type="number" class="cart-qty-input" min="1" max="${item.product.stock}" value="${item.quantity}" data-id="${item.product._id}" />
        </td>
        <td>${formatPrice(item.subtotal)}</td>
        <td><button class="btn btn-danger remove-btn" data-id="${item.product._id}">Remove</button></td>
      </tr>
    `
    )
    .join('');

  cartRoot.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cart-summary">
      <div class="summary-row"><span>Items</span><span>${cart.totalItems}</span></div>
      <div class="summary-row total"><span>Total</span><span>${formatPrice(cart.totalAmount)}</span></div>
      <button class="btn btn-primary btn-block mt-16" id="checkout-btn">Proceed to Checkout</button>
    </div>
  `;

  document.querySelectorAll('.cart-qty-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const quantity = Math.max(1, Number(input.value) || 1);
      try {
        const cart = await apiFetch(`/cart/${input.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity }),
        });
        renderCart(cart);
        refreshCartBadge();
      } catch (err) {
        showCartAlert(err.message);
        loadCart();
      }
    });
  });

  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const cart = await apiFetch(`/cart/${btn.dataset.id}`, { method: 'DELETE' });
        renderCart(cart);
        refreshCartBadge();
      } catch (err) {
        showCartAlert(err.message);
      }
    });
  });

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }
}

loadCart();
