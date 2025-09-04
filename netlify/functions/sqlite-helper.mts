import { getStore } from "@netlify/blobs";
import Database from "better-sqlite3";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const DB_BLOB_KEY = "nomedia-database";
const store = getStore("nomedia-db");

export async function getSQLiteDatabase() {
  // Create a temporary file path
  const tempPath = join(tmpdir(), `nomedia-${Date.now()}.db`);
  
  try {
    // Try to get existing database from Netlify Blobs
    const dbData = await store.get(DB_BLOB_KEY, { type: 'arrayBuffer' });
    
    if (dbData) {
      // Write the blob data to a temporary file
      writeFileSync(tempPath, Buffer.from(dbData));
    }
    
    // Open the database (will create if doesn't exist)
    const db = new Database(tempPath);
    
    // If no existing data, initialize the database
    if (!dbData) {
      await initializeDatabase(db);
    }
    
    return { db, tempPath };
  } catch (error) {
    console.error("Error getting SQLite database:", error);
    throw error;
  }
}

export async function saveSQLiteDatabase(tempPath: string) {
  try {
    // Read the database file and save to Netlify Blobs
    const dbBuffer = readFileSync(tempPath);
    await store.set(DB_BLOB_KEY, dbBuffer);
    
    // Clean up temporary file
    if (existsSync(tempPath)) {
      unlinkSync(tempPath);
    }
  } catch (error) {
    console.error("Error saving SQLite database:", error);
    throw error;
  }
}

async function initializeDatabase(db: Database) {
  console.log("Initializing new SQLite database...");
  
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'active',
      permissions TEXT NOT NULL DEFAULT '[]',
      phone TEXT,
      avatar_url TEXT,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_name TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'medium',
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      start_date DATE,
      deadline DATE,
      progress INTEGER DEFAULT 0,
      project_type TEXT,
      deliverables TEXT,
      notes TEXT,
      client_contact_name TEXT,
      client_contact_email TEXT,
      client_contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      position TEXT,
      department_id INTEGER,
      salary REAL DEFAULT 0,
      contract_type TEXT,
      hire_date DATE,
      status TEXT DEFAULT 'active',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      address TEXT,
      notes TEXT,
      avatar_url TEXT,
      contract_start_date DATE,
      contract_end_date DATE,
      contract_file_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert demo admin user
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash('admin123', 10);
  
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role, status, permissions)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    'admin@nomedia.ma',
    hashedPassword,
    'Admin Principal',
    'admin',
    'active',
    JSON.stringify(['all'])
  ]);

  console.log("Database initialized with demo data");
}
