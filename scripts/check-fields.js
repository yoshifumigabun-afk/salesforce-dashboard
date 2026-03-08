const jsforce = require('jsforce');

async function check() {
    const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
    await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

    const descOrder = await conn.describe('OrderDetails__c');
    console.log("--- OrderDetails__c ---");
    for (const f of descOrder.fields) {
        if (f.label.includes('大区分') || f.label.includes('区分') || f.label.includes('予算') || f.label.includes('分類')) {
            console.log(`${f.label}: ${f.name} [${f.type}]`);
        }
    }

    const descShoot = await conn.describe('PhotographingInformation__c');
    console.log("--- PhotographingInformation__c ---");
    for (const f of descShoot.fields) {
        if (f.label.includes('大区分') || f.label.includes('区分') || f.label.includes('予算') || f.label.includes('分類')) {
            console.log(`${f.label}: ${f.name} [${f.type}]`);
        }
    }
}
check();
