// main.js - UPDATED with Balance Section + Performance Optimisations

let currentSection = 'overview';

function showSection(sectionId) {
  console.log(`📍 Switching to section: ${sectionId}`);
  currentSection = sectionId;

  document.querySelectorAll('.main-content section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar a[data-target]').forEach(l => l.classList.remove('active'));

  const targetSection = document.getElementById(sectionId);
  const targetLink = document.querySelector(`a[data-target="${sectionId}"]`);

  if (targetSection) targetSection.classList.add('active');
  if (targetLink) targetLink.classList.add('active');

  console.log(`✅ Now on section: ${sectionId}`);
}

function getCurrentSection() {
  const activeSection = document.querySelector('.main-content section.active');
  return activeSection ? activeSection.id : currentSection;
}

window.addEventListener('beforeunload', function(e) {
  if (window.profileSaveInProgress) {
    e.preventDefault();
    e.returnValue = 'Save in progress...';
    return 'Save in progress...';
  }
});

document.addEventListener('DOMContentLoaded', async function() {

  // ✅ Reduced from 1000ms to 100ms — saves nearly a second on every login
  await new Promise(resolve => setTimeout(resolve, 100));

  let authAttempts = 0;
  const maxAttempts = 3;
  let authenticated = false;
  let userData = null;

  while (authAttempts < maxAttempts) {
    try {
      console.log(`Checking authentication... (attempt ${authAttempts + 1})`);
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET', credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        if (!data.isAuthenticated) {
          window.location.href = 'login.html';
          return;
        }

        if (data.user.role !== 'agent') {
          window.location.href = 'index.html';
          return;
        }

        userData = data.user;
        updateDashboardWithUserInfo(data.user);
        authenticated = true;
        break;
      } else {
        authAttempts++;
        if (authAttempts >= maxAttempts) {
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

  if (authenticated) {
    try {
      // ✅ Initialize UI sections (no API calls yet — fast)
      initializeListingsSection();
      initializeBookingsSection();
      initializeBalanceSection();
      initializeProfileSection();

      // ✅ Show section immediately so UI feels instant
      const currentActive = getCurrentSection();
      showSection(currentActive);
      const mainContent = document.getElementById('mainContent');
      if (mainContent) mainContent.style.opacity = '1';

      // ✅ Load data in parallel — both run at same time instead of sequentially
      await Promise.all([
        loadDashboardData(),
        checkForInquiriesOnLoad()
      ]);

    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  function updateDashboardWithUserInfo(user) {
    const welcomeElement = document.querySelector('#overview h1');
    if (welcomeElement && user.full_name) {
      welcomeElement.textContent = `Welcome, ${user.full_name}`;
    }

    if (document.getElementById('fullName')) document.getElementById('fullName').value = user.full_name || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = user.phone_number || '';
    if (document.getElementById('email')) document.getElementById('email').value = user.email || '';
    if (document.getElementById('licenseNumber')) document.getElementById('licenseNumber').value = user.licence_number || '';

    if (user.profile_picture) {
      const photoPreview = document.getElementById('photoPreview');
      if (photoPreview) photoPreview.src = `${API_BASE_URL}${user.profile_picture}`;
    }

    const verifiedText = document.querySelector('.verified-text');
    if (verifiedText) {
      if (user.licence_number && user.licence_number.trim() !== '') {
        verifiedText.textContent = 'Verified Agent';
        verifiedText.style.color = '#4CAF50';
      } else {
        verifiedText.textContent = 'Not Verified';
        verifiedText.style.color = '#f44336';
      }
    }
  }

  // Logout
  document.querySelectorAll('[data-logout]').forEach(button => {
    button.addEventListener('click', async e => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST', credentials: 'include'
        });
        if (response.ok) window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  });

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');

  hamburger?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    sidebar.classList.toggle('active');
  });

  document.addEventListener('click', function(e) {
    if (
      window.innerWidth <= 1024 &&
      sidebar &&
      sidebar.classList.contains('active') &&
      !sidebar.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      sidebar.classList.remove('active');
    }
  });

  // ✅ Navigation — listings only loads its data when you actually visit that tab
  let listingsLoaded = false;

  document.querySelectorAll('.sidebar a[data-target]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.dataset.target;
      showSection(targetId);

      // ✅ Lazy load listings data only on first visit to listings tab
      if (targetId === 'listings' && !listingsLoaded) {
        listingsLoaded = true;
        if (typeof loadAgentProperties === 'function') {
          loadAgentProperties();
        }
      }

      if (window.innerWidth <= 1024 && sidebar) {
        sidebar.classList.remove('active');
      }
    });
  });

  const hasActiveSection = document.querySelector('.main-content section.active');
  if (!hasActiveSection) {
    showSection('overview');
  } else {
    currentSection = hasActiveSection.id;
  }

  // If user lands directly on listings tab, load it now
  if (currentSection === 'listings' && !listingsLoaded) {
    listingsLoaded = true;
    if (typeof loadAgentProperties === 'function') {
      loadAgentProperties();
    }
  }

  console.log('✅ Agent Dashboard loaded successfully');
});

function initializeBookingsSection() {
  console.log('🎫 Initializing Bookings section...');

  const refreshBtn = document.querySelector('#bookings .btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async function(e) {
      e.preventDefault();
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

function exportBookingsToCSV() {
  const table = document.querySelector('#bookings .booking-table');
  if (!table) return;

  const csv = [];
  table.querySelectorAll('tr').forEach(row => {
    const rowData = [];
    row.querySelectorAll('td, th').forEach(col => {
      let text = col.textContent.trim().replace(/\s+/g, ' ').replace(/"/g, '""');
      rowData.push(`"${text}"`);
    });
    csv.push(rowData.join(','));
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  showNotification('Bookings exported successfully', 'success');
}