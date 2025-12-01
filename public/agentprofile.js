// agentprofile.js - FIXED VERSION

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
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.isAuthenticated) {
        const loginLink = document.querySelector('.dropdown-content a[href="login.html"]');
        const signupLink = document.querySelector('.dropdown-content a[href="signup.html"]');
        const logoutLink = document.getElementById('logoutBtn');
        
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (logoutLink) {
          logoutLink.style.display = 'block';
          logoutLink.addEventListener('click', handleLogout);
        }
      } else {
        const loginLink = document.querySelector('.dropdown-content a[href="login.html"]');
        const signupLink = document.querySelector('.dropdown-content a[href="signup.html"]');
        const logoutLink = document.getElementById('logoutBtn');
        
        if (loginLink) loginLink.style.display = 'block';
        if (signupLink) signupLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

async function handleLogout(e) {
  e.preventDefault();
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ============================================
// LOAD AGENT PROFILE
// ============================================
async function loadAgentProfile(agentId) {
  try {
    const response = await fetch(`/api/agents/${agentId}`, {
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
    const whatsappSpan = contactItems[2].querySelector('span');
    if (whatsappSpan) whatsappSpan.textContent = 'Chat on WhatsApp';
  }
  
  const socialLinks = document.querySelectorAll('.social-links a');
  
  if (socialLinks[0]) {
    if (agent.facebook) {
      socialLinks[0].href = agent.facebook;
      socialLinks[0].style.display = 'flex';
    } else {
      socialLinks[0].style.display = 'none';
    }
  }
  
  if (socialLinks[1]) {
    if (agent.linkedin) {
      socialLinks[1].href = agent.linkedin;
      socialLinks[1].style.display = 'flex';
    } else {
      socialLinks[1].style.display = 'none';
    }
  }
  
  if (socialLinks[2]) {
    if (agent.instagram) {
      socialLinks[2].href = agent.instagram;
      socialLinks[2].style.display = 'flex';
    } else {
      socialLinks[2].style.display = 'none';
    }
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
  if (photoElement) {
    if (agent.profile_picture) {
      photoElement.src = `/uploads${agent.profile_picture.replace('/uploads', '')}`;
      photoElement.addEventListener('error', function() {
        this.src = 'Images/default avatar.png';
      });
    } else {
      photoElement.src = 'Images/default avatar.png';
    }
  }
  
  document.title = `${agent.full_name || 'Agent'} - HomeLoop`;
}

// ============================================
// LOAD AGENT PROPERTIES
// ============================================
async function loadAgentProperties(agentId) {
  try {
    const response = await fetch(`/api/agents/${agentId}/properties`, {
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
  const propertiesContainer = document.querySelector('.properties-grid');
  
  if (!propertiesContainer) {
    console.error('Properties container not found');
    return;
  }
  
  if (properties && properties.length > 0) {
    propertiesContainer.innerHTML = '';
    
    properties.forEach(property => {
      const card = createPropertyCard(property);
      propertiesContainer.appendChild(card);
    });
    
    const headerElement = document.querySelector('.section-header h2');
    if (headerElement) {
      const agentName = document.querySelector('.agent-info h1')?.textContent || 'Agent';
      headerElement.innerHTML = `<i class="fas fa-building"></i> Properties Listed by ${agentName}`;
    }
  } else {
    propertiesContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 2rem; color: #999;">No properties listed yet.</p>';
  }
}

function createPropertyCard(property) {
  const card = document.createElement('a');
  card.href = `house.html?id=${property.property_id}`;
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
  
  const imageUrl = images && images.length > 0 
    ? `/uploads${images[0].replace('/uploads', '')}`
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60';
  
  const fullLocation = property.address_line1 
    ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
    : property.city || 'Location not specified';
  
  card.innerHTML = `
    <div class="card-image" style="background-image:url('${imageUrl}')"></div>
    <div class="card-content">
      <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(fullLocation)}</p>
      <p class="type">${escapeHtml(property.property_type || 'Property')}</p>
      <p class="details">${property.bedrooms || 0} Bed • ${property.bathrooms || 0} Bath</p>
      <p class="price">Ksh ${formatPrice(property.price)}</p>
      <p class="units-left">Only ${property.units_available || 1} unit${property.units_available !== 1 ? 's' : ''} left</p>
    </div>
  `;
  
  return card;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-KE');
}