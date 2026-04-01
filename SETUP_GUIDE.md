# Crypto Tax Tracker - Complete Setup & Deployment Guide

## ✅ What You Have

A production-ready cryptocurrency tax tracking application with:
- **Coinbase & Kraken Integration** - Sync transactions from both exchanges
- **Encrypted API Key Storage** - AES-256-GCM encryption for security
- **Transaction Management** - View, edit, categorize transactions
- **CSV Export** - Export for tax preparation
- **User Authentication** - Manus OAuth
- **Database** - MySQL with Drizzle ORM

---

## 🚀 Option 1: Run Locally (Fastest Way to Test)

### Prerequisites
- Node.js 22.13.0 or higher
- pnpm package manager
- MySQL database (local or remote)

### Steps

1. **Clone and Install**
```bash
git clone https://github.com/Djworkflowpartners/crypto-tax-tracker-v2.git
cd crypto-tax-tracker-v2
pnpm install
```

2. **Set Up Environment**
Create `.env` file:
```
DATABASE_URL=mysql://user:password@localhost:3306/crypto_tax_tracker
JWT_SECRET=your-random-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
```

3. **Create Database & Run Migrations**
```bash
# Create database first
mysql -u root -p -e "CREATE DATABASE crypto_tax_tracker;"

# Run migrations
pnpm db:push
```

4. **Start Development Server**
```bash
pnpm dev
```

Visit: `http://localhost:3000`

---

## 🚢 Option 2: Deploy to Vercel (Recommended for Production)

### Steps

1. **Push to GitHub** (Already done ✅)
   - Your code is at: `https://github.com/Djworkflowpartners/crypto-tax-tracker-v2`

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select `crypto-tax-tracker-v2`

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env`:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `VITE_APP_ID`
     - `OAUTH_SERVER_URL`
     - `VITE_OAUTH_PORTAL_URL`

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `your-project.vercel.app`

---

## 🚢 Option 3: Deploy to Railway

### Steps

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login & Initialize**
```bash
railway login
railway init
```

3. **Add Database**
```bash
railway add
# Select MySQL
```

4. **Set Environment Variables**
```bash
railway variables set DATABASE_URL "your-connection-string"
railway variables set JWT_SECRET "your-secret"
# ... add other variables
```

5. **Deploy**
```bash
railway up
```

---

## 🐳 Option 4: Docker Deployment

### Create Dockerfile
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Build & Run
```bash
docker build -t crypto-tax-tracker .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e JWT_SECRET="secret" \
  crypto-tax-tracker
```

---

## 📁 Project Structure

```
crypto-tax-tracker-v2/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main app interface
│   │   │   ├── Home.tsx             # Landing page
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── ConnectAccountModal.tsx    # Add Coinbase/Kraken
│   │   │   ├── TransactionsTable.tsx      # Transaction list
│   │   │   ├── ExportPanel.tsx            # CSV export
│   │   │   └── ui/                        # shadcn/ui components
│   │   ├── _core/hooks/
│   │   │   └── useAuth.ts           # Authentication hook
│   │   ├── lib/trpc.ts              # tRPC client
│   │   ├── App.tsx                  # Main component
│   │   └── index.css                # Global styles
│   └── index.html
├── server/                          # Express backend
│   ├── routers/
│   │   ├── accounts.ts              # Connect/sync accounts
│   │   ├── transactions.ts          # Transaction CRUD
│   │   └── export.ts                # CSV export
│   ├── exchanges/
│   │   ├── coinbase.ts              # Coinbase API client
│   │   └── kraken.ts                # Kraken API client
│   ├── encryption.ts                # AES-256-GCM encryption
│   ├── db.ts                        # Database queries
│   ├── routers.ts                   # Main tRPC router
│   └── _core/                       # Framework (OAuth, context, etc.)
├── drizzle/
│   ├── schema.ts                    # Database tables
│   └── migrations/                  # SQL migrations
├── shared/                          # Shared types
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔐 Security

- **API Keys**: Encrypted with AES-256-GCM before database storage
- **User Isolation**: Each user only sees their own data
- **Transaction Ownership**: Users can only edit their own transactions
- **Session Management**: JWT tokens with httpOnly cookies

---

## 🔌 How to Use

### 1. Connect Coinbase Account
- Click "Connect Coinbase"
- Enter your Coinbase API Key and Secret
- Click "Connect"
- Click "Sync" to fetch transactions

### 2. Connect Kraken Account
- Click "Connect Kraken"
- Enter your Kraken API Key and Secret
- Click "Connect"
- Click "Sync" to fetch transactions

### 3. View & Edit Transactions
- Go to "Transactions" tab
- Click on any transaction to edit description/category
- Changes save automatically

### 4. Export to CSV
- Go to "Export" tab
- Choose export type (All, Date Range, By Category)
- Click "Download CSV"
- Use for tax preparation

---

## 📊 Database Setup

### MySQL Connection String Format
```
mysql://username:password@hostname:3306/database_name
```

### Example for Local MySQL
```
mysql://root:password@localhost:3306/crypto_tax_tracker
```

### Example for Remote (AWS RDS, TiDB, etc.)
```
mysql://user:password@db.example.com:3306/crypto_tax_tracker
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is correct
- Ensure database exists
- Verify credentials

### "OAuth not working"
- Verify `VITE_APP_ID` is correct
- Check `OAUTH_SERVER_URL` is reachable
- Clear browser cookies and try again

### "Transactions not syncing"
- Verify Coinbase/Kraken API credentials
- Check API keys have correct permissions
- Look at server logs for error details

### "Build fails"
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 📝 Environment Variables Reference

| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | `mysql://user:pass@localhost/db` | ✅ Yes |
| JWT_SECRET | `your-random-secret-key` | ✅ Yes |
| VITE_APP_ID | `your-manus-app-id` | ✅ Yes |
| OAUTH_SERVER_URL | `https://api.manus.im` | ✅ Yes |
| VITE_OAUTH_PORTAL_URL | `https://oauth.manus.im` | ✅ Yes |

---

## 🚀 Next Steps

1. **Choose a deployment option** (Vercel recommended for simplicity)
2. **Set up your database** (MySQL or TiDB)
3. **Configure environment variables**
4. **Deploy**
5. **Get your Coinbase & Kraken API keys**
6. **Connect your accounts and start tracking**

---

## 📞 Quick Reference

**GitHub Repository**: https://github.com/Djworkflowpartners/crypto-tax-tracker-v2

**Local Development**: `pnpm dev` → http://localhost:3000

**Production Build**: `pnpm build && pnpm start`

**Run Tests**: `pnpm test`

---

**Version**: 1.0.0  
**Last Updated**: April 1, 2026
