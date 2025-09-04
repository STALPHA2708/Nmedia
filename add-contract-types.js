const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'nomedia.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding contract types to database...');

const contractTypes = [
  { name: 'CDI', is_permanent: 1, description: 'Contrat à Durée Indéterminée' },
  { name: 'CDD', is_permanent: 0, description: 'Contrat à Durée Déterminée' },
  { name: 'Stage', is_permanent: 0, description: 'Contrat de Stage' },
  { name: 'Freelance', is_permanent: 0, description: 'Contrat Freelance/Indépendant' },
  { name: 'Consultant', is_permanent: 0, description: 'Contrat de Consultation' }
];

// First check if contract types exist
db.get("SELECT COUNT(*) as count FROM contract_types", (err, row) => {
  if (err) {
    console.error('Error checking contract types:', err);
    return;
  }

  if (row.count > 0) {
    console.log('Contract types already exist:', row.count);
    db.close();
    return;
  }

  console.log('Inserting contract types...');
  
  const stmt = db.prepare("INSERT INTO contract_types (name, is_permanent, description) VALUES (?, ?, ?)");
  
  contractTypes.forEach((ct, index) => {
    stmt.run([ct.name, ct.is_permanent, ct.description], function(err) {
      if (err) {
        console.error('Error inserting contract type:', ct.name, err);
      } else {
        console.log('✅ Added contract type:', ct.name);
      }
      
      if (index === contractTypes.length - 1) {
        stmt.finalize();
        console.log('✅ All contract types added successfully');
        db.close();
      }
    });
  });
});
