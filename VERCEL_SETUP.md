# Vercel Deployment Guide

## What was fixed

1. **`vercel.json`** — Route was `client/$1` (wrong), now `client/build/$1` (correct)
2. **`server/server.js`** — CORS now works for all Vercel domains; `app.listen()` skipped on Vercel
3. **`client/.env.example`** — `REACT_APP_API_URL` set to `/api` (relative, works on Vercel)

---

## Step-by-step Vercel Setup

### 1. Push your code to GitHub

### 2. Import project on Vercel
- Go to https://vercel.com/new
- Import your GitHub repo
- Set **Root Directory** to `.` (the root, not /client or /server)

### 3. Add Environment Variables
Go to **Project → Settings → Environment Variables** and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret string |
| `JWT_EXPIRE` | `30d` |
| `JWT_COOKIE_EXPIRE` | `30` |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `NODE_ENV` | `production` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |
| `STRIPE_MONTHLY_PRICE_ID` | Your Stripe monthly price ID |
| `STRIPE_YEARLY_PRICE_ID` | Your Stripe yearly price ID |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail app password |
| `FROM_EMAIL` | `noreply@golfdraw.com` |
| `FROM_NAME` | `Golf Draw Platform` |

### 4. Deploy
Click **Deploy**. After deployment, update `CLIENT_URL` to your actual Vercel URL.

### 5. Seed the database (optional)
Run locally against your Atlas DB:
```bash
cd server
MONGODB_URI=your_atlas_uri node utils/seeder.js
```

---

## MongoDB Atlas: Allow Vercel IPs
In Atlas → Network Access, add `0.0.0.0/0` to allow all IPs (Vercel uses dynamic IPs).

---

## Cron Jobs Note
`node-cron` doesn't work on Vercel (serverless). For scheduled draws/subscriptions,
use Vercel Cron Jobs or a separate service like Railway/Render for the backend.
