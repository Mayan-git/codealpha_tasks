const grid = document.getElementById('product-grid');
const emptyMessage = document.getElementById('empty-message');
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const alertArea = document.getElementById('alert-area');

let searchTimeout;

function showAlert(message, type = 'error') {
  alertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  setTimeout(() => (alertArea.innerHTML = ''), 3000);
}

function renderProducts(products) {
  grid.innerHTML = '';
  emptyMessage.style.display = products.length === 0 ? 'block' : 'none';

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const lowStock = product.stock > 0 && product.stock <= 5;
    card.innerHTML = `
      <a href="product.html?id=${product._id}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      </a>
      <div class="product-card-body">
        <span class="category-tag">${escapeHtml(product.category)}</span>
        <h3><a href="product.html?id=${product._id}">${escapeHtml(product.name)}</a></h3>
        <div class="price">${formatPrice(product.price)}</div>
        <div class="stock-note ${lowStock ? 'low' : ''}">
          ${product.stock === 0 ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${product._id}" ${product.stock === 0 ? 'disabled' : ''}>
            ${product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!isLoggedIn()) {
        window.location.href = `login.html?next=${encodeURIComponent('index.html')}`;
        return;
      }
      btn.disabled = true;
      try {
        await apiFetch('/cart', {
          method: 'POST',
          body: JSON.stringify({ productId: btn.dataset.id, quantity: 1 }),
        });
        showAlert('Added to cart', 'success');
        refreshCartBadge();
      } catch (err) {
        showAlert(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

async function loadCategories() {
  try {
    const categories = await apiFetch('/products/categories');
    categories.forEach((cat) => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('keyword', searchInput.value.trim());
  if (categorySelect.value && categorySelect.value !== 'All') params.set('category', categorySelect.value);

  try {
    const products = await apiFetch(`/products?${params.toString()}`);
    renderProducts(products);
  } catch (err) {
    showAlert(err.message);
  }
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadProducts, 300);
});
categorySelect.addEventListener('change', loadProducts);

loadCategories();
loadProducts();
