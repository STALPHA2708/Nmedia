import { run, get } from "../config/postgres-database";
import bcrypt from "bcryptjs";

export async function createDemoUsers() {
  try {
    console.log("🔧 Creating demo user accounts...");

    const demoAccounts = [
      {
        email: "admin@nomedia.ma",
        firstName: "Admin",
        lastName: "Principal",
        role: "admin",
        password: "admin123",
      },
      {
        email: "david.chen@nomedia.ma",
        firstName: "David",
        lastName: "Chen",
        role: "manager",
        password: "manager123",
      },
      {
        email: "alice.martin@nomedia.ma",
        firstName: "Alice",
        lastName: "Martin",
        role: "user",
        password: "user123",
      },
      {
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        password: "password",
      },
    ];

    const results = [];

    for (const account of demoAccounts) {
      try {
        const existing = await get("SELECT id FROM users WHERE email = $1", [
          account.email,
        ]);

        if (!existing) {
          const hashedPassword = await bcrypt.hash(account.password, 10);

          const result = await run(
            `
            INSERT INTO users (email, password, first_name, last_name, role, status, permissions, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
          `,
            [
              account.email,
              hashedPassword,
              account.firstName,
              account.lastName,
              account.role,
              "active",
              "{}",
            ],
          );

          console.log(`✅ Created user: ${account.email} (${account.role})`);
          results.push({
            email: account.email,
            status: "created",
            id: result.rows[0].id,
          });
        } else {
          console.log(`ℹ️ User already exists: ${account.email}`);
          results.push({
            email: account.email,
            status: "exists",
          });
        }
      } catch (error) {
        console.error(
          `❌ Failed to create user ${account.email}:`,
          error.message,
        );
        results.push({
          email: account.email,
          status: "error",
          error: error.message,
        });
      }
    }

    console.log("✅ Demo user creation completed");
    return results;
  } catch (error) {
    console.error("❌ Error creating demo users:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoUsers()
    .then((results) => {
      console.log("Demo users created:", results);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create demo users:", error);
      process.exit(1);
    });
}
