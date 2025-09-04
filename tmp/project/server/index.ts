import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "./routes/departments-sqlite";
import contractTypesRouter from "./routes/contract-types-sqlite";
import authRouter from "./routes/auth-sqlite";
import usersRouter from "./routes/users-sqlite";
import dashboardRouter from "./routes/dashboard";
import expensesRouter from "./routes/expenses-sqlite";
import invoicesRouter from "./routes/invoices-sqlite";
import projectsRouter from "./routes/projects-sqlite";
import employeesRouter from "./routes/employees-sqlite";
import projectsRouter from "./routes/projects-sqlite";
import employeesRouter from "./routes/employees-sqlite";
import projectsRouter from "./routes/projects-sqlite";
import employeesRouter from "./routes/employees-sqlite";
import projectsRouter from "./routes/projects-sqlite";
import employeesRouter from "./routes/employees-sqlite";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Debug route to test API
  app.get("/api/test", (_req, res) => {
    res.json({
      success: true,
      message: "API is working correctly",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/demo", handleDemo);

  // Department routes
  app.get("/api/departments", getDepartments);
  app.get("/api/departments/:id", getDepartmentById);
  app.post("/api/departments", createDepartment);
  app.put("/api/departments/:id", updateDepartment);
  app.delete("/api/departments/:id", deleteDepartment);

  // Contract type routes
  app.use("/api/contract-types", contractTypesRouter);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // User management routes (requires authentication)
  app.use("/api/users", usersRouter);

  // Dashboard routes
  app.use("/api/dashboard", dashboardRouter);

  // Expenses routes
  app.use("/api/expenses", expensesRouter);

  // Invoices routes
  app.use("/api/invoices", invoicesRouter);

  // Projects routes
  app.use("/api/projects", projectsRouter);

  // Employees routes
  app.use("/api/employees", employeesRouter);

  // Projects routes
  app.use("/api/projects", projectsRouter);

  // Employees routes
  app.use("/api/employees", employeesRouter);

  // Projects routes
  app.use("/api/projects", projectsRouter);

  // Employees routes
  app.use("/api/employees", employeesRouter);

  // Projects routes
  app.use("/api/projects", projectsRouter);

  // Employees routes
  app.use("/api/employees", employeesRouter);

  // API 404 handler - Must be before any client routes
  app.use("/api/*", (req, res) => {
    console.log(`API route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler for API routes
  app.use((error: any, req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      next(error);
    }
  });

  return app;
}
