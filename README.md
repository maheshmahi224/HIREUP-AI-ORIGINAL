# HireUp.AI — AI-Powered Resume Builder

A premium AI-powered resume builder for students and job seekers.

**Business Model**: ₹30 per downloadable PDF resume.

---

## 🏗 Architecture Overview

The repository enforces a strict 3-tier architecture:

```
/
├── frontend/        # React + Vite customer-facing application (Vercel)
├── backend/         # Express / Cloudflare Worker API (Cloudflare Workers)
├── admin/           # Separate React administrator application (Vercel)
└── templates/       # TSX/React Template Registry (Classic, Modern, Executive, Azurill, Professional)
```

---

## 🚀 Environment Setup

### 1. Frontend (`frontend/.env.example`)
```env
VITE_API_URL=https://api.hireup.ai/api
```

### 2. Admin (`admin/.env.example`)
```env
VITE_API_URL=https://api.hireup.ai/api
```

### 3. Backend (`backend/.env.example`)
```env
NODE_ENV=production
PORT=8787
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/hireupai?retryWrites=true&w=majority
MONGODB_DB=hireupai
FRONTEND_ORIGIN=https://hireup.ai
ADMIN_ORIGIN=https://admin.hireup.ai
SESSION_TTL_DAYS=30

# OAuth & Providers
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://api.hireup.ai/api/auth/google/callback

# AI & Payments
OPENAI_API_KEY=sk-proj-xxxxxx
RAZORPAY_KEY_ID=rzp_live_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx
```

---

## 🛠 Deployment Guide

### Frontend Deployment (Vercel)
1. Import repository to Vercel and set Root Directory to `frontend`.
2. Set Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Add Environment Variable: `VITE_API_URL=https://api.hireup.ai/api`.

### Admin Deployment (Vercel)
1. Import repository to Vercel and set Root Directory to `admin`.
2. Set Build Command: `npm run build`.
3. Output Directory: `dist`.
4. Add Environment Variable: `VITE_API_URL=https://api.hireup.ai/api`.

### Backend Deployment (Cloudflare Workers)
1. Configure `backend/wrangler.jsonc` with `nodejs_compat`.
2. Authenticate with Cloudflare Wrangler: `npx wrangler login`.
3. Add Production Secrets:
   ```sh
   cd backend
   npx wrangler secret put MONGODB_URI
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put RAZORPAY_KEY_SECRET
   ```
4. Deploy Worker:
   ```sh
   npm --workspace backend run build
   npx wrangler deploy
   ```

---

## 🧪 Local Testing & Verification Commands

From root directory:

```sh
# Install dependencies
npm install

# Typecheck all 3 workspaces
npm run typecheck

# Build all 3 workspaces for production
npm run build
```

---

## 🔐 Security & Protection Controls
- **Session Protection**: HTTP-only samesite cookies with CSRF token validation.
- **Data Isolation**: Strict server-side `userId` check on every profile, resume, payment, and PDF download request.
- **Payment Verification**: Server-side Razorpay HMAC-SHA256 signature validation before marking resumes as paid.
- **AI Safety**: Factual non-hallucinating JSON extraction with explicit missing field warnings.
