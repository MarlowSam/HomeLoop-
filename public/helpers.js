// helpers.js - Utility Functions

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}

function formatTime(timeString) {
  if (!timeString) return 'Not specified';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
}

// ADD THIS MISSING FUNCTION
function showNotification(message, type = 'success') {
  const notificationClass = type === 'success' ? 'success-notification' : 
                           type === 'error' ? 'error-notification' : 
                           'info-notification';
  
  const notification = document.createElement('div');
  notification.className = notificationClass;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds with fade out
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showSuccessModal(message) {
  showNotification(message, 'success');
}

function showErrorModal(message) {
  showNotification(message, 'error');
}

function showInfoModal(message) {
  showNotification(message, 'info');
}

function showCustomAlert(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-alert-overlay';
    
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <p>${escapeHtml(message)}</p>
        <button class="custom-alert-btn">OK</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('.custom-alert-btn').onclick = () => {
      overlay.remove();
      resolve();
    };
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve();
      }
    };
  });
}

function showConfirmModal(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    
    overlay.innerHTML = `
      <div class="confirm-modal-box">
        <h3>Confirm Action</h3>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-modal-buttons">
          <button class="confirm-btn confirm-btn-primary" data-confirm="yes">Yes</button>
          <button class="confirm-btn confirm-btn-secondary" data-confirm="no">No</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.querySelectorAll('[data-confirm]').forEach(btn => {
      btn.onclick = () => {
        const confirmed = btn.dataset.confirm === 'yes';
        overlay.remove();
        resolve(confirmed);
      };
    });
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
}

// Show Loading Modal
function showLoadingModal(message = 'Processing...') {
  const overlay = document.createElement('div');
  overlay.className = 'loading-modal-overlay';
  overlay.id = 'loadingModal';
  
  overlay.innerHTML = `
    <div class="loading-modal-box">
      <div class="loading-spinner"></div>
      <p class="loading-modal-text">${escapeHtml(message)}</p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  return overlay;
}

// Hide Loading Modal
function hideLoadingModal() {
  const modal = document.getElementById('loadingModal');
  if (modal) {
    modal.remove();
  }
}

async function getCurrentAgentId() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user.userId;
    } else {
      console.error('❌ Failed to get current user - Status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching current user:', error);
    return null;
  }
}

async function getLoggedInAgentId() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.isAuthenticated && data.user) {
        if (data.user.role === 'agent') {
          return data.user.userId || data.user.user_id;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting agent ID:', error);
    return null;
  }
}

// Add fadeOut animation dynamically
if (!document.getElementById('helper-animations')) {
  const style = document.createElement('style');
  style.id = 'helper-animations';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, -20px); }
    }
  `;
  document.head.appendChild(style);
}