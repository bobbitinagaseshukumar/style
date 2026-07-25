# StyleVerse Developer Onboarding & Deployment Guide

## 1. Quick Start Local Setup

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone repository
git clone https://github.com/your-org/styleverse.git
cd styleverse

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Initialize Database & Seed Sample Data
```bash
cd server
npx prisma db push
node seed/seed.js
```

### Step 3: Run Local Dev Servers
```bash
# Terminal 1: Run Express Server (Port 5000)
cd server
npm run dev

# Terminal 2: Run Vite Client App (Port 3000)
cd client
npm run dev
```

---

## 2. API Reference Routes

| Route Endpoint | Method | Access | Description |
|----------------|--------|--------|-------------|
| `/api/v1/health` | GET | Public | System Health Telemetry |
| `/api/v1/auth/register` | POST | Public | Customer Registration with 6-digit OTP |
| `/api/v1/auth/login` | POST | Public | Password & Dual-Mode OTP Login |
| `/api/v1/products` | GET | Public | Search, Filter & Paginated Products |
| `/api/v1/orders` | POST | Protect | Create Order & Stock Deduction |
| `/api/v1/notifications/my-notifications` | GET | Protect | In-App Customer Notifications |
| `/sitemap.xml` | GET | Public | Auto-Generated Dynamic XML Sitemap |
| `/robots.txt` | GET | Public | Dynamic Crawler Rules |

---

## 3. Production Deployment Guide

### Deploying Frontend to Vercel:
1. Connect GitHub repository to Vercel.
2. Root directory: `client`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Set environment variable: `VITE_API_BASE_URL=https://styleverse-api.onrender.com/api/v1`.

### Deploying Backend to Render:
1. Connect GitHub repository to Render as Web Service.
2. Root directory: `server`.
3. Build command: `npm install && npx prisma generate`.
4. Start command: `node server.js`.
5. Health Check path: `/api/v1/health`.
