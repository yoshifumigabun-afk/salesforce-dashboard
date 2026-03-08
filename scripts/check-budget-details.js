const jsforce = require('jsforce');

async function checkBudgetDetails() {
    const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
    await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

    const soql = `SELECT Id, MajorDivisions__c, AmountTax__c, BudgetAmountTax__c, BudgetAmount__c, SalesDate__c 
                FROM OrderDetails__c 
                WHERE MajorDivisions__c = '予算' OR Broad_division__c = '予算' OR Broad_Division_sushiki__c = '予算'
                LIMIT 5`;
    const result = await conn.query(soql);
    console.log("Budget records found:", result.records.length);
    for (const r of result.records) {
        console.log(`Date: ${r.SalesDate__c}, Amount: ${r.AmountTax__c}, BudgetTax: ${r.BudgetAmountTax__c}, Budget: ${r.BudgetAmount__c}`);
    }
}
checkBudgetDetails();
