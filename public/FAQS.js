// faqs.js - Handle login status and header updates

document.addEventListener('DOMContentLoaded', function() {
  checkLoginStatus();
  updateFavouritesBadge();
});

// ============================================
// CHECK LOGIN STATUS AND UPDATE HEADER
// ============================================
async function checkLoginStatus() {
  const dropdownContent = document.querySelector('.dropdown-content');
  const favouritesLink = document.querySelector('.favourites');
  
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
        
        // Show favourites badge if logged in
        if (favouritesLink) {
          updateFavouritesBadge();
        }
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
        updateFavouritesBadge();
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
      updateFavouritesBadge();
    } else {
      const loginLink = document.createElement('a');
      loginLink.href = 'login.html';
      loginLink.textContent = 'Login / Signup';
      dropdownContent.appendChild(loginLink);
    }
  }
}

// ============================================
// UPDATE FAVOURITES BADGE
// ============================================
async function updateFavouritesBadge() {
  const favouritesBadge = document.querySelector('.favourites-badge');
  
  if (!favouritesBadge) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      const unreadCount = data.unread_count || 0;
      
      if (unreadCount > 0) {
        favouritesBadge.textContent = `${unreadCount} ${unreadCount === 1 ? 'Reply' : 'Replies'}`;
        favouritesBadge.style.display = 'inline-block';
      } else {
        favouritesBadge.style.display = 'none';
      }
    } else {
      favouritesBadge.style.display = 'none';
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    favouritesBadge.style.display = 'none';
  }
}

// ============================================
// FAQ TOGGLE FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isActive = question.classList.contains('active');
      
      // Close all other FAQs
      document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
        q.nextElementSibling.style.display = 'none';
      });
      
      // Toggle current FAQ
      if (!isActive) {
        question.classList.add('active');
        answer.style.display = 'block';
      }
    });
  });
});