# 🚀 NETLIFY DEPLOYMENT GUIDE - NOMEDIA PRODUCTION
## Migration from Fly.dev + SQLite to Netlify + Cloud Database

---

## 🎯 **RECOMMENDED ARCHITECTURE**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   SERVERLESS    │    │   DATABASE      │
│   (Netlify)     │───►│   FUNCTIONS     │───►│   (Supabase)    │
│   React App     │    │   (Netlify)     │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📋 **MIGRATION STEPS**

### **Step 1: Setup Supabase Database**

#### **1.1 Create Supabase Project**
```bash
# Go to https://supabase.com
# Create new project
# Copy connection details
```

#### **1.2 Database Schema Migration**
```sql
-- Create tables in Supabase
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  department_id INTEGER,
  contract_type_id INTEGER,
  salary DECIMAL(10,2),
  hire_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client VARCHAR(255) NOT NULL,
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  client VARCHAR(255) NOT NULL,
  client_ice VARCHAR(100),
  project VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  project_id INTEGER REFERENCES projects(id),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  receipt_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.3 Export Current SQLite Data**
```bash
# Create data export script
node export-sqlite-data.js
```

### **Step 2: Adapt Backend for Serverless**

#### **2.1 Create Netlify Functions Structure**
```
netlify/
  functions/
    auth.js          # Authentication endpoints
    employees.js     # Employee management
    projects.js      # Project management
    invoices.js      # Invoice management
    expenses.js      # Expense management
    dashboard.js     # Dashboard data
```

#### **2.2 Example Netlify Function**
```javascript
// netlify/functions/invoices.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, data: invoices })
        }

      case 'POST':
        const invoiceData = JSON.parse(event.body)
        const { data: newInvoice, error: createError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select()
        
        if (createError) throw createError
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ success: true, data: newInvoice[0] })
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### **Step 3: Update Frontend Configuration**

#### **3.1 Environment Variables**
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "/.netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### **3.2 Update API Client**
```typescript
// client/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "/.netlify/functions";

// Update all API calls to use serverless endpoints
export const invoiceApi = {
  getAll: () => apiRequest<Invoice[]>("/invoices"),
  create: (data: CreateInvoiceRequest) => 
    apiRequest<Invoice>("/invoices", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
  // ... other methods
};
```

### **Step 4: Deploy to Netlify**

#### **4.1 Install Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
```

#### **4.2 Configure Environment Variables**
```bash
# In Netlify dashboard or CLI
netlify env:set SUPABASE_URL "your-supabase-url"
netlify env:set SUPABASE_ANON_KEY "your-supabase-anon-key"
netlify env:set JWT_SECRET "your-jwt-secret"
```

#### **4.3 Deploy**
```bash
# Build and deploy
npm run build
netlify deploy --prod
```

---

## 💰 **COST COMPARISON**

### **Current (Fly.dev):**
- **Fly.dev:** $0-15/month
- **Total:** $0-15/month

### **Netlify + Supabase:**
- **Netlify:** Free tier (100GB bandwidth)
- **Supabase:** Free tier (500MB database, 2GB transfer)
- **Total:** $0/month for small usage

### **Paid Tiers:**
- **Netlify Pro:** $19/month (more bandwidth)
- **Supabase Pro:** $25/month (8GB database, 50GB transfer)

---

## ⚡ **PERFORMANCE BENEFITS**

### **Netlify Advantages:**
- ✅ **Global CDN** - Faster loading worldwide
- ✅ **Edge locations** - Reduced latency
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **SSL included** - Free HTTPS
- ✅ **Deploy previews** - Test before going live

### **Supabase Advantages:**
- ✅ **Real-time features** - Live data updates
- ✅ **Built-in auth** - User management
- ✅ **Auto-backups** - Data protection
- ✅ **Dashboard** - Easy database management
- ✅ **API generation** - Automatic REST/GraphQL APIs

---

## 🔧 **MIGRATION TIMELINE**

### **Phase 1: Database Setup (1-2 hours)**
1. Create Supabase project
2. Run schema migration
3. Export and import data

### **Phase 2: Backend Adaptation (2-4 hours)**
1. Convert Express routes to Netlify functions
2. Update database connections
3. Test API endpoints

### **Phase 3: Frontend Updates (1 hour)**
1. Update API base URL
2. Test all functionality
3. Fix any compatibility issues

### **Phase 4: Deployment (30 minutes)**
1. Configure Netlify project
2. Set environment variables
3. Deploy and test

**Total Estimated Time: 4-7 hours**

---

## 🚀 **ALTERNATIVE: QUICK NETLIFY DEPLOYMENT**

### **Keep Current Database, Deploy Frontend Only**

#### **Hybrid Architecture:**
```
Frontend (Netlify) → API Server (Fly.dev) → SQLite Database
```

#### **Steps:**
1. **Build frontend only:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   ```bash
   netlify deploy --dir=dist --prod
   ```

3. **Update API URLs:**
   ```typescript
   // Point to existing Fly.dev backend
   const API_BASE_URL = "https://your-fly-app.fly.dev/api";
   ```

**Time Required: 30 minutes**

---

## 📊 **DECISION MATRIX**

| Option | Setup Time | Monthly Cost | Performance | Scalability |
|--------|------------|--------------|-------------|-------------|
| **Keep Fly.dev** | 0 hours | $0-15 | ⭐⭐⭐ | ⭐⭐⭐ |
| **Netlify + Supabase** | 4-7 hours | $0-44 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Netlify Frontend Only** | 30 min | $0-15 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 **RECOMMENDATION**

### **For Immediate Deployment:**
**Option: Netlify Frontend + Keep Fly.dev Backend**
- Fastest setup (30 minutes)
- Better global performance for frontend
- Keep existing database intact

### **For Long-term Solution:**
**Option: Full Migration to Netlify + Supabase**
- Best performance and scalability
- Modern serverless architecture
- Real-time features
- Better for team collaboration

---

**Want me to start the migration process? Which option do you prefer?**
