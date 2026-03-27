document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('forgotForm');
  const statusMsg = document.getElementById('statusMessage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const btn = form.querySelector('.login-btn');

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    statusMsg.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      statusMsg.style.display = 'block';

      if (response.status === 429) {
        statusMsg.style.background = 'rgba(255, 193, 7, 0.2)';
        statusMsg.style.border = '1px solid rgba(255, 193, 7, 0.3)';
        statusMsg.style.color = '#FFC107';
        statusMsg.innerHTML = '<i class="fas fa-clock"></i> Too many attempts. Please wait <strong>15 minutes</strong> before trying again.';
      } else {
        statusMsg.style.background = 'rgba(76, 175, 80, 0.2)';
        statusMsg.style.border = '1px solid rgba(76, 175, 80, 0.3)';
        statusMsg.style.color = '#4CAF50';
        statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> ' + data.message;
      }

    } catch (error) {
      statusMsg.style.display = 'block';
      statusMsg.style.background = 'rgba(244, 67, 54, 0.2)';
      statusMsg.style.border = '1px solid rgba(244, 67, 54, 0.3)';
      statusMsg.style.color = '#f44336';
      statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Network error. Please try again.';
    } finally {
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
      btn.disabled = false;
    }
  });
});