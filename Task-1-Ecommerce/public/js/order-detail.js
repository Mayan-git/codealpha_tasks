const orderDetailRoot = document.getElementById('order-detail-root');
const orderDetailAlertArea = document.getElementById('alert-area');

function showOrderDetailAlert(message, type = 'error') {
  orderDetailAlertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

function getOrderId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function loadOrder() {
  if (!requireLogin('order-detail.html')) return;

  const id = getOrderId();
  if (!id) {
    orderDetailRoot.innerHTML = '<p class="empty-state">No order specified.</p>';
    return;
  }

  try {
    const order = await apiFetch(`/orders/${id}`);
    renderOrder(order);
  } catch (err) {
    showOrderDetailAlert(err.message);
  }
}

function renderOrder(order) {
  const justPlaced = new URLSearchParams(window.location.search).get('placed') === '1';
  const itemsHtml = order.items
    .map(
      (item) => `
      <div class="order-summary-item">
        <span>${escapeHtml(item.name)} &times; ${item.quantity}</span>
        <span>${formatPrice(item.price * item.quantity)}</span>
      </div>
    `
    )
    .join('');

  orderDetailRoot.innerHTML = `
    ${justPlaced ? '<div class="alert alert-success">Order placed successfully!</div>' : ''}
    <h1>Order #${order._id.slice(-8).toUpperCase()}</h1>
    <p><span class="status-pill status-${order.status}">${order.status}</span> &middot; Placed on ${new Date(order.createdAt).toLocaleString()}</p>

    <div class="checkout-layout">
      <div class="order-summary-card">
        <h2>Items</h2>
        ${itemsHtml}
        <div class="summary-row total"><span>Total</span><span>${formatPrice(order.totalAmount)}</span></div>
      </div>
      <div class="order-summary-card">
        <h2>Shipping Address</h2>
        <p>
          ${escapeHtml(order.shippingAddress.fullName)}<br />
          ${escapeHtml(order.shippingAddress.address)}<br />
          ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.postalCode)}<br />
          ${escapeHtml(order.shippingAddress.country)}
        </p>
        <h2>Payment Method</h2>
        <p>${escapeHtml(order.paymentMethod)}</p>
      </div>
    </div>
  `;
}

loadOrder();
