// listings.js - Property Listings Management with Bundle Package Support
// FIXED: Video upload now properly handles 2 videos

let selectedHeroImage = null;
let selectedGalleryImages = [];
let selectedVideos = [];
let currentListingData = null;

// Bundle data storage
let bundleProperties = [];

function initializeListingsSection() {
  const addListingBtn = document.getElementById('addListingBtn');
  const addBundleBtn = document.getElementById('addBundleBtn');
  const addListingForm = document.getElementById('addListingForm');
  const addBundleForm = document.getElementById('addBundleForm');
  const cancelListingBtn = document.getElementById('cancelListingBtn');
  const cancelBundleBtn = document.getElementById('cancelBundleBtn');
  const newListingForm = document.getElementById('newListingForm');
  const newBundleForm = document.getElementById('newBundleForm');

  addListingBtn?.addEventListener('click', () => {
    addListingForm.style.display = 'block';
    addBundleForm.style.display = 'none';
    addListingForm.scrollIntoView({ behavior: 'smooth' });
  });

  addBundleBtn?.addEventListener('click', () => {
    addBundleForm.style.display = 'block';
    addListingForm.style.display = 'none';
    addBundleForm.scrollIntoView({ behavior: 'smooth' });
  });

  cancelListingBtn?.addEventListener('click', () => {
    addListingForm.style.display = 'none';
    newListingForm.reset();
    clearListingPreviews();
  });

  cancelBundleBtn?.addEventListener('click', () => {
    addBundleForm.style.display = 'none';
    newBundleForm.reset();
    clearBundlePreviews();
  });

  setupImagePreviews();
  setupVideoPreviews();
  setupBundleImagePreviews();
  setupBundleVideoPreviews();
  setupNewListingForm();
  setupNewBundleForm();
  setupFeaturedModal();
  
  // Load agent properties initially
  loadAgentProperties();
}

function clearListingPreviews() {
  document.getElementById('heroPreviewContainer').innerHTML = '';
  document.getElementById('galleryPreviewContainer').innerHTML = '';
  document.getElementById('videoPreviewContainer').innerHTML = '';
  selectedHeroImage = null;
  selectedGalleryImages = [];
  selectedVideos = [];
}

function clearBundlePreviews() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`bundle${i}HeroPreview`).innerHTML = '';
    document.getElementById(`bundle${i}GalleryPreview`).innerHTML = '';
    document.getElementById(`bundle${i}VideoPreview`).innerHTML = '';
  }
  bundleProperties = [];
  
  // Clear bundle videos storage
  if (window.bundleVideos) {
    window.bundleVideos = {};
  }
}

// Setup image previews for regular listing
function setupImagePreviews() {
  const heroImage = document.getElementById('heroImage');
  const heroPreviewContainer = document.getElementById('heroPreviewContainer');

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

  const galleryImages = document.getElementById('galleryImages');
  const galleryPreviewContainer = document.getElementById('galleryPreviewContainer');

  galleryImages?.addEventListener('change', e => {
    const files = Array.from(e.target.files).slice(0, 3);
    galleryPreviewContainer.innerHTML = '';
    selectedGalleryImages = [];

    if (files.length > 3) {
      showNotification('You can only upload up to 3 gallery images. First 3 selected.', 'info');
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
}

// FIXED: Setup video previews for regular listing
function setupVideoPreviews() {
  const videoInput = document.getElementById('propertyVideos');
  const videoPreviewContainer = document.getElementById('videoPreviewContainer');

  videoInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    videoPreviewContainer.innerHTML = '';
    selectedVideos = []; // Clear the array completely

    if (e.target.files.length > 2) {
      showNotification('You can only upload up to 2 videos. First 2 selected.', 'info');
    }

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (100MB max)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        showNotification(`Video ${file.name} exceeds 100MB limit and will be skipped.`, 'error');
        continue;
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        showNotification(`File ${file.name} is not a valid video file.`, 'error');
        continue;
      }

      // Add to selectedVideos array BEFORE creating preview
      const currentIndex = selectedVideos.length;
      selectedVideos.push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'video-preview';
        div.setAttribute('data-video-index', currentIndex);
        
        const video = document.createElement('video');
        video.src = e.target.result;
        video.controls = false;
        video.muted = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.className = 'remove-video';
        
        // FIXED: Properly remove video using stored index
        removeBtn.onclick = () => {
          div.remove();
          // Remove from array by value to be safe
          const fileIndex = selectedVideos.indexOf(file);
          if (fileIndex > -1) {
            selectedVideos.splice(fileIndex, 1);
            console.log(`✅ Removed video. Remaining: ${selectedVideos.length}`);
          }
        };

        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        videoInfo.textContent = `${(file.size / (1024 * 1024)).toFixed(1)}MB`;

        div.appendChild(video);
        div.appendChild(removeBtn);
        div.appendChild(videoInfo);
        videoPreviewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    }

    console.log(`📹 Total videos loaded: ${selectedVideos.length}`);
  });
}

// Setup bundle image previews
function setupBundleImagePreviews() {
  for (let i = 1; i <= 4; i++) {
    setupBundleImagePreview(i);
  }
}

function setupBundleImagePreview(houseNum) {
  const heroInput = document.getElementById(`bundle${houseNum}HeroImage`);
  const heroPreview = document.getElementById(`bundle${houseNum}HeroPreview`);
  const galleryInput = document.getElementById(`bundle${houseNum}GalleryImages`);
  const galleryPreview = document.getElementById(`bundle${houseNum}GalleryPreview`);

  if (!heroInput || !galleryInput) return;

  heroInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    heroPreview.innerHTML = '';

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
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
          heroInput.value = '';
        };

        div.appendChild(img);
        div.appendChild(removeBtn);
        heroPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    }
  });

  galleryInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    galleryPreview.innerHTML = '';

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
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
        };

        div.appendChild(img);
        div.appendChild(removeBtn);
        galleryPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });
}

// Setup bundle video previews
function setupBundleVideoPreviews() {
  // Initialize bundle videos storage
  if (!window.bundleVideos) {
    window.bundleVideos = {};
  }
  
  for (let i = 1; i <= 4; i++) {
    window.bundleVideos[i] = [];
    setupBundleVideoPreview(i);
  }
}

// FIXED: Bundle video preview function
function setupBundleVideoPreview(houseNum) {
  const videoInput = document.getElementById(`bundle${houseNum}Videos`);
  const videoPreview = document.getElementById(`bundle${houseNum}VideoPreview`);

  if (!videoInput) return;

  // Ensure storage exists for this house
  if (!window.bundleVideos) {
    window.bundleVideos = {};
  }
  if (!window.bundleVideos[houseNum]) {
    window.bundleVideos[houseNum] = [];
  }

  videoInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    videoPreview.innerHTML = '';
    window.bundleVideos[houseNum] = []; // Clear this house's videos

    if (e.target.files.length > 2) {
      showNotification('You can only upload up to 2 videos per property.', 'info');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const maxSize = 100 * 1024 * 1024;
      
      if (file.size > maxSize) {
        showNotification(`Video exceeds 100MB limit.`, 'error');
        continue;
      }

      if (!file.type.startsWith('video/')) {
        showNotification(`Invalid video file.`, 'error');
        continue;
      }

      // Add to this house's video array
      const currentIndex = window.bundleVideos[houseNum].length;
      window.bundleVideos[houseNum].push(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'video-preview';
        div.setAttribute('data-video-index', currentIndex);
        
        const video = document.createElement('video');
        video.src = e.target.result;
        video.controls = false;
        video.muted = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.className = 'remove-video';
        
        // FIXED: Proper removal for bundle videos
        removeBtn.onclick = () => {
          div.remove();
          const fileIndex = window.bundleVideos[houseNum].indexOf(file);
          if (fileIndex > -1) {
            window.bundleVideos[houseNum].splice(fileIndex, 1);
            console.log(`✅ House ${houseNum}: Removed video. Remaining: ${window.bundleVideos[houseNum].length}`);
          }
        };

        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        videoInfo.textContent = `${(file.size / (1024 * 1024)).toFixed(1)}MB`;

        div.appendChild(video);
        div.appendChild(removeBtn);
        div.appendChild(videoInfo);
        videoPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    }

    console.log(`📹 House ${houseNum}: Total videos loaded: ${window.bundleVideos[houseNum].length}`);
  });
}

function setupNewListingForm() {
  const newListingForm = document.getElementById('newListingForm');
  
  newListingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedHeroImage) {
      await showCustomAlert('Please select a hero image');
      return;
    }
    
    const price = parseFloat(document.getElementById('propertyPrice').value);
    const viewingFee = parseFloat(document.getElementById('viewingFee').value);
    const featuredFee = Math.max(50, Math.ceil(price * 0.02));
    
    currentListingData = {
      heroImage: selectedHeroImage,
      galleryImages: selectedGalleryImages,
      videos: selectedVideos,
      location: document.getElementById('propertyLocation').value,
      type: document.getElementById('propertyType').value,
      bedrooms: document.getElementById('bedrooms').value,
      bathrooms: document.getElementById('bathrooms').value,
      price: price,
      viewingFee: viewingFee,
      unitsAvailable: document.getElementById('unitsAvailable').value,
      additionalInfo: document.getElementById('additionalInfo').value,
      featuredFee: featuredFee,
      isBundle: false
    };
    
    console.log(`📤 Submitting listing with ${selectedVideos.length} video(s)`);
    
    updateFeaturedModalPrice(featuredFee);
    document.getElementById('featuredModal').style.display = 'flex';
  });
}

function setupNewBundleForm() {
  const newBundleForm = document.getElementById('newBundleForm');
  
  newBundleForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bundleViewingFee = parseFloat(document.getElementById('bundleViewingFee').value);
    
    // Collect all bundle properties
    bundleProperties = [];
    
    for (let i = 1; i <= 4; i++) {
      const heroInput = document.getElementById(`bundle${i}HeroImage`);
      const location = document.getElementById(`bundle${i}Location`).value;
      
      // Skip optional properties 3 and 4 if not filled
      if (i > 2 && (!heroInput.files[0] || !location)) {
        continue;
      }
      
      // Properties 1 and 2 are required
      if (i <= 2 && (!heroInput.files[0] || !location)) {
        await showCustomAlert(`Property ${i} is required. Please fill in all required fields.`);
        return;
      }
      
      const galleryInput = document.getElementById(`bundle${i}GalleryImages`);
      const videoInput = document.getElementById(`bundle${i}Videos`);
      
      // Use the bundleVideos storage instead of input.files for videos
      const houseVideos = window.bundleVideos && window.bundleVideos[i] ? window.bundleVideos[i] : [];
      
      bundleProperties.push({
        heroImage: heroInput.files[0],
        galleryImages: Array.from(galleryInput.files || []).slice(0, 3),
        videos: houseVideos, // FIXED: Use stored videos
        location: location,
        type: document.getElementById(`bundle${i}Type`).value,
        bedrooms: document.getElementById(`bundle${i}Bedrooms`).value,
        bathrooms: document.getElementById(`bundle${i}Bathrooms`).value,
        price: document.getElementById(`bundle${i}Price`).value,
        unitsAvailable: document.getElementById(`bundle${i}Units`).value,
        additionalInfo: document.getElementById(`bundle${i}Info`).value
      });
      
      console.log(`📤 Property ${i}: ${houseVideos.length} video(s)`);
    }
    
    if (bundleProperties.length < 2) {
      await showCustomAlert('Bundle packages require at least 2 properties.');
      return;
    }
    
    // Calculate featured fee for bundle (based on average price)
    const avgPrice = bundleProperties.reduce((sum, p) => sum + parseFloat(p.price), 0) / bundleProperties.length;
    const featuredFee = Math.max(50, Math.ceil(avgPrice * 0.02));
    
    currentListingData = {
      isBundle: true,
      bundleViewingFee: bundleViewingFee,
      properties: bundleProperties,
      featuredFee: featuredFee
    };
    
    updateFeaturedModalPrice(featuredFee);
    document.getElementById('featuredModal').style.display = 'flex';
  });
}

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
}

function setupFeaturedModal() {
  const featuredModal = document.getElementById('featuredModal');
  const payFeaturedBtn = document.getElementById('payFeaturedBtn');
  const skipFeaturedBtn = document.getElementById('skipFeaturedBtn');

  payFeaturedBtn?.addEventListener('click', async () => {
    await promptPhoneAndPay(currentListingData.featuredFee);
  });

  skipFeaturedBtn?.addEventListener('click', async () => {
    if (currentListingData.isBundle) {
      await submitBundle(0);
    } else {
      await submitProperty(0);
    }
  });

  featuredModal?.addEventListener('click', e => {
    if (e.target === featuredModal) featuredModal.style.display = 'none';
  });
}

// ========================================
// PROPERTY SUBMISSION FUNCTIONS
// ========================================

async function submitProperty(isFeatured) {
  console.log(`🟢 Uploading property with ${selectedVideos.length} video(s)...`);
  
  const loadingModal = showLoadingModal('Uploading property...');

  const formData = new FormData();
  
  const location = currentListingData.location.trim();
  const locationParts = location.split(',').map(part => part.trim());
  const city = locationParts[locationParts.length - 1] || location;
  
  formData.append('title', `${currentListingData.type} in ${location}`);
  formData.append('description', currentListingData.additionalInfo || '');
  formData.append('property_type', currentListingData.type);
  formData.append('listing_type', 'rent');
  formData.append('price', currentListingData.price);
  formData.append('viewing_fee', currentListingData.viewingFee);
  formData.append('bedrooms', currentListingData.bedrooms);
  formData.append('bathrooms', currentListingData.bathrooms);
  formData.append('address_line1', location);
  formData.append('city', city);
  formData.append('units_available', currentListingData.unitsAvailable);
  formData.append('is_featured', isFeatured);
  formData.append('is_bundle', 0);

  formData.append('images', currentListingData.heroImage);
  
  currentListingData.galleryImages.forEach(image => {
    formData.append('images', image);
  });

  // FIXED: Properly append all videos
  currentListingData.videos.forEach((video, index) => {
    formData.append('videos', video);
    console.log(`📹 Appending video ${index + 1}: ${video.name}, ${(video.size / 1024 / 1024).toFixed(1)}MB`);
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();
    
    hideLoadingModal();

    if (response.ok) {
      console.log('🎉 Upload successful!');
      
      const message = isFeatured 
        ? 'Property added successfully as Featured!' 
        : 'Property added successfully!';
      
      showNotification(message, 'success');
      
      resetListingForm();
      await loadAgentProperties();
    } else {
      showNotification(`Failed to add listing: ${result.message || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    hideLoadingModal();
    console.error('🚨 Upload error:', error);
    showNotification('Error uploading property. Please try again.', 'error');
  }
}

async function submitBundle(isFeatured) {
  console.log('🟢 Uploading bundle package...');
  
  const loadingModal = showLoadingModal('Uploading bundle package...');

  try {
    // Create bundle record first
    const bundleResponse = await fetch(`${API_BASE_URL}/api/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        viewing_fee: currentListingData.bundleViewingFee,
        is_featured: isFeatured
      })
    });

    if (!bundleResponse.ok) {
      throw new Error('Failed to create bundle');
    }

    const bundleResult = await bundleResponse.json();
    const bundleId = bundleResult.bundleId;

    // Upload each property in the bundle
    for (let propIndex = 0; propIndex < currentListingData.properties.length; propIndex++) {
      const property = currentListingData.properties[propIndex];
      const formData = new FormData();
      
      const location = property.location.trim();
      const locationParts = location.split(',').map(part => part.trim());
      const city = locationParts[locationParts.length - 1] || location;
      
      formData.append('title', `${property.type} in ${location}`);
      formData.append('description', property.additionalInfo || '');
      formData.append('property_type', property.type);
      formData.append('listing_type', 'rent');
      formData.append('price', property.price);
      formData.append('viewing_fee', currentListingData.bundleViewingFee);
      formData.append('bedrooms', property.bedrooms);
      formData.append('bathrooms', property.bathrooms);
      formData.append('address_line1', location);
      formData.append('city', city);
      formData.append('units_available', property.unitsAvailable);
      formData.append('is_featured', isFeatured);
      formData.append('is_bundle', 1);
      formData.append('bundle_id', bundleId);

      formData.append('images', property.heroImage);
      
      property.galleryImages.forEach(image => {
        formData.append('images', image);
      });

      // FIXED: Properly append videos for each property
      property.videos.forEach((video, index) => {
        formData.append('videos', video);
        console.log(`📹 Property ${propIndex + 1}, Video ${index + 1}: ${video.name}`);
      });

      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to upload property in bundle`);
      }
    }

    hideLoadingModal();

    const message = isFeatured 
      ? 'Bundle package added successfully as Featured!' 
      : 'Bundle package added successfully!';
    
    showNotification(message, 'success');
    
    resetBundleForm();
    await loadAgentProperties();

  } catch (error) {
    hideLoadingModal();
    console.error('🚨 Bundle upload error:', error);
    showNotification('Error uploading bundle package. Please try again.', 'error');
  }
}

function resetListingForm() {
  const featuredModal = document.getElementById('featuredModal');
  const addListingForm = document.getElementById('addListingForm');
  const newListingForm = document.getElementById('newListingForm');
  
  featuredModal.style.display = 'none';
  addListingForm.style.display = 'none';
  newListingForm.reset();
  clearListingPreviews();
}

function resetBundleForm() {
  const featuredModal = document.getElementById('featuredModal');
  const addBundleForm = document.getElementById('addBundleForm');
  const newBundleForm = document.getElementById('newBundleForm');
  
  featuredModal.style.display = 'none';
  addBundleForm.style.display = 'none';
  newBundleForm.reset();
  clearBundlePreviews();
}

async function promptPhoneAndPay(featuredFee) {
  const authResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include'
  });
  
  const authData = await authResponse.json();
  const profilePhone = authData.user.phone_number || '';
  
  const phoneModal = document.createElement('div');
  phoneModal.className = 'phone-modal-overlay';
  
  phoneModal.innerHTML = `
    <div class="phone-modal-box">
      <div class="phone-modal-header">
        <h3>Enter M-Pesa Phone Number</h3>
        <p>The STK push will be sent to this number. Make sure it is registered with M-Pesa.</p>
      </div>
      
      <div class="phone-input-group">
        <label class="phone-input-label">Phone Number</label>
        <input 
          type="tel" 
          id="mpesaPhoneInput" 
          class="phone-input-field"
          value="${profilePhone}"
          placeholder="e.g., 0712345678 or 254712345678"
        />
        <span class="phone-input-hint">Format: 0712345678 or 254712345678 or +254712345678</span>
      </div>
      
      <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid rgba(76, 175, 80, 0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #aaa; font-weight: 500;">Amount to Pay:</span>
          <span style="color: #4caf50; font-size: 1.25rem; font-weight: bold;">Ksh ${featuredFee.toLocaleString()}</span>
        </div>
      </div>
      
      <div class="phone-modal-buttons">
        <button id="confirmPaymentBtn" class="phone-modal-btn phone-modal-btn-primary">
          Send STK Push
        </button>
        <button id="cancelPaymentBtn" class="phone-modal-btn phone-modal-btn-secondary">
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
      await showCustomAlert('Please enter a phone number');
      phoneInput.focus();
      return;
    }
    
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^(\+?254|0)[17]\d{8}$/.test(cleanPhone)) {
      await showCustomAlert('Invalid phone number format. Please use: 0712345678, 254712345678, or +254712345678');
      phoneInput.focus();
      return;
    }
    
    phoneModal.remove();
    
    if (currentListingData.isBundle) {
      await submitBundleWithPayment(featuredFee, phoneNumber);
    } else {
      await submitPropertyWithPayment(featuredFee, phoneNumber);
    }
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

async function submitPropertyWithPayment(featuredFee, phoneNumber) {
  console.log(`🟢 Uploading property with payment (${selectedVideos.length} videos)...`);
  
  const loadingModal = showLoadingModal('Uploading property...');

  const formData = new FormData();
  
  const location = currentListingData.location.trim();
  const locationParts = location.split(',').map(part => part.trim());
  const city = locationParts[locationParts.length - 1] || location;
  
  formData.append('title', `${currentListingData.type} in ${location}`);
  formData.append('description', currentListingData.additionalInfo || '');
  formData.append('property_type', currentListingData.type);
  formData.append('listing_type', 'rent');
  formData.append('price', currentListingData.price);
  formData.append('viewing_fee', currentListingData.viewingFee);
  formData.append('bedrooms', currentListingData.bedrooms);
  formData.append('bathrooms', currentListingData.bathrooms);
  formData.append('address_line1', location);
  formData.append('city', city);
  formData.append('units_available', currentListingData.unitsAvailable);
  formData.append('is_featured', 0);
  formData.append('is_bundle', 0);

  formData.append('images', currentListingData.heroImage);
  
  currentListingData.galleryImages.forEach(image => {
    formData.append('images', image);
  });

  currentListingData.videos.forEach(video => {
    formData.append('videos', video);
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/properties`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();
    
    hideLoadingModal();

    if (response.ok) {
      const propertyId = result.propertyId;
      
      showNotification(`Initiating M-Pesa payment. Check your phone for the STK push prompt.`, 'info');
      
      const mpesaResponse = await fetch(`${API_BASE_URL}/api/payments/mpesa/initiate`, {
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
        showNotification('STK push sent! Check your phone to complete payment.', 'success');
        resetListingForm();
        await loadAgentProperties();
        pollPaymentStatus(mpesaResult.checkoutRequestId, propertyId);
      } else {
        showNotification(`Failed to initiate M-Pesa payment. Property saved as regular listing.`, 'error');
        resetListingForm();
        await loadAgentProperties();
      }
    } else {
      showNotification(`Failed to add listing: ${result.message || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    hideLoadingModal();
    console.error('🚨 Error:', error);
    showNotification('Error uploading property. Please try again.', 'error');
  }
}

async function submitBundleWithPayment(featuredFee, phoneNumber) {
  console.log('🟢 Uploading bundle with payment...');
  
  const loadingModal = showLoadingModal('Uploading bundle package...');

  try {
    // Create bundle record first
    const bundleResponse = await fetch(`${API_BASE_URL}/api/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        viewing_fee: currentListingData.bundleViewingFee,
        is_featured: 0
      })
    });

    if (!bundleResponse.ok) {
      throw new Error('Failed to create bundle');
    }

    const bundleResult = await bundleResponse.json();
    const bundleId = bundleResult.bundleId;

    // Upload each property in the bundle
    for (const property of currentListingData.properties) {
      const formData = new FormData();
      
      const location = property.location.trim();
      const locationParts = location.split(',').map(part => part.trim());
      const city = locationParts[locationParts.length - 1] || location;
      
      formData.append('title', `${property.type} in ${location}`);
      formData.append('description', property.additionalInfo || '');
      formData.append('property_type', property.type);
      formData.append('listing_type', 'rent');
      formData.append('price', property.price);
      formData.append('viewing_fee', currentListingData.bundleViewingFee);
      formData.append('bedrooms', property.bedrooms);
      formData.append('bathrooms', property.bathrooms);
      formData.append('address_line1', location);
      formData.append('city', city);
      formData.append('units_available', property.unitsAvailable);
      formData.append('is_featured', 0);
      formData.append('is_bundle', 1);
      formData.append('bundle_id', bundleId);

      formData.append('images', property.heroImage);
      
      property.galleryImages.forEach(image => {
        formData.append('images', image);
      });

      property.videos.forEach(video => {
        formData.append('videos', video);
      });

      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to upload property in bundle`);
      }
    }

    hideLoadingModal();

    showNotification(`Initiating M-Pesa payment. Check your phone for the STK push prompt.`, 'info');
    
    const mpesaResponse = await fetch(`${API_BASE_URL}/api/payments/mpesa/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        bundle_id: bundleId,
        amount: featuredFee,
        phone_number: phoneNumber
      })
    });
    
    const mpesaResult = await mpesaResponse.json();
    
    if (mpesaResponse.ok && mpesaResult.success) {
      showNotification('STK push sent! Check your phone to complete payment.', 'success');
      resetBundleForm();
      await loadAgentProperties();
      pollPaymentStatus(mpesaResult.checkoutRequestId, null, bundleId);
    } else {
      showNotification(`Failed to initiate M-Pesa payment. Bundle saved as regular listing.`, 'error');
      resetBundleForm();
      await loadAgentProperties();
    }

  } catch (error) {
    hideLoadingModal();
    console.error('🚨 Bundle upload error:', error);
    showNotification('Error uploading bundle package. Please try again.', 'error');
  }
}

async function pollPaymentStatus(checkoutRequestId, propertyId, bundleId) {
  let attempts = 0;
  const maxAttempts = 40;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/status/${checkoutRequestId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const status = data.transaction.status;
        
        if (status === 'completed') {
          clearInterval(interval);
          showNotification('Payment successful! Your listing is now FEATURED!', 'success');
          await loadAgentProperties();
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(interval);
          showNotification(`Payment ${status}. Listing remains in regular listings.`, 'error');
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

// ========================================
// LOAD AND DISPLAY AGENT PROPERTIES WITH BUNDLE + INQUIRY SUPPORT
// ========================================

async function loadAgentProperties() {
  try {
    const agentId = await getLoggedInAgentId();
    
    if (!agentId) {
      console.error('No agent ID found');
      return;
    }
    
    console.log('Loading properties for agent:', agentId);

    const propertiesResponse = await fetch(`${API_BASE_URL}/api/properties/agent/${agentId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const inquiriesResponse = await fetch(`${API_BASE_URL}/api/chat/agent/properties-with-inquiries`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (propertiesResponse.ok) {
      const properties = await propertiesResponse.json();
      console.log('Properties loaded:', properties);
      
      let propertyIdsWithInquiries = [];
      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        propertyIdsWithInquiries = inquiriesData.property_ids || [];
      }
      
      // Group properties by bundle_id
      const bundleMap = new Map();
      const bundleInquiryMap = new Map(); // Track if ANY property in bundle has inquiry
      const regularProperties = [];
      
      properties.forEach(property => {
        if (property.is_bundle === 1 && property.bundle_id) {
          // This is a bundle property
          if (!bundleMap.has(property.bundle_id)) {
            bundleMap.set(property.bundle_id, []);
          }
          bundleMap.get(property.bundle_id).push(property);
          
          // Check if this property has an inquiry
          if (propertyIdsWithInquiries.includes(property.property_id)) {
            bundleInquiryMap.set(property.bundle_id, true);
          }
        } else {
          // Regular property (not part of bundle)
          regularProperties.push(property);
        }
      });
      
      // For each bundle, mark ONLY the first property with bundle tag
      // and mark it with inquiry if ANY property in the bundle has inquiry
      const bundleRepresentatives = [];
      bundleMap.forEach((bundleProperties, bundleId) => {
        // Sort by property_id to ensure consistent "first" property
        bundleProperties.sort((a, b) => a.property_id - b.property_id);
        
        const firstProperty = bundleProperties[0];
        
        // Mark this as the bundle representative
        firstProperty._isBundleRepresentative = true;
        firstProperty._bundleHasInquiry = bundleInquiryMap.has(bundleId);
        
        bundleRepresentatives.push(firstProperty);
      });
      
      // Combine bundles and regular properties
      const allDisplayProperties = [...bundleRepresentatives, ...regularProperties];
      
      // Separate featured and non-featured
      const featuredProperties = allDisplayProperties.filter(p => p.is_featured === 1);
      const nonFeaturedProperties = allDisplayProperties.filter(p => p.is_featured !== 1);
      
      // Sort by inquiry status (for bundles, check _bundleHasInquiry)
      featuredProperties.sort((a, b) => {
        const aHasInquiry = a._bundleHasInquiry || propertyIdsWithInquiries.includes(a.property_id);
        const bHasInquiry = b._bundleHasInquiry || propertyIdsWithInquiries.includes(b.property_id);
        return (bHasInquiry ? 1 : 0) - (aHasInquiry ? 1 : 0);
      });
      
      nonFeaturedProperties.sort((a, b) => {
        const aHasInquiry = a._bundleHasInquiry || propertyIdsWithInquiries.includes(a.property_id);
        const bHasInquiry = b._bundleHasInquiry || propertyIdsWithInquiries.includes(b.property_id);
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
        displayPropertiesWithInquiries(nonFeaturedProperties, regularContainer, propertyIdsWithInquiries, 'Regular');
      }
    } else {
      console.error('Failed to load properties:', propertiesResponse.status);
    }
  } catch (error) {
    console.error('❌ Error loading properties:', error);
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
}

function createPropertyCardWithInquiry(property, hasInquiry) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cursor = 'pointer';
  card.style.position = 'relative';
  
  const images = typeof property.images === 'string' ? JSON.parse(property.images) : property.images;
  // ✅ FIXED: Cloudinary URLs are already complete - no API_BASE_URL prefix needed
  const imageUrl = images && images.length > 0 
    ? images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const location = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  const price = Number(property.price).toLocaleString('en-KE');
  
  // Determine property type badge (Airbnb/Commercial - colored text only)
  let propertyTypeBadge = '';
  const propType = property.property_type || 'Property';
  
  if (propType === 'Airbnb') {
    propertyTypeBadge = '<span class="property-type-badge airbnb-badge">Airbnb</span>';
  } else if (propType === 'Commercial') {
    propertyTypeBadge = '<span class="property-type-badge commercial-badge">Commercial</span>';
  } else {
    propertyTypeBadge = `<p class="type">${escapeHtml(propType)}</p>`;
  }
  
  // Bundle tag - ONLY show if this is marked as bundle representative
  const isBundle = property._isBundleRepresentative === true;
  const bundleTag = isBundle 
    ? '<div class="bundle-tag"><i class="fa-solid fa-gift"></i> Bundle</div>' 
    : '';
  
  // Inquiry badge - check both direct inquiry and bundle inquiry
  const hasBundleInquiry = property._bundleHasInquiry === true;
  const showInquiryBadge = hasBundleInquiry || hasInquiry;
  
  const inquiryBadge = showInquiryBadge 
    ? '<div style="background: #ff4444; color: white; padding: 0.4rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; display: inline-block;">New Inquiry</div>' 
    : '';
  
  card.innerHTML = `
    ${bundleTag}
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${escapeHtml(location)}</p>
    ${propertyTypeBadge}
    <p>${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
    <p class="price">Ksh ${price}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
    ${inquiryBadge}
  `;
  
  card.addEventListener('click', function(e) {
  // ✅ If selection mode is active, let handleCardSelectionClick handle it
  if (selectionModeActive) return;
  if (showInquiryBadge) {
    openAgentChat(property.property_id);
  }
  
});
  
  // ✅ Attach property data for selection mode
card._selectionProperty = property;
card._selectionProperty._hasInquiry = showInquiryBadge;

// ✅ Attach long press for edit/delete
if (isBundle) {
  window.attachLongPress(card, property, showInquiryBadge, true);
} else {
  window.attachLongPress(card, property, showInquiryBadge, false);
}

return card;
}

console.log('✅ listings.js loaded - showSection function available:', typeof showSection);