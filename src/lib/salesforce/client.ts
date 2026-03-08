import * as jsforce from 'jsforce';

export interface SFOrderDetail {
    Id: string;
    PhotographingInformation__c?: string;
    AmountTax__c: number;
    SalesDate__c: string;
    Store__c?: string;
    MajorDivisions__c?: string;
    Broad_division__c?: string;
    BudgetAmountTax__c?: number;
    PhotographingInformation__r?: {
        ShootMajor2__c?: string;
        StoreArea__c?: string;
        Photographer__r?: { Name: string };
        Selector__r?: { Name: string };
    };
}

let conn: jsforce.Connection | null = null;

export const getSalesforceConnection = async () => {
    if (conn) {
        return conn;
    }

    const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    const token = process.env.SF_TOKEN || '';

    if (!username || !password) {
        throw new Error('Salesforce credentials are not set in environment variables.');
    }

    conn = new jsforce.Connection({ loginUrl });

    try {
        await conn.login(username, password + token);
        console.log('Successfully connected to Salesforce.');
        return conn;
    } catch (err) {
        console.error('Failed to connect to Salesforce:', err);
        conn = null;
        throw err;
    }
};

/**
 * Fetches dashboard transaction data from Salesforce.
 * This function handles the SOQL query, pagination (if needed), and mapping to the UI's Transaction format.
 */
export const fetchDashboardDataFromSalesforce = async () => {
    const connection = await getSalesforceConnection();

    // Dynamically compute start date: 5 years ago from today
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const startDateStr = fiveYearsAgo.toISOString().split('T')[0]; // e.g. "2021-03-08"

    const soql = `
    SELECT Id, PhotographingInformation__c, AmountTax__c, SalesDate__c, Store__c,
           MajorDivisions__c, Broad_division__c, BudgetAmountTax__c,
           PhotographingInformation__r.ShootMajor2__c,
           PhotographingInformation__r.StoreArea__c,
           PhotographingInformation__r.Photographer__r.Name,
           PhotographingInformation__r.Selector__r.Name
    FROM OrderDetails__c
    WHERE SalesDate__c >= ${startDateStr}
    ORDER BY SalesDate__c DESC
  `;

    console.log(`Executing SOQL (from ${startDateStr}): ${soql}`);

    const records: SFOrderDetail[] = [];
    await new Promise<void>((resolve, reject) => {
        connection.query<SFOrderDetail>(soql)
            .on("record", (record) => {
                records.push(record);
            })
            .on("end", () => {
                resolve();
            })
            .on("error", (err) => {
                reject(err);
            })
            .run({ autoFetch: true, maxFetch: 200000 }); // 5-year range, reduced from 500k
    });

    return records;
};
