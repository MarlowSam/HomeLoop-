

// Configuration - REPLACE WITH YOUR ACTUAL IDs
const GOOGLE_CLIENT_ID = '635748400290-mrjqtbe7nquslqck3apepd4gv45hsva8.apps.googleusercontent.com';
const FACEBOOK_APP_ID = 'PASTE_YOUR_FACEBOOK_APP_ID_HERE';

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('.login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Initialize Facebook SDK
  initFacebookSDK();

  // ==================== EMAIL/PASSWORD LOGIN ====================
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        alert('Please fill in both email and password');
        return;
      }

      const submitButton = loginForm.querySelector('.login-btn');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Logging in...';
      submitButton.disabled = true;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Login successful:', data);
          
          if (data.user.role === 'agent') {
            window.location.href = 'agentdashboard.html';
          } else {
            window.location.href = 'index.html';
          }
        } else {
          alert(data.message || 'Login failed. Please check your credentials.');
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Network error. Please check your connection and try again.');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }

  // ==================== GOOGLE LOGIN ====================
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Initialize Google Sign-In
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
      });
      
      // Trigger the Google Sign-In popup
      google.accounts.id.prompt();
    });
  }
});

// ==================== GOOGLE LOGIN CALLBACK ====================
async function handleGoogleLogin(response) {
  console.log('Google login initiated...');
  
  try {
    const credential = response.credential;
    
    if (!credential) {
      alert('Google login failed. Please try again.');
      return;
    }

    // Send credential to backend
    const backendResponse = await fetch(`${API_BASE_URL}/api/oauth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ credential })
    });

    const data = await backendResponse.json();

    if (backendResponse.ok) {
      console.log('Google login successful:', data);
      
      // Redirect to home page
      window.location.href = 'index.html';
    } else {
      alert(data.message || 'Google login failed. Please try again.');
    }
  } catch (error) {
    console.error('Google login error:', error);
    alert('Google login failed. Please try again.');
  }
}

// ==================== FACEBOOK SDK INITIALIZATION ====================
function initFacebookSDK() {
  window.fbAsyncInit = function() {
    FB.init({
      appId: FACEBOOK_APP_ID,
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });
  };
}

// ==================== FACEBOOK LOGIN ====================
const facebookLoginBtn = document.getElementById('facebookLoginBtn');

if (facebookLoginBtn) {
  facebookLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    FB.login(function(response) {
      if (response.authResponse) {
        console.log('Facebook login initiated...');
        handleFacebookLogin(response.authResponse.accessToken);
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'public_profile,email' });
  });
}

// ==================== FACEBOOK LOGIN HANDLER ====================
async function handleFacebookLogin(accessToken) {
  try {
    // Send access token to backend
    const response = await fetch(`${API_BASE_URL}/api/oauth/facebook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ accessToken })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Facebook login successful:', data);
      
      // Redirect to home page
      window.location.href = 'index.html';
    } else {
      alert(data.message || 'Facebook login failed. Please try again.');
    }
  } catch (error) {
    console.error('Facebook login error:', error);
    alert('Facebook login failed. Please try again.');
  }
}