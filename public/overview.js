// overview.js - Overview Section Management

async function loadDashboardData() {
  try {
    console.log('📊 Loading dashboard stats...');
    
    const agentId = await getLoggedInAgentId();
    if (!agentId) {
      console.error('No agent ID found');
      return;
    }

    // Fetch listings count
    try {
      const listingsResponse = await fetch(`${API_BASE_URL}/api/properties/agent/${agentId}`, {
        credentials: 'include'
      });
      
      if (listingsResponse.ok) {
        const listings = await listingsResponse.json();
        const totalListings = listings.length;
        const featuredListings = listings.filter(l => l.is_featured).length;
        
        // Update overview stats
        const totalListingsEl = document.querySelector('#overview .stat-box:nth-child(1) strong');
        const featuredListingsEl = document.querySelector('#overview .stat-box:nth-child(3) strong');
        
        if (totalListingsEl) totalListingsEl.textContent = totalListings;
        if (featuredListingsEl) featuredListingsEl.textContent = featuredListings;
        
        console.log(`✅ Listings stats updated: ${totalListings} total, ${featuredListings} featured`);
      } else {
        console.error('Listings response not OK:', listingsResponse.status);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }

    // Fetch bookings count - FIXED ENDPOINT
    try {
      const bookingsResponse = await fetch(`${API_BASE_URL}/api/bookings?agent_id=${agentId}`, {
        credentials: 'include'
      });
      
      if (bookingsResponse.ok) {
        const data = await bookingsResponse.json();
        const totalBookings = data.count || 0;
        
        // Update overview stats
        const totalBookingsEl = document.querySelector('#overview .stat-box:nth-child(2) strong');
        if (totalBookingsEl) totalBookingsEl.textContent = totalBookings;
        
        console.log(`✅ Bookings stats updated: ${totalBookings} total`);
      } else {
        console.error('Bookings response not OK:', bookingsResponse.status);
        const errorText = await bookingsResponse.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }

    console.log('✅ Dashboard stats loaded');
    
  } catch (error) {
    console.error('❌ Error in loadDashboardData:', error);
  }
}

// Placeholder for inquiry check
async function checkForInquiries() {
  console.log('📬 Checking for inquiries...');
  // Add your inquiry checking logic here if needed
}

console.log('✅ overview.js loaded');