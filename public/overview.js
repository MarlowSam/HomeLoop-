// overview.js - Overview Section Management

// ============================================
// SHOW SKELETON LOADERS IMMEDIATELY
// Called before any data is fetched
// ============================================
function showOverviewSkeletons() {
  const statBoxes = document.querySelectorAll('#overview .stat-box strong');
  statBoxes.forEach(el => {
    el.innerHTML = `
      <span style="
        display: inline-block;
        width: 60px; height: 32px;
        background: linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        border-radius: 6px;
        vertical-align: middle;
      "></span>
    `;
  });

  // Add shimmer keyframes once
  if (!document.getElementById('shimmerStyle')) {
    const style = document.createElement('style');
    style.id = 'shimmerStyle';
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ============================================
// LOAD DASHBOARD DATA
// ✅ Parallel fetches — both run at same time
// ✅ Skeletons shown immediately, replaced with real data
// ============================================
async function loadDashboardData() {
  try {
    console.log('📊 Loading dashboard stats...');

    // Show skeletons right away so hardcoded HTML numbers disappear
    showOverviewSkeletons();

    const agentId = await getLoggedInAgentId();
    if (!agentId) {
      console.error('No agent ID found');
      // Show zeros instead of leaving skeletons
      setOverviewStat(0, 0, 0);
      return;
    }

    // ✅ Fetch listings and bookings in PARALLEL — not sequentially
    const [listingsResult, bookingsResult] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/properties/agent/${agentId}`, { credentials: 'include' }),
      fetch(`${API_BASE_URL}/api/bookings?agent_id=${agentId}`, { credentials: 'include' })
    ]);

    // Process listings
    let totalListings = 0;
    let featuredListings = 0;
    if (listingsResult.status === 'fulfilled' && listingsResult.value.ok) {
      const listings = await listingsResult.value.json();
      totalListings = listings.length || 0;
      featuredListings = listings.filter(l => l.is_featured).length || 0;
    } else {
      console.error('Listings fetch failed');
    }

    // Process bookings
    let totalBookings = 0;
    if (bookingsResult.status === 'fulfilled' && bookingsResult.value.ok) {
      const data = await bookingsResult.value.json();
      totalBookings = data.count || 0;
    } else {
      console.error('Bookings fetch failed');
    }

    // Update stats
    setOverviewStat(totalListings, totalBookings, featuredListings);
    console.log(`✅ Stats: ${totalListings} listings, ${totalBookings} bookings, ${featuredListings} featured`);

  } catch (error) {
    console.error('❌ Error in loadDashboardData:', error);
    setOverviewStat(0, 0, 0);
  }
}

function setOverviewStat(total, bookings, featured) {
  const totalListingsEl = document.querySelector('#overview .stat-box:nth-child(1) strong');
  const totalBookingsEl = document.querySelector('#overview .stat-box:nth-child(2) strong');
  const featuredListingsEl = document.querySelector('#overview .stat-box:nth-child(3) strong');

  if (totalListingsEl) totalListingsEl.textContent = total;
  if (totalBookingsEl) totalBookingsEl.textContent = bookings;
  if (featuredListingsEl) featuredListingsEl.textContent = featured;
}

console.log('✅ overview.js loaded');