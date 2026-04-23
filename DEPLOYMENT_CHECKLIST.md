# Deployment Checklist

## Required Environment Variables for Vercel

### Database Configuration
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `NODE_ENV` - Set to `production`

### Authentication
- `JWT_SECRET` - A long random secret string (min 32 characters)
- `JWT_EXPIRE` - Set to `30d`
- `JWT_COOKIE_EXPIRE` - Set to `30`

### Application URLs
- `CLIENT_URL` - Your deployed Vercel URL (e.g., `https://your-app.vercel.app`)

### Stripe Configuration (Required for payments)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `STRIPE_MONTHLY_PRICE_ID` - Monthly subscription price ID
- `STRIPE_YEARLY_PRICE_ID` - Yearly subscription price ID

### Email Configuration (Optional but recommended)
- `SMTP_HOST` - `smtp.gmail.com`
- `SMTP_PORT` - `587`
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Your Gmail app password
- `FROM_EMAIL` - `noreply@golfdraw.com`
- `FROM_NAME` - `Golf Draw Platform`

### Development/Testing
- `MOCK_PAYMENTS` - Set to `true` for testing without real Stripe payments

## Pre-Deployment Steps

### 1. Database Setup
- [ ] Create MongoDB Atlas cluster
- [ ] Add your IP to Atlas Network Access (or use `0.0.0.0/0` for Vercel)
- [ ] Test connection locally

### 2. Stripe Setup (if using payments)
- [ ] Create Stripe account
- [ ] Create products and prices
- [ ] Set up webhook endpoint: `https://your-app.vercel.app/api/payments/webhook`
- [ ] Copy environment variables

### 3. Email Setup (if using emails)
- [ ] Create Gmail app password
- [ ] Test email configuration locally

### 4. Repository Preparation
- [ ] Push all changes to GitHub
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Verify `vercel.json` is present and correct

## Vercel Deployment Steps

### 1. Import Project
- Go to https://vercel.com/new
- Import your GitHub repository
- Set **Root Directory** to `.` (the root)

### 2. Configure Environment Variables
- Go to **Project → Settings → Environment Variables**
- Add all required variables from the list above
- **Important**: Do not include `MOCK_PAYMENTS=true` in production

### 3. Deploy
- Click **Deploy**
- After deployment, update `CLIENT_URL` to your actual Vercel URL
- Redeploy if needed

### 4. Post-Deployment
- [ ] Test all API endpoints
- [ ] Test user registration/login
- [ ] Test charity selection
- [ ] Test payment flow (if configured)
- [ ] Verify emails are sent (if configured)

## Common Deployment Issues & Solutions

### 1. Database Connection Errors
- **Issue**: `MongoDB Connection Error`
- **Solution**: Ensure `MONGODB_URI` is correct and Atlas allows Vercel IPs

### 2. CORS Errors
- **Issue**: Cross-origin requests blocked
- **Solution**: Ensure `CLIENT_URL` matches your deployed URL

### 3. Payment Errors
- **Issue**: Stripe webhook failures
- **Solution**: Verify webhook URL and secret are correct

### 4. Build Failures
- **Issue**: Build process fails
- **Solution**: Check Vercel build logs for specific error messages

## Environment Variable Templates

### Production (.env for Vercel)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=https://your-app.vercel.app
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

### Development (.env.local for local testing)
```
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/golf-draw-platform
JWT_SECRET=golf-draw-super-secret-jwt-key-2024
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_test_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_test_yearly_price_id
MOCK_PAYMENTS=true
```
