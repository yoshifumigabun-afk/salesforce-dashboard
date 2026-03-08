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

    // ユーザー指定: 2026年2月以降のデータを全件取得する
    const soql = `
    SELECT Id, PhotographingInformation__c, AmountTax__c, SalesDate__c, Store__c,
           MajorDivisions__c, Broad_division__c, BudgetAmountTax__c,
           PhotographingInformation__r.ShootMajor2__c,
           PhotographingInformation__r.StoreArea__c,
           PhotographingInformation__r.Photographer__r.Name,
           PhotographingInformation__r.Selector__r.Name
    FROM OrderDetails__c
    WHERE SalesDate__c >= 2021-01-01
    ORDER BY SalesDate__c DESC
  `;

    console.log(`Executing Custom Object SOQL: ${soql}`);

    // JSForce's autoFetch to grab more than 2000 records if they exist since 2026-02
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
            .run({ autoFetch: true, maxFetch: 500000 }); // Increased limit to fetch older historical data
    });

    return records;
};
