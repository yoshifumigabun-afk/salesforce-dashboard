const jsforce = require('jsforce');

async function desc() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
  const desc = await conn.describe('PhotographingInformation__c');
  for (const f of desc.fields) {
    if (f.type === 'reference' || f.name.includes('Date') || f.name.includes('Store') || f.name.includes('Genre') || f.name.includes('Major') || f.name.includes('Store')) {
        console.log(`${f.label}: ${f.name} [${f.type}] (Ref: ${f.referenceTo})`);
    }
  }
}
desc();
