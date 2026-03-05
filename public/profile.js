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
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
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
          width: 60px;
          height: 60px;
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

// ===== SAVE PROFILE - THE ACTUAL FUNCTION =====
window.saveProfile = async function(event) {
  // NUCLEAR PREVENTION - catch the event if it exists
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  
  console.log('🚀🚀🚀 SAVE PROFILE CALLED! 🚀🚀🚀');
  
  try {
    // Set flag to prevent page unload
    window.profileSaveInProgress = true;
    
    // CRITICAL: Store that we're on profile section in localStorage
    try {
      localStorage.setItem('lastActiveSection', 'profile');
      localStorage.setItem('profileSaveInProgress', 'true');
      console.log('✅ Saved to localStorage: profile');
    } catch (e) {
      console.error('localStorage error:', e);
    }
    
    // Also set global variable
    window.savedSection = 'profile';
    
    showProfileLoading();
  
  const formData = new FormData();
  formData.append('full_name', document.getElementById('fullName').value);
  formData.append('bio', document.getElementById('bio').value || '');
  formData.append('years_experience', document.getElementById('experience').value || '0');
  formData.append('licence_number', document.getElementById('licenseNumber').value || '');
  formData.append('phone_number', document.getElementById('phone').value);
  formData.append('whatsapp', document.getElementById('whatsapp')?.value || '');
  
  // DON'T send facebook, linkedin, instagram as backend doesn't support them yet
  // formData.append('facebook', document.getElementById('facebook')?.value || '');
  // formData.append('linkedin', document.getElementById('linkedin')?.value || '');
  // formData.append('instagram', document.getElementById('instagram')?.value || '');
  
  formData.append('specializations', document.getElementById('specializations')?.value || '');
  formData.append('areas_of_operation', document.getElementById('areasOfOperation')?.value || '');
  
  const photoInput = document.getElementById('photoInput');
  if (photoInput && photoInput.files.length > 0) {
    formData.append('profile_picture', photoInput.files[0]);
    console.log('📸 Profile picture attached');
  }

  try {
    console.log('🌐 Making fetch request...');
    const response = await fetch(`${API_BASE_URL}/api/agents/profile`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });
    
    console.log('📡 Response received:', response.status);
    hideProfileLoading();
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅✅✅ Profile saved successfully! ✅✅✅');
      
      // Clear the progress flags
      window.profileSaveInProgress = false;
      localStorage.removeItem('profileSaveInProgress');
      
      // Update the profile picture preview if a new one was uploaded
      if (result.profile_picture) {
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
          photoPreview.src = `${API_BASE_URL}${result.profile_picture}`;
        }
      }
      
      showProfileSuccess('Profile saved successfully!');
      
      console.log('🔒 FORCING PROFILE SECTION TO STAY ACTIVE');
      
      // CRITICAL: Multiple attempts to force staying on profile
      window.savedSection = 'profile';
      localStorage.setItem('lastActiveSection', 'profile');
      localStorage.setItem('justSavedProfile', 'true');
      
      // DON'T try to call showSection - let the page reload and restore naturally
      console.log('✅ Profile saved - localStorage set for restoration');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } else {
      const errorData = await response.json();
      console.error('❌ Save failed:', errorData);
      showProfileError(errorData.message || 'Failed to save profile');
      window.profileSaveInProgress = false;
    }
  } catch (error) {
    hideProfileLoading();
    console.error('❌ CRITICAL Error:', error);
    console.error('Error stack:', error.stack);
    showProfileError('Network error. Please try again.');
    window.profileSaveInProgress = false;
    
    // Force stay on profile even on error
    setTimeout(() => {
      if (typeof showSection === 'function') {
        showSection('profile');
      }
    }, 100);
  }
  
  } catch (outerError) {
    // CATCH ANY ERROR AT ALL
    console.error('❌ OUTER CATCH - SOMETHING WENT VERY WRONG:', outerError);
    console.error('Error stack:', outerError.stack);
    hideProfileLoading();
    showProfileError('An error occurred. Please try again.');
    window.profileSaveInProgress = false;
    
    // Force stay on profile
    setTimeout(() => {
      if (typeof showSection === 'function') {
        showSection('profile');
      }
    }, 100);
  }
  
  // ALWAYS return false
  return false;
}

// ===== INITIALIZATION =====
function initializeProfileSection() {
  console.log('🔧 Initializing profile section...');
  
  // PREVENT ANY PAGE NAVIGATION
  window.addEventListener('beforeunload', function(e) {
    if (window.profileSaveInProgress) {
      console.log('⚠️ Blocking page unload - profile save in progress!');
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
  
  // Photo preview
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  
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
  
  // Attach save button handler
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    console.log('✅ Found save button, attaching handler');
    saveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('💾 Save button clicked via event listener');
      saveProfile(e);
      return false;
    });
  }
  
  // Preview button
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('Preview feature coming soon!');
    });
  }
  
  console.log('✅ Profile section initialized - save button ready in HTML');
}

console.log('✅ profile.js loaded');