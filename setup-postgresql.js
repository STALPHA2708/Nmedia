const { execSync } = require("child_process");
const { Pool } = require("pg");

async function setupPostgreSQL() {
  console.log("🚀 Setting up PostgreSQL Database for Nomedia...\n");

  // Database configuration
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: "postgres", // Connect to default postgres database first
    user: process.env.DB_USER || "nomedia_user",
    password: process.env.DB_PASSWORD || "nomedia_password",
  };

  console.log("1️⃣ Testing PostgreSQL connection...");

  try {
    // Test if PostgreSQL is available
    const testPool = new Pool({
      host: config.host,
      port: config.port,
      database: "postgres",
      user: "postgres",
      password: "",
    });

    await testPool.query("SELECT 1");
    console.log("✅ PostgreSQL is available");
    await testPool.end();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    console.error("\nPlease ensure PostgreSQL is installed and running:");
    console.error(
      "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib",
    );
    console.error(
      "  macOS: brew install postgresql && brew services start postgresql",
    );
    console.error(
      "  Windows: Download from https://www.postgresql.org/download/",
    );
    process.exit(1);
  }

  console.log("\n2️⃣ Setting up database and user...");

  try {
    // Create database and user (requires postgres superuser)
    console.log("Creating database nomedia_production...");
    try {
      execSync("createdb nomedia_production", { stdio: "inherit" });
    } catch (error) {
      console.log("Database might already exist, continuing...");
    }

    console.log("Creating user nomedia_user...");
    try {
      execSync(`createuser nomedia_user`, { stdio: "inherit" });
    } catch (error) {
      console.log("User might already exist, continuing...");
    }

    // Set password for user
    const postgresPool = new Pool({
      host: config.host,
      port: config.port,
      database: "postgres",
      user: "postgres",
      password: "",
    });

    await postgresPool.query(
      `ALTER USER nomedia_user WITH PASSWORD 'nomedia_password'`,
    );
    await postgresPool.query(
      `GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user`,
    );
    await postgresPool.query(`ALTER USER nomedia_user CREATEDB`);
    await postgresPool.end();
  } catch (error) {
    console.warn(
      "⚠️ Could not set up user automatically. You may need to run these commands manually:",
    );
    console.warn("  sudo -u postgres createdb nomedia_production");
    console.warn("  sudo -u postgres createuser nomedia_user");
    console.warn(
      "  sudo -u postgres psql -c \"ALTER USER nomedia_user WITH PASSWORD 'nomedia_password';\"",
    );
    console.warn(
      '  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nomedia_production TO nomedia_user;"',
    );
  }

  console.log("\n3️⃣ Testing application database connection...");

  // Test connection to our application database
  const appPool = new Pool({
    host: config.host,
    port: config.port,
    database: "nomedia_production",
    user: "nomedia_user",
    password: "nomedia_password",
  });

  try {
    await appPool.query("SELECT 1");
    console.log("✅ Application database connection successful!");
    await appPool.end();
  } catch (error) {
    console.error("❌ Application database connection failed:", error.message);
    process.exit(1);
  }

  console.log("\n4️⃣ Initializing database schema...");

  // Initialize the database schema
  try {
    const {
      initializePostgreSQLDatabase,
    } = require("./server/config/init-postgres-database");
    await initializePostgreSQLDatabase();
    console.log("✅ Database schema initialized successfully!");
  } catch (error) {
    console.error("❌ Database schema initialization failed:", error.message);
    process.exit(1);
  }

  console.log("\n🎉 PostgreSQL setup completed successfully!");
  console.log("\n📋 Database Configuration:");
  console.log("   • Host: localhost");
  console.log("   • Port: 5432");
  console.log("   • Database: nomedia_production");
  console.log("   • User: nomedia_user");
  console.log("   • Password: nomedia_password");
  console.log("\n🚀 You can now start the application:");
  console.log("   npm run dev");
  console.log("");
}

// Run the setup
setupPostgreSQL().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
