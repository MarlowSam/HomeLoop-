// about.js - About page functionality

document.addEventListener('DOMContentLoaded', async function() {
  console.log('About page loaded');
  await checkAuthentication();
  initializeSearch();
});

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

function performSearch() {
  const searchInput = document.querySelector('.search-container input');
  const searchQuery = searchInput.value.trim();
  
  if (!searchQuery) {
    alert('Please enter a search term');
    return;
  }
  
  // Redirect to home page with search query
  window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`;
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

// ========================================
// SMOOTH SCROLL FOR NAVIGATION
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});