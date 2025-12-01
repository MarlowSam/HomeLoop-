// bookvisit.js - Submit booking to database

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('visitForm');
  const successMessage = document.getElementById('successMessage');
  
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('property_id');
  
  // Set minimum date to today
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
  
  if (!form) {
    console.error('Form not found');
    return;
  }
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    // Validate property_id exists
    if (!propertyId) {
      alert('Property ID is missing. Please navigate from a property page.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }
    
    // Collect form data
    const bookingData = {
      property_id: propertyId,
      full_name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      preferred_date: document.getElementById('date').value,
      preferred_time: document.getElementById('time').value,
      notes: document.getElementById('notes').value.trim()
    };
    
    // Validate required fields
    if (!bookingData.full_name || !bookingData.email || !bookingData.phone || !bookingData.preferred_date || !bookingData.preferred_time) {
      alert('Please fill in all required fields');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }
    
    console.log('Submitting booking data:', bookingData);
    
    await submitBooking(bookingData, submitBtn, originalBtnText);
  });
});

async function submitBooking(bookingData, submitBtn, originalBtnText) {
  const successMessage = document.getElementById('successMessage');
  
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(bookingData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Booking submitted:', data);
      
      // Show success message
      if (successMessage) {
        successMessage.style.display = 'block';
        successMessage.textContent = '✓ ' + data.message;
        successMessage.style.backgroundColor = '#4CAF50';
        successMessage.style.color = 'white';
        successMessage.style.padding = '1rem';
        successMessage.style.borderRadius = '4px';
        successMessage.style.marginTop = '1rem';
        successMessage.style.textAlign = 'center';
        
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Reset form
      document.getElementById('visitForm').reset();
      
      // Hide message and redirect after 3 seconds
      setTimeout(function() {
        if (successMessage) {
          successMessage.style.display = 'none';
        }
        // Optional: redirect to homepage
        // window.location.href = 'index.html';
      }, 3000);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit booking');
    }
  } catch (error) {
    console.error('Error submitting booking:', error);
    
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.textContent = '✗ ' + error.message;
      successMessage.style.backgroundColor = '#f44336';
      successMessage.style.color = 'white';
      successMessage.style.padding = '1rem';
      successMessage.style.borderRadius = '4px';
      successMessage.style.marginTop = '1rem';
      successMessage.style.textAlign = 'center';
      
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(function() {
        successMessage.style.display = 'none';
      }, 5000);
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}