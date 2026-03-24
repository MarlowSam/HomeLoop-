// favourites.js - Optimised with single API call

document.addEventListener('DOMContentLoaded', async function() {
  await loadFavouritesAndInquiries();
});

// ============================================
// LOAD FAVOURITES - SINGLE API CALL
// ============================================
async function loadFavouritesAndInquiries() {
  const container = document.getElementById('favouritesContainer');
  if (!container) return;

  container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #ccc;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>Loading your favourites...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/api/favourites/summary`, {
      method: 'GET',
      credentials: 'include'
    });

    let inquiredProperties = [];

    if (response.ok) {
      const data = await response.json();
      inquiredProperties = (data.properties || []).map(p => ({
        ...p,
        location: p.address_line1 || p.city || 'Location not specified',
        type: p.property_type || 'Property',
        price: p.is_bundle
          ? `Ksh ${Number(p.monthly_rent || p.price || 0).toLocaleString('en-KE')}`
          : `Ksh ${Number(p.price).toLocaleString('en-KE')}`,
        img: p.images && p.images.length > 0
          ? (p.images[0].startsWith('http') ? p.images[0] : `${API_BASE_URL}${p.images[0]}`)
          : null,
        hasInquiry: true,
        hasUnread: p.unread_count > 0,
        hasAgentReplied: !!p.agent_has_replied
      }));
    }

    // Merge with local favourites
    const localFavorites = JSON.parse(localStorage.getItem('favourites')) || [];
    const allProperties = [...inquiredProperties];

    localFavorites.forEach(fav => {
      const alreadyExists = allProperties.some(p =>
        (p.property_id || p.id) === (fav.property_id || fav.id)
      );
      if (!alreadyExists) {
        allProperties.push({ ...fav, hasInquiry: false, hasUnread: false });
      }
    });

    if (allProperties.length === 0) {
      container.innerHTML = `
        <p style="text-align: center; grid-column: 1/-1; padding: 3rem 2rem; color: #ccc;">
          <i class="fa-solid fa-heart-broken" style="font-size: 4rem; display: block; margin-bottom: 1.5rem; opacity: 0.3; color: #ff4dd2;"></i>
          <span style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">No favourites yet</span>
          <span style="font-size: 0.95rem; color: #aaa;">Browse properties and click the heart icon to save them here!</span>
        </p>
      `;
      return;
    }

    // Sort: unread first, then inquired, then local saves
    allProperties.sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      if (a.hasInquiry && !b.hasInquiry) return -1;
      if (!a.hasInquiry && b.hasInquiry) return 1;
      return 0;
    });

    container.innerHTML = '';
    allProperties.forEach(property => {
      const card = createPropertyCard(property);
      container.appendChild(card);
    });

    updateFavoritesBadge(allProperties.filter(p => p.hasUnread).length);

  } catch (error) {
    console.error('Error loading favourites:', error);
    container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #ff4d4d; padding: 2rem;">Error loading favourites. Please refresh the page.</p>';
  }
}

// ============================================
// CREATE PROPERTY CARD — matches index.html exactly
// ============================================
function createPropertyCard(property) {
  const card = document.createElement('a');
  card.className = 'card';

  const isBundle = property.is_bundle === true || !!property.bundle_id;

  if (isBundle) {
    card.href = `bundle.html?id=${property.bundle_id || property.property_id}`;
  } else if (property.hasInquiry) {
    card.href = `house.html?id=${property.property_id}&openChat=true`;
  } else {
    card.href = `house.html?id=${property.property_id}`;
  }

  // Image
  const imageUrl = property.img ||
    (property.images && property.images.length > 0
      ? (property.images[0].startsWith('http') ? property.images[0] : `${API_BASE_URL}${property.images[0]}`)
      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60');

  // Location — matches index.js (address_line1 + city with orange pin icon)
  const fullLocation = property.address_line1
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || property.location || 'Location not specified';

  // Type — matches index.js exactly
  let typeHtml = '';
  if (isBundle) {
    typeHtml = `<p class="type bundle-type">BUNDLE</p>`;
  } else {
    const rawType = property.type || property.property_type || 'Property';
    if (rawType === 'Airbnb') {
      typeHtml = `<p class="type airbnb-badge">Airbnb</p>`;
    } else if (rawType === 'Commercial') {
      typeHtml = `<p class="type commercial-badge">Commercial</p>`;
    } else {
      typeHtml = `<p class="type">${escapeHtml(rawType)}</p>`;
    }
  }

  // Price — bundles use monthly_rent
  const priceDisplay = isBundle
    ? `Ksh ${Number(property.monthly_rent || property.price_raw || 0).toLocaleString('en-KE')}`
    : (property.price || 'Price not available');

  const bedrooms = Math.floor(property.bedrooms || 0);
  const bathrooms = Math.floor(property.bathrooms || 0);

  // Status badge — only for non-bundle inquired properties
  let statusHtml = '';
  if (!isBundle && property.hasInquiry) {
    if (property.hasUnread) {
      statusHtml = `<div class="reply-status-badge green"><i class="fa-solid fa-comment-dots"></i> View Reply</div>`;
    } else if (!property.hasAgentReplied) {
      statusHtml = `<div class="reply-status-badge orange"><i class="fa-solid fa-clock"></i> Pending Reply</div>`;
    }
  }

  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${escapeHtml(fullLocation)}</p>
    ${typeHtml}
    <p>${bedrooms} Bed • ${bathrooms} Bath</p>
    <p class="price">${priceDisplay}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${(property.units_available || 1) !== 1 ? 's' : ''} left</p>
    ${statusHtml}
  `;

  return card;
}

// ============================================
// UPDATE FAVOURITES BADGE IN HEADER
// ============================================
function updateFavoritesBadge(unreadCount) {
  const badge = document.querySelector('.favourites-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = `${unreadCount} ${unreadCount === 1 ? 'Reply' : 'Replies'}`;
      badge.style.display = 'inline-flex';
      badge.style.background = '#4caf50';
      badge.style.color = 'white';
      badge.style.padding = '0.25rem 0.75rem';
      badge.style.borderRadius = '12px';
      badge.style.fontSize = '0.85rem';
      badge.style.fontWeight = '600';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ============================================
// ADD TO FAVOURITES (called from house.html / bundle.html)
// ============================================
async function addToFavourites(property) {
  let favourites = JSON.parse(localStorage.getItem('favourites')) || [];

  const exists = favourites.some(fav =>
    (fav.property_id || fav.id) === (property.property_id || property.id)
  );

  if (!exists) {
    favourites.push({
      property_id: property.property_id || property.id,
      id: property.property_id || property.id,
      address_line1: property.address_line1 || null,
      city: property.city || null,
      location: property.location || property.address_line1 || property.city,
      type: property.type || property.property_type,
      is_bundle: property.is_bundle || false,
      bundle_id: property.bundle_id || null,
      monthly_rent: property.monthly_rent || null,
      price_raw: property.price_raw || null,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      price: property.price,
      units_available: property.units_available || 1,
      img: property.img || (property.images && property.images.length > 0
        ? (property.images[0].startsWith('http') ? property.images[0] : `${API_BASE_URL}${property.images[0]}`)
        : null)
    });
    localStorage.setItem('favourites', JSON.stringify(favourites));
    return true;
  }

  return false;
}

// ============================================
// REMOVE FROM FAVOURITES
// ============================================
function removeFromFavourites(propertyId) {
  let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
  favourites = favourites.filter(fav =>
    (fav.property_id || fav.id) !== propertyId
  );
  localStorage.setItem('favourites', JSON.stringify(favourites));
  if (window.location.pathname.includes('favourites')) {
    loadFavouritesAndInquiries();
  }
}

// ============================================
// HELPER
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.addToFavourites = addToFavourites;
window.removeFromFavourites = removeFromFavourites;
window.loadFavouritesAndInquiries = loadFavouritesAndInquiries;