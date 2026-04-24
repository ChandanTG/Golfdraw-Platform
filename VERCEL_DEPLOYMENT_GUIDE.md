# Vercel Deployment Guide

## Root Directory Configuration

**Set Root Directory to: `.`** (the root of your repository)

Do NOT set it to `/client` or `/server` - use the root directory `.`

## Why Root Directory?

Your project structure requires both client and server to be built together:
- `server/server.js` → Backend API functions
- `client/` → React frontend
- `vercel.json` → Deployment configuration (must be in root)

## Step-by-Step Deployment

### 1. Import Project on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Root Directory**: `.` (leave as default)
4. Framework Preset: "Other" (Vercel will detect from vercel.json)

### 2. Configure Environment Variables
Go to **Project → Settings → Environment Variables** and add:

#### Required Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=https://your-app-name.vercel.app
```

#### Payment Variables (Required for payments)
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

#### Email Variables (Optional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=noreply@golfdraw.com
FROM_NAME=Golf Draw Platform
```

### 3. Deploy
1. Click **Deploy**
2. Wait for build to complete
3. After deployment, update `CLIENT_URL` to your actual Vercel URL
4. Redeploy if you changed `CLIENT_URL`

### 4. Post-Deployment Setup

#### MongoDB Atlas
1. Go to your Atlas cluster → Network Access
2. Add IP: `0.0.0.0/0` (allows all Vercel IPs)
3. Create a database user with read/write permissions

#### Stripe Setup (if using payments)
1. Create Stripe account
2. Create products and prices
3. Set webhook endpoint: `https://your-app.vercel.app/api/payments/webhook`
4. Copy webhook secret to environment variables

#### Seed Database (optional)
```bash
cd server
MONGODB_URI=your_atlas_uri node utils/seeder.js
```

## Troubleshooting Common Issues

### 1. Build Failures
**Issue**: "Could not find package.json"
**Solution**: Ensure Root Directory is set to `.` (not `/client`)

**Issue**: "Module not found" errors
**Solution**: Check all dependencies are in package.json files

### 2. Database Connection Errors
**Issue**: "MongoDB Connection Error"
**Solution**: 
- Verify `MONGODB_URI` is correct
- Add `0.0.0.0/0` to Atlas Network Access
- Check database user credentials

### 3. CORS Errors
**Issue**: Cross-origin requests blocked
**Solution**: Ensure `CLIENT_URL` matches your deployed URL exactly

### 4. Payment/Webhook Errors
**Issue**: Stripe webhook failures
**Solution**: 
- Verify webhook URL: `https://your-app.vercel.app/api/payments/webhook`
- Check webhook secret matches Stripe dashboard
- Ensure webhook events are enabled

### 5. Static File Issues
**Issue**: 404 errors for static assets
**Solution**: The updated vercel.json should handle this automatically

## Environment Variable Templates

### Production Template
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/golf-draw-platform
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum-please-change-this
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=https://your-app-name.vercel.app
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
STRIPE_MONTHLY_PRICE_ID=price_your_stripe_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_stripe_yearly_price_id
```

### Testing Template (with mock payments)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/golf-draw-platform
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=https://your-app-name.vercel.app
MOCK_PAYMENTS=true
```

## Deployment Checklist

Before deploying:
- [ ] All code pushed to GitHub
- [ ] vercel.json is in root directory
- [ ] Root Directory set to `.`
- [ ] All required environment variables added
- [ ] MongoDB Atlas configured with IP access
- [ ] Stripe configured (if using payments)

After deploying:
- [ ] Test API endpoints: `/api/health`
- [ ] Test user registration/login
- [ ] Test charity display
- [ ] Test payment flow (if configured)
- [ ] Check Vercel logs for any errors

## Vercel.json Explanation

The updated `vercel.json` includes:
- **Builds**: Serverless function for backend, static build for frontend
- **Routes**: API routes to server, everything else to client
- **Functions**: Increased timeout for database operations
- **Config**: Explicit build commands for reliability

This configuration ensures both frontend and backend work together seamlessly on Vercel.
