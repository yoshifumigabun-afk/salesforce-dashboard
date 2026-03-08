export interface Transaction {
    id: string;
    shootId?: string; // Add field to track unique shoots
    year: number;
    month: number;
    day: number;
    area: string;
    store: string;
    genre: string;
    sales: number;
    targetSales: number;
    count: number;
    shootingStaff: string;
    selectStaff: string;
    majorDivision: string;
    isBudget: boolean;
}

const AREAS = ['関東', '関西', '中部', '九州'];
const STORES: Record<string, string[]> = {
    '関東': ['東京本店', '横浜店'],
    '関西': ['大阪梅田店'],
    '中部': ['名古屋栄店'],
    '九州': ['福岡天神店'],
};

const GENRES = ['ウェディング', 'マタニティ', '七五三', '成人式', 'ファミリー'];

const SHOOTING_STAFF: Record<string, string[]> = {
    '東京本店': ['佐藤(撮)', '鈴木(撮)', '高橋(撮)'],
    '横浜店': ['田中(撮)', '伊藤(撮)'],
    '大阪梅田店': ['渡辺(撮)', '山本(撮)', '中村(撮)'],
    '名古屋栄店': ['小林(撮)', '加藤(撮)'],
    '福岡天神店': ['吉田(撮)', '山田(撮)'],
};

const SELECT_STAFF: Record<string, string[]> = {
    '東京本店': ['佐々木(セ)', '山口(セ)'],
    '横浜店': ['松本(セ)', '井上(セ)'],
    '大阪梅田店': ['木村(セ)', '林(セ)', '清水(セ)'],
    '名古屋栄店': ['山崎(セ)', '阿部(セ)'],
    '福岡天神店': ['森(セ)', '池田(セ)'],
};

// Seeded random number generator for consistent mock data
const seedRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export const generateMockData = (): Transaction[] => {
    const data: Transaction[] = [];
    const startYear = 2022;
    const endYear = 2026;
    let idCounter = 1;

    for (let year = startYear; year <= endYear; year++) {
        // Generate trending factor (growing business)
        const yearFactor = 1 + (year - startYear) * 0.15;

        for (let month = 1; month <= 12; month++) {
            // Seasonal factor (higher in autumn for 753, etc.)
            const seasonalFactor = (month >= 9 && month <= 11) ? 1.3 : (month === 3 || month === 4 ? 1.2 : 0.9);

            for (const area of AREAS) {
                for (const store of STORES[area]) {
                    const storeFactor = store === '東京本店' ? 1.5 : (store === '大阪梅田店' ? 1.2 : 1.0);

                    for (const genre of GENRES) {
                        let genreFactor = 1.0;
                        if (genre === '七五三' && (month < 9 || month > 11)) genreFactor = 0.3; // Specific seasonality
                        if (genre === 'ウェディング' && (month === 4 || month === 5 || month === 10 || month === 11)) genreFactor = 1.4;

                        const baseCount = 10 * yearFactor * seasonalFactor * storeFactor * genreFactor;

                        // Generate some random fluctuation
                        const seed = year * 1000 + month * 100 + store.length * 10 + genre.length;
                        const fluctuation = 0.8 + seedRandom(seed) * 0.4; // 0.8 to 1.2

                        const actualCount = Math.max(1, Math.floor(baseCount * fluctuation));

                        // Base price per genre
                        let basePrice = 50000;
                        if (genre === 'ウェディング') basePrice = 150000;
                        if (genre === '成人式') basePrice = 100000;
                        if (genre === 'マタニティ') basePrice = 40000;
                        if (genre === 'ファミリー') basePrice = 35000;
                        if (genre === '七五三') basePrice = 60000;

                        const sales = actualCount * Math.floor(basePrice * (0.9 + seedRandom(seed + 1) * 0.2));
                        const targetSales = Math.floor(baseCount * basePrice * 1.05); // Target is slightly higher than baseline

                        const sStaffList = SHOOTING_STAFF[store];
                        const selStaffList = SELECT_STAFF[store];

                        // Distribute across staff
                        for (let i = 0; i < actualCount; i++) {
                            const shooter = sStaffList[Math.floor(seedRandom(seed + i) * sStaffList.length)];
                            const selector = selStaffList[Math.floor(seedRandom(seed + i + 100) * selStaffList.length)];

                            const singleSale = Math.floor(sales / actualCount);

                            data.push({
                                id: `TRX-${idCounter++}`,
                                year,
                                month,
                                day: Math.floor(seedRandom(seed + i + 200) * 28) + 1,
                                area,
                                store,
                                genre,
                                sales: singleSale,
                                targetSales: targetSales / actualCount, // target distributed equally for this calc
                                count: 1,
                                shootingStaff: shooter,
                                selectStaff: selector,
                                majorDivision: '',
                                isBudget: false,
                            });
                        }
                    }
                }
            }
        }
    }

    return data;
};

// Singleton data loaded once
export const MOCK_DATACache = generateMockData();

// Utility function to get filtered data
export const getFilteredData = (
    data: Transaction[],
    filters: {
        years?: number[];
        months?: number[];
        startMonth?: number | null;
        endMonth?: number | null;
        areas?: string[];
        stores?: string[];
        genres?: string[];
    }
) => {
    return data.filter(d => {
        if (filters.years && filters.years.length > 0 && !filters.years.includes(d.year)) return false;
        if (filters.months && filters.months.length > 0 && !filters.months.includes(d.month)) return false;
        if (filters.startMonth && d.month < filters.startMonth) return false;
        if (filters.endMonth && d.month > filters.endMonth) return false;
        if (filters.areas && filters.areas.length > 0 && !filters.areas.includes(d.area)) return false;
        if (filters.stores && filters.stores.length > 0 && !filters.stores.includes(d.store)) return false;
        if (filters.genres && filters.genres.length > 0 && !filters.genres.includes(d.genre)) return false;
        return true;
    });
};
