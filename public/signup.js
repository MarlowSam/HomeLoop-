// signup.js - UPDATED FOR LOCAL AND PRODUCTION

document.addEventListener('DOMContentLoaded', function() {
  const signupForm = document.querySelector('.signup-form'); // Changed from .signup
  const agentCheckbox = document.querySelector('input[name="is_agent"]');
  const agentForm = document.getElementById('agentForm');
  const emailInput = document.getElementById('email');
  const usernameInput = document.getElementById('username'); // Changed from Username to username
  const passwordInput = document.getElementById('password');

  // Function to show styled welcome message
  function showWelcomeMessage(username) {
    // Create message box
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(46, 0, 51, 0.95);
      padding: 15px 25px;
      border-radius: 8px;
      border: 1px solid #ff4dd2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
    `;

    // Create welcome text
    const welcomeText = document.createElement('div');
    welcomeText.textContent = `Welcome ${username}!`;
    welcomeText.style.cssText = `
      font-size: 1rem;
      font-weight: 600;
      color: white;
      margin: 0;
    `;

    messageBox.appendChild(welcomeText);
    document.body.appendChild(messageBox);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { 
          transform: translateX(400px);
          opacity: 0;
        }
        to { 
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Show/hide agent form based on checkbox
  if (agentCheckbox && agentForm) {
    agentForm.style.display = 'none';
    
    agentCheckbox.addEventListener('change', function() {
      if (this.checked) {
        agentForm.style.display = 'block';
        document.getElementById('fullName').required = true;
        document.getElementById('license').required = true;
        document.getElementById('agency').required = true;
        document.getElementById('phoneAgent').required = true;
      } else {
        agentForm.style.display = 'none';
        document.getElementById('fullName').required = false;
        document.getElementById('license').required = false;
        document.getElementById('agency').required = false;
        document.getElementById('phoneAgent').required = false;
      }
    });
  }

  // Handle form submission
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const isAgent = agentCheckbox ? agentCheckbox.checked : false;

      // Validation
      if (!email || !username || !password) {
        alert('Please fill in email, username, and password');
        return;
      }

      // Validate username format (3-20 characters, alphanumeric + underscore)
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        alert('Username must be 3-20 characters (letters, numbers, underscore only)');
        return;
      }

      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      const requestBody = {
        email: email,
        username: username,
        password: password,
        isAgent: isAgent
      };

      if (isAgent) {
        const fullName = document.getElementById('fullName').value.trim();
        const license = document.getElementById('license').value.trim();
        const agency = document.getElementById('agency').value.trim();
        const phoneAgent = document.getElementById('phoneAgent').value.trim();

        if (!fullName || !license || !agency || !phoneAgent) {
          alert('Please fill in all agent details');
          return;
        }

        requestBody.fullName = fullName;
        requestBody.licenseNumber = license;
        requestBody.agencyName = agency;
        requestBody.phoneNumber = phoneAgent;
      }

      const submitButton = signupForm.querySelector('.signup-btn');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Creating Account...';
      submitButton.disabled = true;

      try {
        console.log('Attempting to connect to backend...');
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody)
        });

        console.log('Response received:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
          console.log('Signup successful:', data);
          
          // Show styled welcome message
          showWelcomeMessage(username);
          
          // IMMEDIATE REDIRECT after 1.5 seconds
          setTimeout(() => {
            console.log('Redirecting to:', data.user.role === 'agent' ? 'agentdashboard.html' : 'index.html');
            
            if (data.user.role === 'agent') {
              window.location.href = 'agentdashboard.html';
            } else {
              window.location.href = 'index.html';
            }
          }, 1500);
        } else {
          console.error('Server error:', data);
          alert(data.message || 'Signup failed. Please try again.');
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        console.error('Full error details:', error);
        alert('Network error: ' + error.message);
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }
    });
  }
});