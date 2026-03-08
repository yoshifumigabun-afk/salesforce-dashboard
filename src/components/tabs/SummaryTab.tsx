"use client";

import React, { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { Transaction, getFilteredData } from '@/lib/data';
import { TrendingUp, CalendarDays } from 'lucide-react';

interface Props {
    data: Transaction[]; // Fully filtered data (for the pie/genre chart)
    allData: Transaction[]; // Trend data (filtered by geometry/genre, but NOT year)
    startMonth: number | null;
    endMonth: number | null;
    selectedArea: string;
    selectedStore: string;
    selectedGenre: string;
}

export default function SummaryTab({
    data,
    allData,
    startMonth,
    endMonth,
    selectedArea,
    selectedStore,
    selectedGenre,
}: Props) {
    const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

    // 過去5年の「同月」または「通期」比較用データ (Using allData passed from Dashboard)
    const comparisonDataRaw = useMemo(() => {
        return getFilteredData(allData, {
            startMonth,
            endMonth,
        });
    }, [startMonth, endMonth, allData]);

    // 年別・ジャンル別の集計 (スタックバー用)
    const { yearlyGenreData, allGenresInComparison, genreColors } = useMemo(() => {
        // Note: The original `yearlyGenreData` used `comparisonDataRaw`.
        // The new logic here uses `data` (fully filtered) and re-filters it.
        // This might be an intentional change to the data source for this specific chart.
        const comparisonData = getFilteredData(data, { areas: [], stores: [], genres: [] });
        const yearGroups = new Map<number, Map<string, number>>();
        const totalByGenre = new Map<string, number>();
        let absoluteGrandTotal = 0;

        comparisonData.forEach(d => {
            const yearData = yearGroups.get(d.year) || new Map<string, number>();
            yearData.set(d.genre, (yearData.get(d.genre) || 0) + d.sales);
            yearGroups.set(d.year, yearData);

            totalByGenre.set(d.genre, (totalByGenre.get(d.genre) || 0) + d.sales);
            absoluteGrandTotal += Math.abs(d.sales);
        });

        // 構成比が小さい（2%未満）またはマイナスのジャンルを「その他」に統合
        const minorGenres = new Set<string>();
        totalByGenre.forEach((total, genre) => {
            if (total < 0 || (absoluteGrandTotal > 0 && (total / absoluteGrandTotal) < 0.02)) {
                minorGenres.add(genre);
            }
        });

        const chartData = Array.from(yearGroups.entries()).map(([year, genres]) => {
            const row: any = { year, yearLabel: `${year}年` };
            let otherTotal = 0;
            genres.forEach((val, genre) => {
                if (minorGenres.has(genre)) {
                    otherTotal += val;
                } else {
                    row[genre] = val;
                }
            });
            if (otherTotal !== 0) row["その他"] = (row["その他"] || 0) + otherTotal;
            return row;
        }).sort((a, b) => b.year - a.year);

        const allGenres = new Set<string>();
        chartData.forEach(row => {
            Object.keys(row).forEach(key => {
                if (key !== 'year' && key !== 'yearLabel') allGenres.add(key);
            });
        });

        const sortedGenres = Array.from(allGenres).sort((a, b) => {
            if (a === "その他") return 1; // "その他"を最後に
            if (b === "その他") return -1;
            // その他以外のジャンルは売上合計で降順ソート
            return (totalByGenre.get(b) || 0) - (totalByGenre.get(a) || 0);
        });

        const colors: Record<string, string> = {};
        const baseColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];
        sortedGenres.forEach((genre, i) => {
            colors[genre] = genre === "その他" ? "#64748b" : baseColors[i % baseColors.length];
        });

        return {
            yearlyGenreData: chartData,
            allGenresInComparison: sortedGenres,
            genreColors: colors
        };
    }, [data]);

    // ジャンル別売上 (現在のフィルターに基づく)
    const genreData = useMemo(() => {
        const map = new Map<string, number>();
        data.forEach(d => {
            map.set(d.genre, (map.get(d.genre) || 0) + d.sales);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, 売上: value }))
            .sort((a, b) => b.売上 - a.売上);
    }, [data]);

    // 日別累積売上データの計算 (年別比較)
    const { cumulativeChartData, yearsForLine } = useMemo(() => {
        const availableYears = Array.from(new Set(comparisonDataRaw.map(d => d.year))).sort();
        const days = Array.from({ length: 31 }, (_, i) => i + 1);

        const chartData = days.map(day => {
            const row: any = { day: `${day}日`, dayNum: day };
            return row;
        });

        availableYears.forEach(year => {
            let runningTotal = 0;
            const yearData = comparisonDataRaw.filter(d => d.year === year && !d.targetSales);

            days.forEach((day, index) => {
                const daySales = yearData
                    .filter(d => Number(d.day) === day)
                    .reduce((sum, d) => sum + (d.sales || 0), 0);
                runningTotal += daySales;
                chartData[index][year.toString()] = runningTotal;
            });
        });

        return { cumulativeChartData: chartData, yearsForLine: availableYears };
    }, [comparisonDataRaw]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-slate-100">全体サマリー & 年別比較</h2>
            </div>

            <div className="space-y-6">
                {/* 5年比較グラフ (横型) */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-slate-400 mb-6 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        年別売上構成推移 ({startMonth && endMonth ? `${startMonth}月〜${endMonth}月` : (startMonth ? `${startMonth}月〜` : (endMonth ? `〜${endMonth}月` : '通期'))})
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyGenreData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis
                                    type="number"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `¥${((val as number) / 10000).toLocaleString()}万`}
                                />
                                <YAxis type="category" dataKey="yearLabel" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={60} />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const filteredPayload = hoveredGenre
                                                ? payload.filter(p => p.dataKey === hoveredGenre)
                                                : payload;

                                            if (filteredPayload.length === 0) return null;

                                            return (
                                                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
                                                    <p className="text-slate-400 text-xs font-bold mb-2">{label}</p>
                                                    {filteredPayload.map((entry: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-slate-200 text-sm font-medium">{entry.name}:</span>
                                                            <span className="text-blue-400 text-sm font-bold">
                                                                ¥{Number(entry.value).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                />
                                {allGenresInComparison.map(genre => (
                                    <Bar
                                        key={genre}
                                        dataKey={genre}
                                        stackId="a"
                                        fill={genreColors[genre]}
                                        barSize={32}
                                        onMouseEnter={() => setHoveredGenre(genre)}
                                        onMouseLeave={() => setHoveredGenre(null)}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 日別累積売上グラフ (折れ線) */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-slate-400 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        日別累積売上推移 (年別比較)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cumulativeChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={2}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `¥${((val as number) / 10000).toLocaleString()}万`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                    formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '累積売上']}
                                />
                                <Legend verticalAlign="top" height={36} />
                                {yearsForLine.map((year, index) => (
                                    <Line
                                        key={year}
                                        type="monotone"
                                        dataKey={year.toString()}
                                        name={`${year}年`}
                                        stroke={['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
