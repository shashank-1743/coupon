const API_URL = '/.netlify/functions/api';

let countdownInterval;
let endTime = null;

// Core API Functions
async function checkStatus() {
    try {
        console.log('Checking status...');
        const response = await fetch(`${API_URL}/status`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Status response:', data);
        updateStatusDisplay(data);
        return data;
    } catch (error) {
        console.error('Status check failed:', error);
        showError('Error checking status');
    }
}

async function claimCoupon() {
    const claimBtn = document.getElementById('claim-btn');
    try {
        console.log('Claiming coupon...');
        claimBtn.disabled = true;
        claimBtn.textContent = 'Claiming...';
        
        const response = await fetch(`${API_URL}/claim`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Claim response:', data);
        handleClaimResponse(data);
    } catch (error) {
        console.error('Error claiming coupon:', error);
        showError('Failed to claim coupon');
    } finally {
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Coupon';
    }
}

async function fetchHistory() {
    try {
        showLoadingHistory();
        const response = await fetch(`${API_URL}/history`, {
            credentials: 'include'
        });
        const data = await response.json();
        displayHistory(data);
    } catch (error) {
        console.error('History fetch failed:', error);
        showError('Failed to fetch history');
    }
}

// UI Update Functions
function updateStatusDisplay(data) {
    const statusElement = document.getElementById('status-message');
    const claimBtn = document.getElementById('claim-btn');
    
    if (data.canClaim) {
        statusElement.textContent = 'You can claim a coupon now!';
        statusElement.className = 'alert alert-success';
        claimBtn.disabled = false;
    } else {
        statusElement.textContent = `You can claim again in ${data.minutesRemaining} minutes`;
        statusElement.className = 'alert alert-info';
        claimBtn.disabled = true;
        startCountdown(data.minutesRemaining);
    }
}

function handleClaimResponse(data) {
    const statusMessage = document.getElementById('status-message');
    const couponContainer = document.getElementById('coupon-container');
    const couponCode = document.getElementById('coupon-code');
    
    if (data.success) {
        statusMessage.className = 'alert alert-success';
        statusMessage.textContent = data.message;
        couponCode.textContent = data.coupon.code;
        couponContainer.classList.remove('d-none');
        localStorage.setItem('claimedCouponCode', data.coupon.code);
        checkStatus();
    } else {
        statusMessage.className = 'alert alert-danger';
        statusMessage.textContent = data.message;
        
        if (data.minutesRemaining) {
            startCountdown(data.minutesRemaining);
        }
    }
}

function displayHistory(data) {
    const historyContainer = document.getElementById('history-container');
    const historyTableBody = document.getElementById('history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    
    historyContainer.classList.remove('d-none');
    
    if (data.success && data.coupons?.length > 0) {
        historyTableBody.innerHTML = data.coupons.map(coupon => `
            <tr>
                <td class="text-center">${coupon.code}</td>
                <td class="text-center">${new Date(coupon.claimedAt).toLocaleString()}</td>
            </tr>
        `).join('');
        noHistoryMessage.classList.add('d-none');
    } else {
        historyTableBody.innerHTML = '';
        noHistoryMessage.classList.remove('d-none');
    }
}

function startCountdown(minutes) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const timerContainer = document.getElementById('timer-container');
    const countdown = document.getElementById('countdown');
    
    endTime = Date.now() + (minutes * 60 * 1000);
    localStorage.setItem('couponEndTime', endTime.toString());
    
    timerContainer.classList.remove('d-none');
    
    function updateCountdown() {
        const now = Date.now();
        const distance = endTime - now;
        
        if (distance <= 0) {
            clearInterval(countdownInterval);
            timerContainer.classList.add('d-none');
            localStorage.removeItem('couponEndTime');
            localStorage.removeItem('claimedCouponCode');
            checkStatus();
            return;
        }
        
        const mins = Math.floor(distance / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);
        countdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

function showError(message) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.className = 'alert alert-danger';
    statusMessage.textContent = message;
}

function showLoadingHistory() {
    const historyContainer = document.getElementById('history-container');
    const historyTableBody = document.getElementById('history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    
    historyContainer.classList.remove('d-none');
    noHistoryMessage.classList.add('d-none');
    historyTableBody.innerHTML = '<tr><td colspan="2" class="text-center">Loading...</td></tr>';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load saved state
    const savedEndTime = localStorage.getItem('couponEndTime');
    const savedCouponCode = localStorage.getItem('claimedCouponCode');
    
    if (savedEndTime && savedEndTime > Date.now()) {
        endTime = parseInt(savedEndTime);
        startCountdown((endTime - Date.now()) / (60 * 1000));
        
        if (savedCouponCode) {
            document.getElementById('coupon-code').textContent = savedCouponCode;
            document.getElementById('coupon-container').classList.remove('d-none');
        }
    }
    
    // Add event listeners
    document.getElementById('claim-btn').addEventListener('click', claimCoupon);
    document.getElementById('check-status-btn').addEventListener('click', () => {
        checkStatus().then(fetchHistory);
    });
    
    // Initial status check
    checkStatus();
});