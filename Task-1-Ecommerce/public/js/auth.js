function getNextUrl() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next || 'index.html';
}

function showAuthAlert(message, type = 'error') {
  const alertArea = document.getElementById('alert-area');
  alertArea.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuth(data);
      window.location.href = getNextUrl();
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      showAuthAlert('Passwords do not match');
      return;
    }

    submitBtn.disabled = true;
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      setAuth(data);
      window.location.href = getNextUrl();
    } catch (err) {
      showAuthAlert(err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
}
