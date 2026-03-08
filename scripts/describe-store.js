const jsforce = require('jsforce');

async function desc() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
  let descOrder = await conn.describe('OrderDetails__c');
  for (const f of descOrder.fields) {
    if (f.label.includes('店舗')) {
        console.log(`OrderDetails__c: ${f.label} (${f.name}) [${f.type}] (Ref: ${f.referenceTo})`);
    }
  }

  let descShoot = await conn.describe('PhotographingInformation__c');
  for (const f of descShoot.fields) {
    if (f.label.includes('カメラマン') || f.label.includes('撮影者') || f.label.includes('セレクト')) {
        console.log(`PhotographingInformation__c: ${f.label} (${f.name}) [${f.type}] (Ref: ${f.referenceTo})`);
    }
  }
}
desc();
