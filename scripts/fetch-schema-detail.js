const jsforce = require('jsforce');

async function checkSchemaDetail() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  try {
    await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
    
    // Check specific fields of OrderDetail__c directly
    console.log("--- Describing OrderDetail__c ---");
    let desc = await conn.describe('OrderDetail__c');
    for (const field of desc.fields) {
        console.log(`  - ${field.label} (${field.name}) [${field.type}]`);
        if (field.referenceTo && field.referenceTo.length > 0) {
           console.log(`    -> References: ${field.referenceTo.join(', ')}`);
        }
    }

  } catch (err) {
    console.error('Failed:', err.message);
  }
}
checkSchemaDetail();
