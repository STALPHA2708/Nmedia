# 🏠 Local Development Setup Guide - Nomedia Production

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone the repository
git clone https://github.com/STALPHA2708/Nomedia.git
cd Nomedia

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Frontend: http://localhost:8080
# API: http://localhost:9000/api
```

## 📋 Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git**

### Optional (for PostgreSQL testing)
- **Docker** and **Docker Compose**

## 🔧 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/STALPHA2708/Nomedia.git

# Navigate to project directory
cd Nomedia

# Switch to main branch (if needed)
git checkout main
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# This will install both frontend and backend dependencies
```

### Step 3: Database Configuration

The application supports **dual database** configuration:

#### Option A: SQLite (Recommended for Local Development)
```bash
# No configuration needed - SQLite works out of the box
# Database file will be created automatically at: ./nomedia.db
```

#### Option B: PostgreSQL (Optional)
```bash
# Set environment variables for PostgreSQL
export DATABASE_TYPE=postgresql
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=nomedia_dev
export DB_USER=your_username
export DB_PASSWORD=your_password
```

### Step 4: Start Development Server

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run dev:client    # Frontend only (Vite)
npm run dev:server    # Backend only (Express)
```

### Step 5: Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:9000/api
- **API Health**: http://localhost:9000/api/health

## 🗄️ Database Setup Options

### Option 1: SQLite (Default - Zero Configuration)

SQLite is used by default and requires no setup:

```bash
# Just start the application
npm run dev

# Database file created automatically: ./nomedia.db
```

**Demo Accounts (Auto-created):**
```
Admin:    admin@nomedia.ma     / admin123
Manager:  mohammed@nomedia.ma  / mohammed123
Manager:  zineb@nomedia.ma     / zineb123
User:     karim@nomedia.ma     / karim123
```

### Option 2: PostgreSQL with Docker

For testing PostgreSQL locally:

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Set environment variables
export DATABASE_TYPE=postgresql

# Start application
npm run dev

# Optional: Start pgAdmin GUI
docker-compose up -d pgadmin
# Access: http://localhost:8081
```

## 🏗️ Project Structure

```
Nomedia/
├── client/                 # Frontend (React + Vite)
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   └── lib/               # Utilities
├── server/                # Backend (Express + TypeScript)
│   ├── config/            # Database configuration
│   ├── routes/            # API routes
│   └── scripts/           # Database scripts
├── shared/                # Shared types/utilities
├── dist/                  # Built frontend files
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Production
npm run build           # Build frontend for production
npm run start           # Start production server
npm run start:prod      # Start with NODE_ENV=production

# Database
npm run setup-db        # Initialize database schema

# Testing
npm run lint            # Run ESLint
npm run preview         # Preview production build

# Docker (PostgreSQL)
docker-compose up -d postgres    # Start PostgreSQL
docker-compose up -d pgadmin     # Start database GUI
docker-compose down              # Stop all containers
```

## 🌐 Environment Variables

Create a `.env` file for local configuration:

```bash
# .env (optional - for customization)

# Database Configuration
DATABASE_TYPE=sqlite          # or 'postgresql'
SQLITE_PATH=./nomedia.db     # SQLite database path

# PostgreSQL (if using)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nomedia_dev
DB_USER=your_username
DB_PASSWORD=your_password

# Security
JWT_SECRET=your-jwt-secret-key

# Development
NODE_ENV=development
DEBUG=                       # Set to 'database' for DB debugging
```

## 🔍 Verification Steps

### 1. Check Application is Running
```bash
# Frontend should be accessible
curl http://localhost:8080

# Backend health check
curl http://localhost:9000/api/health
```

### 2. Test Database Connection
```bash
# Check demo accounts
curl http://localhost:9000/api/demo-status

# Test login
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@nomedia.ma", "password": "admin123"}'
```

### 3. Verify Features

Open http://localhost:8080 and test:
- ✅ Login with demo accounts
- ✅ Dashboard access
- ✅ Project management
- ✅ Employee management
- ✅ Invoice and expense tracking

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :8080  # Frontend
lsof -i :9000  # Backend

# Kill process
kill -9 [PID]

# Or use different ports
PORT=3000 npm run dev:client
```

#### Database Issues
```bash
# Reset SQLite database
rm nomedia.db
npm run dev  # Will recreate with demo data

# Check PostgreSQL connection
docker-compose logs postgres
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be v18.0.0 or higher
# Use nvm to switch versions:
nvm install 18
nvm use 18
```

#### Permission Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment-Specific Issues

#### Windows
```bash
# Use PowerShell or Git Bash
# Set environment variables differently:
set DATABASE_TYPE=postgresql
```

#### macOS/Linux
```bash
# Environment variables
export DATABASE_TYPE=postgresql
```

## 🔄 Development Workflow

### 1. Start Development
```bash
git pull origin main    # Get latest changes
npm install            # Update dependencies
npm run dev           # Start development server
```

### 2. Make Changes
- Edit files in `client/` for frontend changes
- Edit files in `server/` for backend changes
- Changes are automatically reloaded

### 3. Database Changes
- SQLite: Database auto-updates with schema changes
- PostgreSQL: Use migration scripts if needed

### 4. Testing
```bash
npm run lint          # Check code quality
npm run build         # Test production build
```

## 📱 Features Available Locally

Once running locally, you'll have access to:

### 🔐 Authentication & User Management
- Login/logout system
- Role-based access (admin, manager, user)
- User profile management

### 📊 Project Management
- Create and manage projects
- Project timeline and progress tracking
- Client information management

### 👥 Employee Management
- Employee profiles and contracts
- Department organization
- Salary and contact information

### 💰 Financial Management
- Invoice generation and tracking
- Expense management
- Budget tracking

### 📈 Dashboard & Reports
- Real-time statistics
- Project progress overview
- Financial summaries

## 🚀 Ready for Development!

Your local development environment is now ready. The application will:

1. ✅ **Auto-detect** database type (SQLite by default)
2. ✅ **Create tables** automatically on first run
3. ✅ **Initialize demo data** for testing
4. ✅ **Hot reload** on file changes
5. ✅ **API documentation** via health endpoints

Start coding and enjoy developing with the Nomedia Production Management System! 🎉
