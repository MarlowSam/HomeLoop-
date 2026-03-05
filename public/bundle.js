// bundle.js - UPDATED VERSION - Bundle Package Display with Reviews, Similar Properties, and Video Play Buttons

let currentBundleData = null;
let bundleAgentId = null;

document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const bundleId = urlParams.get('id');
  
  if (!bundleId) {
    showStyledAlert('Bundle not found', 'error');
    window.location.href = 'index.html';
    return;
  }
  
  checkLoginStatus();
  await loadBundleData(bundleId);
});

// ============================================
// CHECK LOGIN STATUS FOR DROPDOWN
// ============================================
async function checkLoginStatus() {
  const dropdownContent = document.querySelector('.dropdown-content');
  if (!dropdownContent) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      dropdownContent.innerHTML = '';
      
      if (data.isAuthenticated) {
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
              method: 'POST',
              credentials: 'include'
            });
            window.location.href = 'login.html';
          } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
          }
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
// STYLED ALERT FUNCTION
// ============================================
function showStyledAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #3b0047;
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    box-shadow: 0 8px 30px rgba(255, 77, 210, 0.4);
    border: 2px solid rgba(255, 77, 210, 0.3);
    z-index: 10000;
    text-align: center;
    min-width: 280px;
    max-width: 90%;
    animation: slideIn 0.3s ease;
  `;
  
  alertDiv.innerHTML = `
    <div style="font-size: 1.1rem; color: #ff4dd2; font-weight: 600; margin-bottom: 15px;">
      ${message}
    </div>
    <button onclick="this.parentElement.remove(); document.querySelector('.alert-backdrop')?.remove();" style="
      background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%);
      color: white;
      border: none;
      padding: 8px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s;
    ">OK</button>
  `;
  
  const backdrop = document.createElement('div');
  backdrop.className = 'alert-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 0, 31, 0.8);
    backdrop-filter: blur(4px);
    z-index: 9999;
  `;
  
  backdrop.onclick = () => {
    backdrop.remove();
    alertDiv.remove();
  };
  
  document.body.appendChild(backdrop);
  document.body.appendChild(alertDiv);
}

// ============================================
// LOAD BUNDLE DATA
// ============================================
async function loadBundleData(bundleId) {
  try {
    console.log('📦 Loading bundle:', bundleId);
    
    const response = await fetch(`${API_BASE_URL}/api/bundles/${bundleId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bundle data received:', data);
      currentBundleData = data.bundle;
      
      if (data.bundle.properties && data.bundle.properties.length > 0) {
        bundleAgentId = data.bundle.properties[0].agent_user_id || data.bundle.properties[0].agent_id;
        console.log('📌 Bundle Agent ID:', bundleAgentId);
      }
      
      displayBundleData(data.bundle);
    } else {
      showStyledAlert('Bundle not found', 'error');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('❌ Error loading bundle:', error);
    showStyledAlert('Error loading bundle details', 'error');
  }
}

// ============================================
// DISPLAY BUNDLE DATA
// ============================================
function displayBundleData(bundle) {
  // Update bundle title
  const bundleTitle = document.getElementById('bundleTitle');
  if (bundleTitle) {
    bundleTitle.textContent = `${bundle.properties.length} Properties Bundle Package`;
  }
  
  // Update viewing fee
  const viewingFee = document.getElementById('viewingFee');
  if (viewingFee) {
    viewingFee.textContent = `Ksh ${formatPrice(bundle.viewing_fee)}`;
  }
  
  // Setup chat button
  const chatAgentBtn = document.getElementById('chatAgentBtn');
  if (chatAgentBtn && bundleAgentId) {
    chatAgentBtn.dataset.agentId = bundleAgentId;
    chatAgentBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (bundle.properties && bundle.properties.length > 0) {
        const firstPropertyId = bundle.properties[0].property_id;
        openChat(firstPropertyId, bundleAgentId);
      } else {
        showStyledAlert('Unable to start chat', 'error');
      }
    });
  }
  
  // Setup book button (link to first property's booking page)
  const bookBundleBtn = document.getElementById('bookBundleBtn');
  if (bookBundleBtn && bundle.properties && bundle.properties.length > 0) {
    bookBundleBtn.href = `book-visit.html?property_id=${bundle.properties[0].property_id}&bundle=true`;
  }
  
  // Display all properties
  const bundlePropertiesContainer = document.getElementById('bundleProperties');
  if (bundlePropertiesContainer && bundle.properties) {
    bundlePropertiesContainer.innerHTML = '';
    
    bundle.properties.forEach((property, index) => {
      const propertySection = createPropertySection(property, index + 1);
      bundlePropertiesContainer.appendChild(propertySection);
    });
  }
}

// ============================================
// CREATE PROPERTY SECTION
// ============================================
function createPropertySection(property, propertyNumber) {
  console.log(`🏠 Creating property section ${propertyNumber}:`, property);
  
  const section = document.createElement('div');
  section.className = 'property-section';
  
  // Hero image
  const heroImage = document.createElement('div');
  heroImage.className = 'property-hero';
  const imageUrl = property.images && property.images.length > 0 
    ? `${API_BASE_URL}${property.images[0]}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  heroImage.style.backgroundImage = `url('${imageUrl}')`;
  section.appendChild(heroImage);
  
  // Property details (Quick Info Card - matching house.html)
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'property-details';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  // Determine property type badge
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
  
  // Single House Details Section with description AND media
  const houseDetailsDiv = document.createElement('div');
  houseDetailsDiv.className = 'house-description';
  
  const descText = property.description || property.additional_info || 'No additional information provided.';
  houseDetailsDiv.innerHTML = `
    <h2>House Details</h2>
    <p>${escapeHtml(descText)}</p>
  `;
  
  // Add media grid if images or videos exist
  const hasGalleryImages = property.images && property.images.length > 1;
  const hasVideos = property.videos && property.videos.length > 0;
  
  if (hasGalleryImages || hasVideos) {
    const mediaGrid = document.createElement('div');
    mediaGrid.className = 'media-grid';
    
    // Add up to 3 gallery images (skip first one as it's the hero)
    if (hasGalleryImages) {
      const additionalImages = property.images.slice(1, 4); // Max 3 images
      additionalImages.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = `${API_BASE_URL}${image}`;
        img.alt = `Property image ${index + 2}`;
        mediaGrid.appendChild(img);
      });
    }
    
    // Add first video (in the 4th position of first row)
    if (hasVideos && property.videos.length > 0) {
      const video = document.createElement('video');
      video.controls = true;
      video.preload = 'metadata';
      
      const source = document.createElement('source');
      source.src = `${API_BASE_URL}${property.videos[0]}`;
      source.type = 'video/mp4';
      
      video.appendChild(source);
      video.innerHTML += 'Your browser does not support the video tag.';
      
      mediaGrid.appendChild(video);
    }
    
    // Add second video below (if exists)
    if (hasVideos && property.videos.length > 1) {
      const video2 = document.createElement('video');
      video2.controls = true;
      video2.preload = 'metadata';
      video2.className = 'second-video';
      
      const source2 = document.createElement('source');
      source2.src = `${API_BASE_URL}${property.videos[1]}`;
      source2.type = 'video/mp4';
      
      video2.appendChild(source2);
      video2.innerHTML += 'Your browser does not support the video tag.';
      
      mediaGrid.appendChild(video2);
    }
    
    houseDetailsDiv.appendChild(mediaGrid);
  }
  
  section.appendChild(houseDetailsDiv);
  
  // Reviews section for this property
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
      <div class="no-reviews">
        <p>No reviews yet for this property.</p>
      </div>
    </div>
  `;
  section.appendChild(reviewsSection);
  
  // Load reviews for this property
  loadPropertyReviews(property.property_id);
  
  // Agent profile card
  const agentProfileCard = document.createElement('a');
  agentProfileCard.href = '#';
  agentProfileCard.className = 'agent-profile-card';
  agentProfileCard.id = `agentCard-${property.property_id}`;
  
  const agentProfilePhoto = document.createElement('img');
  agentProfilePhoto.className = 'agent-profile-photo';
  agentProfilePhoto.id = `agentPhoto-${property.property_id}`;
  agentProfilePhoto.alt = 'Agent';
  
  const agentProfileInfo = document.createElement('div');
  agentProfileInfo.className = 'agent-profile-info';
  
  const agentProfileName = document.createElement('strong');
  agentProfileName.id = `agentName-${property.property_id}`;
  agentProfileName.textContent = 'Loading...';
  
  const agentProfileSubtext = document.createElement('span');
  agentProfileSubtext.textContent = 'See more properties from this agent';
  
  agentProfileInfo.appendChild(agentProfileName);
  agentProfileInfo.appendChild(agentProfileSubtext);
  
  agentProfileCard.appendChild(agentProfilePhoto);
  agentProfileCard.appendChild(agentProfileInfo);
  
  // Update agent profile card with actual data
  updateAgentProfileCardForBundle(property, agentProfileCard, agentProfilePhoto, agentProfileName);
  
  // Append agent card to reviews section
  reviewsSection.appendChild(agentProfileCard);
  
  // Similar properties section
  const similarSection = document.createElement('div');
  similarSection.className = 'more-properties';
  similarSection.innerHTML = `
    <h2><i class="fa-solid fa-house-circle-check"></i> Similar Properties</h2>
    <div class="house-cards" id="similarCards${propertyNumber}">
      <p style="text-align: center; color: #aaa; padding: 20px;">Loading similar properties...</p>
    </div>
  `;
  section.appendChild(similarSection);
  
  // Load similar properties for this property
  loadSimilarPropertiesForProperty(property.property_id, `similarCards${propertyNumber}`);
  
  return section;
}

// ============================================
// UPDATE AGENT PROFILE CARD
// ============================================
function updateAgentProfileCardForBundle(property, cardElement, photoElement, nameElement) {
  console.log('👤 Updating agent profile card for property:', property.property_id);
  
  if (property.agent_user_id || property.agent_id) {
    const agentId = property.agent_user_id || property.agent_id;
    cardElement.href = `agent profile.html?agent_id=${agentId}`;
  } else {
    cardElement.href = 'agent profile.html';
  }
  
  // Update name
  if (nameElement) {
    const displayName = property.agency_name || property.agent_full_name || property.agent_name || 'View Agent\'s Profile';
    nameElement.textContent = displayName;
  }
  
  // Update photo with proper error handling
  if (photoElement) {
    const photoPath = property.agent_photo || property.agent_profile_picture;
    
    if (photoPath) {
      let cleanPath = photoPath;
      if (cleanPath.startsWith('/public/')) {
        cleanPath = cleanPath.substring(7);
      } else if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.substring(6);
      }
      
      if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
      }
      
      const fullPhotoUrl = `${API_BASE_URL}${cleanPath}`;
      photoElement.src = fullPhotoUrl;
      
      photoElement.onerror = function() {
        this.src = 'Images/default-avatar.png';
        this.onerror = function() {
          this.src = 'Images/default avatar.png';
          this.onerror = function() {
            this.style.display = 'none';
          };
        };
      };
    } else {
      photoElement.src = 'Images/default-avatar.png';
      photoElement.onerror = function() {
        this.src = 'Images/default avatar.png';
      };
    }
  }
}

// ============================================
// LOAD SIMILAR PROPERTIES
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
    console.error('❌ Error loading similar properties:', error);
    displaySimilarProperties([], containerId);
  }
}

// ============================================
// LOAD PROPERTY REVIEWS
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
    
    if (overallStars) {
      overallStars.textContent = generateStars(avgRating);
    }
    if (overallRating) {
      overallRating.textContent = `(${roundedRating} / 5 from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`;
    }
    
    reviewsList.innerHTML = '';
    const displayReviews = reviews.slice(0, 3);
    
    displayReviews.forEach(review => {
      const reviewItem = createReviewItem(review);
      reviewsList.appendChild(reviewItem);
    });
    
    addWriteReviewButton(reviewsList, propertyId);
    
  } else {
    if (overallStars) overallStars.textContent = '☆☆☆☆☆';
    if (overallRating) overallRating.textContent = '(0.0 / 5)';
    
    reviewsList.innerHTML = `
      <div class="no-reviews">
        <p>No reviews yet. Be the first to review this property!</p>
      </div>
    `;
    
    addWriteReviewButton(reviewsList, propertyId);
  }
}

function addWriteReviewButton(reviewsList, propertyId) {
  if (!reviewsList) return;
  
  if (reviewsList.querySelector('.write-review-btn')) return;
  
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
          <textarea id="reviewComment" required rows="4" placeholder="Share your experience with this property..."></textarea>
        </div>
        
        <button type="submit"><i class="fa-solid fa-paper-plane"></i> Submit Review</button>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.review-modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  const stars = modal.querySelectorAll('.star-rating span');
  const ratingInput = modal.querySelector('#ratingValue');
  
  stars.forEach(star => {
    star.addEventListener('mouseover', function() {
      const rating = parseInt(this.dataset.rating);
      updateStarDisplay(stars, rating, false);
    });
    
    star.addEventListener('click', function() {
      const rating = parseInt(this.dataset.rating);
      ratingInput.value = rating;
      updateStarDisplay(stars, rating, true);
    });
  });
  
  modal.querySelector('.star-rating').addEventListener('mouseleave', function() {
    const currentRating = parseInt(ratingInput.value) || 0;
    updateStarDisplay(stars, currentRating, true);
  });
  
  const form = modal.querySelector('#reviewForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitReview(propertyId, bookingId);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
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

async function submitReview(propertyId, bookingId) {
  const rating = document.getElementById('ratingValue').value;
  const comment = document.getElementById('reviewComment').value;
  
  if (!rating) {
    showStyledAlert('Please select a rating', 'error');
    return;
  }
  
  if (!comment.trim()) {
    showStyledAlert('Please write a review', 'error');
    return;
  }
  
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
      document.getElementById('reviewModal').remove();
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
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '⭐'.repeat(fullStars) + 
         (hasHalfStar ? '⭐' : '') + 
         '☆'.repeat(emptyStars);
}

function formatReviewDate(dateString) {
  try {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
}

function displaySimilarProperties(properties, containerId) {
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  if (properties && properties.length > 0) {
    container.innerHTML = '';
    
    properties.forEach(property => {
      const card = createPropertyCard(property);
      container.appendChild(card);
    });
  } else {
    container.innerHTML = '<p style="text-align: center; color: #aaa; padding: 20px;">No similar properties found.</p>';
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  
  const isBundle = property.is_bundle === true || property.bundle_id;
  const linkId = isBundle && property.bundle_id ? property.bundle_id : property.property_id;
  card.href = isBundle ? `bundle.html?id=${linkId}` : `house.html?id=${property.property_id}`;
  card.className = 'card';
  
  const imageUrl = property.images && property.images.length > 0 
    ? `${API_BASE_URL}${property.images[0]}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  // Property type badge - matching house.css style
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
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${escapeHtml(fullLocation)}</p>
    ${propertyTypeBadge}
    <p>${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
    <p class="price">Ksh ${formatPrice(property.price)}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
  `;
  
  return card;
}

// ============================================
// HELPER FUNCTIONS
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