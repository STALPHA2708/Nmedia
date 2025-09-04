// Quick script to create a demo user via the API
const fetch = require('node-fetch');

async function createDemoUser() {
  try {
    console.log('🔧 Creating demo user via API...');
    
    const response = await fetch('http://localhost:8000/api/auth/create-demo-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (result.success) {
      console.log('✅ Demo accounts created successfully!');
      console.log('🔑 Login credentials:');
      console.log('   - admin@nomedia.ma / admin123');
      console.log('   - test@test.com / password');
    } else {
      console.error('❌ Failed to create demo accounts:', result.message);
    }
  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
  }
}

createDemoUser();
