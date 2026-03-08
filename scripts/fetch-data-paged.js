const jsforce = require('jsforce');

async function fetchDataPaged() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

  // Let's check how many records are returned in 2026 alone vs all
  const soql2026 = `SELECT COUNT(Id) cnt FROM OrderDetails__c WHERE SalesDate__c >= 2026-01-01`;
  const res2026 = await conn.query(soql2026);
  console.log("Records >= 2026:", res2026.records[0].cnt);
}
fetchDataPaged();
