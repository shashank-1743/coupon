# Round-Robin Coupon Distribution System

A simple web application that distributes coupons to guest users in a round-robin manner while preventing abuse through IP and cookie tracking.

## Features

- Coupon distribution in a round-robin fashion
- Guest access without requiring login
- Abuse prevention through IP and cookie tracking
- Cooldown period between coupon claims
- User-friendly interface with countdown timer
- Coupon history tracking

## Abuse Prevention Strategies

1. **IP Tracking**: The application records the IP address of each user who claims a coupon and restricts subsequent claims from the same IP within a specified time frame (configurable, default: 1 minute).

2. **Cookie Tracking**: The application sets a cookie in the user's browser when they claim a coupon, preventing multiple claims from the same browser session.

3. **Rate Limiting**: The API endpoints are protected with rate limiting to prevent excessive requests from the same IP address.

## Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd coupon-distribution-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed:
     ```properties
     PORT=3000
     MONGO_URI=mongodb://localhost:27017/coupon_db
     CLAIM_COOLDOWN_MINUTES=1
     NODE_ENV=development
     ```

4. Start MongoDB service:
   ```bash
   # On Windows
   net start MongoDB
   ```

5. Seed the database with initial coupons:
   ```bash
   npm run seed
   ```

6. Start the application:
   ```bash
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

- `PORT`: The port number for the server (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `CLAIM_COOLDOWN_MINUTES`: Cooldown period between claims in minutes (default: 1)
- `NODE_ENV`: Application environment (development/production)