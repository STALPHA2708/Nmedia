const { query, get } = require('./server/config/sqlite-database');

async function listDepartments() {
  try {
    console.log('\n🏢 DEPARTMENTS:');
    console.log('================');
    const departments = await query('SELECT id, name, description FROM departments ORDER BY name');
    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ID: ${dept.id} | Name: "${dept.name}" | Description: "${dept.description || 'N/A'}"`);
    });
    console.log(`Total departments: ${departments.length}\n`);
  } catch (error) {
    console.error('Error listing departments:', error);
  }
}

async function listContractTypes() {
  try {
    console.log('📋 CONTRACT TYPES:');
    console.log('==================');
    const contractTypes = await query('SELECT id, name, description, is_permanent FROM contract_types ORDER BY name');
    contractTypes.forEach((type, index) => {
      console.log(`${index + 1}. ID: ${type.id} | Name: "${type.name}" | Description: "${type.description || 'N/A'}" | Permanent: ${type.is_permanent ? 'Yes' : 'No'}`);
    });
    console.log(`Total contract types: ${contractTypes.length}\n`);
  } catch (error) {
    console.error('Error listing contract types:', error);
  }
}

async function main() {
  console.log('🔍 Debugging Dropdown Data');
  console.log('===========================');
  
  await listDepartments();
  await listContractTypes();
  
  process.exit(0);
}

main().catch(console.error);
