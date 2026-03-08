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
} from 'recharts';
import { Transaction, getFilteredData } from '@/lib/data';
import { LayersIcon, TrendingUp, TrendingDown, Minus, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    data: Transaction[];        // filtered data (years, months, area, store)
    allData: Transaction[];     // all data filtered only by area/store, used for year-by-year comparisons
    selectedMonths: number[] | null;  // from global filter – applied to drilldown year comparison
}

// ─── Category definitions (same as StoreTab) ─────────────────────────────────
const CATEGORIES = [
    {
        id: '753',
        name: '七五三',
        color: '#f59e0b',
        match: (d: Transaction) => {
            const g = d.genre || ''; const m = d.majorDivision || '';
            return g.includes('七五三') || m === '七五三';
        },
    },
    {
        id: 'seijin',
        name: '成人女性',
        color: '#ec4899',
        match: (d: Transaction) => {
            const g = d.genre || ''; const m = d.majorDivision || '';
            return g.includes('成人') || m.includes('成人');
        },
    },
    {
        id: 'photo',
        name: 'フォトプラン',
        color: '#3b82f6',
        match: (d: Transaction) => {
            const g = d.genre || '';
            return g.includes('フォトプラン') || g.includes('プラン');
        },
    },
    {
        id: 'nyusotsu',
        name: '入卒',
        color: '#10b981',
        match: (d: Transaction) => {
            const g = d.genre || ''; const m = d.majorDivision || '';
            return m === '入卒' || g.includes('入卒') || g.includes('入学') || g.includes('卒業');
        },
    },
];

const GENRE_PALETTE = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#f97316', '#84cc16', '#e11d48', '#7c3aed',
];

// ─── helpers ──────────────────────────────────────────────────────────────────
interface YearStats { sales: number; count: number; unitPrice: number }

function buildCategoryYearStats(allData: Transaction[], matchFn: (d: Transaction) => boolean) {
    const yearMap = new Map<number, { sales: number; shootIds: Set<string> }>();
    allData.forEach(d => {
        if (d.isBudget) return;
        if (!matchFn(d)) return;
        const prev = yearMap.get(d.year) || { sales: 0, shootIds: new Set<string>() };
        prev.sales += d.sales;
        prev.shootIds.add(d.shootId || d.id);
        yearMap.set(d.year, prev);
    });
    const result = new Map<number, YearStats>();
    yearMap.forEach((v, year) => {
        const count = v.shootIds.size;
        result.set(year, { sales: v.sales, count, unitPrice: count > 0 ? Math.round(v.sales / count) : 0 });
    });
    return result;
}

function pct(curr: number, prev: number) {
    if (prev === 0) return null;
    return ((curr - prev) / Math.abs(prev)) * 100;
}

function DeltaBadge({ value }: { value: number | null }) {
    if (value === null) return <span className="text-slate-500 text-xs">-</span>;
    const positive = value >= 0;
    return (
        <span className={cn('text-xs font-semibold flex items-center gap-0.5', positive ? 'text-emerald-400' : 'text-rose-400')}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
}

// ─── Category drilldown modal ─────────────────────────────────────────────────
function CategoryDrilldown({ cat, allData, availableYears, selectedMonths, onClose }: {
    cat: typeof CATEGORIES[0];
    allData: Transaction[];
    availableYears: number[];
    selectedMonths: number[] | null;
    onClose: () => void;
}) {
    // Apply the same month-range filter as the global filter so yearly comparison is period-aware
    const periodData = useMemo(() => {
        if (!selectedMonths) return allData;
        return allData.filter(d => selectedMonths.includes(d.month));
    }, [allData, selectedMonths]);

    const yearStats = useMemo(() => buildCategoryYearStats(periodData, cat.match), [periodData, cat]);

    const chartData = availableYears.map(year => {
        const s = yearStats.get(year);
        return {
            year: `${year}年`,
            売上: s?.sales || 0,
            件数: s?.count || 0,
            単価: s?.unitPrice || 0,
        };
    });

    // Trend report
    const report = useMemo(() => {
        const sorted = availableYears.slice().sort();
        if (sorted.length < 2) return [];
        const lines: string[] = [];
        for (let i = 1; i < sorted.length; i++) {
            const y = sorted[i]; const py = sorted[i - 1];
            const cur = yearStats.get(y); const prv = yearStats.get(py);
            if (!cur || !prv) continue;
            const sp = pct(cur.sales, prv.sales);
            const cp = pct(cur.count, prv.count);
            const up = pct(cur.unitPrice, prv.unitPrice);
            const arrow = (v: number | null) => v === null ? '' : v >= 0 ? '↑' : '↓';
            lines.push(`${py}年→${y}年: 売上 ${arrow(sp)}${sp !== null ? Math.abs(sp).toFixed(1) + '%' : '-'} / 件数 ${arrow(cp)}${cp !== null ? Math.abs(cp).toFixed(1) + '%' : '-'} / 単価 ${arrow(up)}${up !== null ? Math.abs(up).toFixed(1) + '%' : '-'}`);
        }
        return lines;
    }, [yearStats, availableYears]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    {cat.name} — 年別推移
                </h3>

                {/* Year comparison cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {availableYears.map((y, i) => {
                        const cur = yearStats.get(y);
                        const prv = i > 0 ? yearStats.get(availableYears[i - 1]) : undefined;
                        return (
                            <div key={y} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                <div className="text-xs font-bold text-slate-400 mb-3">{y}年</div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">売上</div>
                                        <div className="text-sm font-bold text-white">¥{(cur?.sales || 0).toLocaleString()}</div>
                                        <DeltaBadge value={prv ? pct(cur?.sales || 0, prv.sales) : null} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">件数</div>
                                        <div className="text-sm font-bold text-white">{(cur?.count || 0).toLocaleString()}件</div>
                                        <DeltaBadge value={prv ? pct(cur?.count || 0, prv.count) : null} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase">単価</div>
                                        <div className="text-sm font-bold text-white">¥{(cur?.unitPrice || 0).toLocaleString()}</div>
                                        <DeltaBadge value={prv ? pct(cur?.unitPrice || 0, prv.unitPrice) : null} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bar chart */}
                <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis yAxisId="sales" orientation="left" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                            <YAxis yAxisId="unit" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                formatter={(v: any, name: any) => [`¥${(v as number).toLocaleString()}`, String(name)]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Bar yAxisId="sales" dataKey="売上" fill={cat.color} fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Trend report text */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">前年比レポート</div>
                    {report.length === 0
                        ? <p className="text-xs text-slate-500">比較できる年がありません</p>
                        : report.map((line, i) => <p key={i} className="text-xs text-slate-300 py-1 border-b border-slate-700/50 last:border-0">{line}</p>)
                    }
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GenreTab({ data, allData, selectedMonths }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);

    const availableYears = useMemo(() => {
        const years = new Set<number>();
        allData.forEach(d => { if (!d.isBudget) years.add(d.year); });
        return Array.from(years).sort();
    }, [allData]);

    // ── Year-by-genre stacked bar ───────────────────────────────────────────
    const { yearlyGenreData, allGenresInChart, genreColors } = useMemo(() => {
        const yearGroups = new Map<number, Map<string, number>>();
        const totalByGenre = new Map<string, number>();
        let grandTotal = 0;

        data.forEach(d => {
            const yr = yearGroups.get(d.year) || new Map<string, number>();
            yr.set(d.genre, (yr.get(d.genre) || 0) + d.sales);
            yearGroups.set(d.year, yr);
            totalByGenre.set(d.genre, (totalByGenre.get(d.genre) || 0) + d.sales);
            grandTotal += Math.abs(d.sales);
        });

        const minorGenres = new Set<string>();
        totalByGenre.forEach((total, genre) => {
            if (total < 0 || (grandTotal > 0 && (total / grandTotal) < 0.02)) minorGenres.add(genre);
        });

        const chartData = Array.from(yearGroups.entries()).map(([year, genres]) => {
            const row: any = { year, yearLabel: `${year}年` };
            let otherTotal = 0;
            genres.forEach((val, genre) => {
                if (minorGenres.has(genre)) { otherTotal += val; }
                else { row[genre] = val; }
            });
            if (otherTotal !== 0) row['その他'] = otherTotal;
            return row;
        }).sort((a, b) => a.year - b.year);

        const mainGenresSorted = Array.from(totalByGenre.entries())
            .filter(([g]) => !minorGenres.has(g)).sort((a, b) => b[1] - a[1]).map(([g]) => g);
        const allGenresInChart = [...mainGenresSorted];
        if ([...totalByGenre.values()].some((v, i) => [...totalByGenre.keys()][i] in minorGenres)) allGenresInChart.push('その他');
        const genreColors: Record<string, string> = {};
        allGenresInChart.forEach((g, i) => {
            genreColors[g] = g === 'その他' ? '#64748b' : GENRE_PALETTE[i % GENRE_PALETTE.length];
        });
        return { yearlyGenreData: chartData, allGenresInChart, genreColors };
    }, [data]);

    // ── Trend report for ALL genres (not filtered by min-share) ────────────
    const genreTrendReport = useMemo(() => {
        if (yearlyGenreData.length < 2) return [];

        // Build a fresh per-year, per-genre totals from `data` directly
        // so we capture every genre, including minor ones.
        const yearSet = new Set<number>();
        const genreSet = new Set<string>();
        const genreYearSales = new Map<string, Map<number, number>>();

        data.forEach(d => {
            if (d.isBudget) return;
            yearSet.add(d.year);
            genreSet.add(d.genre);
            if (!genreYearSales.has(d.genre)) genreYearSales.set(d.genre, new Map());
            const ym = genreYearSales.get(d.genre)!;
            ym.set(d.year, (ym.get(d.year) || 0) + d.sales);
        });

        const sortedYears = Array.from(yearSet).sort();
        const report: { genre: string; direction: 'up' | 'down' | 'flat'; pct: number; firstSales: number; lastSales: number }[] = [];

        genreSet.forEach(genre => {
            const ym = genreYearSales.get(genre)!;
            const firstSales = ym.get(sortedYears[0]) || 0;
            const lastSales = ym.get(sortedYears[sortedYears.length - 1]) || 0;
            const p = pct(lastSales, firstSales);
            if (p !== null) {
                report.push({
                    genre,
                    direction: p > 2 ? 'up' : p < -2 ? 'down' : 'flat',
                    pct: p,
                    firstSales,
                    lastSales,
                });
            }
        });

        return report.sort((a, b) => b.pct - a.pct);
    }, [data, yearlyGenreData]);

    // ── Per-category stats (for current filter) ────────────────────────────
    const categoryStats = useMemo(() => {
        return CATEGORIES.map(cat => {
            const filtered = data.filter(d => !d.isBudget && cat.match(d));
            const sales = filtered.reduce((s, d) => s + d.sales, 0);
            const shootIds = new Set(filtered.map(d => d.shootId || d.id));
            const count = shootIds.size;
            return { ...cat, sales, count, unitPrice: count > 0 ? Math.round(sales / count) : 0 };
        });
    }, [data]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
                <LayersIcon className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-slate-100">ジャンル別分析</h2>
            </div>

            {/* ── Year-by-genre stacked bar ─────────────────────────────── */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-semibold text-slate-400 mb-6">年別ジャンル構成推移</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yearlyGenreData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v / 100000000).toFixed(1)}億`} />
                            <YAxis type="category" dataKey="yearLabel" tick={{ fill: '#94a3b8', fontSize: 12 }} width={52} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                formatter={(v: any, name: any) => [`¥${(v as number).toLocaleString()}`, String(name)]}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', flexWrap: 'wrap' }} verticalAlign="bottom" align="center" />
                            {allGenresInChart.map(genre => (
                                <Bar key={genre} dataKey={genre} stackId="a" fill={genreColors[genre]} radius={genre === allGenresInChart[allGenresInChart.length - 1] ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Trend report ─────────────────────────────────────────── */}
            {genreTrendReport.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                        ジャンル増減レポート（全ジャンル）
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {genreTrendReport.map(({ genre, direction, pct: p, firstSales, lastSales }) => (
                            <div key={genre} className={cn(
                                'flex flex-col px-4 py-3 rounded-xl border text-sm',
                                direction === 'up' ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : direction === 'down' ? 'bg-rose-500/5 border-rose-500/20'
                                        : 'bg-slate-800/40 border-slate-700/50'
                            )}>
                                <div className="flex items-center justify-between">
                                    <span className={cn('font-medium truncate mr-2 text-sm',
                                        direction === 'up' ? 'text-emerald-300' : direction === 'down' ? 'text-rose-300' : 'text-slate-400'
                                    )}>{genre}</span>
                                    <span className={cn('flex items-center gap-1 text-xs font-bold shrink-0',
                                        direction === 'up' ? 'text-emerald-400' : direction === 'down' ? 'text-rose-400' : 'text-slate-500'
                                    )}>
                                        {direction === 'up' ? <TrendingUp className="w-3 h-3" /> : direction === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                        {Math.abs(p).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex gap-3 mt-1.5 text-[11px] text-slate-500">
                                    <span>比較元: ¥{(firstSales / 10000).toFixed(0)}万</span>
                                    <span>→</span>
                                    <span className={direction === 'up' ? 'text-emerald-500' : direction === 'down' ? 'text-rose-500' : ''}>最新: ¥{(lastSales / 10000).toFixed(0)}万</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Category cards ───────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-4">主要カテゴリ別集計（クリックで年別比較）</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {categoryStats.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className="text-left bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-md hover:border-opacity-60 transition-all group active:scale-[0.98]"
                            style={{ '--tw-border-opacity': '0.8', borderColor: `${cat.color}33` } as React.CSSProperties}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                                    {cat.name}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-[10px] uppercase text-slate-500 font-semibold">売上</div>
                                    <div className="text-lg font-bold text-white">¥{cat.sales.toLocaleString()}</div>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-500 font-semibold">件数</div>
                                        <div className="text-sm font-semibold text-slate-200">{cat.count.toLocaleString()}件</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase text-slate-500 font-semibold">単価</div>
                                        <div className="text-sm font-semibold text-slate-200">¥{cat.unitPrice.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Drilldown modal ─────────────────────────────────────── */}
            {selectedCategory && (
                <CategoryDrilldown
                    cat={selectedCategory}
                    allData={allData}
                    availableYears={availableYears}
                    selectedMonths={selectedMonths}
                    onClose={() => setSelectedCategory(null)}
                />
            )}
        </div>
    );
}
