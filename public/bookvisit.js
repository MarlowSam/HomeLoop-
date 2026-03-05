document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('visitForm');
  const paymentModal = document.getElementById('paymentModal');
  const successModal = document.getElementById('successModal');
  const payBtn = document.getElementById('payBtn');
  const cancelPayBtn = document.getElementById('cancelPayBtn');
  const paymentStatus = document.getElementById('paymentStatus');
  
  // Get property ID and bundle status from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('property_id');
  const isBundle = urlParams.get('bundle') === 'true';
  
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

  // Auto-fill phone number in payment modal from form
  const phoneInput = document.getElementById('phone');
  const mpesaPhoneInput = document.getElementById('mpesaPhone');
  
  phoneInput.addEventListener('input', function() {
    if (mpesaPhoneInput) {
      mpesaPhoneInput.value = this.value;
    }
  });
  
  // Load property details
  loadPropertyDetails();
  
  // Form submit - Show payment modal
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate property_id exists
    if (!propertyId) {
      alert('Property ID is missing. Please navigate from a property page.');
      return;
    }
    
    // Validate required fields
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    
    if (!fullName || !email || !phone || !date || !time) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Update payment modal with booking details
    document.getElementById('visitDate').textContent = formatDate(date);
    document.getElementById('visitTime').textContent = time;
    
    // Show payment modal
    paymentModal.style.display = 'flex';
  });
  
  // Cancel payment button
  cancelPayBtn.addEventListener('click', function() {
    paymentModal.style.display = 'none';
    paymentStatus.className = 'payment-status';
    paymentStatus.textContent = '';
  });
  
  // Pay button - Process payment
  payBtn.addEventListener('click', async function() {
    const mpesaPhone = mpesaPhoneInput.value.trim();
    
    // Validate M-Pesa phone number
    if (!mpesaPhone) {
      showPaymentStatus('Please enter your M-Pesa phone number', 'error');
      return;
    }
    
    if (!/^254\d{9}$/.test(mpesaPhone)) {
      showPaymentStatus('Please enter a valid phone number (254XXXXXXXXX)', 'error');
      return;
    }
    
    // Disable buttons during processing
    payBtn.disabled = true;
    cancelPayBtn.disabled = true;
    
    // Show processing status
    showPaymentStatus('<span class="spinner"></span> Processing payment... Check your phone for M-Pesa prompt', 'processing');
    
    // Collect booking data
    const bookingData = {
      property_id: propertyId,
      is_bundle: isBundle,
      full_name: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      preferred_date: document.getElementById('date').value,
      preferred_time: document.getElementById('time').value,
      notes: document.getElementById('notes').value.trim(),
      mpesa_phone: mpesaPhone,
      amount: isBundle ? 1500 : getViewingFee()
    };
    
    console.log('Initiating payment:', bookingData);
    
    // Simulate payment process (Replace with actual API call)
    await processPayment(bookingData);
  });
  
  // Load property details from API
  async function loadPropertyDetails() {
    try {
      if (!propertyId) {
        document.getElementById('propertyName').textContent = isBundle ? 'Bundle Package (2 Properties)' : 'Property Visit';
        document.getElementById('viewingFee').textContent = '1,500';
        return;
      }
      
      // If it's a bundle, fetch bundle data to get viewing fee
      if (isBundle) {
        // Try to get bundle ID from URL or fetch property to get bundle_id
        const bundleId = urlParams.get('bundle_id');
        
        if (bundleId) {
          const bundleResponse = await fetch(`${API_BASE_URL}/api/bundles/${bundleId}`);
          if (bundleResponse.ok) {
            const bundleData = await bundleResponse.json();
            document.getElementById('propertyName').textContent = `Bundle Package (${bundleData.bundle.properties.length} Properties)`;
            document.getElementById('viewingFee').textContent = bundleData.bundle.viewing_fee ? bundleData.bundle.viewing_fee.toLocaleString() : '1,500';
            return;
          }
        }
        
        // Fallback: fetch property to get bundle info
        const propResponse = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`);
        if (propResponse.ok) {
          const propData = await propResponse.json();
          if (propData.property.bundle_id) {
            const bundleResponse = await fetch(`${API_BASE_URL}/api/bundles/${propData.property.bundle_id}`);
            if (bundleResponse.ok) {
              const bundleData = await bundleResponse.json();
              document.getElementById('propertyName').textContent = `Bundle Package (${bundleData.bundle.properties.length} Properties)`;
              document.getElementById('viewingFee').textContent = bundleData.bundle.viewing_fee ? bundleData.bundle.viewing_fee.toLocaleString() : '1,500';
              return;
            }
          }
        }
        
        // Final fallback for bundles
        document.getElementById('propertyName').textContent = 'Bundle Package';
        document.getElementById('viewingFee').textContent = '1,500';
        return;
      }
      
      // Regular property (not a bundle)
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}`);
      
      if (response.ok) {
        const data = await response.json();
        const property = data.property;
        
        // Use property location for name
        const locationName = property.address_line1 
          ? `${property.address_line1}${property.city && !property.address_line1.includes(property.city) ? ', ' + property.city : ''}`
          : property.city || 'Property Visit';
          
        document.getElementById('propertyName').textContent = locationName;
        document.getElementById('viewingFee').textContent = property.viewing_fee ? property.viewing_fee.toLocaleString() : '1,000';
      } else {
        document.getElementById('propertyName').textContent = 'Property Visit';
        document.getElementById('viewingFee').textContent = '1,000';
      }
    } catch (error) {
      console.error('Error loading property details:', error);
      document.getElementById('propertyName').textContent = isBundle ? 'Bundle Package' : 'Property Visit';
      document.getElementById('viewingFee').textContent = isBundle ? '1,500' : '1,000';
    }
  }
  
  // Process payment
  async function processPayment(bookingData) {
    try {
      // Step 1: Initiate M-Pesa STK Push
      const paymentResponse = await fetch(`${API_BASE_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          phone_number: bookingData.mpesa_phone,
          amount: bookingData.amount,
          property_id: bookingData.property_id,
          booking_data: bookingData
        })
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Payment initiation failed');
      }
      
      const paymentData = await paymentResponse.json();
      console.log('Payment initiated:', paymentData);
      
      // Step 2: Poll for payment status (or wait for callback)
      // In production, you'd poll the server or use websockets
      // For now, we'll simulate a successful payment after 3 seconds
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful payment
      const isPaymentSuccessful = true; // In production, check actual payment status
      
      if (isPaymentSuccessful) {
        // Step 3: Create booking after successful payment
        const bookingResponse = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            ...bookingData,
            payment_status: 'paid',
            payment_reference: paymentData.checkout_request_id || 'TEST123456'
          })
        });
        
        if (!bookingResponse.ok) {
          throw new Error('Booking creation failed');
        }
        
        const booking = await bookingResponse.json();
        console.log('Booking created:', booking);
        
        // Show success
        showPaymentStatus('<i class="fas fa-check-circle"></i> Payment successful!', 'success');
        
        // Wait a moment then show success modal
        setTimeout(() => {
          paymentModal.style.display = 'none';
          document.getElementById('bookingReference').textContent = booking.booking_id || `BK${Date.now()}`;
          successModal.style.display = 'flex';
          
          // Reset form
          form.reset();
          
          // Re-enable buttons
          payBtn.disabled = false;
          cancelPayBtn.disabled = false;
        }, 1500);
        
      } else {
        throw new Error('Payment was not completed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      showPaymentStatus(`<i class="fas fa-exclamation-circle"></i> ${error.message || 'Payment failed. Please try again.'}`, 'error');
      
      // Re-enable buttons
      payBtn.disabled = false;
      cancelPayBtn.disabled = false;
    }
  }
  
  // Show payment status message
  function showPaymentStatus(message, type) {
    paymentStatus.innerHTML = message;
    paymentStatus.className = `payment-status ${type}`;
  }
  
  // Get viewing fee
  function getViewingFee() {
    const feeText = document.getElementById('viewingFee').textContent.replace(/,/g, '').trim();
    return parseInt(feeText) || (isBundle ? 1500 : 1000);
  }
  
  // Format date
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }
  
  // Close modals on outside click
  paymentModal.addEventListener('click', function(e) {
    if (e.target === paymentModal) {
      paymentModal.style.display = 'none';
    }
  });
  
  successModal.addEventListener('click', function(e) {
    if (e.target === successModal) {
      window.location.href = 'index.html';
    }
  });
});