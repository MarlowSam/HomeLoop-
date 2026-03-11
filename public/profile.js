// profile.js - FINAL WORKING VERSION

// ===== NOTIFICATION SYSTEM =====
function showProfileSuccess(message) {
  const existing = document.getElementById('profileSuccessPopup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'profileSuccessPopup';
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      padding: 20px 35px;
      border-radius: 12px;
      z-index: 999999;
      font-size: 1.1rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    ">
      ✓ ${message}
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}

function showProfileError(message) {
  const existing = document.getElementById('profileErrorPopup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'profileErrorPopup';
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f44336 0%, #e53935 100%);
      color: white;
      padding: 20px 35px;
      border-radius: 12px;
      z-index: 999999;
      font-size: 1.1rem;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    ">
      ❌ ${message}
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}

function showProfileLoading() {
  const existing = document.getElementById('profileLoadingPopup');
  if (existing) existing.remove();
  
  const popup = document.createElement('div');
  popup.id = 'profileLoadingPopup';
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(26, 0, 31, 0.9);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: #3b0047;
        padding: 45px 55px;
        border-radius: 15px;
        text-align: center;
      ">
        <div style="
          width: 60px; height: 60px;
          border: 5px solid rgba(255, 77, 210, 0.2);
          border-top: 5px solid #ff4dd2;
          border-radius: 50%;
          margin: 0 auto 25px;
          animation: profileSpin 1s linear infinite;
        "></div>
        <p style="color: white; font-size: 1.15rem; margin: 0; font-weight: 600;">
          Saving Profile...
        </p>
      </div>
    </div>
  `;
  
  if (!document.getElementById('profileSpinStyle')) {
    const style = document.createElement('style');
    style.id = 'profileSpinStyle';
    style.textContent = `
      @keyframes profileSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(popup);
}

function hideProfileLoading() {
  const popup = document.getElementById('profileLoadingPopup');
  if (popup) popup.remove();
}

// ===== SAVE PROFILE =====
window.saveProfile = async function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  
  console.log('🚀 SAVE PROFILE CALLED');
  
  try {
    window.profileSaveInProgress = true;
    localStorage.setItem('lastActiveSection', 'profile');
    localStorage.setItem('profileSaveInProgress', 'true');
    window.savedSection = 'profile';
    
    showProfileLoading();
  
    const formData = new FormData();
    formData.append('full_name', document.getElementById('fullName').value);
    formData.append('bio', document.getElementById('bio').value || '');
    formData.append('years_experience', document.getElementById('experience').value || '0');
    formData.append('licence_number', document.getElementById('licenseNumber').value || '');
    formData.append('phone_number', document.getElementById('phone').value);
    formData.append('whatsapp', document.getElementById('whatsapp')?.value || '');
    formData.append('specializations', document.getElementById('specializations')?.value || '');
    formData.append('areas_of_operation', document.getElementById('areasOfOperation')?.value || '');
    
    const photoInput = document.getElementById('photoInput');
    if (photoInput && photoInput.files.length > 0) {
      formData.append('profile_picture', photoInput.files[0]);
      console.log('📸 Profile picture attached');
    }

    const response = await fetch(`${API_BASE_URL}/api/agents/profile`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    
    hideProfileLoading();
    
    if (response.ok) {
      const result = await response.json();
      window.profileSaveInProgress = false;
      localStorage.removeItem('profileSaveInProgress');
      
      if (result.profile_picture) {
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
          photoPreview.src = `${API_BASE_URL}${result.profile_picture}`;
        }
      }
      
      showProfileSuccess('Profile saved successfully!');
      window.savedSection = 'profile';
      localStorage.setItem('lastActiveSection', 'profile');
      localStorage.setItem('justSavedProfile', 'true');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } else {
      const errorData = await response.json();
      showProfileError(errorData.message || 'Failed to save profile');
      window.profileSaveInProgress = false;
    }
  } catch (error) {
    hideProfileLoading();
    console.error('❌ Error:', error);
    showProfileError('Network error. Please try again.');
    window.profileSaveInProgress = false;
    setTimeout(() => {
      if (typeof showSection === 'function') showSection('profile');
    }, 100);
  }
  
  return false;
}

// ===== INITIALIZATION =====
function initializeProfileSection() {
  console.log('🔧 Initializing profile section...');
  
  window.addEventListener('beforeunload', function(e) {
    if (window.profileSaveInProgress) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
  
  // ✅ FIXED: Change Photo button - uses addEventListener, no inline onclick
  // This is CSP-compliant and works on all browsers
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');

  if (changePhotoBtn && photoInput) {
    changePhotoBtn.addEventListener('click', function() {
      photoInput.click();
    });
    console.log('✅ Change photo button wired up');
  }
  
  // Photo preview on file select
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          photoPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Save button
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      saveProfile(e);
      return false;
    });
    console.log('✅ Save button wired up');
  }
  
  // Preview button
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Preview feature coming soon!');
    });
  }
  
  console.log('✅ Profile section initialized');
}

// Also fix inline onclicks in bookings section buttons
// These are handled in dashboardbookings.js but need CSP-safe wiring
document.addEventListener('DOMContentLoaded', function() {
  // Refresh bookings button
  const refreshBtn = document.querySelector('[onclick="loadBookings()"]');
  if (refreshBtn) {
    refreshBtn.removeAttribute('onclick');
    refreshBtn.addEventListener('click', function() {
      if (typeof loadBookings === 'function') loadBookings();
    });
  }

  // Export CSV button
  const exportBtn = document.querySelector('[onclick="exportBookingsToCSV()"]');
  if (exportBtn) {
    exportBtn.removeAttribute('onclick');
    exportBtn.addEventListener('click', function() {
      if (typeof exportBookingsToCSV === 'function') exportBookingsToCSV();
    });
  }

  // Withdrawal history refresh button
  const withdrawRefreshBtn = document.querySelector('[onclick="loadWithdrawalHistory()"]');
  if (withdrawRefreshBtn) {
    withdrawRefreshBtn.removeAttribute('onclick');
    withdrawRefreshBtn.addEventListener('click', function() {
      if (typeof loadWithdrawalHistory === 'function') loadWithdrawalHistory();
    });
  }
});

console.log(' profile.js loaded');