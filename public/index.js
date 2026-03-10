// index.js - Fixed filter behavior: Desktop always open, Mobile collapsible & sticky

let allProperties = {
  featured: [],
  recommended: []
};

let activeFilters = {
  location: '',
  type: '',
  price: '',
  bedrooms: '',
  bathrooms: ''
};

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Page loaded, initializing...');
  await loadFeaturedProperties();
  await loadRecommendedProperties();
  await checkAuthentication();
  initializeFilters();
  initializeSearch();
  initializeMobileFilterToggle();
  checkURLSearchQuery();
});

// ========================================
// MOBILE FILTER TOGGLE (Only for mobile)
// ========================================

function initializeMobileFilterToggle() {
  const toggleBtn = document.getElementById('filterToggle');
  const filterControls = document.querySelector('.filter-controls');
  const filterHeader = document.querySelector('.filter-header h3');
  
  console.log('Initializing mobile filter toggle');
  
  if (filterControls) {
    // Start collapsed on mobile only
    if (window.innerWidth <= 768) {
      filterControls.classList.remove('expanded');
      console.log('Mobile view - filters collapsed');
    }
  }
  
  // Add click handler to h3 title for mobile only
  if (filterHeader) {
    filterHeader.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        toggleFilterMobile();
      }
    });
  }
}

window.toggleFilterMobile = function() {
  // Only work on mobile
  if (window.innerWidth > 768) return;
  
  const filterControls = document.querySelector('.filter-controls');
  const toggleBtn = document.getElementById('filterToggle');
  const toggleText = document.getElementById('toggleText');
  
  console.log('Toggle filter mobile called');
  
  if (filterControls && toggleBtn) {
    const isExpanded = filterControls.classList.contains('expanded');
    
    if (isExpanded) {
      filterControls.classList.remove('expanded');
      toggleBtn.classList.remove('active');
      if (toggleText) toggleText.textContent = 'Show Filters';
      console.log('Collapsed filters');
    } else {
      filterControls.classList.add('expanded');
      toggleBtn.classList.add('active');
      if (toggleText) toggleText.textContent = 'Hide Filters';
      console.log('Expanded filters');
    }
  }
};

function collapseFiltersOnMobile() {
  // Only collapse on mobile
  if (window.innerWidth > 768) return;
  
  const filterControls = document.querySelector('.filter-controls');
  const toggleBtn = document.getElementById('filterToggle');
  const toggleText = document.getElementById('toggleText');
  
  console.log('Collapsing filters on mobile...');
  
  if (filterControls) {
    filterControls.classList.remove('expanded');
    console.log('Mobile: Removed expanded class');
  }
  if (toggleBtn) {
    toggleBtn.classList.remove('active');
  }
  if (toggleText) {
    toggleText.textContent = 'Show Filters';
  }
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function initializeSearch() {
  const searchInput = document.querySelector('.search-container input');
  const searchBtn = document.querySelector('.search-btn');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}

function checkURLSearchQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  
  if (searchQuery) {
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
      searchInput.value = searchQuery;
    }
    executeSearch(searchQuery);
  }
}

function performSearch() {
  const searchInput = document.querySelector('.search-container input');
  const searchQuery = searchInput.value.trim().toLowerCase();
  
  if (!searchQuery) {
    alert('Please enter a search term');
    return;
  }
  
  executeSearch(searchQuery);
}

function executeSearch(searchQuery) {
  if (allProperties.featured.length === 0 && allProperties.recommended.length === 0) {
    setTimeout(() => executeSearch(searchQuery), 500);
    return;
  }
  
  // Parse search query intelligently
  const detectedFilters = parseSearchQuery(searchQuery);
  
  // Apply detected filters
  if (detectedFilters.location) {
    document.getElementById('locationFilter').value = detectedFilters.location;
    activeFilters.location = detectedFilters.location;
  }
  
  if (detectedFilters.type) {
    document.getElementById('typeFilter').value = detectedFilters.type;
    activeFilters.type = detectedFilters.type;
  }
  
  if (detectedFilters.price) {
    document.getElementById('priceFilter').value = detectedFilters.price;
    activeFilters.price = detectedFilters.price;
  }
  
  if (detectedFilters.bedrooms) {
    document.getElementById('bedroomsFilter').value = detectedFilters.bedrooms;
    activeFilters.bedrooms = detectedFilters.bedrooms;
  }
  
  // If no specific filters detected, use as location search
  if (!detectedFilters.location && !detectedFilters.type && !detectedFilters.price && !detectedFilters.bedrooms) {
    document.getElementById('locationFilter').value = searchQuery;
    activeFilters.location = searchQuery;
  }
  
  applyFilters();
  
  // Scroll to featured section
  setTimeout(() => {
    const featuredHeader = document.querySelector('.featured-header');
    if (featuredHeader) {
      featuredHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 300);
}

function parseSearchQuery(query) {
  const filters = {
    location: '',
    type: '',
    price: '',
    bedrooms: ''
  };
  
  const locations = [
    'kilimani', 'westlands', 'karen', 'runda', 'lavington', 'parklands',
    'south b', 'south c', 'kileleshwa', 'upperhill', 'upper hill', 'riverside', 
    'gigiri', 'muthaiga', 'spring valley', 'springvalley', 'loresho', 'kitisuru', 
    'nyari', 'rosslyn', 'thika', 'ruaka', 'ruiru', 'kiambu', 'ngong', 'rongai', 
    'syokimau', 'mlolongo', 'embakasi', 'kahawa', 'kasarani', 'zimmerman', 
    'roysambu', 'donholm', 'buruburu', 'umoja', 'komarock', 'kayole', 'dandora',
    'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'
  ];
  
  const propertyTypes = [
    'apartment', 'villa', 'condo', 'studio', 'townhouse', 'penthouse', 'airbnb', 'commercial'
  ];
  
  const priceKeywords = {
    'cheap': '0-35000',
    'affordable': '0-50000',
    'budget': '0-35000',
    'expensive': '70000-999999999',
    'luxury': '100000-999999999',
    'premium': '70000-999999999'
  };
  
  const bedroomKeywords = {
    '1 bed': '1',
    '1 bedroom': '1',
    'one bedroom': '1',
    '2 bed': '2',
    '2 bedroom': '2',
    'two bedroom': '2',
    '3 bed': '3',
    '3 bedroom': '3',
    'three bedroom': '3',
    '4 bed': '4',
    '4 bedroom': '4',
    'bedsitter': '1',
    'studio': '1'
  };
  
  const normalizedQuery = query.toLowerCase().replace(/[,.-]/g, ' ').trim();
  const queryWords = normalizedQuery.split(/\s+/);
  
  for (let location of locations) {
    if (normalizedQuery.includes(location)) {
      filters.location = location;
      break;
    }
    
    for (let word of queryWords) {
      if (location.startsWith(word) && word.length >= 3) {
        filters.location = location;
        break;
      }
    }
    
    if (filters.location) break;
  }
  
  for (let type of propertyTypes) {
    if (query.includes(type)) {
      filters.type = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }
  
  for (let [keyword, priceRange] of Object.entries(priceKeywords)) {
    if (query.includes(keyword)) {
      filters.price = priceRange;
      break;
    }
  }
  
  for (let [keyword, count] of Object.entries(bedroomKeywords)) {
    if (query.includes(keyword)) {
      filters.bedrooms = count;
      break;
    }
  }
  
  return filters;
}

// ========================================
// FILTER FUNCTIONS
// ========================================

function initializeFilters() {
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  
  console.log('Initializing filters');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', function() {
      console.log('Apply filters clicked');
      applyFilters();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      console.log('Reset filters clicked');
      resetFilters();
    });
  }
}

function applyFilters() {
  console.log('Applying filters...');
  
  // Get filter values
  activeFilters.location = document.getElementById('locationFilter').value;
  activeFilters.type = document.getElementById('typeFilter').value;
  activeFilters.price = document.getElementById('priceFilter').value;
  activeFilters.bedrooms = document.getElementById('bedroomsFilter').value;
  activeFilters.bathrooms = document.getElementById('bathroomsFilter').value;
  
  console.log('Active filters:', activeFilters);
  
  // Filter properties
  const filteredFeatured = filterProperties(allProperties.featured);
  const filteredRecommended = filterProperties(allProperties.recommended);
  
  console.log('Filtered featured:', filteredFeatured.length);
  console.log('Filtered recommended:', filteredRecommended.length);
  
  // Display filtered results
  displayPropertiesInRows('featured', filteredFeatured);
  displayPropertiesInRows('recommended', filteredRecommended);
  
  // Update UI
  updateActiveFiltersDisplay();
  updateResultsCount(filteredFeatured.length + filteredRecommended.length);
  
  // On mobile: collapse filters after applying
  if (window.innerWidth <= 768) {
    console.log('Mobile: Collapsing filters after apply');
    setTimeout(() => {
      collapseFiltersOnMobile();
    }, 200);
  }
  
  // Scroll to results
  setTimeout(() => {
    const featuredHeader = document.querySelector('.featured-header');
    if (featuredHeader) {
      featuredHeader.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 400);
}

function filterProperties(properties) {
  return properties.filter(property => {
    // Location filter
    if (activeFilters.location) {
      const searchTerm = activeFilters.location.toLowerCase().trim();
      const city = (property.city || '').toLowerCase();
      const address = (property.address_line1 || '').toLowerCase();
      
      if (!city.includes(searchTerm) && !address.includes(searchTerm)) {
        return false;
      }
    }
    
    // Property type filter
    if (activeFilters.type && property.property_type !== activeFilters.type) {
      return false;
    }
    
    // Price filter
    if (activeFilters.price) {
      const [minPrice, maxPrice] = activeFilters.price.split('-').map(Number);
      const propertyPrice = Number(property.price);
      if (propertyPrice < minPrice || propertyPrice > maxPrice) {
        return false;
      }
    }
    
    // Bedrooms filter
    if (activeFilters.bedrooms) {
      const beds = Number(activeFilters.bedrooms);
      const propertyBeds = Number(property.bedrooms);
      if (beds === 4 && propertyBeds < 4) {
        return false;
      } else if (beds !== 4 && propertyBeds !== beds) {
        return false;
      }
    }
    
    // Bathrooms filter
    if (activeFilters.bathrooms) {
      const baths = Number(activeFilters.bathrooms);
      const propertyBaths = Number(property.bathrooms);
      if (baths === 3 && propertyBaths < 3) {
        return false;
      } else if (baths !== 3 && propertyBaths !== baths) {
        return false;
      }
    }
    
    return true;
  });
}

function displayPropertiesInRows(section, properties) {
  const rowId = section === 'featured' ? 'featuredRow1' : 'recommendedRow1';
  const row = document.getElementById(rowId);
  
  if (!row) return;
  
  row.innerHTML = '';
  
  if (properties.length === 0) {
    row.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff9900; font-size: 1.1rem; padding: 40px;">No properties match your filters. Try adjusting your criteria.</p>';
    return;
  }
  
  properties.forEach(property => {
    const card = createPropertyCard(property);
    row.appendChild(card);
  });
}

function resetFilters() {
  console.log('Resetting filters');
  
  // Clear inputs
  document.getElementById('locationFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('priceFilter').value = '';
  document.getElementById('bedroomsFilter').value = '';
  document.getElementById('bathroomsFilter').value = '';
  
  // Reset active filters
  activeFilters = {
    location: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: ''
  };
  
  // Show all properties
  displayPropertiesInRows('featured', allProperties.featured);
  displayPropertiesInRows('recommended', allProperties.recommended);
  
  // Hide filter display
  const activeFiltersDiv = document.getElementById('activeFilters');
  const resultsCountDiv = document.getElementById('resultsCount');
  
  if (activeFiltersDiv) activeFiltersDiv.style.display = 'none';
  if (resultsCountDiv) resultsCountDiv.style.display = 'none';
}

function updateActiveFiltersDisplay() {
  const activeFiltersDiv = document.getElementById('activeFilters');
  const filterTagsDiv = document.getElementById('filterTags');
  
  if (!activeFiltersDiv || !filterTagsDiv) return;
  
  const hasActiveFilters = Object.values(activeFilters).some(val => val !== '');
  
  if (!hasActiveFilters) {
    activeFiltersDiv.style.display = 'none';
    return;
  }
  
  activeFiltersDiv.style.display = 'flex';
  filterTagsDiv.innerHTML = '';
  
  if (activeFilters.location) {
    addFilterTag('Location', activeFilters.location, 'location');
  }
  if (activeFilters.type) {
    addFilterTag('Type', activeFilters.type, 'type');
  }
  if (activeFilters.price) {
    const [min, max] = activeFilters.price.split('-');
    const priceLabel = max === '999999999' 
      ? `Above Ksh ${Number(min).toLocaleString()}` 
      : `Ksh ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
    addFilterTag('Price', priceLabel, 'price');
  }
  if (activeFilters.bedrooms) {
    const label = activeFilters.bedrooms === '4' 
      ? '4+ Beds' 
      : `${activeFilters.bedrooms} Bed${activeFilters.bedrooms !== '1' ? 's' : ''}`;
    addFilterTag('Bedrooms', label, 'bedrooms');
  }
  if (activeFilters.bathrooms) {
    const label = activeFilters.bathrooms === '3' 
      ? '3+ Baths' 
      : `${activeFilters.bathrooms} Bath${activeFilters.bathrooms !== '1' ? 's' : ''}`;
    addFilterTag('Bathrooms', label, 'bathrooms');
  }
}

function addFilterTag(label, value, filterKey) {
  const filterTagsDiv = document.getElementById('filterTags');
  if (!filterTagsDiv) return;
  
  const tag = document.createElement('div');
  tag.className = 'filter-tag';
  tag.innerHTML = `
    <span>${label}: ${value}</span>
    <i class="fa-solid fa-xmark" onclick="removeFilter('${filterKey}')"></i>
  `;
  
  filterTagsDiv.appendChild(tag);
}

window.removeFilter = function(filterKey) {
  activeFilters[filterKey] = '';
  
  const filterMap = {
    location: 'locationFilter',
    type: 'typeFilter',
    price: 'priceFilter',
    bedrooms: 'bedroomsFilter',
    bathrooms: 'bathroomsFilter'
  };
  
  const filterElement = document.getElementById(filterMap[filterKey]);
  if (filterElement) {
    filterElement.value = '';
  }
  
  applyFilters();
};

function updateResultsCount(count) {
  const resultsCountDiv = document.getElementById('resultsCount');
  if (!resultsCountDiv) return;
  
  resultsCountDiv.style.display = 'block';
  resultsCountDiv.innerHTML = `<i class="fa-solid fa-check-circle"></i> Found ${count} propert${count !== 1 ? 'ies' : 'y'} matching your criteria`;
}

// ========================================
// LOAD PROPERTIES
// ========================================

async function loadFeaturedProperties() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/properties/featured?limit=50`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        allProperties.featured = data.properties;
        displayPropertiesInRows('featured', data.properties);
      } else {
        document.getElementById('featuredRow1').innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No featured properties available.</p>';
      }
    } else {
      console.error('Failed to load featured properties');
    }
  } catch (error) {
    console.error('Error loading featured properties:', error);
  }
}

async function loadRecommendedProperties() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/properties/recommended?limit=50`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        allProperties.recommended = data.properties;
        displayPropertiesInRows('recommended', data.properties);
      } else {
        document.getElementById('recommendedRow1').innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No recommended properties available.</p>';
      }
    } else {
      console.error('Failed to load recommended properties');
    }
  } catch (error) {
    console.error('Error loading recommended properties:', error);
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  
  // ✅ FIXED: Check if property is a bundle and link to correct bundle_id
  const isBundle = property.is_bundle === true || property.bundle_id;
  card.href = isBundle ? `bundle.html?id=${property.bundle_id}` : `house.html?id=${property.property_id}`;
  card.className = 'card';
  
  // ✅ FIXED: Cloudinary URLs are already complete - no API_BASE_URL prefix needed
  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  const bedrooms = Math.floor(property.bedrooms || 0);
  const bathrooms = Math.floor(property.bathrooms || 0);
  
  // Determine property type badge color and text
  let propertyTypeBadge = '';
  const propType = property.property_type || 'Property';
  
  if (propType === 'Airbnb') {
    propertyTypeBadge = '<span class="property-type-badge airbnb-badge">Airbnb</span>';
  } else if (propType === 'Commercial') {
    propertyTypeBadge = '<span class="property-type-badge commercial-badge">Commercial</span>';
  } else {
    propertyTypeBadge = `<p class="type">${propType}</p>`;
  }
  
  // Add bundle tag if property is part of a bundle
  const bundleTag = isBundle ? '<div class="bundle-tag"><i class="fa-solid fa-gift"></i> Bundle</div>' : '';
  
  card.innerHTML = `
    ${bundleTag}
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${fullLocation}</p>
    ${propertyTypeBadge}
    <p>${bedrooms} Bed • ${bathrooms} Bath</p>
    <p class="price">Ksh ${formatPrice(property.price)}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
  `;
  
  return card;
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}

// ========================================
// AUTHENTICATION
// ========================================

async function checkAuthentication() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.isAuthenticated) {
        updateAccountMenu(data.user);
        
        if (data.user.role === 'user') {
          updateFavouritesBadge();
          setInterval(updateFavouritesBadge, 30000);
        }
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

function updateAccountMenu(user) {
  const dropdownContent = document.querySelector('.dropdown-content');
  
  if (dropdownContent) {
    dropdownContent.innerHTML = '';
    
    if (user.role === 'agent') {
      const dashboardLink = document.createElement('a');
      dashboardLink.href = 'agentdashboard.html';
      dashboardLink.innerHTML = '<i class="fa-solid fa-gauge"></i> Dashboard';
      dropdownContent.appendChild(dashboardLink);
    }
    
    const logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Logout';
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      await handleLogout();
    });
    dropdownContent.appendChild(logoutLink);
  }
}

async function handleLogout() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      alert('Logged out successfully');
      window.location.reload();
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error logging out');
  }
}

async function updateFavouritesBadge() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const badge = document.querySelector('.favourites-badge');
      
      if (badge && data.success && data.unread_count > 0) {
        badge.textContent = `${data.unread_count} ${data.unread_count === 1 ? 'Reply' : 'Replies'}`;
        badge.style.display = 'inline-block';
      } else if (badge) {
        badge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error updating favourites badge:', error);
  }
}