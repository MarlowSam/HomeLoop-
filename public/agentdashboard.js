// ✅ Agent Dashboard - Complete with Chat System (FIXED)
document.addEventListener('DOMContentLoaded', async function() {
  // Wait for auth cookie
  await new Promise(resolve => setTimeout(resolve, 200));

  // 🔐 Check authentication
  try {
    console.log('Checking authentication...');
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });

    console.log('Auth check response:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Auth data:', data);

      if (!data.isAuthenticated) {
        window.location.href = 'login.html';
        return;
      }

      if (data.user.role !== 'agent') {
        window.location.href = 'index.html';
        return;
      }

      console.log('✅ Agent authenticated:', data.user);
      updateDashboardWithUserInfo(data.user);
      
      // 🆕 Load all dashboard data AND check inquiries
      await Promise.all([
        loadDashboardData(),
        checkForInquiries()
      ]);
    } else {
      console.log('Auth failed, redirecting...');
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = 'login.html';
  }

  // 🧠 Fill dashboard with user info
  function updateDashboardWithUserInfo(user) {
    const welcomeElement = document.querySelector('#overview h1');
    if (welcomeElement && user.full_name) {
      welcomeElement.textContent = `Welcome, ${user.full_name}`;
    }

    if (user.full_name) document.getElementById('fullName').value = user.full_name || '';
    if (user.phone_number) document.getElementById('phone').value = user.phone_number || '';
    if (user.email) document.getElementById('email').value = user.email || '';
    if (user.licence_number) document.getElementById('licenseNumber').value = user.licence_number || '';
    
    // Update verification status in overview
    if (user.licence_number && user.licence_number.trim() !== '') {
      const verifiedText = document.querySelector('.verified-text');
      if (verifiedText) {
        verifiedText.textContent = 'Verified Agent';
        verifiedText.style.color = '#4CAF50';
      }
    } else {
      const verifiedText = document.querySelector('.verified-text');
      if (verifiedText) {
        verifiedText.textContent = 'Not Verified';
        verifiedText.style.color = '#f44336';
      }
    }
  }

  // 🚪 Logout
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', async e => {
      e.preventDefault();
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  });

  // 🧭 Sidebar navigation - FIXED FOR MOBILE
  const navLinks = document.querySelectorAll('.sidebar a[data-target]');
  const sections = document.querySelectorAll('.main-content section');
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');

  // Hamburger click - FIXED
  hamburger?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Hamburger clicked!');
    sidebar.classList.toggle('active');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 1024 && 
        sidebar && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !hamburger.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active from all
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Add active to clicked
      this.classList.add('active');
      const targetSection = document.getElementById(this.dataset.target);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Close mobile menu
      if (window.innerWidth <= 1024 && sidebar) {
        sidebar.classList.remove('active');
      }
    });
  });

  // 🖼️ Profile photo preview
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');

  photoInput?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => (photoPreview.src = e.target.result);
      reader.readAsDataURL(file);
    }
  });

  // 🏠 Add Listing Form
  const addListingBtn = document.getElementById('addListingBtn');
  const addListingForm = document.getElementById('addListingForm');
  const cancelListingBtn = document.getElementById('cancelListingBtn');
  const newListingForm = document.getElementById('newListingForm');

  addListingBtn?.addEventListener('click', () => {
    addListingForm.style.display = 'block';
    addListingForm.scrollIntoView({ behavior: 'smooth' });
  });

  cancelListingBtn?.addEventListener('click', () => {
    addListingForm.style.display = 'none';
    newListingForm.reset();
    document.getElementById('heroPreviewContainer').innerHTML = '';
    document.getElementById('galleryPreviewContainer').innerHTML = '';
  });

  // 🖼️ Hero Image Preview (Single Image)
  const heroImage = document.getElementById('heroImage');
  const heroPreviewContainer = document.getElementById('heroPreviewContainer');
  let selectedHeroImage = null;

  heroImage?.addEventListener('change', e => {
    const file = e.target.files[0];
    heroPreviewContainer.innerHTML = '';
    selectedHeroImage = null;

    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        selectedHeroImage = file;
        const div = document.createElement('div');
        div.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.className = 'remove-image';
        
        removeBtn.onclick = () => {
          div.remove();
          selectedHeroImage = null;
          heroImage.value = '';
        };

        div.appendChild(img);
        div.appendChild(removeBtn);
        heroPreviewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    }
  });

  // 🖼️ Gallery Images Preview (Up to 3 Images)
  const galleryImages = document.getElementById('galleryImages');
  const galleryPreviewContainer = document.getElementById('galleryPreviewContainer');
  let selectedGalleryImages = [];

  galleryImages?.addEventListener('change', e => {
    const files = Array.from(e.target.files).slice(0, 3);
    galleryPreviewContainer.innerHTML = '';
    selectedGalleryImages = [];

    if (files.length > 3) {
      alert('You can only upload up to 3 gallery images. First 3 selected.');
    }

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        selectedGalleryImages.push(file);
        const div = document.createElement('div');
        div.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.className = 'remove-image';
        
        removeBtn.onclick = () => {
          div.remove();
          selectedGalleryImages.splice(index, 1);
        };

        div.appendChild(img);
        div.appendChild(removeBtn);
        galleryPreviewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // 🏡 New listing form - UPDATED WITH 2% CALCULATION
  let currentListingData = null;
  newListingForm?.addEventListener('submit', e => {
    e.preventDefault();
    
    if (!selectedHeroImage) {
      alert('Please select a hero image');
      return;
    }
    
    const price = parseFloat(document.getElementById('propertyPrice').value);
    
    // Calculate 2% featured fee with minimum of 50 Ksh
    const featuredFee = Math.max(50, Math.ceil(price * 0.02));
    
    currentListingData = {
      heroImage: selectedHeroImage,
      galleryImages: selectedGalleryImages,
      location: document.getElementById('propertyLocation').value,
      type: document.getElementById('propertyType').value,
      bedrooms: document.getElementById('bedrooms').value,
      bathrooms: document.getElementById('bathrooms').value,
      price: price,
      unitsAvailable: document.getElementById('unitsAvailable').value,
      additionalInfo: document.getElementById('additionalInfo').value,
      featuredFee: featuredFee
    };
    
    // Update modal with calculated fee
    updateFeaturedModalPrice(featuredFee);
    
    document.getElementById('featuredModal').style.display = 'flex';
  });

  // 💰 Update Featured Modal Price Display
  function updateFeaturedModalPrice(amount) {
    const priceElement = document.querySelector('.price-highlight');
    const payButton = document.getElementById('payFeaturedBtn');
    
    if (priceElement) {
      priceElement.textContent = `Ksh ${amount.toLocaleString('en-KE')}`;
    }
    
    if (payButton) {
      const buttonIcon = payButton.querySelector('i');
      payButton.innerHTML = '';
      if (buttonIcon) payButton.appendChild(buttonIcon);
      payButton.appendChild(document.createTextNode(` Pay Ksh ${amount.toLocaleString('en-KE')} & Feature`));
    }
    
    console.log('✅ Featured fee calculated:', amount, 'Ksh');
  }

  // 💳 Featured modal - M-PESA ACTIVE
  const featuredModal = document.getElementById('featuredModal');
  const payFeaturedBtn = document.getElementById('payFeaturedBtn');
  const skipFeaturedBtn = document.getElementById('skipFeaturedBtn');

  payFeaturedBtn?.addEventListener('click', async () => {
    await promptPhoneAndPay(currentListingData.featuredFee);
  });

  skipFeaturedBtn?.addEventListener('click', async () => {
    await submitProperty(0);
  });

  // 📤 Submit property function (for skip - no payment)
  function showSuccessModal(message) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(255, 77, 210, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.3);
    z-index: 10000;
    font-size: 0.95rem;
    font-weight: 500;
  `;
  
  modal.textContent = message;
  document.body.appendChild(modal);
  
  setTimeout(() => modal.remove(), 2000);
}
  async function submitProperty(isFeatured) {
    console.log('🟢 Uploading new property to backend...');

    const formData = new FormData();
    
    const location = currentListingData.location.trim();
    const locationParts = location.split(',').map(part => part.trim());
    const city = locationParts[locationParts.length - 1] || location;
    
    formData.append('title', `${currentListingData.type} in ${location}`);
    formData.append('description', currentListingData.additionalInfo || '');
    formData.append('property_type', currentListingData.type);
    formData.append('listing_type', 'rent');
    formData.append('price', currentListingData.price);
    formData.append('bedrooms', currentListingData.bedrooms);
    formData.append('bathrooms', currentListingData.bathrooms);
    formData.append('address_line1', location);
    formData.append('city', city);
    formData.append('units_available', currentListingData.unitsAvailable);
    formData.append('is_featured', isFeatured);

    formData.append('images', currentListingData.heroImage);
    
    currentListingData.galleryImages.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      console.log('✅ Upload response:', result);

      if (response.ok) {
        showSuccessModal(`Success! Your listing has been added${isFeatured ? ' as Featured' : ' to My Properties'}.`);
        
        featuredModal.style.display = 'none';
        addListingForm.style.display = 'none';
        newListingForm.reset();
        heroPreviewContainer.innerHTML = '';
        galleryPreviewContainer.innerHTML = '';
        selectedHeroImage = null;
        selectedGalleryImages = [];
        
        // Reload dashboard data
        await loadDashboardData();
      } else {
        alert(`❌ Failed to add listing: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🚨 Upload error:', error);
      alert('❌ Error uploading property. Check console for details.');
    }
  }

  // 📱 Prompt for phone number before payment
  async function promptPhoneAndPay(featuredFee) {
    const authResponse = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    const authData = await authResponse.json();
    const profilePhone = authData.user.phone_number || '';
    
    const phoneModal = document.createElement('div');
    phoneModal.className = 'modal-overlay';
    phoneModal.style.cssText = `
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `;
    
    phoneModal.innerHTML = `
      <div style="background: white; border-radius: 12px; max-width: 450px; width: 90%; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <h2 style="margin: 0 0 1rem 0; color: #333;">
          <i class="fas fa-mobile-alt" style="color: #4CAF50;"></i> 
          Enter M-Pesa Phone Number
        </h2>
        
        <p style="color: #666; margin-bottom: 1.5rem; font-size: 0.95rem;">
          The STK push will be sent to this number. Make sure it's registered with M-Pesa.
        </p>
        
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #333;">
            Phone Number *
          </label>
          <input 
            type="tel" 
            id="mpesaPhoneInput" 
            value="${profilePhone}"
            placeholder="e.g., 0712345678 or 254712345678"
            style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box;"
          />
          <small style="display: block; margin-top: 0.5rem; color: #666;">
            Format: 0712345678 or 254712345678 or +254712345678
          </small>
        </div>
        
        <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #666; font-weight: 500;">Amount to Pay:</span>
            <span style="color: #4CAF50; font-size: 1.25rem; font-weight: bold;">Ksh ${featuredFee.toLocaleString()}</span>
          </div>
        </div>
        
        <div style="display: flex; gap: 0.75rem;">
          <button 
            id="confirmPaymentBtn" 
            style="flex: 1; padding: 0.85rem; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem;"
          >
            <i class="fas fa-credit-card"></i>
            Send STK Push
          </button>
          <button 
            id="cancelPaymentBtn" 
            style="padding: 0.85rem 1.5rem; background: #f5f5f5; color: #666; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;"
          >
            Cancel
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(phoneModal);
    
    const phoneInput = document.getElementById('mpesaPhoneInput');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const cancelBtn = document.getElementById('cancelPaymentBtn');
    
    phoneInput.focus();
    phoneInput.select();
    
    confirmBtn.addEventListener('click', async () => {
      const phoneNumber = phoneInput.value.trim();
      
      if (!phoneNumber) {
        alert('Please enter a phone number');
        phoneInput.focus();
        return;
      }
      
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      if (!/^(\+?254|0)[17]\d{8}$/.test(cleanPhone)) {
        alert('Invalid phone number format.\n\nPlease use:\n• 0712345678\n• 254712345678\n• +254712345678');
        phoneInput.focus();
        return;
      }
      
      phoneModal.remove();
      await submitPropertyWithPayment(featuredFee, phoneNumber);
    });
    
    cancelBtn.addEventListener('click', () => {
      phoneModal.remove();
    });
    
    phoneModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        phoneModal.remove();
      } else if (e.key === 'Enter') {
        confirmBtn.click();
      }
    });
    
    phoneModal.addEventListener('click', (e) => {
      if (e.target === phoneModal) {
        phoneModal.remove();
      }
    });
  }
  
  // 📤 Submit property WITH M-Pesa payment
  async function submitPropertyWithPayment(featuredFee, phoneNumber) {
    console.log('🟢 Uploading property with M-Pesa payment...');

    const formData = new FormData();
    
    const location = currentListingData.location.trim();
    const locationParts = location.split(',').map(part => part.trim());
    const city = locationParts[locationParts.length - 1] || location;
    
    formData.append('title', `${currentListingData.type} in ${location}`);
    formData.append('description', currentListingData.additionalInfo || '');
    formData.append('property_type', currentListingData.type);
    formData.append('listing_type', 'rent');
    formData.append('price', currentListingData.price);
    formData.append('bedrooms', currentListingData.bedrooms);
    formData.append('bathrooms', currentListingData.bathrooms);
    formData.append('address_line1', location);
    formData.append('city', city);
    formData.append('units_available', currentListingData.unitsAvailable);
    formData.append('is_featured', 0);

    formData.append('images', currentListingData.heroImage);
    
    currentListingData.galleryImages.forEach(image => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        const propertyId = result.propertyId;
        
        alert(`📱 Initiating M-Pesa payment...\n\nCheck your phone (${phoneNumber}) for the STK push prompt.\n\nAmount: Ksh ${featuredFee}`);
        
        const mpesaResponse = await fetch('/api/payments/mpesa/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            property_id: propertyId,
            amount: featuredFee,
            phone_number: phoneNumber
          })
        });
        
        const mpesaResult = await mpesaResponse.json();
        
        if (mpesaResponse.ok && mpesaResult.success) {
          alert(`✅ STK push sent!\n\nCheck your phone to complete payment.\n\nProperty ID: ${propertyId}`);
          
          featuredModal.style.display = 'none';
          addListingForm.style.display = 'none';
          newListingForm.reset();
          heroPreviewContainer.innerHTML = '';
          galleryPreviewContainer.innerHTML = '';
          selectedHeroImage = null;
          selectedGalleryImages = [];
          
          await loadDashboardData();
          pollPaymentStatus(mpesaResult.checkoutRequestId, propertyId);
        } else {
          alert(`❌ Failed to initiate M-Pesa payment:\n\n${mpesaResult.message || mpesaResult.error}\n\nProperty saved as regular listing.`);
          
          featuredModal.style.display = 'none';
          addListingForm.style.display = 'none';
          newListingForm.reset();
          heroPreviewContainer.innerHTML = '';
          galleryPreviewContainer.innerHTML = '';
          selectedHeroImage = null;
          selectedGalleryImages = [];
          await loadDashboardData();
        }
      } else {
        alert(`❌ Failed to add listing: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('🚨 Error:', error);
      alert('❌ Error uploading property. Check console for details.');
    }
  }
  
  // 🔄 Poll payment status
  async function pollPaymentStatus(checkoutRequestId, propertyId) {
    let attempts = 0;
    const maxAttempts = 40;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/
payments/status/${checkoutRequestId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const status = data.transaction.status;
          
          if (status === 'completed') {
            clearInterval(interval);
            alert(`🎉 Payment successful!\n\nYour property is now FEATURED!`);
            await loadDashboardData();
          } else if (status === 'failed' || status === 'cancelled') {
            clearInterval(interval);
            alert(`❌ Payment ${status}.\n\nProperty remains in regular listings.`);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 3000);
  }

  featuredModal?.addEventListener('click', e => {
    if (e.target === featuredModal) featuredModal.style.display = 'none';
  });

  // 👤 Profile form
  const profileForm = document.getElementById('profileForm');
  const successMessage = document.getElementById('successMessage');
  
  profileForm?.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = new FormData();
    
    formData.append('full_name', document.getElementById('fullName').value);
    formData.append('bio', document.getElementById('bio').value || '');
    formData.append('years_experience', document.getElementById('experience').value || '0');
    formData.append('phone_number', document.getElementById('phone').value);
    formData.append('whatsapp', document.getElementById('whatsapp')?.value || '');
    formData.append('facebook', document.getElementById('facebook')?.value || '');
    formData.append('linkedin', document.getElementById('linkedin')?.value || '');
    formData.append('instagram', document.getElementById('instagram')?.value || '');
    formData.append('specializations', document.getElementById('specializations')?.value || '');
    formData.append('areas_of_operation', document.getElementById('areasOfOperation')?.value || '');
    
    const photoInput = document.getElementById('photoInput');
    if (photoInput && photoInput.files.length > 0) {
      formData.append('profile_picture', photoInput.files[0]);
    }

    try {
      const response = await fetch('/api/agents/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        successMessage.style.display = 'block';
        setTimeout(() => (successMessage.style.display = 'none'), 3000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert(`Error updating profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error saving profile. Check console for details.');
    }
  });

  document.getElementById('overview')?.classList.add('active');
  document.querySelector('a[data-target="overview"]')?.classList.add('active');

  console.log('✅ Agent Dashboard loaded successfully');
});

// ============================================
// LOAD ALL DASHBOARD DATA
// ============================================
async function loadDashboardData() {
  const agentId = await getLoggedInAgentId();
  
  if (!agentId) {
    console.error('Agent not logged in');
    return;
  }
  
  await Promise.all([
    loadBookings(),
    loadAgentPropertiesWithInquiries(agentId),
    loadOverviewStats(agentId)
  ]);
  
}

// ============================================
// OVERVIEW STATS
// ============================================
async function loadOverviewStats(agentId) {
  try {
    const response = await fetch(`/api/agents/${agentId}/properties`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      const properties = data.properties || [];
      
      const totalListings = properties.length;
      const featuredListings = properties.filter(p => p.is_featured === 1).length;
      
      const totalListingsElement = document.querySelector('.stat-box:nth-child(1) strong');
      if (totalListingsElement) {
        totalListingsElement.textContent = totalListings;
      }
      
      const featuredListingsElement = document.querySelector('.stat-box:nth-child(3) strong');
      if (featuredListingsElement) {
        featuredListingsElement.textContent = featuredListings;
      }
    }
  } catch (error) {
    console.error('Error loading overview stats:', error);
  }
}

// ============================================
// 🆕 CHECK FOR INQUIRIES
// ============================================
async function checkForInquiries() {
  try {
    const response = await fetch('/api/chat/agent/inquiry-count', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const inquiryCount = data.inquiry_count || 0;
      
      updateInquiryBadge(inquiryCount);
      
      if (inquiryCount > 0) {
        showInquiryNotification(inquiryCount);
      }
    }
  } catch (error) {
    console.error('Error checking inquiries:', error);
  }
}

function updateInquiryBadge(count) {
  const badge = document.getElementById('inquiryBadge');
  
  if (badge) {
    if (count > 0) {
      badge.textContent = `🔴 ${count} ${count === 1 ? 'Inquiry' : 'Inquiries'}`;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function showInquiryNotification(count) {
  const existingModal = document.getElementById('inquiryNotificationModal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'inquiryNotificationModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 0, 31, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;
  
  modal.innerHTML = `
    <div style="background: #3b0047; border-radius: 15px; max-width: 400px; width: 90%; padding: 25px; box-shadow: 0 8px 35px rgba(255, 77, 210, 0.4); border: 2px solid rgba(255, 77, 210, 0.3); animation: slideUp 0.3s ease;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 60px; background: rgba(255, 77, 210, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; border: 2px solid #ff4dd2;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff4dd2" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <h3 style="margin: 0 0 10px 0; color: #ff4dd2; font-size: 1.3rem; font-weight: 600;">New ${count === 1 ? 'Inquiry' : 'Inquiries'}!</h3>
        <p style="margin: 0; color: #e0e0e0; font-size: 0.95rem; line-height: 1.5;">You have <strong style="color: #ff9900;">${count}</strong> new ${count === 1 ? 'inquiry' : 'inquiries'} waiting for your response.</p>
      </div>
      <button id="viewInquiriesBtn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 15px rgba(255, 77, 210, 0.3); margin-bottom: 8px;">
        View Inquiries
      </button>
      <button id="closeInquiryNotification" style="width: 100%; padding: 12px; background: transparent; color: #ff4dd2; border: 2px solid #ff4dd2; border-radius: 10px; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: all 0.3s ease;">
        Close
      </button>
    </div>
    <style>
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      #viewInquiriesBtn:hover { transform: translateY(-2px); box-shadow: 0 5px 22px rgba(255, 77, 210, 0.5); }
      #closeInquiryNotification:hover { background: rgba(255, 77, 210, 0.1); }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('viewInquiriesBtn').onclick = () => {
    modal.remove();
    document.querySelector('a[data-target="listings"]')?.click();
  };
  
  document.getElementById('closeInquiryNotification').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
// ============================================
// 🆕 LOAD PROPERTIES WITH INQUIRY INDICATORS
// ============================================
async function loadAgentPropertiesWithInquiries(agentId) {
  try {
    const propertiesResponse = await fetch(`/api/
agents/${agentId}/properties`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const inquiriesResponse = await fetch('/api/chat/agent/properties-with-inquiries', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      const properties = propertiesData.properties || [];
      
      let propertyIdsWithInquiries = [];
      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        propertyIdsWithInquiries = inquiriesData.property_ids || [];
      }
      
      console.log('✅ Properties with inquiries:', propertyIdsWithInquiries);
      
      const featuredProperties = properties.filter(p => p.is_featured === 1);
      const regularProperties = properties.filter(p => p.is_featured !== 1);
      
      // Sort: properties with inquiries first
      featuredProperties.sort((a, b) => {
        const aHasInquiry = propertyIdsWithInquiries.includes(a.property_id);
        const bHasInquiry = propertyIdsWithInquiries.includes(b.property_id);
        return (bHasInquiry ? 1 : 0) - (aHasInquiry ? 1 : 0);
      });
      
      regularProperties.sort((a, b) => {
        const aHasInquiry = propertyIdsWithInquiries.includes(a.property_id);
        const bHasInquiry = propertyIdsWithInquiries.includes(b.property_id);
        return (bHasInquiry ? 1 : 0) - (aHasInquiry ? 1 : 0);
      });
      
      const listingsSection = document.getElementById('listings');
      if (!listingsSection) return;
      
      const agentPropertiesContainers = listingsSection.querySelectorAll('.agent-properties');
      if (agentPropertiesContainers.length < 2) return;
      
      const featuredContainer = agentPropertiesContainers[0].querySelector('.house-cards');
      const regularContainer = agentPropertiesContainers[1].querySelector('.house-cards');
      
      if (featuredContainer) {
        displayPropertiesWithInquiries(featuredProperties, featuredContainer, propertyIdsWithInquiries, 'Featured');
      }
      
      if (regularContainer) {
        displayPropertiesWithInquiries(regularProperties, regularContainer, propertyIdsWithInquiries, 'Regular');
      }
    }
  } catch (error) {
    console.error('❌ Error loading properties with inquiries:', error);
  }
}

function displayPropertiesWithInquiries(properties, container, inquiryPropertyIds, sectionName) {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (properties.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 2rem; color: #666; width: 100%;">No ${sectionName.toLowerCase()} properties yet.</p>`;
    return;
  }
  
  properties.forEach(function(property) {
    const hasInquiry = inquiryPropertyIds.includes(property.property_id);
    const card = createPropertyCardWithInquiry(property, hasInquiry);
    container.appendChild(card);
  });
  
  console.log(`✅ ${sectionName} properties displayed with inquiry indicators`);
}

function createPropertyCardWithInquiry(property, hasInquiry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cursor = 'pointer';
  card.style.position = 'relative';
  
  const images = typeof property.images === 'string' ? JSON.parse(property.images) : property.images;
  const imageUrl = images && images.length > 0 
    ? `http://127.0.0.1:5000${images[0]}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const location = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  const price = Number(property.price).toLocaleString('en-KE');
  
  const inquiryBadge = hasInquiry 
    ? '<div style="background: #ff4444; color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; display: inline-block;">🔴 New Inquiry</div>' 
    : '';
  
  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location">${escapeHtml(location)}</p>
    <p class="type">${escapeHtml(property.property_type || 'Property')}</p>
    <p>${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
    <p class="price">Ksh ${price}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
    ${inquiryBadge}
  `;
  
  card.addEventListener('click', function() {
    if (hasInquiry) {
      openAgentChat(property.property_id);
    } else {
      window.location.href = `house.html?id=${property.property_id}`;
    }
  });
  
  return card;
}
// ============================================
// HELPER FUNCTIONS - MUST BE FIRST!
// ============================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// 🔧 FIXED: Get Current Agent ID from API
// ============================================
async function getCurrentAgentId() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Current user from API:', data.user);
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

// ============================================
// 🆕 OPEN AGENT CHAT - FIXED FOR MULTIPLE USERS
// ============================================
function openAgentChat(propertyId) {
  showConversationSelector(propertyId);
}

async function showConversationSelector(propertyId) {
  try {
    const response = await fetch(`/api/
chat/property/${propertyId}/conversations`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const conversations = data.conversations || [];
      
      if (conversations.length === 0) {
        alert('No inquiries found for this property.');
        return;
      }
      
      if (conversations.length === 1) {
        openChatWindow(conversations[0].conversation_id, propertyId);
        return;
      }
      
      displayConversationSelector(conversations, propertyId);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    alert('Failed to load conversations.');
  }
}

function displayConversationSelector(conversations, propertyId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 0, 31, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  let conversationListHTML = '';
  conversations.forEach((conv) => {
    const unreadBadge = conv.unread_count > 0 
      ? `<span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600;">${conv.unread_count} new</span>` 
      : '';
    
    const lastMessageTime = conv.last_message_time 
      ? new Date(conv.last_message_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'No messages yet';
    
    conversationListHTML += `
      <div class="conversation-item" data-conversation-id="${conv.conversation_id}" style="padding: 16px; border-bottom: 1px solid rgba(255, 77, 210, 0.15); cursor: pointer; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <strong style="color: #fff; font-size: 1rem;">${escapeHtml(conv.user_name || 'User')}</strong>
            ${unreadBadge}
          </div>
          <div style="color: #999; font-size: 0.85rem;">${escapeHtml(conv.last_message || 'Click to view conversation')}</div>
          <div style="color: #666; font-size: 0.75rem; margin-top: 4px;">${lastMessageTime}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4dd2" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    `;
  });
  
  modal.innerHTML = `
    <div style="background: #2d0036; border-radius: 10px; max-width: 500px; width: 90%; max-height: 70vh; padding: 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 77, 210, 0.2); overflow: hidden; display: flex; flex-direction: column;">
      <div style="background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); padding: 18px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Select Conversation (${conversations.length})
        </h3>
        <button class="close-modal" style="background: rgba(255, 255, 255, 0.15); border: none; color: white; font-size: 22px; cursor: pointer; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="flex: 1; overflow-y: auto;">
        ${conversationListHTML}
      </div>
    </div>
    <style>
      .close-modal:hover { background: rgba(255, 255, 255, 0.25); }
      .conversation-item:hover { background: rgba(255, 77, 210, 0.1); }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  
  modal.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const conversationId = item.dataset.conversationId;
      modal.remove();
      openChatWindow(conversationId, propertyId);
    });
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ============================================
// 🔧 FIXED: Chat Window with Async Agent ID
// ============================================
async function openChatWindow(conversationId, propertyId) {
  try {
    // Fetch messages
    const response = await fetch(`/api/
chat/conversations/${conversationId}/messages`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    const messages = data.messages || [];
    
    // ✅ Get current agent ID from API
    const currentUserId = await getCurrentAgentId();
    
    console.log('🔍 Opening chat - Agent ID:', currentUserId);
    console.log('🔍 Total messages:', messages.length);
    
    // Determine client name
    let clientName = 'Client';
    if (messages.length > 0) {
      const clientMessage = messages.find(msg => String(msg.sender_id) !== String(currentUserId));
      if (clientMessage) {
        clientName = clientMessage.sender_name || 'Client';
      }
    }
    
    // Create chat overlay
    const chatOverlay = document.createElement('div');
    chatOverlay.id = 'agentChatOverlay';
    chatOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(26, 0, 31, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      backdrop-filter: blur(4px);
    `;
    
    chatOverlay.innerHTML = `
      <div style="background: #2d0036; border-radius: 15px; width: 90%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 8px 35px rgba(255, 77, 210, 0.4); border: 2px solid rgba(255, 77, 210, 0.3); overflow: hidden;">
        
        <div style="background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 45px; height: 45px; background: rgba(255, 255, 255, 0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255, 255, 255, 0.4);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 600;">${escapeHtml(clientName)}</h3>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.85); font-size: 0.85rem;">Property Inquiry</p>
            </div>
          </div>
          <button id="closeAgentChat" style="background: rgba(255, 255, 255, 0.15); border: none; color: white; font-size: 24px; cursor: pointer; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
        </div>
        
        <div id="agentChatMessages" style="flex: 1; overflow-y: auto; padding: 20px; background: #1a001f;">
          <p style="text-align: center; color: #999;">Loading messages...</p>
        </div>
        
        <div style="padding: 16px 20px; border-top: 1px solid rgba(255, 77, 210, 0.2); display: flex; gap: 10px; background: #2d0036;">
          <input 
            type="text" 
            id="agentChatInput" 
            placeholder="Type your reply..." 
            style="flex: 1; padding: 12px 16px; border: 2px solid rgba(255, 77, 210, 0.3); border-radius: 25px; font-size: 0.95rem; background: #3b0047; color: #fff; outline: none; transition: border-color 0.2s;"
            onfocus="this.style.borderColor='#ff4dd2'"
            onblur="this.style.borderColor='rgba(255, 77, 210, 0.3)'"
          />
          <button id="agentSendMessage" style="padding: 12px 24px; background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); color: white; border: none; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: all 0.3s; box-shadow: 0 3px 15px rgba(255, 77, 210, 0.3); display: flex; align-items: center; gap: 6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Send
          </button>
        </div>
      </div>
      
      <style>
        #closeAgentChat:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        #agentSendMessage:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 22px rgba(255, 77, 210, 0.5);
        }
        
        #agentChatMessages::-webkit-scrollbar {
          width: 8px;
        }
        
        #agentChatMessages::-webkit-scrollbar-track {
          background: rgba(255, 77, 210, 0.05);
          border-radius: 10px;
        }
        
        #agentChatMessages::-webkit-scrollbar-thumb {
          background: rgba(255, 77, 210, 0.3);
          border-radius: 10px;
        }
        
        #agentChatMessages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 77, 210, 0.5);
        }
        
        #agentChatInput::placeholder {
          color: #999;
        }
      </style>
    `;
    
    document.body.appendChild(chatOverlay);
    
    // ✅ Display messages with correct agent ID
    await displayAgentChatMessages(messages, conversationId);
    
    // Event listeners
    document.getElementById('closeAgentChat').onclick = async function() {
      chatOverlay.remove();
      await checkForInquiries();
      const agentId = await getCurrentAgentId();
      if (agentId) {
        await loadAgentPropertiesWithInquiries(agentId);
      }
    };
    
    document.getElementById('agentSendMessage').onclick = function() {
      sendMessage(conversationId, propertyId);
    };
    
    document.getElementById('agentChatInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage(conversationId, propertyId);
      }
    });
    
    chatOverlay.onclick = function(e) {
      if (e.target === chatOverlay) {
        document.getElementById('closeAgentChat').click();
      }
    };
    
  } catch (error) {
    console.error('Error loading conversation:', error);
    alert('Failed to open chat window.');
  }
}

// ============================================
// 🔧 FIXED: Display Messages with Async Agent ID
// ============================================
async function displayAgentChatMessages(messages, conversationId) {
  const container = document.getElementById('agentChatMessages');
  if (!container) return;
  
  container.innerHTML = '';
  container.dataset.conversationId = conversationId;
  
  if (messages.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No messages yet. Start the conversation!</p>';
    return;
  }
  
  // ✅ Get current agent ID from API
  const currentUserId = await getCurrentAgentId();
  
  console.log('🔍 Current Agent ID:', currentUserId);
  console.log('🔍 Total messages:', messages.length);
  
  messages.forEach((message, index) => {
    const isOwnMessage = String(message.sender_id) === String(currentUserId);
    
    console.log(`📨 Message ${index + 1}:`, {
      sender_name: message.sender_name,
      sender_id: message.sender_id,
      currentUserId: currentUserId,
      isOwnMessage: isOwnMessage
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: ${isOwnMessage ? 'flex-end' : 'flex-start'};
    `;
    
    const timestamp = new Date(message.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const senderLabel = document.createElement('div');
    senderLabel.style.cssText = `
      font-size: 0.75rem;
      color: ${isOwnMessage ? '#4ade80' : '#ff4dd2'};
      font-weight: 600;
      margin-bottom: 4px;
      padding: 0 12px;
    `;
    senderLabel.textContent = isOwnMessage ? 'You' : escapeHtml(message.sender_name);
    
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 70%;
      padding: 12px 16px;
      border-radius: ${isOwnMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px'};
      background: ${isOwnMessage 
        ? 'rgba(34, 197, 94, 0.2)' 
        : '#3b0047'};
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 1px solid ${isOwnMessage ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 77, 210, 0.2)'};
    `;
    
    messageBubble.innerHTML = `
      <div style="margin-bottom: 6px; line-height: 1.4;">${escapeHtml(message.message_text)}</div>
      <div style="font-size: 0.7rem; opacity: 0.8; text-align: ${isOwnMessage ? 'right' : 'left'};">${timestamp}</div>
    `;
    
    messageDiv.appendChild(senderLabel);
    messageDiv.appendChild(messageBubble);
    container.appendChild(messageDiv);
  });
  
  container.scrollTop = container.scrollHeight;
}

// ============================================
// 🔧 FIXED: Load Chat Messages
// ============================================
async function loadChatMessages(conversationId) {
  try {
    const messagesResponse = await fetch(
      `/api/
chat/conversations/${conversationId}/messages`,
      { method: 'GET', credentials: 'include' }
    );
    
    if (messagesResponse.ok) {
      const messagesData = await messagesResponse.json();
      await displayAgentChatMessages(messagesData.messages || [], conversationId);
    }
  } catch (error) {
    console.error('Error loading chat messages:', error);
    const container = document.getElementById('agentChatMessages');
    if (container) {
      container.innerHTML = '<p style="text-align: center; color: #f44336;">Failed to load messages.</p>';
    }
  }
}

// ============================================
// Send Message
// ============================================
async function sendMessage(conversationId, propertyId) {
  const input = document.getElementById('agentChatInput');
  const messageText = input.value.trim();
  
  if (!messageText) return;
  
  try {
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message_text: messageText })
    });

    if (response.ok) {
      input.value = '';
      await markMessagesAsRead(conversationId);
      await loadChatMessages(conversationId);
      
      await checkForInquiries();
      const agentId = await getCurrentAgentId();
      if (agentId) {
        await loadAgentPropertiesWithInquiries(agentId);
      }
    } else {
      const error = await response.json();
      console.error('Send error:', error);
      alert('Failed to send message: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message');
  }
}

// ============================================
// Mark Messages as Read
// ============================================
async function markMessagesAsRead(conversationId) {
  try {
    await fetch(`/api/
chat/conversations/${conversationId}/read`, {
      method: 'PUT',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// ============================================
// BOOKINGS SECTION
// ============================================
async function loadBookings() {
  const tbody = document.querySelector('#bookings .booking-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2rem;">
        <i class="fas fa-spinner fa-spin"></i> Loading bookings...
      </td>
    </tr>
  `;
  
  try {
    const agentId = await getLoggedInAgentId();
    
    if (!agentId) {
      throw new Error('Agent not logged in');
    }
    
    const response = await fetch(`/api/bookings?agent_id=${agentId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      displayBookings(data.bookings || []);
      updateBookingCount(data.count || 0);
    } else {
      throw new Error('Failed to fetch bookings');
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #f44336;">
          <i class="fas fa-exclamation-triangle"></i><br><br>
          ${error.message === 'Agent not logged in' 
            ? 'Please log in to view bookings.' 
            : 'Failed to load bookings. Please check your connection and try again.'}
        </td>
      </tr>
    `;
  }
}

async function getLoggedInAgentId() {
  try {
    const response = await fetch('/api/auth/me', {
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

function displayBookings(bookings) {
  const tbody = document.querySelector('#bookings .booking-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
          <i class="fas fa-inbox"></i><br><br>
          No bookings yet. Bookings will appear here when clients book visits.
        </td>
      </tr>
    `;
    return;
  }
  
  bookings.forEach(function(booking) {
    const row = document.createElement('tr');
    
    const date = new Date(booking.preferred_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const formattedTime = formatTime(booking.preferred_time);
    const statusBadge = getStatusBadge(booking.status);
    
    row.innerHTML = `
      <td data-label="Booker Name">${escapeHtml(booking.full_name)}</td>
      <td data-label="Phone Number">${escapeHtml(booking.phone)}</td>
      <td data-label="Email">${escapeHtml(booking.email)}</td>
      <td data-label="Preferred Date">${formattedDate}</td>
      <td data-label="Preferred Time">${formattedTime}</td>
      <td data-label="Status">${statusBadge}</td>
    `;
    
    row.style.cursor = 'pointer';
    row.addEventListener('click', function() {
      showBookingDetails(booking);
    });
    
    tbody.appendChild(row);
  });
}

function formatTime(timeString) {
  if (!timeString) return 'Not specified';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
}

function getStatusBadge(status) {
  const badges = {
    pending: '<span style="background: #ff9800; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Pending</span>',
    confirmed: '<span style="background: #4CAF50; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Confirmed</span>',
    cancelled: '<span style="background: #f44336; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Cancelled</span>'
  };
  return badges[status] || badges.pending;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function showBookingDetails(booking) {
  const date = new Date(booking.preferred_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const time = formatTime(booking.preferred_time);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 0, 31, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const statusColor = booking.status === 'confirmed' ? '#4CAF50' : booking.status === 'cancelled' ? '#f44336' : '#ff9800';
  const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  
  modal.innerHTML = `
    <div style="background: #2d0036; border-radius: 10px; max-width: 450px; width: 90%; padding: 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 77, 210, 0.2); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); padding: 18px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Booking Details
        </h3>
        <button class="close-modal" style="background: rgba(255, 255, 255, 0.15); border: none; color: white; font-size: 22px; cursor: pointer; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 77, 210, 0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Client Name:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${escapeHtml(booking.full_name)}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Date:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${date}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Time:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${time}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #999; font-size: 0.9rem;">Status:</span>
            <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">${statusText}</span>
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-confirm" style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Confirm Booking
          </button>
          <button class="btn-cancel-booking" style="width: 100%; padding: 12px; background: transparent; color: #f44336; border: 1px solid #f44336; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
    <style>
      .close-modal:hover { background: rgba(255, 255, 255, 0.25); }
      .btn-confirm:hover { background: #45a049; }
      .btn-cancel-booking:hover { background: rgba(244, 67, 54, 0.08); }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });
  
  modal.querySelector('.btn-confirm').addEventListener('click', function() {
    updateBookingStatus(booking.id, 'confirmed');
    modal.remove();
  });
  
  modal.querySelector('.btn-cancel-booking').addEventListener('click', function() {
    updateBookingStatus(booking.id, 'cancelled');
    modal.remove();
  });
}
async function updateBookingStatus(bookingId, newStatus) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      await loadBookings();
      showNotification(`Booking ${newStatus} successfully!`, 'success');
    } else {
      throw new Error('Failed to update booking');
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    showNotification('Failed to update booking', 'error');
  }
}

async function deleteBooking(bookingId) {
  if (!confirm('Are you sure you want to delete this booking?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      await loadBookings();
      showNotification('Booking deleted successfully!', 'success');
    } else {
      throw new Error('Failed to delete booking');
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    showNotification('Failed to delete booking', 'error');
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10001;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(function() {
    notification.remove();
  }, 3000);
}

function updateBookingCount(count) {
  const bookingCountElement = document.querySelector('.stat-box:nth-child(2) strong');
  if (bookingCountElement) {
    bookingCountElement.textContent = count;
  }
}