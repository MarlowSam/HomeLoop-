// editlisting.js - Long press, edit and delete for single properties
// Depends on: listings.js, helpers.js, config.js

// ==========================================
// LONG PRESS DETECTION
// ==========================================
let longPressTimer = null;
const LONG_PRESS_DURATION = 600;

function attachLongPress(card, property, hasInquiry, isBundle = false) {
  // Touch events (mobile)
  card.addEventListener('touchstart', (e) => {
    longPressTimer = setTimeout(() => {
      e.preventDefault();
      if (isBundle) {
        showBundleActionMenu(property, e.touches[0].clientX, e.touches[0].clientY);
      } else {
        showPropertyActionMenu(property, hasInquiry, e.touches[0].clientX, e.touches[0].clientY);
      }
    }, LONG_PRESS_DURATION);
  }, { passive: true });

  card.addEventListener('touchend', () => clearTimeout(longPressTimer));
  card.addEventListener('touchmove', () => clearTimeout(longPressTimer));

  // Right click (desktop)
  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isBundle) {
      showBundleActionMenu(property, e.clientX, e.clientY);
    } else {
      showPropertyActionMenu(property, hasInquiry, e.clientX, e.clientY);
    }
  });
}

// ==========================================
// ACTION MENU — SINGLE PROPERTY
// ==========================================
function showPropertyActionMenu(property, hasInquiry, x, y) {
  document.querySelector('.property-action-menu')?.remove();

  const menu = document.createElement('div');
  menu.className = 'property-action-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${Math.min(y, window.innerHeight - 160)}px;
    left: ${Math.min(x, window.innerWidth - 200)}px;
    background: #2d0036;
    border: 1px solid rgba(255, 77, 210, 0.4);
    border-radius: 12px;
    padding: 8px;
    z-index: 99999;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    min-width: 180px;
    animation: menuSlideIn 0.15s ease;
  `;

  const editBtn = document.createElement('button');
  editBtn.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 12px 16px;
    background: none; border: none; color: white;
    font-size: 0.95rem; cursor: pointer; border-radius: 8px;
    transition: background 0.2s;
  `;
  editBtn.innerHTML = '<i class="fas fa-edit" style="color:#ff4dd2"></i> Edit Property';
  editBtn.onmouseenter = () => editBtn.style.background = 'rgba(255,77,210,0.15)';
  editBtn.onmouseleave = () => editBtn.style.background = 'none';
  editBtn.onclick = () => {
    menu.remove();
    openEditPropertyForm(property);
  };
  menu.appendChild(editBtn);

  if (!hasInquiry) {
    const deleteBtn = document.createElement('button');
    deleteBtn.style.cssText = `
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 12px 16px;
      background: none; border: none; color: white;
      font-size: 0.95rem; cursor: pointer; border-radius: 8px;
      transition: background 0.2s;
    `;
    deleteBtn.innerHTML = '<i class="fas fa-trash" style="color:#ff4444"></i> Delete Property';
    deleteBtn.onmouseenter = () => deleteBtn.style.background = 'rgba(255,68,68,0.15)';
    deleteBtn.onmouseleave = () => deleteBtn.style.background = 'none';
    deleteBtn.onclick = () => {
      menu.remove();
      confirmDeleteProperty(property);
    };
    menu.appendChild(deleteBtn);
  }

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 12px 16px;
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 0.95rem; cursor: pointer; border-radius: 8px;
    border-top: 1px solid rgba(255,255,255,0.1); margin-top: 4px;
    transition: background 0.2s;
  `;
  cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
  cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
  cancelBtn.onmouseleave = () => cancelBtn.style.background = 'none';
  cancelBtn.onclick = () => menu.remove();
  menu.appendChild(cancelBtn);

  const style = document.createElement('style');
  style.textContent = `@keyframes menuSlideIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }`;
  menu.appendChild(style);

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }, { once: true });
  }, 100);
}

// ==========================================
// ACTION MENU — BUNDLE
// ==========================================
function showBundleActionMenu(property, x, y) {
  document.querySelector('.property-action-menu')?.remove();

  const menu = document.createElement('div');
  menu.className = 'property-action-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${Math.min(y, window.innerHeight - 130)}px;
    left: ${Math.min(x, window.innerWidth - 200)}px;
    background: #2d0036;
    border: 1px solid rgba(255, 77, 210, 0.4);
    border-radius: 12px;
    padding: 8px;
    z-index: 99999;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    min-width: 180px;
    animation: menuSlideIn 0.15s ease;
  `;

  const editBtn = document.createElement('button');
  editBtn.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 12px 16px;
    background: none; border: none; color: white;
    font-size: 0.95rem; cursor: pointer; border-radius: 8px;
    transition: background 0.2s;
  `;
  editBtn.innerHTML = '<i class="fas fa-edit" style="color:#ff4dd2"></i> Edit Bundle';
  editBtn.onmouseenter = () => editBtn.style.background = 'rgba(255,77,210,0.15)';
  editBtn.onmouseleave = () => editBtn.style.background = 'none';
  editBtn.onclick = () => {
    menu.remove();
    window.openEditBundleForm(property);
  };
  menu.appendChild(editBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 12px 16px;
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 0.95rem; cursor: pointer; border-radius: 8px;
    border-top: 1px solid rgba(255,255,255,0.1); margin-top: 4px;
    transition: background 0.2s;
  `;
  cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
  cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
  cancelBtn.onmouseleave = () => cancelBtn.style.background = 'none';
  cancelBtn.onclick = () => menu.remove();
  menu.appendChild(cancelBtn);

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }, { once: true });
  }, 100);
}

// ==========================================
// EDIT PROPERTY FORM
// ==========================================
function openEditPropertyForm(property) {
  document.getElementById('editPropertyOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'editPropertyOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #1a0033 0%, #2d0052 100%);
    z-index: 10002; overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 1rem 1rem;
  `;

  const images = Array.isArray(property.images) ? property.images : JSON.parse(property.images || '[]');
  const videos = Array.isArray(property.videos) ? property.videos : JSON.parse(property.videos || '[]');

  // ✅ Separate hero (first image) from gallery (rest)
  const heroImage = images[0] || null;
  const galleryImages = images.slice(1);

  // Hero image same size as gallery thumbnails, no HERO badge
  const heroImageHTML = heroImage ? `
    <div class="edit-image-preview" data-url="${heroImage}" data-type="hero"
      style="width:100px;height:100px;border-radius:8px;overflow:hidden;position:relative;border:2px solid #ff69ff;display:inline-block;margin:4px;">
      <img src="${heroImage}" style="width:100%;height:100%;object-fit:cover;">
      <button type="button" onclick="removeExistingImage(this, '${heroImage}', 'hero')"
        style="position:absolute;top:3px;right:3px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:0.8rem;line-height:1;display:flex;align-items:center;justify-content:center;">×</button>
    </div>
  ` : '<p style="color:rgba(255,255,255,0.5);">No hero image</p>';

  const galleryImagesHTML = galleryImages.map(url => `
    <div class="edit-image-preview" data-url="${url}" data-type="gallery"
      style="width:100px;height:100px;border-radius:8px;overflow:hidden;position:relative;border:2px solid #ff69ff;display:inline-block;margin:4px;">
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;">
      <button type="button" onclick="removeExistingImage(this, '${url}', 'gallery')"
        style="position:absolute;top:3px;right:3px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:0.8rem;line-height:1;display:flex;align-items:center;justify-content:center;">×</button>
    </div>
  `).join('');

  const existingVideosHTML = videos.map(url => `
    <div class="edit-video-preview" data-url="${url}"
      style="width:160px;height:120px;border-radius:8px;overflow:hidden;position:relative;border:2px solid #ff69ff;display:inline-block;margin:4px;background:#000;">
      <video src="${url}" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video>
      <button type="button" onclick="removeExistingVideo(this, '${url}')"
        style="position:absolute;top:3px;right:3px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:1rem;line-height:1;display:flex;align-items:center;justify-content:center;">×</button>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div style="max-width:800px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;position:sticky;top:0;background:linear-gradient(135deg,#1a0033,#2d0052);padding:1rem 0;z-index:10;">
        <h1 style="color:#ff69ff;font-size:1.5rem;margin:0;">Edit Property</h1>
        <button id="closeEditOverlay"
          style="background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.3);color:white;font-size:1.5rem;cursor:pointer;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">×</button>
      </div>

      <form id="editPropertyForm" style="background:rgba(138,43,226,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.5rem;">

        <!-- Hero Image -->
        <div style="margin-bottom:1.5rem;">
          <label style="display:block;margin-bottom:0.5rem;color:#ff69ff;font-weight:600;font-size:1rem;">Hero Image (Main Display)</label>
          <div id="existingHeroContainer" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:0.75rem;">${heroImageHTML}</div>
          <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.8);font-size:0.9rem;">Replace Hero Image</label>
          <input type="file" id="editHeroImage" accept="image/*"
            style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;">
          <div id="newHeroPreview" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;"></div>
        </div>

        <!-- Gallery Images -->
        <div style="margin-bottom:1.5rem;">
          <label style="display:block;margin-bottom:0.5rem;color:#ff69ff;font-weight:600;font-size:1rem;">Gallery Images</label>
          <div id="existingGalleryContainer" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:0.75rem;">
            ${galleryImagesHTML || '<p style="color:rgba(255,255,255,0.5);font-size:0.9rem;">No gallery images</p>'}
          </div>
          <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.8);font-size:0.9rem;">Add Gallery Images (up to 3)</label>
          <input type="file" id="editGalleryImages" accept="image/*" multiple
            style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;">
          <div id="newGalleryPreview" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;"></div>
        </div>

        <!-- Videos -->
        <div style="margin-bottom:1.5rem;">
          <label style="display:block;margin-bottom:0.5rem;color:#ff69ff;font-weight:600;font-size:1rem;">Videos</label>
          <div id="existingVideosContainer" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:0.75rem;">
            ${existingVideosHTML || '<p style="color:rgba(255,255,255,0.5);font-size:0.9rem;">No videos</p>'}
          </div>
          <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.8);font-size:0.9rem;">Add New Videos (up to 2)</label>
          <input type="file" id="editVideos" accept="video/mp4,video/webm" multiple
            style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;">
          <div id="newVideosPreview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>
        </div>

        <!-- Location -->
        <div style="margin-bottom:1.5rem;">
          <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Location *</label>
          <input type="text" id="editLocation" value="${property.address_line1 || ''}"
            style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
        </div>

        <!-- Property Type & Bedrooms -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Property Type *</label>
            <select id="editPropertyType" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
              ${['Apartment','Condo','Villa','Studio','House','Townhouse','Airbnb','Commercial'].map(t =>
                `<option value="${t}" ${property.property_type === t ? 'selected' : ''} style="background:#2d0052;">${t}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Bedrooms *</label>
            <input type="number" id="editBedrooms" value="${property.bedrooms || 0}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>
        </div>

        <!-- Bathrooms & Price -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Bathrooms *</label>
            <input type="number" id="editBathrooms" value="${property.bathrooms || 0}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Monthly Rent (Ksh) *</label>
            <input type="number" id="editPrice" value="${property.price || 0}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>
        </div>

        <!-- Viewing Fee & Units -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Viewing Fee (Ksh) *</label>
            <input type="number" id="editViewingFee" value="${property.viewing_fee || 0}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>
          <div>
            <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Units Available *</label>
            <input type="number" id="editUnits" value="${property.units_available || 1}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>
        </div>

        <!-- Additional Info -->
        <div style="margin-bottom:2rem;">
          <label style="display:block;margin-bottom:0.5rem;color:rgba(255,255,255,0.9);font-weight:500;">Additional Information</label>
          <textarea id="editAdditionalInfo" rows="4"
            style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;resize:vertical;font-family:inherit;">${property.description || ''}</textarea>
        </div>

        <!-- Form Actions -->
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <button type="submit"
            style="padding:0.875rem 2rem;background:linear-gradient(135deg,#ff69ff,#8a2be2);color:white;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;touch-action:manipulation;">
            <i class="fas fa-save"></i> Save Changes
          </button>
          <button type="button" id="cancelEditBtn"
            style="padding:0.875rem 2rem;background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;touch-action:manipulation;">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // ✅ Track hero, gallery, videos separately
  window._editHeroImage = heroImage;
  window._editKeepGallery = [...galleryImages];
  window._editKeepVideos = [...videos];
  window._editNewHero = null;
  window._editNewGallery = [];
  window._editNewVideos = [];

  // ✅ Mobile-friendly close button using addEventListener
  document.getElementById('closeEditOverlay').addEventListener('click', () => {
    document.getElementById('editPropertyOverlay')?.remove();
  });
  document.getElementById('closeEditOverlay').addEventListener('touchend', (e) => {
    e.preventDefault();
    document.getElementById('editPropertyOverlay')?.remove();
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editPropertyOverlay')?.remove();
  });
  document.getElementById('cancelEditBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    document.getElementById('editPropertyOverlay')?.remove();
  });

  // New hero image preview
  document.getElementById('editHeroImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    window._editNewHero = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('newHeroPreview').innerHTML = `
        <div style="width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid #4CAF50;display:inline-block;">
          <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <p style="color:#4CAF50;font-size:0.85rem;margin-top:4px;">✅ New hero image selected</p>
      `;
    };
    reader.readAsDataURL(file);
  });

  // New gallery images preview
  document.getElementById('editGalleryImages').addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    window._editNewGallery = files;
    const preview = document.getElementById('newGalleryPreview');
    preview.innerHTML = '';
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.style.cssText = 'width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid #4CAF50;display:inline-block;';
        div.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // New videos preview
  document.getElementById('editVideos').addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    window._editNewVideos = files;
    const preview = document.getElementById('newVideosPreview');
    preview.innerHTML = '';
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.style.cssText = 'width:160px;height:120px;border-radius:8px;overflow:hidden;border:2px solid #4CAF50;display:inline-block;background:#000;';
        div.innerHTML = `<video src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video>`;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // Form submit
  document.getElementById('editPropertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitEditProperty(property.property_id);
  });
}

// ==========================================
// REMOVE EXISTING IMAGE/VIDEO
// ==========================================
window.removeExistingImage = function(btn, url, type) {
  btn.closest('.edit-image-preview').remove();
  if (type === 'hero') {
    window._editHeroImage = null;
  } else {
    window._editKeepGallery = window._editKeepGallery.filter(u => u !== url);
  }
};

window.removeExistingVideo = function(btn, url) {
  btn.closest('.edit-video-preview').remove();
  window._editKeepVideos = window._editKeepVideos.filter(u => u !== url);
};

// ==========================================
// SUBMIT EDIT PROPERTY
// ==========================================
async function submitEditProperty(propertyId) {
  const submitBtn = document.querySelector('#editPropertyForm button[type="submit"]');
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  submitBtn.disabled = true;

  try {
    const formData = new FormData();

    const location = document.getElementById('editLocation').value.trim();
    const locationParts = location.split(',').map(p => p.trim());
    const city = locationParts[locationParts.length - 1] || location;

    formData.append('title', `${document.getElementById('editPropertyType').value} in ${location}`);
    formData.append('description', document.getElementById('editAdditionalInfo').value);
    formData.append('property_type', document.getElementById('editPropertyType').value);
    formData.append('listing_type', 'rent');
    formData.append('price', document.getElementById('editPrice').value);
    formData.append('viewing_fee', document.getElementById('editViewingFee').value);
    formData.append('bedrooms', document.getElementById('editBedrooms').value);
    formData.append('bathrooms', document.getElementById('editBathrooms').value);
    formData.append('address_line1', location);
    formData.append('city', city);
    formData.append('units_available', document.getElementById('editUnits').value);

    // ✅ Build final images array: hero first then gallery
    const keepImages = [];
    if (window._editHeroImage) keepImages.push(window._editHeroImage);
    keepImages.push(...window._editKeepGallery);

    formData.append('keepImages', JSON.stringify(keepImages));
    formData.append('keepVideos', JSON.stringify(window._editKeepVideos));

    // ✅ New hero image goes first
    if (window._editNewHero) {
      formData.append('heroImage', window._editNewHero);
    }

    // ✅ New gallery images
    (window._editNewGallery || []).forEach(file => formData.append('galleryImages', file));

    // ✅ New videos
    (window._editNewVideos || []).forEach(file => formData.append('videos', file));

    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      document.getElementById('editPropertyOverlay').remove();
      showNotification('Property updated successfully!', 'success');
      await loadAgentProperties();
    } else {
      showNotification(result.message || 'Failed to update property', 'error');
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error updating property:', error);
    showNotification('Error updating property. Please try again.', 'error');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    submitBtn.disabled = false;
  }
}

// ==========================================
// DELETE PROPERTY
// ==========================================
function confirmDeleteProperty(property) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26,0,31,0.85); display: flex;
    align-items: center; justify-content: center; z-index: 10002;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="background:#3b0047;border-radius:15px;max-width:400px;width:90%;padding:30px;
      box-shadow:0 10px 40px rgba(255,68,68,0.4);border:2px solid rgba(255,68,68,0.3);text-align:center;">
      <div style="font-size:3rem;margin-bottom:1rem;">🗑️</div>
      <h2 style="color:#ff4444;margin-bottom:1rem;">Delete Property?</h2>
      <p style="color:#ddd;margin-bottom:1.5rem;line-height:1.6;">
        Are you sure you want to delete <strong>${property.address_line1 || 'this property'}</strong>?
        This action cannot be undone.
      </p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
        <button id="confirmDeleteBtn"
          style="padding:12px 24px;background:linear-gradient(135deg,#ff4444,#cc0000);
          color:white;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;touch-action:manipulation;">
          <i class="fas fa-trash"></i> Yes, Delete
        </button>
        <button id="cancelDeleteBtn"
          style="padding:12px 24px;background:rgba(255,255,255,0.1);
          color:white;border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;touch-action:manipulation;">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // ✅ Mobile-friendly event listeners
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => modal.remove());
  document.getElementById('cancelDeleteBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    modal.remove();
  });

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const confirmBtn = document.getElementById('confirmDeleteBtn');

  const doDelete = async () => {
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${property.property_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      modal.remove();

      if (response.ok) {
        showNotification('Property deleted successfully!', 'success');
        await loadAgentProperties();
      } else {
        showNotification(result.message || 'Failed to delete property', 'error');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      modal.remove();
      showNotification('Error deleting property. Please try again.', 'error');
    }
  };

  confirmBtn.addEventListener('click', doDelete);
  confirmBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    doDelete();
  });
}

// ==========================================
// EXPOSE TO listings.js
// ==========================================
window.attachLongPress = attachLongPress;

console.log('✅ editlisting.js loaded');