const ordersRoot = document.getElementById('orders-root');
const ordersAlertArea = document.getElementById('alert-area');

function showOrdersAlert(message, type = 'error') {
  ordersAlertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

async function loadOrders() {
  if (!requireLogin('orders.html')) return;

  try {
    const orders = await apiFetch('/orders/myorders');
    renderOrders(orders);
  } catch (err) {
    showOrdersAlert(err.message);
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersRoot.innerHTML = `
      <div class="empty-state">
        <p>You haven't placed any orders yet.</p>
        <a class="btn btn-primary" href="index.html">Start Shopping</a>
      </div>
    `;
    return;
  }

  const rows = orders
    .map(
      (order) => `
      <tr>
        <td><a href="order-detail.html?id=${order._id}">${order._id.slice(-8).toUpperCase()}</a></td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>${order.items.length} item(s)</td>
        <td>${formatPrice(order.totalAmount)}</td>
        <td><span class="status-pill status-${order.status}">${order.status}</span></td>
        <td><a href="order-detail.html?id=${order._id}">View</a></td>
      </tr>
    `
    )
    .join('');

  ordersRoot.innerHTML = `
    <table class="orders-table">
      <thead>
        <tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

loadOrders();
