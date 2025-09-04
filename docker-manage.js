#!/usr/bin/env node

const { execSync } = require("child_process");

const commands = {
  start: {
    description: "Start PostgreSQL container",
    cmd: "docker compose up -d postgres",
  },
  stop: {
    description: "Stop all containers",
    cmd: "docker compose down",
  },
  restart: {
    description: "Restart PostgreSQL container",
    cmd: "docker compose restart postgres",
  },
  logs: {
    description: "View PostgreSQL logs",
    cmd: "docker compose logs postgres",
  },
  status: {
    description: "Check container status",
    cmd: "docker compose ps",
  },
  pgadmin: {
    description: "Start pgAdmin (database management UI)",
    cmd: "docker compose up -d pgadmin",
  },
  connect: {
    description: "Connect to PostgreSQL database",
    cmd: "docker compose exec postgres psql -U nomedia_user -d nomedia_production",
  },
  reset: {
    description: "Reset database (WARNING: Deletes all data)",
    cmd: "docker compose down -v && docker compose up -d postgres",
  },
};

function showHelp() {
  console.log("🐳 Nomedia Docker PostgreSQL Management\n");
  console.log("Usage: node docker-manage.js <command>\n");
  console.log("Available commands:");

  Object.entries(commands).forEach(([cmd, info]) => {
    console.log(`  ${cmd.padEnd(10)} - ${info.description}`);
  });

  console.log("\nExamples:");
  console.log("  node docker-manage.js start     # Start the database");
  console.log("  node docker-manage.js logs      # View database logs");
  console.log(
    "  node docker-manage.js pgadmin   # Start database management UI",
  );
  console.log("");
}

function runCommand(commandName) {
  const command = commands[commandName];

  if (!command) {
    console.error(`❌ Unknown command: ${commandName}\n`);
    showHelp();
    process.exit(1);
  }

  console.log(`🐳 Running: ${command.description}...`);
  console.log(`📝 Command: ${command.cmd}\n`);

  try {
    if (commandName === "reset") {
      console.log("⚠️  WARNING: This will delete ALL database data!");
      console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

      // Give user time to cancel
      for (let i = 5; i > 0; i--) {
        process.stdout.write(`${i}... `);
        execSync("sleep 1", { stdio: "inherit" });
      }
      console.log("\n🗄️ Resetting database...");
    }

    execSync(command.cmd, { stdio: "inherit" });
    console.log(`\n✅ ${command.description} completed successfully!`);

    if (commandName === "start") {
      console.log("\n🔧 Next steps:");
      console.log("   1. Wait a few seconds for PostgreSQL to initialize");
      console.log("   2. Start your application: npm run dev");
      console.log(
        "   3. Optional: Start pgAdmin: node docker-manage.js pgadmin",
      );
    }

    if (commandName === "pgadmin") {
      console.log("\n🌐 pgAdmin is now available at: http://localhost:5050");
      console.log("   📧 Email: admin@nomedia.ma");
      console.log("   🔐 Password: admin123");
    }
  } catch (error) {
    console.error(`\n❌ Failed to ${command.description.toLowerCase()}`);
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const commandName = args[0].toLowerCase();
runCommand(commandName);
