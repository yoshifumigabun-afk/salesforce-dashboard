const jsforce = require('jsforce');

async function checkBudget() {
    const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
    await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

    const soql = `SELECT Id, xMajorDivisions__c, Broad_division__c, MajorDivisions__c, AmountTax__c, SalesDate__c 
                FROM OrderDetails__c 
                WHERE Broad_division__c = '予算' OR xMajorDivisions__c = '予算' OR MajorDivisions__c = '予算' OR Broad_Division_sushiki__c = '予算'
                LIMIT 5`;
    const result = await conn.query(soql);
    console.log("Budget records found:", result.records.length);
    for (const r of result.records) {
        console.log(`xMajor: ${r.xMajorDivisions__c}, Broad: ${r.Broad_division__c}, Old: ${r.MajorDivisions__c}, Amount: ${r.AmountTax__c}, Date: ${r.SalesDate__c}`);
    }

    // Also query grouped by Broad_division__c to see available values
    const soql2 = `SELECT Broad_division__c, COUNT(Id) cnt FROM OrderDetails__c GROUP BY Broad_division__c LIMIT 10`;
    const result2 = await conn.query(soql2);
    console.log("\nBroad_division__c values:");
    for (const r of result2.records) console.log(`${r.Broad_division__c}: ${r.cnt}`);

    const soql3 = `SELECT xMajorDivisions__c, COUNT(Id) cnt FROM OrderDetails__c GROUP BY xMajorDivisions__c LIMIT 10`;
    const result3 = await conn.query(soql3);
    console.log("\nxMajorDivisions__c values:");
    for (const r of result3.records) console.log(`${r.xMajorDivisions__c}: ${r.cnt}`);

}
checkBudget();
