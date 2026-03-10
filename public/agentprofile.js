// agentprofile.js - UPDATED with Horizontal Scroll Rows and Bundle Tags

document.addEventListener('DOMContentLoaded', async function() {
  await checkAuthenticationStatus();
  
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get('agent_id');
  
  if (!agentId) {
    alert('Agent not found');
    window.location.href = 'index.html';
    return;
  }
  
  await loadAgentProfile(agentId);
  await loadAgentProperties(agentId);
});

// ============================================
// CHECK AUTHENTICATION STATUS
// ============================================
async function checkAuthenticationStatus() {
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
    console.error('Auth check error:', error);
  }
}

// ============================================
// LOAD AGENT PROFILE
// ============================================
async function loadAgentProfile(agentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Agent data:', data);
      displayAgentProfile(data.agent);
    } else {
      alert('Agent not found');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Error loading agent:', error);
    alert('Error loading agent profile');
  }
}

function displayAgentProfile(agent) {
  const nameElement = document.querySelector('.agent-info h1');
  if (nameElement) {
    nameElement.textContent = agent.full_name || agent.agency_name || 'Agent';
  }
  
  const bioElement = document.querySelector('.agent-bio');
  if (bioElement) {
    bioElement.textContent = agent.bio || 'No bio available';
  }
  
  const statItems = document.querySelectorAll('.stat-item');
  
  if (statItems[0]) {
    const yearsSpan = statItems[0].querySelector('span strong');
    if (yearsSpan) {
      yearsSpan.textContent = agent.years_experience || '0';
    }
  }
  
  if (statItems[1]) {
    const specSpan = statItems[1].querySelector('span strong');
    if (specSpan) {
      specSpan.textContent = agent.specializations || 'Not specified';
    }
  }
  
  if (statItems[2]) {
    const areasSpan = statItems[2].querySelector('span strong');
    if (areasSpan) {
      areasSpan.textContent = agent.areas_of_operation || 'Not specified';
    }
  }
  
  const contactItems = document.querySelectorAll('.contact-item');
  
  if (contactItems[0] && agent.email) {
    contactItems[0].href = `mailto:${agent.email}`;
    const emailSpan = contactItems[0].querySelector('span');
    if (emailSpan) emailSpan.textContent = agent.email;
  }
  
  if (contactItems[1] && agent.phone_number) {
    contactItems[1].href = `tel:${agent.phone_number}`;
    const phoneSpan = contactItems[1].querySelector('span');
    if (phoneSpan) phoneSpan.textContent = agent.phone_number;
  }
  
  if (contactItems[2] && agent.whatsapp) {
    const cleanNumber = agent.whatsapp.replace(/\D/g, '');
    contactItems[2].href = `https://wa.me/${cleanNumber}`;
  }
  
  const socialLinks = document.querySelectorAll('.social-links a');
  
  if (socialLinks[0]) {
    socialLinks[0].href = agent.facebook || '#';
    socialLinks[0].style.display = agent.facebook ? 'flex' : 'none';
  }
  
  if (socialLinks[1]) {
    socialLinks[1].href = agent.linkedin || '#';
    socialLinks[1].style.display = agent.linkedin ? 'flex' : 'none';
  }
  
  if (socialLinks[2]) {
    socialLinks[2].href = agent.instagram || '#';
    socialLinks[2].style.display = agent.instagram ? 'flex' : 'none';
  }
  
  const licenseDetails = document.querySelectorAll('.license-detail');
  
  if (licenseDetails[0]) {
    const licenseValue = licenseDetails[0].querySelector('.value');
    if (licenseValue) {
      licenseValue.textContent = agent.licence_number || 'N/A';
    }
  }
  
  if (licenseDetails[1]) {
    const statusValue = licenseDetails[1].querySelector('.value.verified');
    if (statusValue) {
      if (agent.is_verified) {
        statusValue.innerHTML = '<i class="fas fa-check-circle"></i> Verified Agent';
        statusValue.style.color = '#00ff99';
      } else {
        statusValue.innerHTML = '<i class="fas fa-clock"></i> Pending Verification';
        statusValue.style.color = '#ff9900';
      }
    }
  }
  
  const photoElement = document.querySelector('.agent-photo');
  if (photoElement && agent.profile_picture) {
    photoElement.src = `${API_BASE_URL}${agent.profile_picture}`;
    photoElement.addEventListener('error', function() {
      this.src = 'Images/default avatar.png';
    });
  }
  
  document.title = `${agent.full_name || 'Agent'} - HomeLoop`;
}

// ============================================
// LOAD AGENT PROPERTIES - WITH ROWS
// ============================================
async function loadAgentProperties(agentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/properties`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Agent properties:', data);
      displayAgentProperties(data.properties, agentId);
    }
  } catch (error) {
    console.error('Error loading agent properties:', error);
  }
}

function displayAgentProperties(properties, agentId) {
  const propertiesContainer = document.getElementById('propertiesContainer');
  
  if (!propertiesContainer) {
    console.error('Properties container not found');
    return;
  }
  
  if (properties && properties.length > 0) {
    propertiesContainer.innerHTML = '';
    
    // Update header with agent name
    const headerElement = document.querySelector('.section-header h2');
    if (headerElement) {
      const agentName = document.querySelector('.agent-info h1')?.textContent || 'Agent';
      headerElement.innerHTML = `<i class="fas fa-building"></i> Properties Listed by ${agentName}`;
    }
    
    // Limit to 30 properties (3 rows of 10)
    const limitedProperties = properties.slice(0, 30);
    
    // Split into rows of 10
    const rowSize = 10;
    const numRows = Math.ceil(limitedProperties.length / rowSize);
    
    for (let i = 0; i < numRows; i++) {
      const rowProperties = limitedProperties.slice(i * rowSize, (i + 1) * rowSize);
      const rowDiv = createPropertyRow(rowProperties);
      propertiesContainer.appendChild(rowDiv);
    }
    
  } else {
    propertiesContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">No properties listed yet.</p>';
  }
}

function createPropertyRow(properties) {
  const rowDiv = document.createElement('div');
  rowDiv.className = 'properties-row';
  
  const scrollDiv = document.createElement('div');
  scrollDiv.className = 'properties-scroll';
  
  properties.forEach(property => {
    const card = createPropertyCard(property);
    scrollDiv.appendChild(card);
  });
  
  rowDiv.appendChild(scrollDiv);
  return rowDiv;
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  
  // If property has a bundle_id, link to the bundle page instead
  if (property.bundle_id) {
    card.href = `bundle.html?id=${property.bundle_id}`;
  } else {
    card.href = `house.html?id=${property.property_id}`;
  }
  
  card.className = 'property-card';
  
  let images = [];
  if (property.images) {
    if (typeof property.images === 'string') {
      try {
        images = JSON.parse(property.images);
      } catch (e) {
        images = [property.images];
      }
    } else if (Array.isArray(property.images)) {
      images = property.images;
    }
  }
  
  // ✅ FIXED: Cloudinary URLs are already complete - no API_BASE_URL prefix needed
  const imageUrl = images && images.length > 0 
    ? images[0]
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  // Show bundle tag if property is part of a bundle
  const bundleTag = property.bundle_id ? '<div class="bundle-tag"><i class="fas fa-gift"></i> Bundle</div>' : '';
  
  // Determine property type badge
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
    <div class="card-content">
      <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(fullLocation)}</p>
      ${propertyTypeBadge}
      <p class="details">${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
      <p class="price">Ksh ${formatPrice(property.price)}</p>
      <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
    </div>
  `;
  
  return card;
}

// HELPER FUNCTIONS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}