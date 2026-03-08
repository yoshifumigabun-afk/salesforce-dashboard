const jsforce = require('jsforce');
async function run() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
  
  // Count how many records we have >= 2021-01-01
  const soql = `SELECT COUNT(Id) cnt FROM OrderDetails__c WHERE SalesDate__c >= 2021-01-01`;
  const res = await conn.query(soql);
  console.log("Total records since 2021:", res.records[0].cnt);
}
run();
