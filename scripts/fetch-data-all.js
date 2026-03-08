const jsforce = require('jsforce');

async function testFetchAll() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

  // Let's get 5 years data
  const soql = `SELECT Id, SalesDate__c FROM OrderDetails__c WHERE SalesDate__c >= 2021-01-01 LIMIT 100000`;
  
  console.log("Fetching up to 100k records...");
  const records = [];
  await new Promise((resolve, reject) => {
      conn.query(soql)
        .on("record", function(record) {
          records.push(record);
        })
        .on("end", function() {
          console.log("Total in result.totalSize:", this.totalSize);
          console.log("Total fetched:", records.length);
          resolve();
        })
        .on("error", function(err) {
          console.error(err);
          reject(err);
        })
        .run({ autoFetch : true, maxFetch : 100000 }); // Try to fetch max 100k
  });
}
testFetchAll();
