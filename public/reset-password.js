document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('resetForm');
  const statusMsg = document.getElementById('statusMessage');

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // No token = invalid link
  if (!token) {
    form.style.display = 'none';
    statusMsg.style.display = 'block';
    statusMsg.style.background = 'rgba(244, 67, 54, 0.2)';
    statusMsg.style.border = '1px solid rgba(244, 67, 54, 0.3)';
    statusMsg.style.color = '#f44336';
    statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid reset link. <a href="forgot-password.html" style="color:#ff4dd2;">Request a new one</a>';
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = form.querySelector('.login-btn');

    // Passwords must match
    if (newPassword !== confirmPassword) {
      statusMsg.style.display = 'block';
      statusMsg.style.background = 'rgba(244, 67, 54, 0.2)';
      statusMsg.style.border = '1px solid rgba(244, 67, 54, 0.3)';
      statusMsg.style.color = '#f44336';
      statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Passwords do not match.';
      return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    btn.disabled = true;
    statusMsg.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();
      statusMsg.style.display = 'block';

      if (response.status === 429) {
        statusMsg.style.background = 'rgba(255, 193, 7, 0.2)';
        statusMsg.style.border = '1px solid rgba(255, 193, 7, 0.3)';
        statusMsg.style.color = '#FFC107';
        statusMsg.innerHTML = '<i class="fas fa-clock"></i> Too many attempts. Please wait <strong>15 minutes</strong> before trying again.';
        btn.innerHTML = '<i class="fas fa-lock"></i> Reset Password';
        btn.disabled = false;

      } else if (response.ok) {
        statusMsg.style.background = 'rgba(76, 175, 80, 0.2)';
        statusMsg.style.border = '1px solid rgba(76, 175, 80, 0.3)';
        statusMsg.style.color = '#4CAF50';
        statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Password reset successful! Redirecting to login...';
        form.style.display = 'none';

        // Redirect to login after 3 seconds
        setTimeout(() => window.location.href = 'login.html', 3000);

      } else {
        statusMsg.style.background = 'rgba(244, 67, 54, 0.2)';
        statusMsg.style.border = '1px solid rgba(244, 67, 54, 0.3)';
        statusMsg.style.color = '#f44336';
        statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + data.message;
        btn.innerHTML = '<i class="fas fa-lock"></i> Reset Password';
        btn.disabled = false;
      }

    } catch (error) {
      statusMsg.style.display = 'block';
      statusMsg.style.background = 'rgba(244, 67, 54, 0.2)';
      statusMsg.style.border = '1px solid rgba(244, 67, 54, 0.3)';
      statusMsg.style.color = '#f44336';
      statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Network error. Please try again.';
      btn.innerHTML = '<i class="fas fa-lock"></i> Reset Password';
      btn.disabled = false;
    }
  });
});