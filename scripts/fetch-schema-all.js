const jsforce = require('jsforce');

async function checkSchemaAll() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  try {
    await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
    
    const globalDesc = await conn.describeGlobal();
    const customObjects = globalDesc.sobjects.filter(obj => obj.custom);
    
    console.log("--- All Custom Objects Found ---");
    for (const obj of customObjects) {
      console.log(`- ${obj.label} (${obj.name})`);
    }
    
  } catch (err) {
    console.error('Failed:', err.message);
  }
}
checkSchemaAll();
