# 🏠 Run Nomedia Production Locally

## ⚡ Quick Start (5 minutes)

### 1. Prerequisites
- **Node.js v18+** - [Download here](https://nodejs.org)
- **Git** - [Download here](https://git-scm.com)

### 2. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Access the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:9000/api

### 4. Login with Demo Accounts
```
Admin:    admin@nomedia.ma     / admin123
Manager:  mohammed@nomedia.ma  / mohammed123
Manager:  zineb@nomedia.ma     / zineb123
User:     karim@nomedia.ma     / karim123
```

## 🎯 That's it! You're ready to develop locally.

---

## 📁 Project Structure
```
Nomedia/
├── client/          # Frontend (React + Vite)
├── server/          # Backend (Express + TypeScript)
├── shared/          # Shared types
└── package.json     # Dependencies
```

## 🔧 Development Commands
```bash
npm run dev          # Start both frontend & backend
npm run dev:client   # Frontend only
npm run dev:server   # Backend only
npm run build        # Build for production
```

## 🗄️ Database
- **SQLite** is used by default (zero configuration)
- Database file: `./nomedia.db` (created automatically)
- **PostgreSQL** available with Docker: `docker-compose up -d postgres`

## 🌐 URLs
- **Frontend**: http://localhost:8080
- **API**: http://localhost:9000/api
- **Health Check**: http://localhost:9000/api/health
- **Demo Status**: http://localhost:9000/api/demo-status

## 🚀 Features Available
- ✅ User Authentication & Management
- ✅ Project Management
- ✅ Employee Management  
- ✅ Invoice & Expense Tracking
- ✅ Dashboard & Reports
- ✅ Responsive Design

## 📚 Complete Documentation
- **`LOCAL_DEVELOPMENT_GUIDE.md`** - Detailed setup guide
- **`POSTGRESQL_TESTING_GUIDE.md`** - PostgreSQL testing
- **`HOSTINGER_DEPLOYMENT_GUIDE.md`** - Production deployment

## 🐛 Troubleshooting
```bash
# Port conflicts
lsof -i :8080    # Check what's using port 8080
lsof -i :9000    # Check what's using port 9000

# Reset database
rm nomedia.db    # Delete SQLite database (will recreate)

# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Auto-Setup Script
```bash
# Run automated setup
node setup-local.js
```

---

**Happy coding! 🎉**
