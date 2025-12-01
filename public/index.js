// index.js - Complete version with filters integrated

// Store all properties for filtering
let allProperties = {
  featured: [],
  recommended: []
};

// Active filters object
let activeFilters = {
  location: '',
  type: '',
  price: '',
  bedrooms: '',
  bathrooms: ''
};

document.addEventListener('DOMContentLoaded', async function() {
  
  // Load featured properties
  await loadFeaturedProperties();
  
  // Load recommended properties
  await loadRecommendedProperties();
  
  // Check authentication
  await checkAuthentication();
  
  // Initialize filters
  initializeFilters();
  
  // Initialize search
  initializeSearch();
  
  // Check if there's a search query in URL
  checkURLSearchQuery();
});

// ============================================
// INTELLIGENT SEARCH FUNCTIONALITY
// ============================================

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.querySelector('.search-container input');
  const searchBtn = document.querySelector('.search-btn');
  
  if (searchBtn && searchInput) {
    // Search on button click
    searchBtn.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}

// Check if there's a search query in URL
function checkURLSearchQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  
  if (searchQuery) {
    // Set the search input value
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
      searchInput.value = searchQuery;
    }
    
    // Execute the search
    executeSearch(searchQuery);
    
    // Scroll to results
    setTimeout(() => {
      const featuredHeader = document.querySelector('.featured-header');
      if (featuredHeader) {
        featuredHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }
}

// Perform intelligent search
function performSearch() {
  const searchInput = document.querySelector('.search-container input');
  const searchQuery = searchInput.value.trim().toLowerCase();
  
  if (!searchQuery) {
    alert('Please enter a search term');
    return;
  }
  
  // Check if we're already on homepage
  const isHomepage = window.location.pathname.includes('index.html') || 
                     window.location.pathname === '/' ||
                     window.location.pathname.endsWith('/');
  
  if (isHomepage) {
    // We're on homepage - perform search directly
    executeSearch(searchQuery);
  } else {
    // We're on another page - redirect to homepage with search query
    window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`;
  }
}

// Execute search with intelligent keyword extraction
function executeSearch(searchQuery) {
  console.log('Searching for:', searchQuery);
  
  // Wait for properties to load before searching
  if (allProperties.featured.length === 0 && allProperties.recommended.length === 0) {
    console.log('Waiting for properties to load...');
    setTimeout(() => executeSearch(searchQuery), 500);
    return;
  }
  
  // Common Kenyan locations to detect
  const locations = [
    'kilimani', 'westlands', 'karen', 'runda', 'lavington', 'parklands',
    'south b', 'south c', 'kileleshwa', 'upperhill', 'riverside', 'gigiri',
    'muthaiga', 'spring valley', 'loresho', 'kitisuru', 'nyari', 'rosslyn',
    'thika', 'ruaka', 'ruiru', 'kiambu', 'ngong', 'rongai', 'syokimau',
    'mlolongo', 'embakasi', 'kahawa', 'kasarani', 'zimmerman', 'roysambu',
    'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'
  ];
  
  // Property types to detect
  const propertyTypes = [
    'apartment', 'villa', 'condo', 'studio', 'townhouse', 'penthouse',
    'house', 'flat', 'maisonette', 'bungalow', 'mansion'
  ];
  
  // Price keywords
  const priceKeywords = {
    'cheap': '0-35000',
    'affordable': '0-50000',
    'budget': '0-35000',
    'expensive': '70000-999999999',
    'luxury': '100000-999999999',
    'premium': '70000-999999999'
  };
  
  // Bedroom keywords
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
    'four bedroom': '4',
    'bedsitter': '1',
    'studio': '1'
  };
  
  // Extract keywords from search query
  let detectedLocation = '';
  let detectedType = '';
  let detectedPrice = '';
  let detectedBedrooms = '';
  
  // Detect location
  for (let location of locations) {
    if (searchQuery.includes(location)) {
      detectedLocation = location;
      break;
    }
  }
  
  // Detect property type
  for (let type of propertyTypes) {
    if (searchQuery.includes(type)) {
      // Capitalize first letter
      detectedType = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }
  
  // Detect price keywords
  for (let [keyword, priceRange] of Object.entries(priceKeywords)) {
    if (searchQuery.includes(keyword)) {
      detectedPrice = priceRange;
      break;
    }
  }
  
  // Detect bedroom count
  for (let [keyword, count] of Object.entries(bedroomKeywords)) {
    if (searchQuery.includes(keyword)) {
      detectedBedrooms = count;
      break;
    }
  }
  
  // Apply detected filters
  const locationInput = document.getElementById('locationFilter');
  const typeSelect = document.getElementById('typeFilter');
  const priceSelect = document.getElementById('priceFilter');
  const bedroomsSelect = document.getElementById('bedroomsFilter');
  
  if (detectedLocation && locationInput) {
    locationInput.value = detectedLocation;
    activeFilters.location = detectedLocation;
  }
  
  if (detectedType && typeSelect) {
    typeSelect.value = detectedType;
    activeFilters.type = detectedType;
  }
  
  if (detectedPrice && priceSelect) {
    priceSelect.value = detectedPrice;
    activeFilters.price = detectedPrice;
  }
  
  if (detectedBedrooms && bedroomsSelect) {
    bedroomsSelect.value = detectedBedrooms;
    activeFilters.bedrooms = detectedBedrooms;
  }
  
  // If no specific keywords detected, treat entire query as location search
  if (!detectedLocation && !detectedType && !detectedPrice && !detectedBedrooms && locationInput) {
    locationInput.value = searchQuery;
    activeFilters.location = searchQuery;
  }
  
  // Apply the filters
  applyFilters();
  
  // Show search results message
  const resultsCountDiv = document.getElementById('resultsCount');
  if (resultsCountDiv) {
    const filteredCount = filterProperties(allProperties.featured).length + 
                         filterProperties(allProperties.recommended).length;
    
    resultsCountDiv.style.display = 'block';
    resultsCountDiv.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Search results for "${searchQuery}" - Found ${filteredCount} propert${filteredCount !== 1 ? 'ies' : 'y'}`;
  }
}

// ============================================
// FILTER FUNCTIONS
// ============================================

// Initialize filter event listeners

// Initialize filter event listeners
function initializeFilters() {
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
  
  // Add change listeners to all filters for real-time updates
  const filters = ['locationFilter', 'typeFilter', 'priceFilter', 'bedroomsFilter', 'bathroomsFilter'];
  filters.forEach(filterId => {
    const filterElement = document.getElementById(filterId);
    if (filterElement) {
      filterElement.addEventListener('change', updateActiveFiltersDisplay);
    }
  });
}

// Apply filters function
function applyFilters() {
  // Get filter values
  activeFilters.location = document.getElementById('locationFilter').value;
  activeFilters.type = document.getElementById('typeFilter').value;
  activeFilters.price = document.getElementById('priceFilter').value;
  activeFilters.bedrooms = document.getElementById('bedroomsFilter').value;
  activeFilters.bathrooms = document.getElementById('bathroomsFilter').value;
  
  // Filter properties
  const filteredFeatured = filterProperties(allProperties.featured);
  const filteredRecommended = filterProperties(allProperties.recommended);
  
  // Display filtered properties
  displayFilteredProperties('.featured-cards', filteredFeatured);
  displayFilteredProperties('.Recommended-cards', filteredRecommended);
  
  // Update active filters display
  updateActiveFiltersDisplay();
  
  // Update results count
  updateResultsCount(filteredFeatured.length + filteredRecommended.length);
  
  // Smooth scroll to results
  const featuredHeader = document.querySelector('.featured-header');
  if (featuredHeader) {
    featuredHeader.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }
}

// Filter properties based on active filters
function filterProperties(properties) {
  return properties.filter(property => {
    // Location filter - search in both city and address_line1
    if (activeFilters.location) {
      const searchTerm = activeFilters.location.toLowerCase().trim();
      const city = (property.city || '').toLowerCase();
      const address = (property.address_line1 || '').toLowerCase();
      
      // Check if search term is found in either city or address
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

// Display filtered properties
function displayFilteredProperties(containerSelector, properties) {
  const container = document.querySelector(containerSelector);
  
  if (!container) return;
  
  if (properties.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff9900; font-size: 1.1rem; padding: 40px;">No properties match your filters. Try adjusting your criteria.</p>';
    return;
  }
  
  container.innerHTML = '';
  properties.forEach(property => {
    const card = createPropertyCard(property);
    container.appendChild(card);
  });
}

// Reset filters function
function resetFilters() {
  // Clear filter values
  document.getElementById('locationFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('priceFilter').value = '';
  document.getElementById('bedroomsFilter').value = '';
  document.getElementById('bathroomsFilter').value = '';
  
  // Clear active filters
  activeFilters = {
    location: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: ''
  };
  
  // Display all properties
  displayFilteredProperties('.featured-cards', allProperties.featured);
  displayFilteredProperties('.Recommended-cards', allProperties.recommended);
  
  // Hide active filters display
  const activeFiltersDiv = document.getElementById('activeFilters');
  const resultsCountDiv = document.getElementById('resultsCount');
  
  if (activeFiltersDiv) activeFiltersDiv.style.display = 'none';
  if (resultsCountDiv) resultsCountDiv.style.display = 'none';
}

// Update active filters display
function updateActiveFiltersDisplay() {
  const activeFiltersDiv = document.getElementById('activeFilters');
  const filterTagsDiv = document.getElementById('filterTags');
  
  if (!activeFiltersDiv || !filterTagsDiv) return;
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(val => val !== '');
  
  if (!hasActiveFilters) {
    activeFiltersDiv.style.display = 'none';
    return;
  }
  
  activeFiltersDiv.style.display = 'flex';
  filterTagsDiv.innerHTML = '';
  
  // Add filter tags
  if (activeFilters.location) {
    addFilterTag('Location', activeFilters.location, 'location');
  }
  if (activeFilters.type) {
    addFilterTag('Type', activeFilters.type, 'type');
  }
  if (activeFilters.price) {
    const [min, max] = activeFilters.price.split('-');
    const priceLabel = max === '999999999' ? `Above Ksh ${Number(min).toLocaleString()}` : `Ksh ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
    addFilterTag('Price', priceLabel, 'price');
  }
  if (activeFilters.bedrooms) {
    const label = activeFilters.bedrooms === '4' ? '4+ Beds' : `${activeFilters.bedrooms} Bed${activeFilters.bedrooms !== '1' ? 's' : ''}`;
    addFilterTag('Bedrooms', label, 'bedrooms');
  }
  if (activeFilters.bathrooms) {
    const label = activeFilters.bathrooms === '3' ? '3+ Baths' : `${activeFilters.bathrooms} Bath${activeFilters.bathrooms !== '1' ? 's' : ''}`;
    addFilterTag('Bathrooms', label, 'bathrooms');
  }
}

// Add individual filter tag
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

// Remove individual filter (must be global for onclick)
window.removeFilter = function(filterKey) {
  activeFilters[filterKey] = '';
  
  // Update the select element
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
  
  // Reapply filters
  applyFilters();
};

// Update results count
function updateResultsCount(count) {
  const resultsCountDiv = document.getElementById('resultsCount');
  
  if (!resultsCountDiv) return;
  
  resultsCountDiv.style.display = 'block';
  resultsCountDiv.innerHTML = `<i class="fa-solid fa-check-circle"></i> Found ${count} propert${count !== 1 ? 'ies' : 'y'} matching your criteria`;
}

// ============================================
// PROPERTY LOADING FUNCTIONS
// ============================================

// Function to load featured properties
async function loadFeaturedProperties() {
  try {
    const response = await fetch('/api/properties/featured?limit=4', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Featured properties:', data);
      
      const featuredContainer = document.querySelector('.featured-cards');
      
      if (data.properties && data.properties.length > 0) {
        // Store properties for filtering
        allProperties.featured = data.properties;
        
        // Clear existing content
        featuredContainer.innerHTML = '';
        
        // Add each property
        data.properties.forEach(property => {
          const card = createPropertyCard(property);
          featuredContainer.appendChild(card);
        });
      } else {
        featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No featured properties available at the moment.</p>';
      }
    } else if (response.status === 429) {
      console.error('Rate limit exceeded. Please wait a moment.');
      const featuredContainer = document.querySelector('.featured-cards');
      featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff9900;">Server is busy. Please refresh the page in a moment.</p>';
    } else {
      console.error('Failed to load featured properties');
    }
  } catch (error) {
    console.error('Error loading featured properties:', error);
    const featuredContainer = document.querySelector('.featured-cards');
    if (featuredContainer) {
      featuredContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff9900;">Unable to load properties. Please try again.</p>';
    }
  }
}

// Function to load recommended properties
async function loadRecommendedProperties() {
  try {
    const response = await fetch('/api/properties/recommended?limit=8', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Recommended properties:', data);
      
      const recommendedContainer = document.querySelector('.Recommended-cards');
      
      if (data.properties && data.properties.length > 0) {
        // Store properties for filtering
        allProperties.recommended = data.properties;
        
        // Clear existing content
        recommendedContainer.innerHTML = '';
        
        // Add each property
        data.properties.forEach(property => {
          const card = createPropertyCard(property);
          recommendedContainer.appendChild(card);
        });
      } else {
        recommendedContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No recommended properties available at the moment.</p>';
      }
    } else {
      console.error('Failed to load recommended properties');
    }
  } catch (error) {
    console.error('Error loading recommended properties:', error);
  }
}

// Function to create property card HTML
function createPropertyCard(property) {
  const card = document.createElement('a');
  card.href = `house.html?id=${property.property_id}`;
  card.className = 'card';
  
  const imageUrl = property.images && property.images.length > 0 
    ? `http://127.0.0.1:5000${property.images[0]}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  // Show full location
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  // Format bedrooms and bathrooms to show whole numbers
  const bedrooms = Math.floor(property.bedrooms || 0);
  const bathrooms = Math.floor(property.bathrooms || 0);
  
  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <p class="location"><i class="fas fa-map-marker-alt" style="color: #FFA500;"></i> ${fullLocation}</p>
    <p class="type">${property.property_type || 'Property'}</p>
    <p>${bedrooms} Bed • ${bathrooms} Bath</p>
    <p class="price">Ksh ${formatPrice(property.price)}</p>
    <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
  `;
  
  return card;
}

// Helper function to format price
function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Function to check authentication
async function checkAuthentication() {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.isAuthenticated) {
        updateAccountMenu(data.user);
        
        // Update favourites badge if user is a regular user
        if (data.user.role === 'user') {
          updateFavouritesBadge();
          
          // Update badge every 30 seconds
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
    
    // Only show Dashboard link if user is an agent
    if (user.role === 'agent') {
      const dashboardLink = document.createElement('a');
      dashboardLink.href = 'agentdashboard.html';
      dashboardLink.innerHTML = '<i class="fa-solid fa-gauge"></i> Dashboard';
      dropdownContent.appendChild(dashboardLink);
    }
    
    // Logout link for all authenticated users
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
    const response = await fetch('/api/auth/logout', {
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

// ============================================
// UPDATE FAVOURITES BADGE WITH UNREAD COUNT
// ============================================
async function updateFavouritesBadge() {
  try {
    const response = await fetch('/api/chat/unread-count', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const badge = document.querySelector('.favourites-badge');
      
      if (badge && data.success && data.unread_count > 0) {
        badge.textContent = `${data.unread_count} ${data.unread_count === 1 ? 'Reply' : 'Replies'}`;
        badge.style.display = 'inline-block';
        badge.style.background = '#4caf50';
        badge.style.color = 'white';
        badge.style.padding = '0.25rem 0.75rem';
        badge.style.borderRadius = '12px';
        badge.style.fontSize = '0.85rem';
        badge.style.fontWeight = '600';
      } else if (badge) {
        badge.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error updating favourites badge:', error);
  }
}