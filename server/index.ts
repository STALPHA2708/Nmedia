import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createHttpServer } from "http";
import { initializeDatabase, getDatabaseType, checkDatabaseHealth, detectDatabaseEnvironment, query } from "./config/unified-database";
import { handleDemo } from "./routes/demo";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./routes/departments-sqlite";
import {
  getContractTypes,
  getContractTypeById,
  createContractType,
  updateContractType,
  deleteContractType,
} from "./routes/contract-types-sqlite";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from "./routes/employees-sqlite";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignEmployeeToProject,
  removeEmployeeFromProject,
} from "./routes/projects-sqlite";
import authRouter from "./routes/auth-sqlite";
import usersRouter from "./routes/users-sqlite";
import dashboardRouter from "./routes/dashboard";
import expensesRouter from "./routes/expenses-sqlite";
import invoicesRouter from "./routes/invoices-sqlite";

export async function createServer() {
  const app = express();

  // Initialize unified database (auto-detects SQLite or PostgreSQL)
  try {
    const envInfo = detectDatabaseEnvironment();
    console.log(`🗄️ Detected database type: ${envInfo.type.toUpperCase()}`);
    console.log(`📊 Database config:`, envInfo.config);
    
    await initializeDatabase();
    const dbType = getDatabaseType();
    console.log(`✅ ${dbType?.toUpperCase()} database initialized successfully`);
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    console.error("");
    console.error("🔧 CONFIGURATION OPTIONS:");
    console.error("");
    console.error("   📊 For PostgreSQL (Hostinger):");
    console.error("      DATABASE_TYPE=postgresql");
    console.error("      DB_HOST=your-hostinger-host");
    console.error("      DB_NAME=your-database-name");
    console.error("      DB_USER=your-username");
    console.error("      DB_PASSWORD=your-password");
    console.error("      DB_PORT=5432");
    console.error("");
    console.error("   📊 Alternative (connection string):");
    console.error("      DATABASE_URL=postgresql://user:pass@host:5432/db");
    console.error("");
    console.error("   📊 For SQLite (default - local development):");
    console.error("      SQLITE_PATH=./nomedia.db (optional)");
    console.error("");
    console.error("⚠️  Server will continue running but database operations will fail");
    console.error("");
  }

  // Middleware
  app.use(cors());

  // Security headers (only in production to avoid dev issues)
  if (process.env.NODE_ENV === "production") {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
        },
      },
      crossOriginEmbedderPolicy: false, // May need adjustment for your frontend
    }));
  }

  app.use(express.json({ limit: "10mb" })); // Limit payload size
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Rate limiting for security - prevent brute force attacks
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: "Trop de requêtes, veuillez réessayer plus tard.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per 15 minutes
    message: {
      success: false,
      message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // Apply rate limiting
  app.use("/api/", generalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Debug route to test API
  app.get("/api/test", (req, res) => {
    console.log("🚀 MAIN API TEST ROUTE HIT - /api/test");
    res.json({
      success: true,
      message: "API is working correctly",
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });
  });

  // Demo accounts status endpoint
  app.get("/api/demo-status", async (_req, res) => {
    try {
      const demoAccounts = [
        { email: "admin@nomedia.ma", role: "admin" },
        { email: "mohammed@nomedia.ma", role: "admin" },
        { email: "zineb@nomedia.ma", role: "manager" },
        { email: "karim@nomedia.ma", role: "user" },
      ];

      const accountStatus = [];
      
      for (const account of demoAccounts) {
        try {
          const user = await query(
            "SELECT id, name, email, role, status FROM users WHERE email = ?",
            [account.email],
          );
          
          accountStatus.push({
            email: account.email,
            exists: user.length > 0,
            name: user[0]?.name || "Not found",
            role: user[0]?.role || "Unknown",
            status: user[0]?.status || "Unknown",
          });
        } catch (error) {
          accountStatus.push({
            email: account.email,
            exists: false,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        demoAccounts: accountStatus,
        databaseType: getDatabaseType()?.toUpperCase(),
        message: "Demo accounts status check completed",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking demo accounts",
        error: error.message,
      });
    }
  });

  // Health check endpoint with database status
  app.get("/api/health", async (_req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const dbType = getDatabaseType();
      const envInfo = detectDatabaseEnvironment();

      res.json({
        success: true,
        status: "healthy",
        database: dbHealth ? "connected" : "disconnected",
        databaseType: dbType?.toUpperCase() || "unknown",
        databaseConfig: envInfo.config,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: "unhealthy",
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Department routes
  app.get("/api/departments", getDepartments);
  app.get("/api/departments/:id", getDepartmentById);
  app.post("/api/departments", createDepartment);
  app.put("/api/departments/:id", updateDepartment);
  app.delete("/api/departments/:id", deleteDepartment);

  // Contract type routes
  app.get("/api/contract-types", getContractTypes);
  app.get("/api/contract-types/:id", getContractTypeById);
  app.post("/api/contract-types", createContractType);
  app.put("/api/contract-types/:id", updateContractType);
  app.delete("/api/contract-types/:id", deleteContractType);

  // Employee routes (require authentication)
  app.get("/api/employees", getEmployees);
  app.get("/api/employees/stats", getEmployeeStats);
  app.get("/api/employees/:id", getEmployeeById);
  app.post("/api/employees", createEmployee); // Protected route for creating employees
  app.put("/api/employees/:id", updateEmployee);
  app.delete("/api/employees/:id", deleteEmployee);

  // Project routes
  app.get("/api/projects", getProjects);
  app.get("/api/projects/:id", getProjectById);
  app.post("/api/projects", createProject);
  app.put("/api/projects/:id", updateProject);
  app.delete("/api/projects/:id", deleteProject);
  app.post(
    "/api/projects/:projectId/employees/:employeeId",
    assignEmployeeToProject,
  );
  app.delete(
    "/api/projects/:projectId/employees/:employeeId",
    removeEmployeeFromProject,
  );

  // Add middleware to log all API requests (BEFORE routes)
  app.use("/api/*", (req, res, next) => {
    console.log(`🌐 API Request: ${req.method} ${req.path} from ${req.ip}`);
    console.log("🌐 Request Body:", req.body);
    next();
  });

  // Authentication routes
  console.log("🔗 Registering auth routes at /api/auth");
  app.use("/api/auth", authRouter);

  // User management routes (requires authentication)
  app.use("/api/users", usersRouter);

  // Dashboard routes
  app.use("/api/dashboard", dashboardRouter);

  // Expenses routes
  app.use("/api/expenses", expensesRouter);

  // Invoices routes
  app.use("/api/invoices", invoicesRouter);

  // API 404 handler - Must be before any client routes
  app.use("/api/*", (req, res) => {
    console.log(`API route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler for API routes
  app.use((error: any, req: any, res: any, next: any) => {
    if (req.path.startsWith("/api/")) {
      console.error("API Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    } else {
      next(error);
    }
  });

  return app;
}

// Function to find an available port
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createHttpServer();
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        resolve(port);
      });
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Development server startup (when running with tsx/nodemon)
async function startDevelopmentServer() {
  // Use port 9000 which should be available
  const port = 9000;
  console.log(`🔧 Starting server on port ${port}...`);

  try {
    const app = await createServer();
    app.listen(port, () => {
      console.log(`🚀 Development server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:8082`);
      console.log(`🔧 API: http://localhost:${port}/api`);
      console.log(`⚠️  Update proxy port to ${port} if needed`);
    });
  } catch (error) {
    console.error("Failed to start development server:", error);
    process.exit(1);
  }
}

// Check if this is the main module being run (works with tsx/nodemon)
if (
  process.argv[1] &&
  (process.argv[1].endsWith("server/index.ts") ||
    process.argv[1].endsWith("index.ts"))
) {
  startDevelopmentServer();
}
