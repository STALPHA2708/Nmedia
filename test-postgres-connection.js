#!/usr/bin/env node

/**
 * PostgreSQL Connection Test Script
 * Tests if PostgreSQL Docker container is ready and accessible
 */

const { Client } = require('pg');

// PostgreSQL connection configuration (matching docker-compose.yml)
const config = {
  host: 'localhost',
  port: 5432,
  database: 'nomedia_production',
  user: 'nomedia_user',
  password: 'nomedia_password123',
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

async function testPostgreSQLConnection() {
  log(colors.bold + colors.cyan, '🐳 Testing PostgreSQL Docker Connection...\n');

  const client = new Client(config);

  try {
    log(colors.blue, '🔗 Connecting to PostgreSQL...');
    await client.connect();
    log(colors.green, '✅ Connected to PostgreSQL successfully!');

    log(colors.blue, '🔍 Testing basic query...');
    const result = await client.query('SELECT version()');
    log(colors.green, '✅ Query successful!');
    log(colors.cyan, `📊 PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);

    log(colors.blue, '🗄️ Testing database access...');
    await client.query('SELECT current_database(), current_user');
    log(colors.green, '✅ Database access confirmed!');
    log(colors.cyan, `📦 Database: ${config.database}`);
    log(colors.cyan, `👤 User: ${config.user}`);

    log(colors.blue, '🔧 Testing table creation...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log(colors.green, '✅ Table creation successful!');

    log(colors.blue, '📝 Testing data insertion...');
    await client.query(`
      INSERT INTO test_table (message) 
      VALUES ('PostgreSQL Docker test successful!')
    `);
    log(colors.green, '✅ Data insertion successful!');

    log(colors.blue, '📖 Testing data retrieval...');
    const testData = await client.query('SELECT * FROM test_table ORDER BY id DESC LIMIT 1');
    log(colors.green, '✅ Data retrieval successful!');
    log(colors.cyan, `📄 Test Data: ${testData.rows[0].message}`);

    log(colors.blue, '🧹 Cleaning up test table...');
    await client.query('DROP TABLE test_table');
    log(colors.green, '✅ Cleanup successful!');

    await client.end();

    log(colors.bold + colors.green, '\n🎉 PostgreSQL Docker Test PASSED!');
    log(colors.green, '✅ PostgreSQL is ready for your application');
    log(colors.yellow, '\n🔄 Next step: Switch your application to use PostgreSQL');

    return true;

  } catch (error) {
    log(colors.red, '❌ PostgreSQL connection failed:');
    log(colors.red, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      log(colors.yellow, '\n💡 Troubleshooting:');
      log(colors.cyan, '1. Make sure Docker is running');
      log(colors.cyan, '2. Start PostgreSQL: docker-compose up -d postgres');
      log(colors.cyan, '3. Wait 10-30 seconds for PostgreSQL to start');
      log(colors.cyan, '4. Check logs: docker-compose logs postgres');
    }

    return false;
  }
}

async function showConnectionInfo() {
  log(colors.bold + colors.blue, '\n📊 PostgreSQL Connection Information:');
  log(colors.cyan, `Host: ${config.host}`);
  log(colors.cyan, `Port: ${config.port}`);
  log(colors.cyan, `Database: ${config.database}`);
  log(colors.cyan, `Username: ${config.user}`);
  log(colors.cyan, `Password: ${config.password}`);
}

async function showDockerCommands() {
  log(colors.bold + colors.yellow, '\n🐳 Docker Commands for PostgreSQL:');
  log(colors.cyan, 'Start PostgreSQL:     docker-compose up -d postgres');
  log(colors.cyan, 'Stop PostgreSQL:      docker-compose down');
  log(colors.cyan, 'View logs:            docker-compose logs postgres');
  log(colors.cyan, 'Check status:         docker-compose ps');
  log(colors.cyan, 'Connect to database:  docker-compose exec postgres psql -U nomedia_user -d nomedia_production');
  log(colors.cyan, 'Start pgAdmin GUI:    docker-compose up -d pgadmin');
}

// Main execution
async function main() {
  await showConnectionInfo();
  await showDockerCommands();
  
  log(colors.bold + colors.blue, '\n🧪 Testing PostgreSQL Connection...');
  const success = await testPostgreSQLConnection();
  
  if (success) {
    log(colors.bold + colors.green, '\n✅ PostgreSQL is ready! You can now switch your app to use PostgreSQL.');
  } else {
    log(colors.bold + colors.red, '\n❌ PostgreSQL test failed. Please check Docker setup.');
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPostgreSQLConnection, config };
