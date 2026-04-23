#  GolfDraw Platform

> A subscription-based platform combining Stableford golf score tracking, monthly prize draws, and charity contributions.

![Stack](https://img.shields.io/badge/Stack-MERN-green)
![Stripe](https://img.shields.io/badge/Payments-Stripe-blue)
![License](https://img.shields.io/badge/License-MIT-gray)

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Framer Motion, Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Payments | Stripe (subscriptions, webhooks, billing portal) |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

---

##  Project Structure

```
golf-draw-platform/
├── client/                      # React frontend
│   ├── public/index.html
│   └── src/
│       ├── App.js               # Router + protected routes
│       ├── index.css            # Design system (dark theme, Syne font)
│       ├── context/
│       │   └── AuthContext.js   # Auth state, login/logout/register
│       ├── utils/api.js         # Axios instance with JWT interceptor
│       ├── components/
│       │   ├── layout/          # Navbar, Footer
│       │   ├── admin/           # AdminLayout sidebar
│       │   └── common/          # Loader
│       └── pages/
│           ├── Landing.js       # Public homepage
│           ├── Login.js
│           ├── Register.js      # 2-step: account + charity
│           ├── Subscribe.js     # Stripe checkout
│           ├── CharitiesPage.js # Browse + filter charities
│           ├── CharityDetail.js # Charity profile + select
│           ├── user/
│           │   ├── Dashboard.js # Stats, scores, draw status
│           │   ├── Scores.js    # CRUD scores (max 5 rule)
│           │   ├── DrawPage.js  # Draw results + history
│           │   ├── WinnersPage.js # Proof upload + payment status
│           │   └── Profile.js   # Settings + billing portal
│           └── admin/
│               ├── AdminDashboard.js  # Stats + quick actions
│               ├── AdminUsers.js      # Search, filter, override sub
│               ├── AdminDraws.js      # Schedule/simulate/execute/publish
│               ├── AdminCharities.js  # Full CRUD + events
│               ├── AdminWinners.js    # Verify proofs + update payments
│               └── AdminReports.js   # Charts: users, revenue, charities
│
└── server/                      # Express backend
    ├── server.js                # App entry + middleware
    ├── config/db.js             # MongoDB connection
    ├── models/
    │   ├── User.js              # JWT, Stripe sub, charity, roles
    │   ├── Score.js             # Max-5 rule, date uniqueness
    │   ├── Draw.js              # Winning numbers, prize pool, jackpot
    │   ├── Winner.js            # Proof, verification, payment
    │   ├── Charity.js           # Events, slug, categories
    │   └── Transaction.js       # Stripe payment ledger
    ├── controllers/             # Business logic
    ├── routes/                  # Express routers
    ├── middleware/
    │   ├── auth.js              # protect, authorize, requireSubscription
    │   ├── error.js             # Global error handler
    │   └── validate.js          # express-validator runner
    └── utils/
        ├── seeder.js            # Seed test data
        ├── sendEmail.js         # HTML email templates
        └── cron.js              # Scheduled jobs
```

---

##  Local Setup

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Stripe account (test mode)

### 2. Clone & Install

```bash
git clone https://github.com/yourname/golf-draw-platform.git
cd golf-draw-platform
npm run install-all
```

### 3. Environment Variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/golf-draw?retryWrites=true&w=majority
JWT_SECRET=your-strong-random-secret-here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@golfdraw.com
FROM_NAME=GolfDraw

CLIENT_URL=http://localhost:3000
PORT=5000
NODE_ENV=development

ADMIN_EMAIL=admin@golfdraw.com
ADMIN_PASSWORD=Admin@123456
```

Edit `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Stripe Setup

1. Create two Prices in Stripe Dashboard:
   - Monthly: £10/month recurring → copy Price ID
   - Yearly: £100/year recurring → copy Price ID
2. Set up webhook endpoint: `https://yourdomain.com/api/payments/webhook`
3. Events to listen: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Seed Database

```bash
cd server && npm run seed
```

This creates:
- 5 charities (Health, Education, Environment, Sports, Community)
- 1 admin user + 6 subscriber users with scores
- 1 sample published draw

### 6. Run

```bash
# From project root
npm run dev

# Or separately:
cd server && npm run dev    # API on :5000
cd client && npm start      # UI on :3000
```

---

## 🧪 Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@golfdraw.com | Admin@123456 |
| User | james@example.com | Password@123 |
| User | sarah@example.com | Password@123 |

---

## ⛳ Core Features

### Score System
- Users enter Stableford scores (1–45) with date + course
- Max 5 scores stored — adding a 6th auto-removes the oldest
- No duplicate scores for the same date
- Scores displayed newest first

### Draw System
- Admin schedules draws by month/year
- **Simulate**: preview results without committing
- **Execute**: generate real winning numbers, calculate matches + prizes
- **Publish**: make results public, create Winner records, notify winners
- **Jackpot rollover**: if no 5-match winner, the 40% rolls to next month
- Two algorithms: `random` or `frequency` (biased toward common scores)

### Prize Distribution
| Match | Pool Share |
|---|---|
| 5-match | 40% (or jackpot roll) |
| 4-match | 35% |
| 3-match | 25% |

### Charity System
- Users select charity at signup (changeable anytime)
- Minimum 10% of subscription allocated
- Users can increase contribution % up to 100%

### Winner Flow
1. Draw published → Winner records created
2. Winner logs in → sees win notification
3. Winner uploads proof image
4. Admin reviews proof → Approve or Reject (with reason)
5. Admin marks payment status → Pending → Processing → Paid

---

## 🔐 API Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET  | /api/auth/me | Private | Current user |
| POST | /api/scores | Subscriber | Add score |
| GET  | /api/scores | Private | My scores |
| GET  | /api/draws | Public | Published draws |
| GET  | /api/draws/current | Public | This month's draw |
| POST | /api/draws/schedule | Admin | Schedule draw |
| POST | /api/draws/:id/simulate | Admin | Simulate |
| POST | /api/draws/:id/execute | Admin | Execute draw |
| POST | /api/draws/:id/publish | Admin | Publish results |
| GET  | /api/charities | Public | List charities |
| PUT  | /api/charities/select | Private | Select charity |
| POST | /api/payments/create-checkout-session | Private | Stripe checkout |
| POST | /api/payments/webhook | Stripe | Webhook handler |
| GET  | /api/winners/my | Private | My winnings |
| POST | /api/winners/:id/proof | Private | Upload proof |
| GET  | /api/admin/stats | Admin | Dashboard stats |
| GET  | /api/admin/users | Admin | All users |
| GET  | /api/admin/reports | Admin | Analytics |

---

## 🚀 Deployment (Vercel + Railway)

### Backend (Railway or Render)
1. Push to GitHub
2. Connect to Railway → new project → from GitHub
3. Set all env vars from `server/.env.example`
4. Deploy — copy the deployment URL

### Frontend (Vercel)
1. Import GitHub repo to Vercel
2. Set Root Directory: `client`
3. Set env vars: `REACT_APP_API_URL=https://your-backend.railway.app/api`
4. Deploy

### Stripe Webhook (Production)
1. Go to Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-backend.railway.app/api/payments/webhook`
3. Select events (see Stripe Setup above)
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

## 📊 Database Schema Overview

```
Users          ─── selectedCharity ──► Charities
  │                                      └── events[]
  ├── Scores (max 5 per user)
  │
  └── Subscription (Stripe mirrored)

Draws
  ├── participants[]: { user, scores[], matchCount, prizeAmount }
  ├── winners: { fiveMatch[], fourMatch[], threeMatch[] }
  └── prizePool: { total, fiveMatchPrize, fourMatchPrize, threeMatchPrize, jackpotRollover }

Winners        ─── user ──► Users
  │            ─── draw ──► Draws
  ├── proofImage
  ├── verificationStatus: pending | approved | rejected
  └── paymentStatus: pending | processing | paid | failed

Transactions   ─── user ──► Users
  ├── type: subscription | prize_payout | charity_contribution
  └── stripeInvoiceId, stripePaymentIntentId
```

---

## 🛡️ Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiry
- Helmet.js HTTP security headers
- Rate limiting (200 req/10 min per IP)
- CORS locked to CLIENT_URL
- Stripe webhook signature verification
- Role-based middleware on every sensitive route
- Input validation via express-validator

---

## 📧 Email Templates

- **Welcome/Email Verification** — styled HTML with verify link
- **Password Reset** — 10-minute expiry link
- **Winner Notification** — prize amount + claim instructions

---

## 🔄 Cron Jobs

| Schedule | Job |
|---|---|
| Daily midnight | Check for draws past their drawDate |
| 1st of each month | Expire cancelled subscriptions |

---

## 📝 License

MIT — build on it freely.
