"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DATACache, getFilteredData, Transaction } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
    BarChart3,
    Map,
    Store,
    Users,
    TrendingUp,
    Layers,
    Calendar,
    Filter,
    ChevronDown,
    Loader2,
    Database,
    DollarSign
} from 'lucide-react';

import SummaryTab from './tabs/SummaryTab';
import StoreTab from './tabs/StoreTab';
import StaffTab from './tabs/StaffTab';
import GenreTab from './tabs/GenreTab';
import Login from './Login';

// Tabs Definition
const TABS = [
    { id: 'summary', name: '全体サマリー & 年別比較', icon: TrendingUp },
    { id: 'store', name: '店舗別分析', icon: Store },
    { id: 'staff', name: '担当者分析', icon: Users },
    { id: 'genre', name: 'ジャンル別分析', icon: Layers },
];

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<Transaction[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<'mock' | 'salesforce'>('mock');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Auth check on mount
    useEffect(() => {
        const auth = localStorage.getItem('dashboard_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
        setCheckingAuth(false);
    }, []);

    const handleLogin = (pass: string) => {
        // In a real app, this would be an API call or check against process.env
        // For this demo/formal request, we use a fixed password or env variable
        const correctPassword = process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || 'salesforce2026';

        if (pass === correctPassword) {
            localStorage.setItem('dashboard_auth', 'true');
            setIsAuthenticated(true);
        }
    };

    // Load data on mount
    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch('/api/salesforce');
                const json = await res.json();

                if (json.success) {
                    if (json.data && json.data.length > 0) {
                        setDashboardData(json.data);
                        setDataSource(json.source);

                        // Default to latest year available
                        const years = Array.from(new Set(json.data.map((d: any) => d.year))).sort();
                        if (years.length > 0) {
                            setSelectedYears([years[years.length - 1] as number]);
                        }
                    } else {
                        console.log('Salesforce query successful but returned 0 records. Falling back to mock data.');
                        setErrorMsg('Salesforceの連携は成功しましたが、本番データが0件のためモックデータを表示しています');
                        setDashboardData(MOCK_DATACache);
                        setDataSource('mock');
                        setSelectedYears([2026]);
                    }
                } else {
                    setErrorMsg(json.message || 'データ取得エラー');
                    setDashboardData(MOCK_DATACache); // fallback
                    setSelectedYears([2026]);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setErrorMsg('APIに接続できませんでした。モックデータを表示します。');
                setDashboardData(MOCK_DATACache); // fallback
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    // Global Filters State
    const [selectedYears, setSelectedYears] = useState<number[]>([]);
    const [selectedStartMonth, setSelectedStartMonth] = useState<number | null>(null);
    const [selectedEndMonth, setSelectedEndMonth] = useState<number | null>(null);
    const [selectedArea, setSelectedArea] = useState<string>('全エリア');
    const [selectedStore, setSelectedStore] = useState<string>('全店舗');
    const [selectedGenre, setSelectedGenre] = useState<string>('全ジャンル');

    // Derive filter constraints dynamically from loaded data
    // Base data filtering (Exclude future dates)
    const baseDashboardData = useMemo(() => {
        const TODAY = new Date('2026-03-08');
        return dashboardData.filter(d => {
            // If it's a budget row (targetSales > 0), we might want to keep it or filter it. 
            // Usually targets are set for the whole month. 
            // But the user specifically said "除外してください".
            const itemDate = new Date(d.year, d.month - 1, d.day || 1);
            return itemDate <= TODAY;
        });
    }, [dashboardData]);

    const availableYears = Array.from(new Set(baseDashboardData.map(d => d.year))).sort((a, b) => a - b);
    const availableMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const availableAreas = ['全エリア', ...Array.from(new Set(baseDashboardData.map(d => d.area)))];
    const availableStores = ['全店舗', ...Array.from(new Set(baseDashboardData.filter(d => selectedArea === '全エリア' || d.area === selectedArea).map(d => d.store)))];
    const availableGenres = ['全ジャンル', ...Array.from(new Set(baseDashboardData.map(d => d.genre)))];

    // Filter Data
    const filteredData = useMemo(() => {
        return getFilteredData(baseDashboardData, {
            years: selectedYears,
            startMonth: selectedStartMonth,
            endMonth: selectedEndMonth,
            areas: selectedArea !== '全エリア' ? [selectedArea] : undefined,
            stores: selectedStore !== '全店舗' ? [selectedStore] : undefined,
            genres: selectedGenre !== '全ジャンル' ? [selectedGenre] : undefined,
        });
    }, [selectedYears, selectedStartMonth, selectedEndMonth, selectedArea, selectedStore, selectedGenre, baseDashboardData]);

    const toggleYear = (year: number) => {
        setSelectedYears(prev =>
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort()
        );
    };

    // Data for Trends & Summary (Filtered by geography/genre, but NOT year/month)
    const trendData = useMemo(() => {
        return getFilteredData(baseDashboardData, {
            areas: selectedArea !== '全エリア' ? [selectedArea] : undefined,
            stores: selectedStore !== '全店舗' ? [selectedStore] : undefined,
            genres: selectedGenre !== '全ジャンル' ? [selectedGenre] : undefined,
        });
    }, [selectedArea, selectedStore, selectedGenre, baseDashboardData]);

    // KPI Calculations
    const totalSales = filteredData.reduce((sum, d) => sum + d.sales, 0);
    const targetSales = filteredData.reduce((sum, d) => sum + d.targetSales, 0);
    const achievementRate = targetSales > 0 ? (totalSales / targetSales) * 100 : 0;

    // Calculate unique photoshoots instead of raw order detail rows
    const uniqueShoots = new Set(filteredData.filter(d => !d.isBudget).map(d => d.shootId || d.id));
    const transactionCount = uniqueShoots.size;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    同期中...
                </h2>
                <p className="text-sm text-slate-400 mt-2">Salesforceからデータを取得しています</p>
            </div>
        );
    }

    // Render
    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Notifications overlay */}
            {errorMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500 text-red-400 px-6 py-3 rounded-full text-sm font-medium backdrop-blur-md shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4">
                    <Database className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col backdrop-blur-xl">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-400" />
                        ROI Core
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Salesforce Analytics UI</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                                activeTab === tab.id
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Glow Effects */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                {/* Global Filters Header */}
                <header className="px-8 py-5 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md z-10 flex flex-wrap gap-6 items-center justify-between">
                    <div className="flex flex-wrap gap-6 items-center">
                        <div className="flex items-center gap-2 text-slate-400 mr-2">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium tracking-wide">GLOBAL FILTERS</span>
                        </div>

                        {/* Years Filter (Multi-select toggles) */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                            {availableYears.map(year => (
                                <button
                                    key={year}
                                    onClick={() => toggleYear(year)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                                        selectedYears.includes(year)
                                            ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>

                        {/* Start Month Select */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">START:</span>
                            <div className="relative group">
                                <select
                                    value={selectedStartMonth ?? ''}
                                    onChange={(e) => setSelectedStartMonth(e.target.value ? Number(e.target.value) : null)}
                                    className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:border-blue-500 transition-colors capitalize cursor-pointer font-medium"
                                >
                                    <option value="">開始 (Start)</option>
                                    {availableMonths.map(m => <option key={m} value={m}>{m}月</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors" />
                            </div>
                        </div>

                        {/* End Month Select */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">END:</span>
                            <div className="relative group">
                                <select
                                    value={selectedEndMonth ?? ''}
                                    onChange={(e) => setSelectedEndMonth(e.target.value ? Number(e.target.value) : null)}
                                    className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:border-blue-500 transition-colors capitalize cursor-pointer font-medium"
                                >
                                    <option value="">終了 (End)</option>
                                    {availableMonths.map(m => <option key={m} value={m}>{m}月</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors" />
                            </div>
                        </div>

                        {/* Area Select */}
                        <div className="relative group">
                            <select
                                value={selectedArea}
                                onChange={(e) => { setSelectedArea(e.target.value); setSelectedStore('全店舗'); }}
                                className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
                            >
                                {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Store Select */}
                        <div className="relative group">
                            <select
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                                className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
                            >
                                {availableStores.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Genre Select */}
                        <div className="relative group">
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2 pr-10 outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
                            >
                                {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className={cn(
                        "text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-medium ml-auto",
                        dataSource === 'salesforce' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full", dataSource === 'salesforce' ? "bg-emerald-500" : "bg-amber-500")} />
                        {dataSource === 'salesforce' ? 'Live Data (Salesforce)' : 'Mock Data'}
                    </div>

                </header>

                {/* Dashboard Content Area */}
                <div className="flex-1 overflow-y-auto p-8 z-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">

                    {/* Top KPI row - Always visible across tabs for context */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm group hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-slate-400 text-sm font-semibold tracking-wider">合計売上<br />(TOTAL SALES)</div>
                                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white tracking-tight">
                                ¥{totalSales.toLocaleString()}
                            </div>
                            <div className="mt-2 text-xs text-slate-500 font-medium">
                                フィルターされたデータ内の合計
                            </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm group hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-slate-400 text-sm font-semibold tracking-wider">平均単価<br />(AVG. UNIT PRICE)</div>
                                <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white">
                                ¥{transactionCount > 0 ? Math.round(totalSales / transactionCount).toLocaleString() : '0'}
                            </div>
                            <div className="mt-2 text-xs text-slate-500 font-medium">
                                撮影1件あたりの平均単価
                            </div>
                        </div>

                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm group hover:border-slate-700 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-slate-400 text-sm font-semibold tracking-wider">件数<br />(TRANSACTIONS)</div>
                                <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                    <Users className="w-5 h-5 text-indigo-400" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-white">
                                {transactionCount.toLocaleString()}
                            </div>
                            <div className="mt-2 text-xs text-slate-500 font-medium">
                                撮影件数 (単価: ¥{transactionCount > 0 ? Math.round(totalSales / transactionCount).toLocaleString() : 0})
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Tab Content */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm min-h-[400px]">
                        {activeTab === 'summary' && (
                            <SummaryTab
                                data={filteredData}
                                allData={trendData}
                                startMonth={selectedStartMonth}
                                endMonth={selectedEndMonth}
                                selectedArea={selectedArea}
                                selectedStore={selectedStore}
                                selectedGenre={selectedGenre}
                            />
                        )}
                        {activeTab === 'store' && (
                            <StoreTab data={filteredData} />
                        )}
                        {activeTab === 'staff' && (
                            <StaffTab data={filteredData} />
                        )}
                        {activeTab === 'genre' && (
                            <GenreTab data={filteredData} allData={trendData} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
