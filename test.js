const jsforce = require('jsforce');

async function test() {
    const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
    try {
        const userInfo = await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');
        console.log('Success! Org ID:', userInfo.organizationId);
    } catch (err) {
        console.error('Failed with combined:', err.message);
    }
}
test();
