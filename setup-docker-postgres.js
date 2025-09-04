import { execSync } from "child_process";
import pkg from "pg";
const { Pool } = pkg;

async function setupDockerPostgreSQL() {
  console.log("🐳 Setting up PostgreSQL with Docker...\n");

  // Check if Docker is available
  try {
    execSync("docker --version", { stdio: "pipe" });
    console.log("✅ Docker is available");
  } catch (error) {
    console.error("❌ Docker is not installed or not running");
    console.error(
      "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop",
    );
    process.exit(1);
  }

  // Check if Docker Compose is available
  try {
    execSync("docker compose version", { stdio: "pipe" });
    console.log("✅ Docker Compose is available");
  } catch (error) {
    console.error("❌ Docker Compose is not available");
    console.error("Please ensure Docker Desktop includes Docker Compose");
    process.exit(1);
  }

  console.log("\n1️��� Starting PostgreSQL container...");

  try {
    // Stop any existing containers
    try {
      execSync("docker compose down", { stdio: "inherit" });
    } catch (error) {
      // Container might not exist, continue
    }

    // Start PostgreSQL container
    execSync("docker compose up -d postgres", { stdio: "inherit" });
    console.log("✅ PostgreSQL container started");
  } catch (error) {
    console.error("❌ Failed to start PostgreSQL container:", error.message);
    process.exit(1);
  }

  console.log("\n2️⃣ Waiting for PostgreSQL to be ready...");

  // Wait for PostgreSQL to be ready
  const maxRetries = 30; // 30 seconds
  let retries = 0;
  let connected = false;

  const config = {
    host: "localhost",
    port: 5432,
    database: "nomedia_production",
    user: "nomedia_user",
    password: "nomedia_password123",
  };

  while (retries < maxRetries && !connected) {
    try {
      const pool = new Pool(config);
      await pool.query("SELECT 1");
      await pool.end();
      connected = true;
      console.log("✅ PostgreSQL is ready!");
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        process.stdout.write(".");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (!connected) {
    console.error("\n❌ PostgreSQL failed to start after 30 seconds");
    console.error("Check container logs: docker compose logs postgres");
    process.exit(1);
  }

  console.log("\n3️⃣ Initializing database schema...");

  try {
    const { initializePostgreSQLDatabase } = await import("./server/config/init-postgres-database.ts");

    await initializePostgreSQLDatabase();
    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Database schema initialization failed:", error.message);
    console.error(
      "\nYou can try to initialize manually by restarting your app server",
    );
  }

  console.log("\n🎉 Docker PostgreSQL setup completed successfully!");
  console.log("\n📋 Database Information:");
  console.log("   • Container: nomedia-postgres");
  console.log("   • Host: localhost");
  console.log("   • Port: 5432");
  console.log("   • Database: nomedia_production");
  console.log("   • User: nomedia_user");
  console.log("   • Password: nomedia_password123");

  console.log("\n🔧 Useful Docker Commands:");
  console.log("   • Start database: docker compose up -d postgres");
  console.log("   • Stop database: docker compose down");
  console.log("   • View logs: docker compose logs postgres");
  console.log(
    "   • Access database: docker compose exec postgres psql -U nomedia_user -d nomedia_production",
  );

  console.log("\n🎯 Optional pgAdmin (Database Management UI):");
  console.log("   • Start: docker compose up -d pgadmin");
  console.log("   • Access: http://localhost:5050");
  console.log("   • Email: admin@nomedia.ma");
  console.log("   • Password: admin123");

  console.log("\n🚀 Your application is ready! Start with:");
  console.log("   npm run dev");
  console.log("");
}

setupDockerPostgreSQL().catch((error) => {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
});
