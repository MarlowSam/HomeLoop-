// house.js - Property Details Page with Chat Integration & Reviews

let currentPropertyData = null;

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
      top: 0;
      left: 0;
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



// ✅ TOP LOADING BAR + CONTENT COVER
// Bar runs on top, cover hides raw "Loading..." text beneath
function showTopBar() {
  // Remove any existing
  document.getElementById('top-load-bar')?.remove();
  document.getElementById('page-cover')?.remove();

  // Top progress bar
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

  // Cover overlay - same colour as page bg, hides Loading... text
  // Bar sits above it (higher z-index)
  const cover = document.createElement('div');
  cover.id = 'page-cover';
  cover.style.cssText = `
    position: fixed;
    inset: 0;
    background: #1a001f;
    z-index: 9998;
    transition: opacity 0.35s ease;
  `;
  document.body.appendChild(cover);
}

function completeTopBar() {
  // Complete the bar
  const bar = document.getElementById('top-load-bar');
  if (bar) {
    bar.style.transition = 'width 0.2s ease, opacity 0.4s ease 0.3s';
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; setTimeout(() => bar.remove(), 400); }, 300);
  }

  // Fade out the cover to reveal loaded content
  const cover = document.getElementById('page-cover');
  if (cover) {
    cover.style.opacity = '0';
    setTimeout(() => cover.remove(), 400);
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  // ✅ Show top bar immediately - continues the feel from navigation
  showTopBar();

  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const writeReview = urlParams.get('write_review');
  const bookingId = urlParams.get('booking_id');
  const openChatParam = urlParams.get('openChat');

  if (!propertyId) {
    completeTopBar();
    showStyledAlert('Property not found', 'error');
    window.location.href = 'index.html';
    return;
  }

  checkLoginStatus();

  await loadPropertyDetails(propertyId);
  await loadPropertyReviews(propertyId);
  await loadSimilarProperties(propertyId);

  // ✅ All data loaded - complete the bar
  completeTopBar();

  if (writeReview === 'true' && bookingId) {
    setTimeout(() => showReviewForm(bookingId), 500);
  }

  if (openChatParam === 'true' && currentPropertyData && currentPropertyData.agent_user_id) {
    setTimeout(() => {
      const chatBtn = document.getElementById('chatAgentBtn');
      if (chatBtn) chatBtn.click();
    }, 500);
  }
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
  // Remove any existing alert first
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

  // ✅ addEventListener instead of inline onclick - fixes mobile
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
// FAVOURITES NOTIFICATION (Small Toast)
// ============================================
function showFavouriteNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 90px; right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' : 'linear-gradient(135deg, #ff4d4d 0%, #ff1744 100%)'};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10001;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  notification.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'times'}-circle"></i><span>${message}</span>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// ============================================
// ADD TO FAVOURITES
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const favouriteBtn = document.querySelector('.favourite');
  if (favouriteBtn) {
    favouriteBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!currentPropertyData) {
        showFavouriteNotification('Please wait for property to load', 'error');
        return;
      }
      const propertyToSave = {
        property_id: currentPropertyData.property_id,
        id: currentPropertyData.property_id,
        location: currentPropertyData.address_line1 || currentPropertyData.city || 'Location not specified',
        type: currentPropertyData.property_type || 'Property',
        bedrooms: currentPropertyData.bedrooms || 0,
        bathrooms: currentPropertyData.bathrooms || 0,
        price: `Ksh ${formatPrice(currentPropertyData.price)}`,
        units_available: currentPropertyData.units_available || 1,
        images: currentPropertyData.images,
        // ✅ Cloudinary URLs are already complete
        img: currentPropertyData.images && currentPropertyData.images.length > 0
          ? currentPropertyData.images[0]
          : null
      };
      let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
      const exists = favourites.some(fav => (fav.property_id || fav.id) === propertyToSave.property_id);
      if (!exists) {
        favourites.push(propertyToSave);
        localStorage.setItem('favourites', JSON.stringify(favourites));
        showFavouriteNotification('House added to favourites!', 'success');
        favouriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Added to Favourites';
        favouriteBtn.style.background = '#ff4dd2';
        favouriteBtn.style.color = 'white';
        favouriteBtn.style.pointerEvents = 'none';
      } else {
        showFavouriteNotification('Already in favourites', 'error');
      }
    });
  }
});

// ============================================
// LOAD PROPERTY DETAILS
// ============================================
async function loadPropertyDetails(propertyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      currentPropertyData = data.property;
      displayPropertyDetails(data.property);
    } else {
      showStyledAlert('Property not found', 'error');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error loading property:', error);
    showStyledAlert('Error loading property details', 'error');
  }
}

function displayPropertyDetails(property) {
  // ✅ Cloudinary URLs are already complete
  const heroImage = document.querySelector('.hero-image');
  if (heroImage && property.images && property.images.length > 0) {
    heroImage.style.backgroundImage = `url('${property.images[0]}')`;
  }

  const fullLocation = property.address_line1
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';

  const locationElement = document.querySelector('.location');
  if (locationElement) locationElement.textContent = fullLocation;

  const typeElement = document.querySelector('.type');
  if (typeElement) typeElement.textContent = `${property.property_type} • ${property.bedrooms} Bed • ${property.bathrooms} Bath`;

  const priceElement = document.querySelector('.price');
  if (priceElement) priceElement.textContent = `Ksh ${formatPrice(property.price)}`;

  const unitsElement = document.querySelector('.units-left');
  if (unitsElement) unitsElement.textContent = `Only ${property.units_available} unit${property.units_available !== 1 ? 's' : ''} left`;

  const viewingFeeElement = document.querySelector('.viewing-fee');
  if (viewingFeeElement && property.viewing_fee) {
    viewingFeeElement.textContent = `Viewing Fee: Ksh ${formatPrice(property.viewing_fee)}`;
    viewingFeeElement.style.display = 'block';
  } else if (viewingFeeElement) {
    viewingFeeElement.style.display = 'none';
  }

  const descriptionElement = document.querySelector('.house-description p');
  if (descriptionElement) {
    const descriptionText = property.description || property.additional_info || '';
    descriptionElement.innerHTML = descriptionText.trim() ? descriptionText : 'No additional information provided.';
  }

  // ✅ Gallery - Cloudinary URLs already complete
  const gallery = document.querySelector('.gallery');
  if (gallery && property.images && property.images.length > 1) {
    gallery.innerHTML = '';
    property.images.slice(1, 4).forEach((image, index) => {
      const img = document.createElement('img');
      img.src = image;
      img.alt = `Property image ${index + 2}`;
      gallery.appendChild(img);
    });
  }

  // ✅ Set BOTH agentId AND propertyId so chat.js uses correct IDs
  if (property.agent_user_id) {
    const chatAgentBtn = document.getElementById('chatAgentBtn');
    if (chatAgentBtn) {
      chatAgentBtn.dataset.agentId = property.agent_user_id;
      chatAgentBtn.dataset.propertyId = property.property_id;
    }
  }

  updateAgentProfileCard(property);

  // ✅ Clean URL - remove ?id=XX from address bar
  history.replaceState({ propertyId: property.property_id }, document.title, window.location.pathname);

  const bookBtn = document.querySelector('.btn.book');
  if (bookBtn) {
    bookBtn.href = `book-visit.html?property_id=${property.property_id}`;
  }
}

function updateAgentProfileCard(property) {
  const agentProfileCard = document.getElementById('agentProfileCard');
  const agentProfilePhoto = document.getElementById('agentProfilePhoto');
  const agentProfileName = document.getElementById('agentProfileName');

  if (!agentProfileCard) return;

  if (property.agent_user_id || property.agent_id) {
    const agentId = property.agent_user_id || property.agent_id;
    agentProfileCard.href = `agent profile.html?agent_id=${agentId}`;
  }

  if (agentProfileName) {
    agentProfileName.textContent = property.agency_name || property.agent_full_name || property.agent_name || "View Agent's Profile";
  }

  if (agentProfilePhoto && (property.agent_photo || property.agent_profile_picture)) {
    const photoPath = property.agent_photo || property.agent_profile_picture;
    agentProfilePhoto.src = `${API_BASE_URL}${photoPath}`;
    agentProfilePhoto.onerror = function() {
      this.src = 'Images/default avatar.png';
    };
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
      displayReviews(data.reviews);
    } else {
      displayReviews([]);
    }
  } catch (error) {
    console.error('Error loading reviews:', error);
    displayReviews([]);
  }
}

function displayReviews(reviews) {
  const reviewsList = document.getElementById('reviewsList');
  const seeAllLink = document.getElementById('seeAllReviews');
  const overallStars = document.getElementById('overallStars');
  const overallRating = document.getElementById('overallRating');

  if (!reviewsList) return;

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;
    if (overallStars) overallStars.textContent = generateStars(avgRating);
    if (overallRating) overallRating.textContent = `(${roundedRating} / 5 from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`;

    reviewsList.innerHTML = '';
    reviews.slice(0, 4).forEach(review => {
      reviewsList.appendChild(createReviewItem(review));
    });
    addWriteReviewButton();

    if (seeAllLink) {
      seeAllLink.style.display = reviews.length > 4 ? 'inline-block' : 'none';
      if (reviews.length > 4) seeAllLink.textContent = `See All ${reviews.length} Reviews`;
    }
  } else {
    reviewsList.innerHTML = `<div class="no-reviews"><p>No reviews yet. Be the first to review this property!</p></div>`;
    if (overallStars) overallStars.textContent = '☆☆☆☆☆';
    if (overallRating) overallRating.textContent = '(0.0 / 5)';
    if (seeAllLink) seeAllLink.style.display = 'none';
    addWriteReviewButton();
  }
}

function addWriteReviewButton() {
  const reviewsList = document.getElementById('reviewsList');
  if (!reviewsList || document.getElementById('writeReviewBtn')) return;

  const writeBtn = document.createElement('button');
  writeBtn.id = 'writeReviewBtn';
  writeBtn.className = 'write-review-btn';
  writeBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Write a Review';
  writeBtn.addEventListener('click', () => showReviewForm());
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
function showReviewForm(bookingId = null) {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');

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
    await submitReview(propertyId, bookingId);
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
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '⭐'.repeat(full) + (half ? '⭐' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function formatReviewDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateString; }
}

// ============================================
// SIMILAR PROPERTIES
// ============================================
async function loadSimilarProperties(propertyId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/properties/similar/${propertyId}?limit=4`, {
      method: 'GET',
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      displaySimilarProperties(data.properties);
    }
  } catch (error) {
    console.error('Error loading similar properties:', error);
  }
}

function displaySimilarProperties(properties) {
  const container = document.querySelector('.more-properties .house-cards');
  if (!container) return;

  if (properties && properties.length > 0) {
    container.innerHTML = '';
    properties.forEach(property => container.appendChild(createPropertyCard(property)));
  } else {
    container.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#aaa;">No similar properties found.</p>';
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  const href = property.bundle_id ? `bundle.html?id=${property.bundle_id}` : `house.html?id=${property.property_id}`;
  card.href = href;
  card.className = 'card';

  // ✅ Cloudinary URLs already complete
  const imageUrl = property.images && property.images.length > 0
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';

  const fullLocation = property.address_line1
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';

  const bundleTag = property.bundle_id ? '<div class="bundle-tag"><i class="fas fa-gift"></i> Bundle</div>' : '';

  let propertyTypeBadge = '';
  const propType = property.property_type || 'Property';
  if (propType === 'Airbnb') {
    propertyTypeBadge = '<span class="property-type-badge airbnb-badge">Airbnb</span>';
  } else if (propType === 'Commercial') {
    propertyTypeBadge = '<span class="property-type-badge commercial-badge">Commercial</span>';
  } else {
    propertyTypeBadge = `<p class="type">${escapeHtml(propType)}</p>`;
  }

  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')">
      ${bundleTag}
    </div>
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