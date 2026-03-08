const jsforce = require('jsforce');
async function run() {
  const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
  await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
  
  // Test a grouped SOQL query to bypass row limits by aggregating on Salesforce side
  const soql = `
    SELECT 
        CALENDAR_YEAR(SalesDate__c) year,
        CALENDAR_MONTH(SalesDate__c) month,
        Store__c,
        PhotographingInformation__r.ShootMajor2__c,
        PhotographingInformation__r.StoreArea__c,
        PhotographingInformation__r.Photographer__r.Name,
        PhotographingInformation__r.Selector__r.Name,
        MajorDivisions__c,
        Broad_division__c,
        SUM(AmountTax__c) sumAmount,
        SUM(BudgetAmountTax__c) sumBudget,
        COUNT(Id) recCount,
        COUNT_DISTINCT(PhotographingInformation__c) shootCount
    FROM OrderDetails__c
    WHERE SalesDate__c >= 2021-01-01
    GROUP BY 
        CALENDAR_YEAR(SalesDate__c),
        CALENDAR_MONTH(SalesDate__c),
        Store__c,
        PhotographingInformation__r.ShootMajor2__c,
        PhotographingInformation__r.StoreArea__c,
        PhotographingInformation__r.Photographer__r.Name,
        PhotographingInformation__r.Selector__r.Name,
        MajorDivisions__c,
        Broad_division__c
    LIMIT 2000
  `;
  const res = await conn.query(soql);
  console.log("Grouped records returned:", res.records.length);
  if(res.records.length > 0) console.log(res.records[0]);
}
run();
