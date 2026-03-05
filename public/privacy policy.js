
document.addEventListener('DOMContentLoaded', function() {
  // Check login status and update dropdown
  checkLoginStatus();
  
  // Smooth scroll for anchor links
  initializeSmoothScroll();
  
  // Add scroll-to-top functionality on logo click
  initializeLogoClick();
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
        // User is NOT logged in - show Login/Signup
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.textContent = 'Login / Signup';
        
        dropdownContent.appendChild(loginLink);
      }
    } else {
      // If API fails, check if there's a session cookie
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
            await fetch(`${API_BASE_URL}/api/auth/logout`, {
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
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
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
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
function initializeSmoothScroll() {
  const contentLinks = document.querySelectorAll('a[href^="#"]');
  contentLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return; // Skip empty anchors
      
      e.preventDefault();
      const targetSection = document.querySelector(href);
      
      if (targetSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// LOGO CLICK TO HOME
// ============================================
function initializeLogoClick() {
  const logoContainer = document.querySelector('.logo-container');
  if (logoContainer) {
    logoContainer.addEventListener('click', function() {
      window.location.href = 'index.html';
    });
  }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
const searchInput = document.querySelector('.search-container input');
const searchBtn = document.querySelector('.search-btn');

if (searchInput && searchBtn) {
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

function performSearch() {
  const query = searchInput.value.trim();
  if (query) {
    // Redirect to main page with search query
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
  }
}

// ============================================
// SCROLL TO TOP ON LOAD
// ============================================
window.addEventListener('load', function() {
  // Scroll to top when page loads
  window.scrollTo(0, 0);
});