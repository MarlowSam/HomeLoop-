// bundle.js - Bundle Package Display with Reviews, Similar Properties, and Video Play Buttons

let currentBundleData = null;
let bundleAgentId = null;

// ============================================
// LOADING BAR NAVIGATION
// ============================================
function startNavigation(url) {
  let bar = document.getElementById('navLoadBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'navLoadBar';
    bar.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%);
      z-index: 99999;
      transition: width 0.6s ease;
      box-shadow: 0 0 8px rgba(255, 77, 210, 0.6);
      pointer-events: none;
    `;
    document.body.appendChild(bar);
  }
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = '60%'; }, 10);
  setTimeout(() => { bar.style.width = '85%'; }, 300);
  setTimeout(() => { bar.style.width = '100%'; }, 600);
  setTimeout(() => { window.location.href = url; }, 750);
}


// ✅ TOP LOADING BAR
function showTopBar() {
  const existing = document.getElementById('top-load-bar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.id = 'top-load-bar';
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    width: 0%;
    background: linear-gradient(90deg, #ff4dd2, #ff9900);
    z-index: 99999;
    transition: width 0.4s ease;
    border-radius: 0 2px 2px 0;
  `;
  document.body.appendChild(bar);
  setTimeout(() => { bar.style.width = '30%'; }, 20);
  setTimeout(() => { bar.style.width = '70%'; }, 300);
  setTimeout(() => { bar.style.width = '85%'; }, 800);
}

function completeTopBar() {
  const bar = document.getElementById('top-load-bar');
  if (!bar) return;
  bar.style.transition = 'width 0.2s ease, opacity 0.4s ease 0.2s';
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.opacity = '0';
    setTimeout(() => bar.remove(), 400);
  }, 200);
}

document.addEventListener('DOMContentLoaded', async function() {
  showTopBar();

  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('id');

  if (!bundleId) {
    completeTopBar();
    showStyledAlert('Bundle not found', 'error');
    window.location.href = 'index.html';
    return;
  }

  checkLoginStatus();
  await loadBundleData(bundleId);
  completeTopBar();

  // ✅ Clean URL after loading so it shows /bundle.html instead of /bundle.html?id=5
  history.replaceState({ bundleId }, document.title, window.location.pathname);
});

// ============================================
// CHECK LOGIN STATUS
// ============================================
async function checkLoginStatus() {
  const dropdownContent = document.querySelector('.dropdown-content');
  if (!dropdownContent) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    dropdownContent.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      if (data.isAuthenticated) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
          } catch (err) { console.error(err); }
          window.location.href = 'login.html';
        });
        dropdownContent.appendChild(logoutLink);
      } else {
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login / Signup';
        dropdownContent.appendChild(loginLink);
      }
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

// ============================================
// STYLED ALERT - OK button uses addEventListener (fixes mobile)
// ============================================
function showStyledAlert(message, type = 'success') {
  document.querySelectorAll('.styled-alert-box, .alert-backdrop').forEach(el => el.remove());

  const backdrop = document.createElement('div');
  backdrop.className = 'alert-backdrop';
  backdrop.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(26, 0, 31, 0.85);
    backdrop-filter: blur(4px);
    z-index: 9999;
  `;

  const alertDiv = document.createElement('div');
  alertDiv.className = 'styled-alert-box';
  alertDiv.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #3b0047;
    color: white;
    padding: 24px 30px;
    border-radius: 15px;
    box-shadow: 0 8px 30px rgba(255, 77, 210, 0.4);
    border: 2px solid rgba(255, 77, 210, 0.3);
    z-index: 10000;
    text-align: center;
    min-width: 280px;
    max-width: 90%;
  `;

  const msgDiv = document.createElement('div');
  msgDiv.style.cssText = `font-size: 1.1rem; color: #ff4dd2; font-weight: 600; margin-bottom: 18px;`;
  msgDiv.textContent = message;

  const okBtn = document.createElement('button');
  okBtn.textContent = 'OK';
  okBtn.style.cssText = `
    background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%);
    color: white; border: none;
    padding: 10px 30px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 1rem;
    min-width: 80px;
    -webkit-tap-highlight-color: transparent;
  `;

  alertDiv.appendChild(msgDiv);
  alertDiv.appendChild(okBtn);
  document.body.appendChild(backdrop);
  document.body.appendChild(alertDiv);

  // ✅ addEventListener fixes mobile OK button
  okBtn.addEventListener('click', () => {
    alertDiv.remove();
    backdrop.remove();
  });
  backdrop.addEventListener('click', () => {
    alertDiv.remove();
    backdrop.remove();
  });
}

// ============================================
// LOAD BUNDLE DATA
// ============================================
async function loadBundleData(bundleId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bundles/${bundleId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      currentBundleData = data.bundle;

      if (data.bundle.properties && data.bundle.properties.length > 0) {
        bundleAgentId = data.bundle.properties[0].agent_user_id || data.bundle.properties[0].agent_id;
      }

      displayBundleData(data.bundle);
    } else {
      showStyledAlert('Bundle not found', 'error');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error loading bundle:', error);
    showStyledAlert('Error loading bundle details', 'error');
  }
}

// ============================================
// DISPLAY BUNDLE DATA
// ============================================
function displayBundleData(bundle) {
  const bundleTitle = document.getElementById('bundleTitle');
  if (bundleTitle) {
    bundleTitle.textContent = `${bundle.properties.length} Properties Bundle Package`;
  }

  const viewingFee = document.getElementById('viewingFee');
  if (viewingFee) {
    viewingFee.textContent = `Ksh ${formatPrice(bundle.viewing_fee)}`;
  }

  // ✅ Set BOTH agentId AND propertyId on chatAgentBtn - let chat.js handle the click
  const chatAgentBtn = document.getElementById('chatAgentBtn');
  if (chatAgentBtn && bundleAgentId && bundle.properties && bundle.properties.length > 0) {
    chatAgentBtn.dataset.agentId = bundleAgentId;
    chatAgentBtn.dataset.propertyId = bundle.properties[0].property_id;
    // No click listener here - chat.js reads dataset and handles it correctly
  }

  // Book button
  const bookBundleBtn = document.getElementById('bookBundleBtn');
  if (bookBundleBtn && bundle.properties && bundle.properties.length > 0) {
    bookBundleBtn.href = `book-visit.html?property_id=${bundle.properties[0].property_id}&bundle=true`;
  }

  // Display all properties
  const bundlePropertiesContainer = document.getElementById('bundleProperties');
  if (bundlePropertiesContainer && bundle.properties) {
    bundlePropertiesContainer.innerHTML = '';
    bundle.properties.forEach((property, index) => {
      bundlePropertiesContainer.appendChild(createPropertySection(property, index + 1));
    });
  }
}

// ============================================
// CREATE PROPERTY SECTION
// ============================================
function createPropertySection(property, propertyNumber) {
  const section = document.createElement('div');
  section.className = 'property-section';

  // Hero image - ✅ Cloudinary URLs already complete
  const heroImage = document.createElement('div');
  heroImage.className = 'property-hero';
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  heroImage.style.backgroundImage = `url('${imageUrl}')`;
  section.appendChild(heroImage);

  // Property details
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'property-details';

  const fullLocation = property.address_line1
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';

  let propertyTypeBadge = '';
  const propType = property.property_type || 'Property';
  if (propType === 'Airbnb') {
    propertyTypeBadge = '<span class="property-type-badge airbnb-badge">Airbnb</span>';
  } else if (propType === 'Commercial') {
    propertyTypeBadge = '<span class="property-type-badge commercial-badge">Commercial</span>';
  } else {
    propertyTypeBadge = `<p class="type">${propType}</p>`;
  }

  detailsDiv.innerHTML = `
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${escapeHtml(fullLocation)}</p>
    ${propertyTypeBadge}
    <p>${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
    <p class="price">Ksh ${formatPrice(property.price)}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
  `;
  section.appendChild(detailsDiv);

  // House Details with description and media
  const houseDetailsDiv = document.createElement('div');
  houseDetailsDiv.className = 'house-description';
  const descText = property.description || property.additional_info || 'No additional information provided.';
  houseDetailsDiv.innerHTML = `<h2>House Details</h2><p>${escapeHtml(descText)}</p>`;

  const hasGalleryImages = property.images && property.images.length > 1;
  const hasVideos = property.videos && property.videos.length > 0;

  if (hasGalleryImages || hasVideos) {
    const mediaGrid = document.createElement('div');
    mediaGrid.className = 'media-grid';

    // ✅ Gallery images - Cloudinary URLs already complete (no API_BASE_URL prefix)
    if (hasGalleryImages) {
      property.images.slice(1, 4).forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Property image ${index + 2}`;
        mediaGrid.appendChild(img);
      });
    }

    // ✅ Videos - Cloudinary URLs already complete
    if (hasVideos) {
      property.videos.slice(0, 2).forEach((videoUrl, i) => {
        const video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        if (i === 1) video.className = 'second-video';
        const source = document.createElement('source');
        source.src = videoUrl;
        source.type = 'video/mp4';
        video.appendChild(source);
        video.insertAdjacentText('beforeend', 'Your browser does not support the video tag.');
        mediaGrid.appendChild(video);
      });
    }

    houseDetailsDiv.appendChild(mediaGrid);
  }
  section.appendChild(houseDetailsDiv);

  // Reviews section
  const reviewsSection = document.createElement('div');
  reviewsSection.className = 'house-reviews';
  reviewsSection.id = `reviews-${property.property_id}`;
  reviewsSection.innerHTML = `
    <div class="reviews-header">
      <h2>House Reviews</h2>
      <div class="overall-rating">
        <span class="stars" id="stars-${property.property_id}">☆☆☆☆☆</span>
        <span id="rating-${property.property_id}">(0.0 / 5)</span>
      </div>
    </div>
    <div id="reviewsList-${property.property_id}">
      <div class="no-reviews"><p>No reviews yet for this property.</p></div>
    </div>
  `;
  section.appendChild(reviewsSection);
  loadPropertyReviews(property.property_id);

  // ✅ Agent profile card with photo and icon
  const agentProfileCard = document.createElement('a');
  agentProfileCard.className = 'agent-profile-card';
  agentProfileCard.id = `agentCard-${property.property_id}`;

  // ✅ Always show icon - photo replaces it if available
  const agentIconFallback = document.createElement('div');
  agentIconFallback.className = 'agent-profile-icon-fallback';
  agentIconFallback.innerHTML = '<i class="fa-solid fa-circle-user" style="font-size:52px;color:#ff4dd2;"></i>';

  const agentProfilePhoto = document.createElement('img');
  agentProfilePhoto.className = 'agent-profile-photo';
  agentProfilePhoto.alt = 'Agent';
  agentProfilePhoto.style.display = 'none'; // Hidden until loaded
  agentProfilePhoto.onload = function() {
    this.style.display = 'block';
    agentIconFallback.style.display = 'none';
  };
  agentProfilePhoto.onerror = function() {
    this.style.display = 'none';
    agentIconFallback.style.display = 'block';
  };

  const agentProfileInfo = document.createElement('div');
  agentProfileInfo.className = 'agent-profile-info';

  const agentProfileName = document.createElement('strong');
  agentProfileName.id = `agentName-${property.property_id}`;
  agentProfileName.textContent = 'Loading...';

  const agentProfileSubtext = document.createElement('span');
  agentProfileSubtext.textContent = 'See more properties from this agent';

  agentProfileInfo.appendChild(agentProfileName);
  agentProfileInfo.appendChild(agentProfileSubtext);
  agentProfileCard.appendChild(agentIconFallback);
  agentProfileCard.appendChild(agentProfilePhoto);
  agentProfileCard.appendChild(agentProfileInfo);

  updateAgentProfileCardForBundle(property, agentProfileCard, agentProfilePhoto, agentProfileName);
  reviewsSection.appendChild(agentProfileCard);

  // Similar properties
  const similarSection = document.createElement('div');
  similarSection.className = 'more-properties';
  similarSection.innerHTML = `
    <h2><i class="fa-solid fa-house-circle-check"></i> Similar Properties</h2>
    <div class="house-cards" id="similarCards${propertyNumber}">
      <p style="text-align:center;color:#aaa;padding:20px;">Loading similar properties...</p>
    </div>
  `;
  section.appendChild(similarSection);
  loadSimilarPropertiesForProperty(property.property_id, `similarCards${propertyNumber}`);

  return section;
}

// ============================================
// UPDATE AGENT PROFILE CARD
// ============================================
function updateAgentProfileCardForBundle(property, cardElement, photoElement, nameElement) {
  const agentId = property.agent_user_id || property.agent_id;
  if (agentId) {
    cardElement.href = `agent profile.html?agent_id=${agentId}`;
  } else {
    cardElement.href = 'agent profile.html';
  }

  if (nameElement) {
    nameElement.textContent = property.agency_name || property.agent_full_name || property.agent_name || "View Agent's Profile";
  }

  if (photoElement) {
    const photoPath = property.agent_photo || property.agent_profile_picture;
    if (photoPath) {
      let cleanPath = photoPath;
      if (cleanPath.startsWith('/public/')) cleanPath = cleanPath.substring(7);
      else if (cleanPath.startsWith('public/')) cleanPath = cleanPath.substring(6);
      if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

      photoElement.src = `${API_BASE_URL}${cleanPath}`;
      photoElement.onerror = function() {
        this.src = 'Images/default avatar.png';
        this.onerror = function() { this.style.display = 'none'; };
      };
    }
  }
}

// ============================================
// SIMILAR PROPERTIES
// ============================================
async function loadSimilarPropertiesForProperty(propertyId, containerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/properties/similar/${propertyId}?limit=6`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      displaySimilarProperties(data.properties, containerId);
    } else {
      displaySimilarProperties([], containerId);
    }
  } catch (error) {
    console.error('Error loading similar properties:', error);
    displaySimilarProperties([], containerId);
  }
}

// ============================================
// REVIEWS
// ============================================
async function loadPropertyReviews(propertyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${propertyId}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      displayPropertyReviews(data.reviews, propertyId);
    } else {
      displayPropertyReviews([], propertyId);
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    displayPropertyReviews([], propertyId);
  }
}

function displayPropertyReviews(reviews, propertyId) {
  const reviewsList = document.getElementById(`reviewsList-${propertyId}`);
  const overallStars = document.getElementById(`stars-${propertyId}`);
  const overallRating = document.getElementById(`rating-${propertyId}`);

  if (!reviewsList) return;

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;
    if (overallStars) overallStars.textContent = generateStars(avgRating);
    if (overallRating) overallRating.textContent = `(${roundedRating} / 5 from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`;

    reviewsList.innerHTML = '';
    reviews.slice(0, 3).forEach(review => reviewsList.appendChild(createReviewItem(review)));
    addWriteReviewButtonForProperty(reviewsList, propertyId);
  } else {
    if (overallStars) overallStars.textContent = '☆☆☆☆☆';
    if (overallRating) overallRating.textContent = '(0.0 / 5)';
    reviewsList.innerHTML = `<div class="no-reviews"><p>No reviews yet. Be the first to review!</p></div>`;
    addWriteReviewButtonForProperty(reviewsList, propertyId);
  }
}

function addWriteReviewButtonForProperty(reviewsList, propertyId) {
  if (!reviewsList || reviewsList.querySelector('.write-review-btn')) return;
  const writeBtn = document.createElement('button');
  writeBtn.className = 'write-review-btn';
  writeBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Write a Review';
  writeBtn.addEventListener('click', () => showReviewForm(propertyId));
  reviewsList.appendChild(writeBtn);
}

function createReviewItem(review) {
  const reviewDiv = document.createElement('div');
  reviewDiv.className = 'review-item';
  const formattedDate = formatReviewDate(review.review_date);
  const verifiedBadge = review.is_verified ? ' <span style="color: #28a745;">✓ Verified</span>' : '';
  reviewDiv.innerHTML = `
    <div class="review-header">
      <span class="reviewer-name">${escapeHtml(review.reviewer_name)}${verifiedBadge}</span>
      <span class="review-date">${formattedDate}</span>
    </div>
    <div class="review-stars">${generateStars(review.rating)}</div>
    <p class="review-text">${escapeHtml(review.comment)}</p>
  `;
  return reviewDiv;
}

// ============================================
// REVIEW FORM
// ============================================
function showReviewForm(propertyId, bookingId = null) {
  const modal = document.createElement('div');
  modal.id = 'reviewModal';

  modal.innerHTML = `
    <div class="review-modal-content">
      <div class="review-modal-header">
        <h2><i class="fa-solid fa-star"></i> Write a Review</h2>
        <button class="review-modal-close">&times;</button>
      </div>
      <form id="reviewForm">
        <div style="margin-bottom: 18px;">
          <label>Your Rating *</label>
          <div class="star-rating">
            <span data-rating="1">☆</span>
            <span data-rating="2">☆</span>
            <span data-rating="3">☆</span>
            <span data-rating="4">☆</span>
            <span data-rating="5">☆</span>
          </div>
          <input type="hidden" id="ratingValue" required>
        </div>
        <div style="margin-bottom: 18px;">
          <label for="reviewComment">Your Review *</label>
          <textarea id="reviewComment" required rows="4" placeholder="Share your experience..."></textarea>
        </div>
        <button type="submit"><i class="fa-solid fa-paper-plane"></i> Submit Review</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.review-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  const stars = modal.querySelectorAll('.star-rating span');
  const ratingInput = modal.querySelector('#ratingValue');

  stars.forEach(star => {
    star.addEventListener('mouseover', function() {
      updateStarDisplay(stars, parseInt(this.dataset.rating), false);
    });
    star.addEventListener('click', function() {
      ratingInput.value = this.dataset.rating;
      updateStarDisplay(stars, parseInt(this.dataset.rating), true);
    });
  });

  modal.querySelector('.star-rating').addEventListener('mouseleave', function() {
    updateStarDisplay(stars, parseInt(ratingInput.value) || 0, true);
  });

  modal.querySelector('#reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitReview(propertyId, bookingId, modal);
  });
}

function updateStarDisplay(stars, rating, filled) {
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '⭐';
      star.style.color = '#ffc107';
    } else {
      star.textContent = '☆';
      star.style.color = filled ? '#666' : '#ffc107';
    }
  });
}

async function submitReview(propertyId, bookingId, modal) {
  const rating = document.getElementById('ratingValue').value;
  const comment = document.getElementById('reviewComment').value;

  if (!rating) { showStyledAlert('Please select a rating', 'error'); return; }
  if (!comment.trim()) { showStyledAlert('Please write a review', 'error'); return; }

  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        property_id: propertyId,
        booking_id: bookingId,
        rating: parseInt(rating),
        comment: comment.trim()
      })
    });
    const data = await response.json();
    if (response.ok) {
      if (modal) modal.remove();
      showStyledAlert('Thank you for your review!', 'success');
      await loadPropertyReviews(propertyId);
    } else {
      showStyledAlert(data.message || 'Error submitting review', 'error');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    showStyledAlert('Error submitting review. Please try again.', 'error');
  }
}

function generateStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '⭐'.repeat(full) + (half ? '⭐' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function formatReviewDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateString; }
}

function displaySimilarProperties(properties, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (properties && properties.length > 0) {
    container.innerHTML = '';
    properties.forEach(property => container.appendChild(createPropertyCard(property)));
  } else {
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">No similar properties found.</p>';
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  const isBundle = property.is_bundle === true || property.bundle_id;
  const linkId = isBundle && property.bundle_id ? property.bundle_id : property.property_id;
  const href = isBundle ? `bundle.html?id=${linkId}` : `house.html?id=${property.property_id}`;
  card.href = href;
  card.className = 'card';

  // ✅ Cloudinary URLs already complete
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';

  const fullLocation = property.address_line1
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';

  let propertyTypeBadge = '';
  const propType = property.property_type || 'Property';
  if (propType === 'Airbnb') {
    propertyTypeBadge = '<span class="property-type-badge airbnb-badge">Airbnb</span>';
  } else if (propType === 'Commercial') {
    propertyTypeBadge = '<span class="property-type-badge commercial-badge">Commercial</span>';
  } else {
    propertyTypeBadge = `<p class="type">${propType}</p>`;
  }

  const bundleTag = isBundle ? '<div class="bundle-tag"><i class="fa-solid fa-gift"></i> Bundle</div>' : '';

  card.innerHTML = `
    ${bundleTag}
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color:#FFA500;"></i> ${escapeHtml(fullLocation)}</p>
    ${propertyTypeBadge}
    <p>${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
    <p class="price">Ksh ${formatPrice(property.price)}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
  `;

  // ✅ Loading bar on click
  card.addEventListener('click', function(e) {
    e.preventDefault();
    startNavigation(this.href);
  });

  return card;
}

// ============================================
// HELPERS
// ============================================
function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}