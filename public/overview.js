// overview.js - Overview Section Management

// ============================================
// SHOW SKELETON LOADERS IMMEDIATELY
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
// ✅ Single API call — replaces 3 separate fetches
//    (listings, bookings, inquiry count)
// ✅ Skeletons shown immediately
// ============================================
async function loadDashboardData() {
  showOverviewSkeletons();

  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/dashboard/summary`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();

      setOverviewStat(
        data.total_listings,
        data.total_bookings,
        data.featured_listings
      );

      // Also update the inquiry badge from the same response
      if (typeof updateInquiryBadge === 'function') {
        updateInquiryBadge(data.unread_inquiry_count || 0);
      }

      console.log(`✅ Dashboard stats loaded — ${data.total_listings} listings, ${data.total_bookings} bookings, ${data.featured_listings} featured, ${data.unread_inquiry_count} inquiries`);
    } else {
      console.error('Dashboard summary fetch failed:', response.status);
      setOverviewStat(0, 0, 0);
    }
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