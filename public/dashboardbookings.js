// bookings.js - Bookings Management

async function loadBookings() {
  const tbody = document.querySelector('#bookings .booking-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2rem;">
        <i class="fas fa-spinner fa-spin"></i> Loading bookings...
      </td>
    </tr>
  `;
  
  try {
    const agentId = await getLoggedInAgentId();
    
    if (!agentId) {
      throw new Error('Agent not logged in');
    }
    
    // FIXED: Use correct endpoint with query parameter
    const response = await fetch(`${API_BASE_URL}/api/bookings?agent_id=${agentId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('Bookings response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Bookings data:', data);
      displayBookings(data.bookings || []);
      updateBookingCount(data.count || 0);
    } else {
      const errorText = await response.text();
      console.error('Bookings error response:', errorText);
      throw new Error('Failed to fetch bookings');
    }
  } catch (error) {
    console.error('Error loading bookings:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #f44336;">
          <i class="fas fa-exclamation-triangle"></i><br><br>
          ${error.message === 'Agent not logged in' 
            ? 'Please log in to view bookings.' 
            : 'Failed to load bookings. Please check your connection and try again.'}
        </td>
      </tr>
    `;
  }
}

function displayBookings(bookings) {
  const tbody = document.querySelector('#bookings .booking-table tbody');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
          <i class="fas fa-inbox"></i><br><br>
          No bookings yet. Bookings will appear here when clients book visits.
        </td>
      </tr>
    `;
    return;
  }
  
  bookings.forEach(function(booking) {
    const row = document.createElement('tr');
    
    const date = new Date(booking.preferred_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    const formattedTime = formatTime(booking.preferred_time);
    const statusBadge = getStatusBadge(booking.status);
    
    row.innerHTML = `
      <td data-label="Booker Name">${escapeHtml(booking.full_name)}</td>
      <td data-label="Phone Number">${escapeHtml(booking.phone)}</td>
      <td data-label="Email">${escapeHtml(booking.email)}</td>
      <td data-label="Preferred Date">${formattedDate}</td>
      <td data-label="Preferred Time">${formattedTime}</td>
      <td data-label="Status">${statusBadge}</td>
    `;
    
    row.style.cursor = 'pointer';
    row.addEventListener('click', function() {
      showBookingDetails(booking);
    });
    
    tbody.appendChild(row);
  });
}

function getStatusBadge(status) {
  const badges = {
    pending: '<span style="background: #ff9800; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Pending</span>',
    confirmed: '<span style="background: #4CAF50; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Confirmed</span>',
    cancelled: '<span style="background: #f44336; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Cancelled</span>'
  };
  return badges[status] || badges.pending;
}

function showBookingDetails(booking) {
  const date = new Date(booking.preferred_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const time = formatTime(booking.preferred_time);
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(26, 0, 31, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const statusColor = booking.status === 'confirmed' ? '#4CAF50' : booking.status === 'cancelled' ? '#f44336' : '#ff9800';
  const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  
  modal.innerHTML = `
    <div style="background: #2d0036; border-radius: 10px; max-width: 450px; width: 90%; padding: 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 77, 210, 0.2); overflow: hidden;">
      <div style="background: linear-gradient(135deg, #ff4dd2 0%, #ff9900 100%); padding: 18px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: white; font-size: 1.2rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Booking Details
        </h3>
        <button class="close-modal" style="background: rgba(255, 255, 255, 0.15); border: none; color: white; font-size: 22px; cursor: pointer; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">&times;</button>
      </div>
      
      <div style="padding: 24px;">
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 77, 210, 0.15);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Client Name:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${escapeHtml(booking.full_name)}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Date:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${date}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <span style="color: #999; font-size: 0.9rem;">Time:</span>
            <strong style="color: #fff; font-size: 1rem; font-weight: 500;">${time}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #999; font-size: 0.9rem;">Status:</span>
            <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500;">${statusText}</span>
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn-confirm" style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Confirm Booking
          </button>
          <button class="btn-cancel-booking" style="width: 100%; padding: 12px; background: transparent; color: #f44336; border: 1px solid #f44336; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
    <style>
      .close-modal:hover { background: rgba(255, 255, 255, 0.25); }
      .btn-confirm:hover { background: #45a049; }
      .btn-cancel-booking:hover { background: rgba(244, 67, 54, 0.08); }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
      modal.remove();
    }
  });
  
  modal.querySelector('.btn-confirm').addEventListener('click', function() {
    updateBookingStatus(booking.id, 'confirmed');
    modal.remove();
  });
  
  modal.querySelector('.btn-cancel-booking').addEventListener('click', function() {
    updateBookingStatus(booking.id, 'cancelled');
    modal.remove();
  });
}

async function updateBookingStatus(bookingId, newStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });
    
    if (response.ok) {
      await loadBookings();
      showNotification(`Booking ${newStatus} successfully!`, 'success');
    } else {
      throw new Error('Failed to update booking');
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    showNotification('Failed to update booking', 'error');
  }
}

async function deleteBooking(bookingId) {
  const confirmed = await showConfirmModal('Are you sure you want to delete this booking?');
  
  if (!confirmed) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      await loadBookings();
      showSuccessModal('Booking deleted successfully!');
    } else {
      throw new Error('Failed to delete booking');
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    showErrorModal('Failed to delete booking');
  }
}

function updateBookingCount(count) {
  const bookingCountElement = document.querySelector('.stat-box:nth-child(2) strong');
  if (bookingCountElement) {
    bookingCountElement.textContent = count;
  }
}