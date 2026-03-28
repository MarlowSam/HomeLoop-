// editbundle.js - Long press edit for bundle properties
// Depends on: listings.js, helpers.js, config.js

// ==========================================
// OPEN BUNDLE EDIT FORM
// ==========================================
async function openEditBundleForm(property) {
  const bundleId = property.bundle_id;

  // Show loading
  const loading = document.createElement('div');
  loading.id = 'bundleEditLoading';
  loading.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(26,0,31,0.9);
    display:flex;align-items:center;justify-content:center;z-index:10002;`;
  loading.innerHTML = '<div style="color:#ff69ff;font-size:1.2rem;"><i class="fas fa-spinner fa-spin"></i> Loading bundle data...</div>';
  document.body.appendChild(loading);

  try {
    // Fetch full bundle data
    const response = await fetch(`${API_BASE_URL}/api/bundles/${bundleId}`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to load bundle');

    const data = await response.json();
    const bundle = data.bundle;
    const bundleProperties = bundle.properties || [];

    loading.remove();

    // Build the edit overlay
    document.getElementById('editBundleOverlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'editBundleOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #1a0033 0%, #2d0052 100%);
      z-index: 10002; overflow-y: auto;
      padding: 2rem 1rem;
    `;

    // Build properties HTML
    let propertiesHTML = bundleProperties.map((prop, i) => {
      const images = Array.isArray(prop.images) ? prop.images : JSON.parse(prop.images || '[]');
      const videos = Array.isArray(prop.videos) ? prop.videos : JSON.parse(prop.videos || '[]');

      const existingImagesHTML = images.map(url => `
        <div class="bundle-edit-image" data-prop="${i}" data-url="${url}"
          style="width:90px;height:90px;border-radius:8px;overflow:hidden;position:relative;border:2px solid #ff69ff;display:inline-block;margin:4px;">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover;">
          <button type="button" onclick="removeBundleExistingImage(this, ${i}, '${url}')"
            style="position:absolute;top:2px;right:2px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:0.75rem;">×</button>
        </div>
      `).join('');

      const existingVideosHTML = videos.map(url => `
        <div class="bundle-edit-video" data-prop="${i}" data-url="${url}"
          style="width:160px;height:120px;border-radius:8px;overflow:hidden;position:relative;border:2px solid #ff69ff;display:inline-block;margin:4px;background:#000;">
          <video src="${url}" style="width:100%;height:100%;object-fit:cover;" muted></video>
          <button type="button" onclick="removeBundleExistingVideo(this, ${i}, '${url}')"
            style="position:absolute;top:2px;right:2px;background:rgba(255,0,0,0.8);color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:0.9rem;">×</button>
        </div>
      `).join('');

      return `
        <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
          <h3 style="color:#ff69ff;font-size:1.2rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:2px solid rgba(255,105,255,0.3);">
            <i class="fas fa-home"></i> Property ${i + 1}
          </h3>

          <div style="margin-bottom:1rem;">
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Current Images</label>
            <div id="bundleExistingImages_${i}" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:0.75rem;">${existingImagesHTML}</div>
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Add New Images</label>
            <input type="file" id="bundleNewImages_${i}" accept="image/*" multiple
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;">
            <div id="bundleNewImagesPreview_${i}" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;"></div>
          </div>

          <div style="margin-bottom:1rem;">
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Current Videos</label>
            <div id="bundleExistingVideos_${i}" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:0.75rem;">${existingVideosHTML}</div>
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Add New Videos</label>
            <input type="file" id="bundleNewVideos_${i}" accept="video/mp4,video/webm" multiple
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;">
            <div id="bundleNewVideosPreview_${i}" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;"></div>
          </div>

          <div style="margin-bottom:1rem;">
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Location</label>
            <input type="text" id="bundleLocation_${i}" value="${prop.address_line1 || ''}"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
              <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Property Type</label>
              <select id="bundleType_${i}" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
                ${['Apartment','Condo','Villa','Studio','House','Townhouse','Airbnb','Commercial'].map(t =>
                  `<option value="${t}" ${prop.property_type === t ? 'selected' : ''} style="background:#2d0052;">${t}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Bedrooms</label>
              <input type="number" id="bundleBedrooms_${i}" value="${prop.bedrooms || 0}" min="0"
                style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div>
              <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Bathrooms</label>
              <input type="number" id="bundleBathrooms_${i}" value="${prop.bathrooms || 0}" min="0"
                style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
            </div>
            <div>
              <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Monthly Rent (Ksh)</label>
              <input type="number" id="bundlePrice_${i}" value="${prop.price || 0}" min="0"
                style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Units Available</label>
            <input type="number" id="bundleUnits_${i}" value="${prop.units_available || 1}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>

          <div>
            <label style="display:block;margin-bottom:0.4rem;color:rgba(255,255,255,0.9);font-weight:500;">Additional Information</label>
            <textarea id="bundleInfo_${i}" rows="3"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;resize:vertical;font-family:inherit;">${prop.description || ''}</textarea>
          </div>
        </div>
      `;
    }).join('');

    overlay.innerHTML = `
      <div style="max-width:800px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;">
          <h1 style="color:#ff69ff;font-size:1.8rem;">Edit Bundle Package</h1>
          <button onclick="document.getElementById('editBundleOverlay').remove()"
            style="background:rgba(255,255,255,0.1);border:none;color:white;font-size:1.5rem;cursor:pointer;width:40px;height:40px;border-radius:50%;">×</button>
        </div>

        <form id="editBundleForm" style="display:flex;flex-direction:column;gap:0;">

          <!-- Bundle Viewing Fee -->
          <div style="background:rgba(138,43,226,0.3);border:2px solid rgba(255,105,255,0.4);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;">
            <label style="display:block;margin-bottom:0.5rem;color:#ff69ff;font-weight:700;font-size:1.1rem;">Bundle Viewing Fee (Ksh)</label>
            <input type="number" id="editBundleViewingFee" value="${bundle.viewing_fee || 0}" min="0"
              style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:white;font-size:1rem;">
          </div>

          <!-- Properties -->
          ${propertiesHTML}

          <!-- Actions -->
          <div style="display:flex;gap:1rem;justify-content:center;margin-top:1rem;">
            <button type="submit" style="padding:0.75rem 2rem;background:linear-gradient(135deg,#ff69ff,#8a2be2);color:white;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">
              <i class="fas fa-save"></i> Save Bundle Changes
            </button>
            <button type="button" onclick="document.getElementById('editBundleOverlay').remove()"
              style="padding:0.75rem 2rem;background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2);border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initialize keep arrays for each property
    window._bundleEditData = bundleProperties.map(prop => ({
      propertyId: prop.property_id,
      keepImages: Array.isArray(prop.images) ? [...prop.images] : JSON.parse(prop.images || '[]'),
      keepVideos: Array.isArray(prop.videos) ? [...prop.videos] : JSON.parse(prop.videos || '[]'),
      newImages: [],
      newVideos: []
    }));

    // Setup new image/video previews for each property
    bundleProperties.forEach((prop, i) => {
      document.getElementById(`bundleNewImages_${i}`)?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        window._bundleEditData[i].newImages = files;
        const preview = document.getElementById(`bundleNewImagesPreview_${i}`);
        preview.innerHTML = '';
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const div = document.createElement('div');
            div.style.cssText = 'width:90px;height:90px;border-radius:8px;overflow:hidden;border:2px solid #ff69ff;display:inline-block;';
            div.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
            preview.appendChild(div);
          };
          reader.readAsDataURL(file);
        });
      });

      document.getElementById(`bundleNewVideos_${i}`)?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).slice(0, 2);
        window._bundleEditData[i].newVideos = files;
        const preview = document.getElementById(`bundleNewVideosPreview_${i}`);
        preview.innerHTML = '';
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const div = document.createElement('div');
            div.style.cssText = 'width:160px;height:120px;border-radius:8px;overflow:hidden;border:2px solid #ff69ff;display:inline-block;background:#000;';
            div.innerHTML = `<video src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;" muted></video>`;
            preview.appendChild(div);
          };
          reader.readAsDataURL(file);
        });
      });
    });

    // Form submit
    document.getElementById('editBundleForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitEditBundle(bundleId, bundleProperties);
    });

  } catch (error) {
    loading.remove();
    console.error('Error loading bundle:', error);
    showNotification('Failed to load bundle data. Please try again.', 'error');
  }
}

// ==========================================
// REMOVE EXISTING BUNDLE IMAGE/VIDEO
// ==========================================
window.removeBundleExistingImage = function(btn, propIndex, url) {
  btn.closest('.bundle-edit-image').remove();
  if (window._bundleEditData && window._bundleEditData[propIndex]) {
    window._bundleEditData[propIndex].keepImages =
      window._bundleEditData[propIndex].keepImages.filter(u => u !== url);
  }
};

window.removeBundleExistingVideo = function(btn, propIndex, url) {
  btn.closest('.bundle-edit-video').remove();
  if (window._bundleEditData && window._bundleEditData[propIndex]) {
    window._bundleEditData[propIndex].keepVideos =
      window._bundleEditData[propIndex].keepVideos.filter(u => u !== url);
  }
};

// ==========================================
// SUBMIT BUNDLE EDIT
// ==========================================
async function submitEditBundle(bundleId, bundleProperties) {
  const submitBtn = document.querySelector('#editBundleForm button[type="submit"]');
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  submitBtn.disabled = true;

  try {
    const formData = new FormData();

    // Bundle viewing fee
    formData.append('bundleViewingFee', document.getElementById('editBundleViewingFee').value);

    // Build properties data
    const propertiesData = bundleProperties.map((prop, i) => {
      const location = document.getElementById(`bundleLocation_${i}`).value.trim();
      const locationParts = location.split(',').map(p => p.trim());
      const city = locationParts[locationParts.length - 1] || location;

      return {
        title: `${document.getElementById(`bundleType_${i}`).value} in ${location}`,
        description: document.getElementById(`bundleInfo_${i}`).value,
        property_type: document.getElementById(`bundleType_${i}`).value,
        price: document.getElementById(`bundlePrice_${i}`).value,
        bedrooms: document.getElementById(`bundleBedrooms_${i}`).value,
        bathrooms: document.getElementById(`bundleBathrooms_${i}`).value,
        address_line1: location,
        city: city,
        units_available: document.getElementById(`bundleUnits_${i}`).value,
        keepImages: window._bundleEditData[i].keepImages,
        keepVideos: window._bundleEditData[i].keepVideos
      };
    });

    formData.append('propertiesData', JSON.stringify(propertiesData));

    // Append new files per property
    bundleProperties.forEach((prop, i) => {
      const data = window._bundleEditData[i];
      data.newImages.forEach(file => formData.append(`property_${i}_images`, file));
      data.newVideos.forEach(file => formData.append(`property_${i}_videos`, file));
    });

    const response = await fetch(`${API_BASE_URL}/api/bundles/${bundleId}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();

    if (response.ok) {
      document.getElementById('editBundleOverlay').remove();
      showNotification('Bundle updated successfully!', 'success');
      await loadAgentProperties();
    } else {
      showNotification(result.message || 'Failed to update bundle', 'error');
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Bundle Changes';
      submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error updating bundle:', error);
    showNotification('Error updating bundle. Please try again.', 'error');
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Bundle Changes';
    submitBtn.disabled = false;
  }
}

// ==========================================
// EXPOSE TO listings.js
// ==========================================
window.openEditBundleForm = openEditBundleForm;

console.log('✅ editbundle.js loaded');