import { NextResponse } from 'next/server';
import { fetchDashboardDataFromSalesforce } from '@/lib/salesforce/client';
import { Transaction } from '@/lib/data';

// Force this route to be dynamic (server-rendered at request time).
// This prevents Next.js from trying to pre-render it during build,
// which would fail because it requires a live Salesforce connection.
export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        const isMock = process.env.USE_MOCK_DATA === 'true';

        // 1. もしモックフラグがOnならローカルデータを返す（検証用）
        if (isMock) {
            const { MOCK_DATACache } = await import('@/lib/data');
            return NextResponse.json({
                success: true,
                source: 'mock',
                data: MOCK_DATACache,
            });
        }

        // 2. Salesforceから本番データを取得
        const records = await fetchDashboardDataFromSalesforce();

        // 3. SalesforceのSOQLレスポンスをDashboard UI用の`Transaction`型にマッピング
        const mappedData: Transaction[] = records.map((record: any, index: number) => {
            // 売上日 (SalesDate__c) を基準に年と月を抽出
            // 例: "2023-03-15"
            let year = 2026;
            let month = 3;
            let day = 1;
            if (record.SalesDate__c) {
                const dateParts = record.SalesDate__c.split('-');
                if (dateParts.length >= 3) {
                    year = parseInt(dateParts[0], 10);
                    month = parseInt(dateParts[1], 10);
                    day = parseInt(dateParts[2], 10);
                } else if (dateParts.length >= 2) {
                    year = parseInt(dateParts[0], 10);
                    month = parseInt(dateParts[1], 10);
                }
            }

            // 撮影情報へのリレーション
            const shootInfo = record.PhotographingInformation__r || {};

            // 予算（売上目標）判定
            const isBudget = record.MajorDivisions__c === '予算' || record.Broad_division__c === '予算';
            const actualSales = isBudget ? 0 : (record.AmountTax__c || 0);
            const budgetSales = isBudget ? (record.BudgetAmountTax__c || 0) : 0;

            return {
                id: record.Id,
                shootId: record.PhotographingInformation__c, // Unique shoot ID for transaction counts
                year: year,
                month: month,
                day: day,

                area: shootInfo.StoreArea__c || '未設定エリア',
                store: record.Store__c || '未設定店舗',
                genre: shootInfo.ShootMajor2__c || '未設定ジャンル',

                sales: actualSales,
                targetSales: budgetSales,

                count: 1,

                shootingStaff: shootInfo.Photographer__r?.Name || '担当不明(撮)',
                selectStaff: shootInfo.Selector__r?.Name || '担当不明(セ)',
                majorDivision: record.MajorDivisions__c || '',
                isBudget: isBudget,
            };
        });

        return NextResponse.json({
            success: true,
            source: 'salesforce',
            data: mappedData,
        });

    } catch (error: any) {
        console.error('Error fetching dashboard data API:', error);

        // Return graceful error response alongside the standard 500 status block
        return NextResponse.json(
            {
                success: false,
                source: 'error',
                message: 'Salesforce API通信でエラーが発生しました。接続設定を確認してください。',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
