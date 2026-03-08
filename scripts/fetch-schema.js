const jsforce = require('jsforce');

async function checkSchema() {
    const conn = new jsforce.Connection({ loginUrl: 'https://login.salesforce.com' });
    try {
        await conn.login('4423gabun@gmail.com', 'Trot184han2813xX65y3B1OywQwgxopL3gbD0');

        // Fetch all custom objects
        const globalDesc = await conn.describeGlobal();
        const customObjects = globalDesc.sobjects.filter(obj => obj.custom);

        console.log("--- Custom Objects Found ---");
        for (const obj of customObjects) {
            console.log(`- ${obj.label} (${obj.name})`);
        }

        // Try to describe specific objects if we find obvious matches
        const orderDetailRegex = /detail|明細|受注|order|sale/i;
        const shootInfoRegex = /shoot|photo|撮影|情報/i;

        const targetObjects = customObjects.filter(obj =>
            orderDetailRegex.test(obj.name) || orderDetailRegex.test(obj.label) ||
            shootInfoRegex.test(obj.name) || shootInfoRegex.test(obj.label)
        );

        for (const target of targetObjects) {
            console.log(`\n\n--- Describing ${target.label} (${target.name}) ---`);
            const desc = await conn.describe(target.name);
            console.log("Fields:");
            for (const field of desc.fields) {
                // print label, api name, type, and relationships
                console.log(`  - ${field.label} (${field.name}) [${field.type}]`);
                if (field.referenceTo && field.referenceTo.length > 0) {
                    console.log(`    -> References: ${field.referenceTo.join(', ')}`);
                }
            }
        }

    } catch (err) {
        console.error('Failed:', err.message);
    }
}
checkSchema();
