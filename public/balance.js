// balance.js - Earnings and Withdrawal Management

let currentBalanceData = null;

// Initialize Balance Section
function initializeBalanceSection() {
  console.log('💰 Initializing Balance section...');
  
  // Load balance data
  loadBalanceData();
  
  // Load withdrawal history
  loadWithdrawalHistory();
  
  // Setup withdrawal form
  setupWithdrawalForm();
  
  // Setup amount input to calculate fees
  const amountInput = document.getElementById('withdrawAmount');
  if (amountInput) {
    amountInput.addEventListener('input', calculateWithdrawalFee);
  }
  
  console.log('✅ Balance section initialized');
}

// Load Balance Data from API
async function loadBalanceData() {
  try {
    const agentId = await getLoggedInAgentId();
    if (!agentId) {
      console.error('No agent ID found');
      return;
    }
    
    console.log('Loading balance for agent:', agentId);
    
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/balance`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Balance data:', data);
      currentBalanceData = data;
      displayBalanceData(data);
    } else {
      console.error('Failed to load balance');
      // Show zeros if API fails
      displayBalanceData({
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0
      });
    }
  } catch (error) {
    console.error('Error loading balance:', error);
    displayBalanceData({
      available_balance: 0,
      pending_balance: 0,
      total_earned: 0
    });
  }
}

// Display Balance Data
function displayBalanceData(data) {
  const availableBalance = document.getElementById('availableBalance');
  const pendingBalance = document.getElementById('pendingBalance');
  const lifetimeEarnings = document.getElementById('lifetimeEarnings');
  
  if (availableBalance) {
    availableBalance.textContent = `Ksh ${formatPrice(data.available_balance || 0)}`;
  }
  
  if (pendingBalance) {
    pendingBalance.textContent = `Ksh ${formatPrice(data.pending_balance || 0)}`;
  }
  
  if (lifetimeEarnings) {
    lifetimeEarnings.textContent = `Ksh ${formatPrice(data.total_earned || 0)}`;
  }
  
  // Update overview total earnings if on that page
  const overviewEarnings = document.getElementById('totalEarnings');
  if (overviewEarnings) {
    overviewEarnings.textContent = `Ksh ${formatPrice(data.total_earned || 0)}`;
  }
}

// Calculate M-Pesa Transaction Fee
function calculateWithdrawalFee() {
  const amountInput = document.getElementById('withdrawAmount');
  const feeDisplay = document.getElementById('withdrawFee');
  
  if (!amountInput || !feeDisplay) return;
  
  const amount = parseFloat(amountInput.value) || 0;
  let fee = 0;
  
  // M-Pesa B2C fee structure (approximate)
  if (amount >= 1000 && amount <= 1500) {
    fee = 29;
  } else if (amount >= 1501 && amount <= 2500) {
    fee = 29;
  } else if (amount >= 2501 && amount <= 3500) {
    fee = 52;
  } else if (amount >= 3501 && amount <= 5000) {
    fee = 58;
  } else if (amount >= 5001 && amount <= 7500) {
    fee = 78;
  } else if (amount >= 7501 && amount <= 10000) {
    fee = 90;
  } else if (amount >= 10001 && amount <= 15000) {
    fee = 115;
  } else if (amount > 15000) {
    fee = 115;
  }
  
  feeDisplay.textContent = `Transaction fee: ~Ksh ${fee}`;
  feeDisplay.style.color = fee > 0 ? '#ff9900' : 'rgba(255,255,255,0.6)';
}

// Setup Withdrawal Form
function setupWithdrawalForm() {
  const form = document.getElementById('withdrawalForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    await processWithdrawal();
  });
}

// Process Withdrawal Request
async function processWithdrawal() {
  const amountInput = document.getElementById('withdrawAmount');
  const mpesaInput = document.getElementById('mpesaNumber');
  
  if (!amountInput || !mpesaInput) return;
  
  const amount = parseFloat(amountInput.value);
  const mpesaNumber = mpesaInput.value.trim();
  
  // Validate amount
  if (amount < 1000) {
    showNotification('Minimum withdrawal amount is Ksh 1,000', 'error');
    return;
  }
  
  if (!currentBalanceData || amount > currentBalanceData.available_balance) {
    showNotification('Insufficient balance. Amount exceeds available balance.', 'error');
    return;
  }
  
  // Validate M-Pesa number
  if (!/^254\d{9}$/.test(mpesaNumber)) {
    showNotification('Please enter a valid M-Pesa number (254XXXXXXXXX)', 'error');
    return;
  }
  
  // Confirm withdrawal
  const confirmed = await showConfirmModal(
    `Withdraw Ksh ${formatPrice(amount)} to ${mpesaNumber}?`
  );
  
  if (!confirmed) return;
  
  // Show loading
  const loadingModal = showLoadingModal('Processing withdrawal request...');
  
  try {
    const agentId = await getLoggedInAgentId();
    
    const response = await fetch(`${API_BASE_URL}/api/withdrawals/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        agent_id: agentId,
        amount: amount,
        mpesa_number: mpesaNumber
      })
    });
    
    hideLoadingModal();
    
    if (response.ok) {
      const data = await response.json();
      console.log('Withdrawal initiated:', data);
      
      showNotification('Withdrawal request submitted! Check your phone for M-Pesa confirmation.', 'success');
      
      // Reset form
      form.reset();
      calculateWithdrawalFee();
      
      // Reload balance and history
      await loadBalanceData();
      await loadWithdrawalHistory();
      
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || 'Withdrawal request failed', 'error');
    }
    
  } catch (error) {
    hideLoadingModal();
    console.error('Withdrawal error:', error);
    showNotification('An error occurred. Please try again.', 'error');
  }
}

// Load Withdrawal History
async function loadWithdrawalHistory() {
  try {
    const agentId = await getLoggedInAgentId();
    if (!agentId) return;
    
    const response = await fetch(`${API_BASE_URL}/api/withdrawals/history/${agentId}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Withdrawal history:', data);
      displayWithdrawalHistory(data.withdrawals || []);
    } else {
      displayWithdrawalHistory([]);
    }
  } catch (error) {
    console.error('Error loading withdrawal history:', error);
    displayWithdrawalHistory([]);
  }
}

// Display Withdrawal History
function displayWithdrawalHistory(withdrawals) {
  const tbody = document.getElementById('withdrawalHistoryBody');
  if (!tbody) return;
  
  if (withdrawals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">
          No withdrawal history yet
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = '';
  
  withdrawals.forEach(withdrawal => {
    const row = document.createElement('tr');
    
    const statusClass = withdrawal.status === 'completed' ? 'status-completed' :
                       withdrawal.status === 'pending' ? 'status-pending' :
                       withdrawal.status === 'processing' ? 'status-processing' :
                       'status-failed';
    
    const statusText = withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1);
    
    row.innerHTML = `
      <td>${formatDate(withdrawal.requested_at)}</td>
      <td style="font-weight: 600; color: #ff69ff;">Ksh ${formatPrice(withdrawal.amount)}</td>
      <td>${escapeHtml(withdrawal.mpesa_number)}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(withdrawal.transaction_id || 'Pending')}</td>
    `;
    
    tbody.appendChild(row);
  });
}

// Format date helper
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
}

// Export for use in other modules
window.initializeBalanceSection = initializeBalanceSection;
window.loadBalanceData = loadBalanceData;
window.loadWithdrawalHistory = loadWithdrawalHistory;