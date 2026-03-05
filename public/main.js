// main.js - UPDATED with Balance Section

// Track current active section
let currentSection = 'overview';

// Define showSection FIRST before anything else uses it
function showSection(sectionId) {
  console.log(`📍 Switching to section: ${sectionId}`);
  
  // Update current section tracker
  currentSection = sectionId;
  
  // Remove active from all sections and nav links
  const sections = document.querySelectorAll('.main-content section');
  const navLinks = document.querySelectorAll('.sidebar a[data-target]');
  
  sections.forEach(s => s.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  
  // Add active to target section and nav link
  const targetSection = document.getElementById(sectionId);
  const targetLink = document.querySelector(`a[data-target="${sectionId}"]`);
  
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  if (targetLink) {
    targetLink.classList.add('active');
  }
  
  console.log(`✅ Now on section: ${sectionId}`);
}

// Get current active section
function getCurrentSection() {
  const activeSection = document.querySelector('.main-content section.active');
  if (activeSection) {
    return activeSection.id;
  }
  return currentSection;
}

// Prevent navigation during saves - CRITICAL FIX
window.addEventListener('beforeunload', function(e) {
  if (window.profileSaveInProgress) {
    console.log('⚠️ Blocking page unload - profile save in progress!');
    e.preventDefault();
    e.returnValue = 'Save in progress...';
    return 'Save in progress...';
  }
});

document.addEventListener('DOMContentLoaded', async function() {
  // Wait for auth cookie to be properly set
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 🔐 Check authentication with retries
  let authAttempts = 0;
  const maxAttempts = 3;
  let authenticated = false;
  
  while (authAttempts < maxAttempts) {
    try {
      console.log(`Checking authentication... (attempt ${authAttempts + 1})`);
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include'
      });

      console.log('Auth check response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Auth data:', data);

        if (!data.isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          window.location.href = 'login.html';
          return;
        }

        if (data.user.role !== 'agent') {
          console.log('Not an agent, redirecting to homepage');
          window.location.href = 'index.html';
          return;
        }
        
        // Successfully authenticated as agent
        console.log('✅ Agent authenticated:', data.user);
        updateDashboardWithUserInfo(data.user);
        authenticated = true;
        break;
      } else {
        authAttempts++;
        if (authAttempts >= maxAttempts) {
          console.log('Max auth attempts reached, redirecting to login');
          window.location.href = 'login.html';
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Auth check error:', error);
      authAttempts++;
      if (authAttempts >= maxAttempts) {
        window.location.href = 'login.html';
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // If authenticated successfully, initialize dashboard
  if (authenticated) {
    try {
      // Initialize all sections
      initializeListingsSection();
      initializeBookingsSection();
      initializeBalanceSection(); // Initialize balance section
      initializeProfileSection();
      
      // Load dashboard data
      await loadDashboardData();
      await checkForInquiries();
      
      // Show default section
      const currentActive = getCurrentSection();
      console.log(`🔄 Setting initial section: ${currentActive}`);
      showSection(currentActive);
      
      // Make content visible
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.style.opacity = '1';
      }
      
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  // Fill dashboard with user info
  function updateDashboardWithUserInfo(user) {
    const welcomeElement = document.querySelector('#overview h1');
    if (welcomeElement && user.full_name) {
      welcomeElement.textContent = `Welcome, ${user.full_name}`;
    }

    // Update profile form fields if they exist
    if (document.getElementById('fullName')) document.getElementById('fullName').value = user.full_name || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = user.phone_number || '';
    if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
    if (document.getElementById('licenseNumber')) document.getElementById('licenseNumber').value = user.licence_number || '';
    
    // Update profile picture if available
    if (user.profile_picture) {
      const photoPreview = document.getElementById('photoPreview');
      if (photoPreview) {
        photoPreview.src = `${API_BASE_URL}${user.profile_picture}`;
      }
    }
    
    // Update verification status in overview
    if (user.licence_number && user.licence_number.trim() !== '') {
      const verifiedText = document.querySelector('.verified-text');
      if (verifiedText) {
        verifiedText.textContent = 'Verified Agent';
        verifiedText.style.color = '#4CAF50';
      }
    } else {
      const verifiedText = document.querySelector('.verified-text');
      if (verifiedText) {
        verifiedText.textContent = 'Not Verified';
        verifiedText.style.color = '#f44336';
      }
    }
  }

  // Logout
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', async e => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  });

  // Sidebar navigation
  const navLinks = document.querySelectorAll('.sidebar a[data-target]');
  const sections = document.querySelectorAll('.main-content section');
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');

  // Hamburger click
  hamburger?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Hamburger clicked!');
    sidebar.classList.toggle('active');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 1024 && 
        sidebar && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !hamburger.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  // Navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.dataset.target;
      showSection(targetId);
      
      // Close mobile menu
      if (window.innerWidth <= 1024 && sidebar) {
        sidebar.classList.remove('active');
      }
    });
  });

  // Set default section only if none is active
  const hasActiveSection = document.querySelector('.main-content section.active');
  if (!hasActiveSection) {
    showSection('overview');
  } else {
    // Track the initially active section
    currentSection = hasActiveSection.id;
  }

  console.log('✅ Agent Dashboard loaded successfully');
});

// Initialize Bookings Section
function initializeBookingsSection() {
  console.log('🎫 Initializing Bookings section...');
  
  const refreshBtn = document.querySelector('#bookings .btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Refresh bookings clicked');
      await loadBookings();
    });
  }
  
  const exportBtn = document.querySelector('#bookings .btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', function(e) {
      e.preventDefault();
      exportBookingsToCSV();
    });
  }
  
  loadBookings();
  
  console.log('✅ Bookings section initialized');
}

// Export Bookings to CSV
function exportBookingsToCSV() {
  const table = document.querySelector('#bookings .booking-table');
  if (!table) return;
  
  let csv = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const rowData = [];
    cols.forEach(col => {
      let text = col.textContent.trim();
      text = text.replace(/\s+/g, ' ');
      text = text.replace(/"/g, '""');
      rowData.push(`"${text}"`);
    });
    csv.push(rowData.join(','));
  });
  
  const csvContent = csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showNotification('Bookings exported successfully!', 'success');
}