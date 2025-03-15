document.addEventListener('DOMContentLoaded', () => {
  const claimBtn = document.getElementById('claim-btn');
  const checkStatusBtn = document.getElementById('check-status-btn');
  const statusMessage = document.getElementById('status-message');
  const timerContainer = document.getElementById('timer-container');
  const countdown = document.getElementById('countdown');
  const couponContainer = document.getElementById('coupon-container');
  const couponCode = document.getElementById('coupon-code');
  const historyContainer = document.getElementById('history-container');
  const historyTableBody = document.getElementById('history-table-body');
  const noHistoryMessage = document.getElementById('no-history-message');
  
  let countdownInterval;
  let endTime = null; // Store the end time globally
  
  // Try to load endTime and coupon from localStorage
  const savedEndTime = localStorage.getItem('couponEndTime');
  const savedCouponCode = localStorage.getItem('claimedCouponCode');
  
  if (savedEndTime) {
    const parsedEndTime = parseInt(savedEndTime);
    // Only use the saved end time if it's in the future
    if (parsedEndTime > Date.now()) {
      endTime = parsedEndTime;
      startCountdown();
      
      // If there's a saved coupon code, display it
      if (savedCouponCode) {
        couponCode.textContent = savedCouponCode;
        couponContainer.classList.remove('d-none');
      }
    } else {
      // Clear expired end time and coupon
      localStorage.removeItem('couponEndTime');
      localStorage.removeItem('claimedCouponCode');
    }
  }
  
  // Check status on page load
  checkStatus();
  
  const API_URL = window.location.hostname === 'localhost' 
    ? '/api'
    : '/.netlify/functions/api';
  
  // Add error handling middleware
  const handleApiError = (error) => {
    console.error('API Error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again later.'
    };
  };
  
  // Claim coupon button click handler
  claimBtn.addEventListener('click', async () => {
    try {
      claimBtn.disabled = true;
      claimBtn.textContent = 'Claiming...';
      
      const response = await fetch(`${API_URL}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        statusMessage.className = 'alert alert-success';
        statusMessage.textContent = data.message;
        
        // Display coupon
        couponCode.textContent = data.coupon.code;
        couponContainer.classList.remove('d-none');
        
        // Save coupon code to localStorage
        localStorage.setItem('claimedCouponCode', data.coupon.code);
        
        // Start countdown
        checkStatus();
        
        // Hide history container if it's open
        historyContainer.classList.add('d-none');
      } else {
        // Error
        statusMessage.className = 'alert alert-danger';
        statusMessage.textContent = data.message;
        
        if (data.minutesRemaining) {
          // Set the end time based on server response
          endTime = new Date().getTime() + (data.minutesRemaining * 60 * 1000);
          // Save to localStorage
          localStorage.setItem('couponEndTime', endTime.toString());
          startCountdown();
        }
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      statusMessage.className = 'alert alert-danger';
      statusMessage.textContent = 'An error occurred. Please try again later.';
    } finally {
      claimBtn.disabled = false;
      claimBtn.textContent = 'Claim Coupon';
    }
  });
  
  // Check status/history button click handler
  checkStatusBtn.addEventListener('click', async () => {
    // First check status to update the timer
    await checkStatus();
    
    // Then fetch and display coupon history
    await fetchCouponHistory();
  });
  
  // Function to check user's claim status
  async function checkStatus() {
    try {
      const response = await fetch(`${API_URL}/status`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      return handleApiError(error);
    }
  }
  
  // Function to fetch and display coupon history
  async function fetchCouponHistory() {
    try {
      // Show loading state
      historyTableBody.innerHTML = '<tr><td colspan="2" class="text-center">Loading...</td></tr>';
      historyContainer.classList.remove('d-none');
      noHistoryMessage.classList.add('d-none');
      
      const response = await fetch(`${API_URL}/history`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.coupons && data.coupons.length > 0) {
          // Clear the table
          historyTableBody.innerHTML = '';
          
          // Add each coupon to the table
          data.coupons.forEach(coupon => {
            const row = document.createElement('tr');
            
            const codeCell = document.createElement('td');
            codeCell.textContent = coupon.code;
            codeCell.className = 'text-center';
            
            const dateCell = document.createElement('td');
            const claimDate = new Date(coupon.claimedAt);
            dateCell.textContent = claimDate.toLocaleString();
            dateCell.className = 'text-center';
            
            row.appendChild(codeCell);
            row.appendChild(dateCell);
            historyTableBody.appendChild(row);
          });
          
          // Show the table
          noHistoryMessage.classList.add('d-none');
        } else {
          // No coupons found
          historyTableBody.innerHTML = '';
          noHistoryMessage.classList.remove('d-none');
        }
      } else {
        // Error
        historyTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">
          ${data.message || 'Failed to load coupon history'}
        </td></tr>`;
      }
    } catch (error) {
      console.error('Error fetching coupon history:', error);
      historyTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">
        An error occurred while fetching your coupon history.
      </td></tr>`;
    }
  }
  
  // Function to start countdown timer
  function startCountdown() {
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Show timer container
    timerContainer.classList.remove('d-none');
    
    // Update countdown immediately
    updateCountdown();
    
    // Set interval to update countdown every second
    countdownInterval = setInterval(updateCountdown, 1000);
    
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = endTime - now;
      
      if (distance <= 0) {
        // Countdown finished
        clearInterval(countdownInterval);
        timerContainer.classList.add('d-none');
        localStorage.removeItem('couponEndTime');
        localStorage.removeItem('claimedCouponCode');
        couponContainer.classList.add('d-none');
        checkStatus();
        return;
      }
      
      // Calculate minutes and seconds
      const minutes = Math.floor(distance / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Display countdown
      countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
});

const API_URL = window.location.hostname === 'localhost' 
  ? '/api'
  : '/.netlify/functions/api';

// Update status display
async function updateStatus() {
  try {
    const response = await fetch(`${API_URL}/status`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    const statusElement = document.getElementById('status');
    const claimButton = document.getElementById('claimButton');
    
    if (data.canClaim) {
      statusElement.textContent = 'You can claim a coupon now!';
      claimButton.disabled = false;
    } else {
      statusElement.textContent = `You can claim again in ${data.minutesRemaining} minutes`;
      claimButton.disabled = true;
    }
  } catch (error) {
    console.error('Status check failed:', error);
    document.getElementById('status').textContent = 'Error checking status';
  }
}

// Claim coupon
async function claimCoupon() {
  try {
    const response = await fetch(`${API_URL}/claim`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const resultElement = document.getElementById('result');
    
    if (data.success) {
      resultElement.textContent = `Your coupon code: ${data.coupon.code}`;
    } else {
      resultElement.textContent = data.message;
    }
    
    // Update status after claiming
    updateStatus();
  } catch (error) {
    console.error('Claim failed:', error);
    document.getElementById('result').textContent = 'Error claiming coupon';
  }
}

// View history
async function viewHistory() {
  try {
    const response = await fetch(`${API_URL}/history`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    const historyElement = document.getElementById('history');
    
    if (data.success) {
      if (data.coupons.length === 0) {
        historyElement.textContent = 'No coupons claimed yet';
      } else {
        const historyList = data.coupons
          .map(coupon => `Code: ${coupon.code}, Claimed: ${new Date(coupon.claimedAt).toLocaleString()}`)
          .join('\n');
        historyElement.textContent = historyList;
      }
    } else {
      historyElement.textContent = 'Error fetching history';
    }
  } catch (error) {
    console.error('History fetch failed:', error);
    document.getElementById('history').textContent = 'Error fetching history';
  }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  const claimButton = document.getElementById('claimButton');
  const historyButton = document.getElementById('historyButton');
  
  if (claimButton) {
    claimButton.addEventListener('click', claimCoupon);
  }
  
  if (historyButton) {
    historyButton.addEventListener('click', viewHistory);
  }
  
  // Check initial status
  updateStatus();
  
  // Update status every minute
  setInterval(updateStatus, 60000);
});