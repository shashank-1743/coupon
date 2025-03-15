# Coupon Distribution App

A round-robin coupon distribution system built with Node.js, Express, and MongoDB.

## Features

- Automated coupon distribution
- IP and cookie-based abuse prevention
- MongoDB integration
- Round-robin distribution logic
- Configurable claim cooldown period

## Abuse Prevention Strategies

1. **IP Tracking**: The application records the IP address of each user who claims a coupon and restricts subsequent claims from the same IP within a specified time frame (configurable, default: 1 minute).

2. **Cookie Tracking**: The application sets a cookie in the user's browser when they claim a coupon, preventing multiple claims from the same browser session.

3. **Rate Limiting**: The API endpoints are protected with rate limiting to prevent excessive requests from the same IP address.

## Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Installation
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/coupon-distribution-app.git
cd coupon-distribution-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Edit .env with your MongoDB connection string
```

4. Start MongoDB service:
   ```bash
   # On Windows
   net start MongoDB
   ```

## Usage
```bash
# Seed database
npm run seed

# Start server
npm start
```

7. Access the application in your browser:
   ```
   http://localhost:3000
   ```

## Usage

1. Visit the application in your browser
2. Click the "Claim Coupon" button to claim a coupon
3. If eligible, you will receive a coupon code
4. If not eligible, you will see a countdown timer indicating when you can claim again
5. Click "Check History" to see all your previously claimed coupons

## Testing

To test the abuse prevention mechanisms:

1. Claim a coupon
2. Try to claim another coupon immediately - you should be blocked
3. Try using a different browser or incognito mode - you should still be blocked if on the same IP
4. Wait for the cooldown period to expire - you should be able to claim again

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `CLAIM_COOLDOWN_MINUTES`: Cooldown between claims
- `NODE_ENV`: development/production