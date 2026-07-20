const summaryItemsEl = document.getElementById('order-summary-items');
const summaryTotalEl = document.getElementById('order-summary-total');
const checkoutAlertArea = document.getElementById('alert-area');
const checkoutForm = document.getElementById('checkout-form');
const placeOrderBtn = document.getElementById('place-order-btn');

function showCheckoutAlert(message, type = 'error') {
  checkoutAlertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

async function loadSummary() {
  if (!requireLogin('checkout.html')) return;

  try {
    const cart = await apiFetch('/cart');
    if (!cart.items.length) {
      showCheckoutAlert('Your cart is empty. Add items before checking out.');
      placeOrderBtn.disabled = true;
      summaryItemsEl.innerHTML = '';
      summaryTotalEl.innerHTML = '';
      return;
    }

    summaryItemsEl.innerHTML = cart.items
      .map(
        (item) => `
        <div class="order-summary-item">
          <span>${escapeHtml(item.product.name)} &times; ${item.quantity}</span>
          <span>${formatPrice(item.subtotal)}</span>
        </div>
      `
      )
      .join('');
    summaryTotalEl.innerHTML = `<span>Total</span><span>${formatPrice(cart.totalAmount)}</span>`;
  } catch (err) {
    showCheckoutAlert(err.message);
  }
}

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  placeOrderBtn.disabled = true;

  const shippingAddress = {
    fullName: document.getElementById('fullName').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    postalCode: document.getElementById('postalCode').value.trim(),
    country: document.getElementById('country').value.trim(),
  };
  const paymentMethod = document.getElementById('paymentMethod').value;

  try {
    const order = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress, paymentMethod }),
    });
    window.location.href = `order-detail.html?id=${order._id}&placed=1`;
  } catch (err) {
    showCheckoutAlert(err.message);
    placeOrderBtn.disabled = false;
  }
});

loadSummary();
