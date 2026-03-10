// indexlistings.js - Fixed filter behavior: Desktop always open, Mobile collapsible & sticky

let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const propertiesPerPage = 20;

let activeFilters = {
  location: '',
  type: '',
  price: '',
  bedrooms: '',
  bathrooms: ''
};

document.addEventListener('DOMContentLoaded', async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section') || 'featured';
  const searchQuery = urlParams.get('search');
  
  document.getElementById('sectionTitle').textContent = 
    section === 'featured' ? 'Featured Listings' : 'Recommended Listings';
  
  await loadProperties(section);
  await checkAuthentication();
  
  applyURLFilters();
  
  if (searchQuery) {
    document.getElementById('searchInput').value = searchQuery;
    applySearchFilter(searchQuery);
  }
  
  initializeFilters();
  initializeSearch();
  initializePagination();
  initializeMobileFilterToggle();
  
  displayPage(1);
});

// ========================================
// MOBILE FILTER TOGGLE (Only for mobile)
// ========================================

function initializeMobileFilterToggle() {
  const toggleBtn = document.getElementById('filterToggle');
  const filterControls = document.querySelector('.filter-controls');
  const filterHeader = document.querySelector('.filter-header h3');
  
  if (filterControls) {
    // Start collapsed on mobile only
    if (window.innerWidth <= 768) {
      filterControls.classList.remove('expanded');
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
  
  if (filterControls && toggleBtn) {
    filterControls.classList.toggle('expanded');
    
    if (filterControls.classList.contains('expanded')) {
      toggleText.textContent = 'Hide Filters';
      toggleBtn.classList.add('active');
    } else {
      toggleText.textContent = 'Show Filters';
      toggleBtn.classList.remove('active');
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
  }
  if (toggleBtn) {
    toggleBtn.classList.remove('active');
  }
  if (toggleText) {
    toggleText.textContent = 'Show Filters';
  }
}

// ========================================
// LOAD PROPERTIES
// ========================================

async function loadProperties(section) {
  try {
    const endpoint = section === 'featured' ? 'featured' : 'recommended';
    const response = await fetch(`${API_BASE_URL}/api/properties/${endpoint}?limit=100`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.properties && data.properties.length > 0) {
        allProperties = data.properties;
        filteredProperties = [...allProperties];
      }
    }
  } catch (error) {
    console.error('Error loading properties:', error);
  }
}

// ========================================
// DISPLAY & PAGINATION
// ========================================

function displayPage(pageNumber) {
  currentPage = pageNumber;
  
  const startIndex = (pageNumber - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const pageProperties = filteredProperties.slice(startIndex, endIndex);
  
  const grid = document.getElementById('listingsGrid');
  grid.innerHTML = '';
  
  if (pageProperties.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff9900; padding: 40px;">No properties found matching your criteria.</p>';
    updatePagination();
    return;
  }
  
  pageProperties.forEach(property => {
    const card = createPropertyCard(property);
    grid.appendChild(card);
  });
  
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePagination() {
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  
  document.getElementById('pageInfo').textContent = `${currentPage}/${totalPages || 1}`;
  
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (currentPage === 1) {
    prevBtn.classList.add('disabled');
  } else {
    prevBtn.classList.remove('disabled');
  }
  
  if (currentPage === totalPages || totalPages === 0) {
    nextBtn.classList.add('disabled');
  } else {
    nextBtn.classList.remove('disabled');
  }
}

function initializePagination() {
  document.getElementById('prevBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (currentPage > 1) {
      displayPage(currentPage - 1);
    }
  });
  
  document.getElementById('nextBtn').addEventListener('click', function(e) {
    e.preventDefault();
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    if (currentPage < totalPages) {
      displayPage(currentPage + 1);
    }
  });
}

// ========================================
// CREATE PROPERTY CARD
// ========================================

function createPropertyCard(property) {
  const card = document.createElement('a');
  card.href = `house.html?id=${property.property_id}`;
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

function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}

// ========================================
// FILTERS
// ========================================

function initializeFilters() {
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('resetFilters');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
}

function applyURLFilters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const location = urlParams.get('location');
  const type = urlParams.get('type');
  const price = urlParams.get('price');
  const bedrooms = urlParams.get('bedrooms');
  const bathrooms = urlParams.get('bathrooms');
  
  if (location) {
    document.getElementById('locationFilter').value = location;
    activeFilters.location = location;
  }
  if (type) {
    document.getElementById('typeFilter').value = type;
    activeFilters.type = type;
  }
  if (price) {
    document.getElementById('priceFilter').value = price;
    activeFilters.price = price;
  }
  if (bedrooms) {
    document.getElementById('bedroomsFilter').value = bedrooms;
    activeFilters.bedrooms = bedrooms;
  }
  if (bathrooms) {
    document.getElementById('bathroomsFilter').value = bathrooms;
    activeFilters.bathrooms = bathrooms;
  }
  
  if (location || type || price || bedrooms || bathrooms) {
    applyFilters();
  }
}

function applyFilters() {
  activeFilters.location = document.getElementById('locationFilter').value;
  activeFilters.type = document.getElementById('typeFilter').value;
  activeFilters.price = document.getElementById('priceFilter').value;
  activeFilters.bedrooms = document.getElementById('bedroomsFilter').value;
  activeFilters.bathrooms = document.getElementById('bathroomsFilter').value;
  
  filteredProperties = allProperties.filter(property => {
    if (activeFilters.location) {
      const searchTerm = activeFilters.location.toLowerCase().trim();
      const city = (property.city || '').toLowerCase();
      const address = (property.address_line1 || '').toLowerCase();
      
      if (!city.includes(searchTerm) && !address.includes(searchTerm)) {
        return false;
      }
    }
    
    if (activeFilters.type && property.property_type !== activeFilters.type) {
      return false;
    }
    
    if (activeFilters.price) {
      const [minPrice, maxPrice] = activeFilters.price.split('-').map(Number);
      const propertyPrice = Number(property.price);
      if (propertyPrice < minPrice || propertyPrice > maxPrice) {
        return false;
      }
    }
    
    if (activeFilters.bedrooms) {
      const beds = Number(activeFilters.bedrooms);
      const propertyBeds = Number(property.bedrooms);
      if (beds === 4 && propertyBeds < 4) {
        return false;
      } else if (beds !== 4 && propertyBeds !== beds) {
        return false;
      }
    }
    
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
  
  updateActiveFiltersDisplay();
  updateResultsCount();
  displayPage(1);
  
  // On mobile: collapse filters after applying
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      collapseFiltersOnMobile();
    }, 200);
  }
}

function resetFilters() {
  document.getElementById('locationFilter').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('priceFilter').value = '';
  document.getElementById('bedroomsFilter').value = '';
  document.getElementById('bathroomsFilter').value = '';
  
  activeFilters = {
    location: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: ''
  };
  
  filteredProperties = [...allProperties];
  
  const activeFiltersDiv = document.getElementById('activeFilters');
  const resultsCountDiv = document.getElementById('resultsCount');
  
  if (activeFiltersDiv) activeFiltersDiv.style.display = 'none';
  if (resultsCountDiv) resultsCountDiv.style.display = 'none';
  
  displayPage(1);
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

function updateResultsCount() {
  const resultsCountDiv = document.getElementById('resultsCount');
  if (!resultsCountDiv) return;
  
  resultsCountDiv.style.display = 'block';
  resultsCountDiv.innerHTML = `<i class="fa-solid fa-check-circle"></i> Found ${filteredProperties.length} propert${filteredProperties.length !== 1 ? 'ies' : 'y'} matching your criteria`;
}

// ========================================
// SEARCH
// ========================================

function initializeSearch() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}

function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchQuery = searchInput.value.trim();
  
  if (!searchQuery) {
    alert('Please enter a search term');
    return;
  }
  
  applySearchFilter(searchQuery);
}

function applySearchFilter(searchQuery) {
  document.getElementById('locationFilter').value = searchQuery;
  activeFilters.location = searchQuery;
  applyFilters();
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