const detailRoot = document.getElementById('product-detail-root');
const detailAlertArea = document.getElementById('alert-area');

function showDetailAlert(message, type = 'error') {
  detailAlertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  setTimeout(() => (detailAlertArea.innerHTML = ''), 3000);
}

function getProductId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function loadProduct() {
  const id = getProductId();
  if (!id) {
    detailRoot.innerHTML = '<p class="empty-state">No product specified.</p>';
    return;
  }

  try {
    const product = await apiFetch(`/products/${id}`);
    renderProduct(product);
  } catch (err) {
    detailRoot.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function renderProduct(product) {
  document.title = `${product.name} — ShopEasy`;
  const outOfStock = product.stock === 0;

  detailRoot.innerHTML = `
    <div class="product-detail">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      <div class="product-detail-info">
        <span class="category-tag">${escapeHtml(product.category)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="price">${formatPrice(product.price)}</div>
        <p class="description">${escapeHtml(product.description)}</p>
        <p class="stock-note ${product.stock <= 5 && !outOfStock ? 'low' : ''}">
          ${outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </p>
        ${
          outOfStock
            ? '<button class="btn btn-secondary" disabled>Out of stock</button>'
            : `
              <div class="qty-row">
                <label for="qty-input">Quantity:</label>
                <input type="number" id="qty-input" min="1" max="${product.stock}" value="1" />
              </div>
              <button class="btn btn-primary" id="add-to-cart-btn">Add to Cart</button>
            `
        }
      </div>
    </div>
  `;

  const addBtn = document.getElementById('add-to-cart-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      if (!isLoggedIn()) {
        window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      const qtyInput = document.getElementById('qty-input');
      const quantity = Math.max(1, Number(qtyInput.value) || 1);

      addBtn.disabled = true;
      try {
        await apiFetch('/cart', {
          method: 'POST',
          body: JSON.stringify({ productId: product._id, quantity }),
        });
        showDetailAlert('Added to cart', 'success');
        refreshCartBadge();
      } catch (err) {
        showDetailAlert(err.message);
      } finally {
        addBtn.disabled = false;
      }
    });
  }
}

loadProduct();
