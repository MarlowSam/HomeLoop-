// house.js - Property Details Page with Chat Integration & Reviews

let currentPropertyData = null;

document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  const writeReview = urlParams.get('write_review');
  const bookingId = urlParams.get('booking_id');
  const openChat = urlParams.get('openChat');
  
  if (!propertyId) {
    showStyledAlert('Property not found', 'error');
    window.location.href = 'index.html';
    return;
  }
  
  // Check login status and update dropdown
  checkLoginStatus();
  
  // Load all data
  await loadPropertyDetails(propertyId);
  await loadPropertyReviews(propertyId);
  await loadSimilarProperties(propertyId);
  
  // If user clicked "Write Review" from email, show form
  if (writeReview === 'true' && bookingId) {
    setTimeout(() => showReviewForm(bookingId), 500);
  }
  
  // If opened from favourites with new message, auto-open chat
  if (openChat === 'true' && currentPropertyData && currentPropertyData.agent_user_id) {
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
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Clear existing content
      dropdownContent.innerHTML = '';
      
      if (data.isAuthenticated) {
        // User is logged in - show ONLY Logout
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch('/api/auth/logout', {
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
        // User is NOT logged in - show Login/Signup
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login / Signup';
        
        dropdownContent.appendChild(loginLink);
      }
    } else {
      // If API fails, check if there's a session cookie and default to Logout
      const hasCookie = document.cookie.includes('session');
      dropdownContent.innerHTML = '';
      
      if (hasCookie) {
        // Assume logged in if session cookie exists
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include'
            });
          } catch (error) {
            console.error('Logout error:', error);
          }
          window.location.href = 'login.html';
        });
        
        dropdownContent.appendChild(logoutLink);
      } else {
        // No cookie, show Login
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login / Signup';
        dropdownContent.appendChild(loginLink);
      }
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    
    // On error, check for session cookie
    const hasCookie = document.cookie.includes('session');
    dropdownContent.innerHTML = '';
    
    if (hasCookie) {
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.textContent = 'Logout';
      
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (err) {
          console.error('Logout error:', err);
        }
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
}

// ============================================
// STYLED ALERT FUNCTION
// ============================================
function showStyledAlert(message, type = 'success') {
  // Create custom alert - compact version
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
  
  // Add backdrop
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
// FAVOURITES NOTIFICATION (Small Toast)
// ============================================
function showFavouriteNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' : 'linear-gradient(135deg, #ff4d4d 0%, #ff1744 100%)'};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideInRight 0.3s ease;
  `;
  
  notification.innerHTML = `
    <i class="fa-solid fa-${type === 'success' ? 'check' : 'times'}-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);


// ============================================
// ADD TO FAVOURITES WITH NOTIFICATION
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
      
      // Prepare property data for localStorage
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
        img: currentPropertyData.images && currentPropertyData.images.length > 0 
          ? `http://127.0.0.1:5000${currentPropertyData.images[0]}`
          : null
      };
      
      // Get existing favourites
      let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
      
      // Check if already exists
      const exists = favourites.some(fav => 
        (fav.property_id || fav.id) === propertyToSave.property_id
      );
      
      if (!exists) {
        // Add to favourites
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
    const response = await fetch(`/api/properties/${propertyId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Property data:', data);
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
  // Update hero image
  const heroImage = document.querySelector('.hero-image');
  if (heroImage && property.images && property.images.length > 0) {
    heroImage.style.backgroundImage = `url('http://127.0.0.1:5000${property.images[0]}')`;
  }
  
  // Full location (without pin emoji)
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
  
  // Update description - ONLY show additional info if available
  const descriptionElement = document.querySelector('.house-description p');
  if (descriptionElement) {
    const descriptionText = property.description || property.additional_info || '';
    if (descriptionText.trim()) {
      descriptionElement.innerHTML = descriptionText;
    } else {
      // If no description, hide the description section or show gallery only
      descriptionElement.innerHTML = 'No additional information provided.';
    }
  }
  
  // Update gallery
  const gallery = document.querySelector('.gallery');
  if (gallery && property.images && property.images.length > 1) {
    gallery.innerHTML = '';
    const additionalImages = property.images.slice(1, 4);
    additionalImages.forEach((image, index) => {
      const img = document.createElement('img');
      img.src = `http://127.0.0.1:5000${image}`;
      img.alt = `Property image ${index + 2}`;
      gallery.appendChild(img);
    });
  }
  
  // Update agent info for chat
  if (property.agent_user_id) {
    const chatAgentBtn = document.getElementById('chatAgentBtn');
    if (chatAgentBtn) {
      chatAgentBtn.dataset.agentId = property.agent_user_id;
    }
  }
  
  // Update agent profile card
  updateAgentProfileCard(property);
  
  // Update booking button
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
  
  if (property.agent_user_id) {
    agentProfileCard.href = `agent profile.html?agent_id=${property.agent_user_id}`;
  }
  
  if (agentProfileName) {
    const displayName = property.agency_name || property.agent_full_name || property.agent_name || 'View Agent\'s Profile';
    agentProfileName.textContent = displayName;
  }
  
  if (agentProfilePhoto) {
    if (property.agent_photo || property.agent_profile_picture) {
      agentProfilePhoto.src = `http://127.0.0.1:5000${property.agent_photo || property.agent_profile_picture}`;
      agentProfilePhoto.onerror = function() {
        this.src = 'Images/default avatar.png';
      };
    }
  }
}

// ============================================
// LOAD REAL REVIEWS FROM API
// ============================================
async function loadPropertyReviews(propertyId) {
  try {
    const response = await fetch(`/api/reviews/${propertyId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Reviews loaded:', data);
      displayReviews(data.reviews);
    } else {
      console.error('Error loading reviews');
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
    
    if (overallStars) {
      overallStars.textContent = generateStars(avgRating);
    }
    if (overallRating) {
      overallRating.textContent = `(${roundedRating} / 5 from ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`;
    }
    
    reviewsList.innerHTML = '';
    const displayReviews = reviews.slice(0, 4);
    
    displayReviews.forEach(review => {
      const reviewItem = createReviewItem(review);
      reviewsList.appendChild(reviewItem);
    });
    
    // Add "Write a Review" button if user is logged in
    addWriteReviewButton();
    
    if (seeAllLink) {
      if (reviews.length > 4) {
        seeAllLink.style.display = 'inline-block';
        seeAllLink.textContent = `See All ${reviews.length} Reviews`;
      } else {
        seeAllLink.style.display = 'none';
      }
    }
    
  } else {
    reviewsList.innerHTML = `
      <div class="no-reviews">
        <p>No reviews yet. Be the first to review this property!</p>
      </div>
    `;
    
    if (overallStars) overallStars.textContent = '☆☆☆☆☆';
    if (overallRating) overallRating.textContent = '(0.0 / 5)';
    if (seeAllLink) seeAllLink.style.display = 'none';
    
    addWriteReviewButton();
  }
}

function addWriteReviewButton() {
  const reviewsList = document.getElementById('reviewsList');
  if (!reviewsList) return;
  
  // Check if button already exists
  if (document.getElementById('writeReviewBtn')) return;
  
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
  
  // Create modal overlay
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
  
  // Close button
  modal.querySelector('.review-modal-close').addEventListener('click', () => {
    modal.remove();
  });
  
  // Star rating interaction
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
  
  // Form submission
  const form = modal.querySelector('#reviewForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitReview(propertyId, bookingId);
  });
  
  // Close on outside click
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
    const response = await fetch('/api/reviews', {
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
      await loadPropertyReviews(propertyId); // Reload reviews
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

// ============================================
// LOAD SIMILAR PROPERTIES
// ============================================
async function loadSimilarProperties(propertyId) {
  try {
    const response = await fetch(`/api/properties/similar/${propertyId}?limit=4`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Similar properties:', data);
      displaySimilarProperties(data.properties);
    }
  } catch (error) {
    console.error('Error loading similar properties:', error);
  }
}

function displaySimilarProperties(properties) {
  const similarContainer = document.querySelector('.more-properties .house-cards');
  
  if (!similarContainer) return;
  
  if (properties && properties.length > 0) {
    similarContainer.innerHTML = '';
    
    properties.forEach(property => {
      const card = createPropertyCard(property);
      similarContainer.appendChild(card);
    });
  } else {
    similarContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #aaa;">No similar properties found.</p>';
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  card.href = `house.html?id=${property.property_id}`;
  card.className = 'card';
  
  const imageUrl = property.images && property.images.length > 0 
    ? `http://127.0.0.1:5000${property.images[0]}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${escapeHtml(fullLocation)}</p>
    <p class="type">${escapeHtml(property.property_type || 'Property')}</p>
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