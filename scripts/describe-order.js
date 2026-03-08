const jsforce = require('jsforce');

async function desc() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
  const desc = await conn.describe('OrderDetails__c');
  for (const f of desc.fields) {
    if (f.type === 'reference' || f.name.includes('Amount') || f.name.includes('Date')) {
        console.log(`${f.label}: ${f.name} [${f.type}] (Ref: ${f.referenceTo})`);
    }
  }
}
desc();
