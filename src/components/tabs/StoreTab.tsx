"use client";

import React, { useMemo, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { Transaction } from '@/lib/data';
import { Store, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    data: Transaction[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function StoreTab({ data }: Props) {

    const [selectedDetailStore, setSelectedDetailStore] = useState<string | null>(null);
    const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

    // 店舗別の集計
    const storeStats = useMemo(() => {
        const map = new Map<string, { sales: number; target: number; area: string }>();
        data.forEach(d => {
            const current = map.get(d.store) || { sales: 0, target: 0, area: d.area };
            map.set(d.store, {
                sales: current.sales + d.sales,
                target: current.target + d.targetSales,
                area: current.area,
            });
        });

        return Array.from(map.entries())
            .map(([store, { sales, target, area }]) => ({
                store,
                sales,
                target,
                area,
                achievement: target > 0 ? (sales / target) * 100 : 0,
            }))
            .sort((a, b) => b.sales - a.sales);
    }, [data]);

    // ジャンル構成（全体または選択中のデータに対する割合）
    const genreData = useMemo(() => {
        const genreMap = new Map<string, number>();
        const targetData = selectedDetailStore ? data.filter(d => d.store === selectedDetailStore) : data;
        let absoluteGrandTotal = 0;

        targetData.forEach(d => {
            genreMap.set(d.genre, (genreMap.get(d.genre) || 0) + d.sales);
            absoluteGrandTotal += Math.abs(d.sales);
        });

        // 構成比が小さい（2%未満）またはマイナスのジャンルを「その他」に統合
        const barDataRow: any = { name: '構成比' };
        let otherTotal = 0;
        const mainGenres: { name: string, value: number }[] = [];

        genreMap.forEach((value, name) => {
            if (value < 0 || (absoluteGrandTotal > 0 && (value / absoluteGrandTotal) < 0.02)) {
                otherTotal += value;
            } else {
                mainGenres.push({ name, value });
            }
        });

        mainGenres.sort((a, b) => b.value - a.value);
        mainGenres.forEach(g => {
            barDataRow[g.name] = g.value;
        });

        if (otherTotal !== 0) {
            barDataRow["その他"] = otherTotal;
        }

        const genres = [...mainGenres.map(g => g.name)];
        if (otherTotal !== 0) genres.push("その他");

        return { barData: [barDataRow], genres };
    }, [data, selectedDetailStore]);

    // 特定ジャンル別の集計
    const categoryStats = useMemo(() => {
        const targetData = selectedDetailStore ? data.filter(d => d.store === selectedDetailStore) : data;

        const categories = [
            { id: '753', name: '七五三', genres: ['七五三', '七五三（トレアル）'] },
            { id: 'seijin', name: '成人女性', genres: ['成人式 女性'] },
            { id: 'photo', name: 'フォトプラン', genres: ['木下フォトプラン・フォトプラン', 'フォトプラン'] },
            { id: 'nyusotsu', name: '入卒', genres: ['入卒・入卒（トレアル）'] },
        ];

        return categories.map(cat => {
            const filtered = targetData.filter(d => {
                const genre = d.genre || "";
                const major = d.majorDivision || "";

                // 「入卒」の特別判定: 撮影大区分が「入卒」またはジャンル名に「入卒/入学/卒業」を含む
                if (cat.id === 'nyusotsu') {
                    return major === "入卒" || genre.includes("入卒") || genre.includes("入学") || genre.includes("卒業");
                }

                // 「成人女性」の特別判定
                if (cat.id === 'seijin') {
                    return genre.includes("成人") || genre.includes("成人女性") || major.includes("成人");
                }

                // 「フォトプラン」の特別判定
                if (cat.id === 'photo') {
                    return genre.includes("フォトプラン") || genre.includes("プラン");
                }

                // デフォルト判定
                return cat.genres.some(g => genre === g || genre.includes(g));
            });
            const sales = filtered.reduce((sum, d) => sum + d.sales, 0);
            const shootIds = new Set(filtered.filter(d => !d.isBudget).map(d => d.shootId || d.id));
            const count = shootIds.size;
            const unitPrice = count > 0 ? Math.round(sales / count) : 0;

            return { ...cat, count, sales, unitPrice };
        });
    }, [data, selectedDetailStore]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
                <Store className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-slate-100">店舗別分析</h2>
            </div>

            {/* 上部: 店舗別ランキング */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md overflow-hidden flex flex-col">
                <h3 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    店舗別ランキング
                </h3>

                <div className="overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 max-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="p-3 font-semibold text-slate-300 rounded-tl-lg">順位 / 店舗名</th>
                                <th className="p-3 font-semibold text-slate-300">エリア</th>
                                <th className="p-3 font-semibold text-slate-300 text-right">売上</th>
                                <th className="p-3 font-semibold text-slate-300 text-right">目標</th>
                                <th className="p-3 font-semibold text-slate-300 text-right rounded-tr-lg">達成率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {storeStats.map((stat, i) => (
                                <tr
                                    key={stat.store}
                                    onClick={() => setSelectedDetailStore(stat.store === selectedDetailStore ? null : stat.store)}
                                    className={cn(
                                        "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer",
                                        stat.store === selectedDetailStore ? "bg-indigo-500/20" : ""
                                    )}
                                >
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                i === 0 ? "bg-amber-500/20 text-amber-400" :
                                                    i === 1 ? "bg-slate-300/20 text-slate-300" :
                                                        i === 2 ? "bg-amber-700/20 text-amber-600" : "bg-slate-800 text-slate-500"
                                            )}>
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-200">{stat.store}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                                            {stat.area}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-semibold text-blue-400">
                                        ¥{(stat.sales).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right text-slate-400">
                                        ¥{(stat.target).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={cn(
                                                "font-bold",
                                                stat.achievement >= 100 ? "text-emerald-400" : "text-slate-300"
                                            )}>
                                                {stat.achievement.toFixed(1)}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", stat.achievement >= 100 ? "bg-emerald-500" : "bg-blue-500")}
                                                    style={{ width: `${Math.min(stat.achievement, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* 中部: 特定ジャンル別集計 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {categoryStats.map(cat => (
                    <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-slate-700 transition-all">
                        <div className="text-slate-400 text-xs font-bold tracking-wider mb-3">{cat.name}</div>
                        <div className="space-y-3">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-semibold">件数 (Count)</div>
                                <div className="text-xl font-bold text-slate-100">{cat.count.toLocaleString()}<span className="text-xs text-slate-500 ml-1 font-medium">件</span></div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">単価 (Price)</div>
                                    <div className="text-sm font-bold text-indigo-400">¥{cat.unitPrice.toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase font-semibold">売上 (Sales)</div>
                                    <div className="text-sm font-bold text-emerald-400">¥{cat.sales.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 下部: ジャンル別構成比 (積み上げ横棒) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold text-slate-400">
                        ジャンル構成比 {selectedDetailStore ? <span className="text-indigo-400">({selectedDetailStore})</span> : '(全店舗)'}
                    </h3>
                    <span className="text-[10px] text-slate-500">※ 上の表から店舗を選択して絞り込み</span>
                </div>

                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={genreData.barData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" hide />
                            <RechartsTooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const filteredPayload = hoveredGenre
                                            ? payload.filter(p => p.dataKey === hoveredGenre)
                                            : payload;

                                        if (filteredPayload.length === 0) return null;

                                        return (
                                            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
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
                            {genreData.genres.map((genre, index) => (
                                <Bar
                                    key={genre}
                                    dataKey={genre}
                                    stackId="a"
                                    fill={genre === "その他" ? "#64748b" : COLORS[index % COLORS.length]}
                                    radius={0}
                                    onMouseEnter={() => setHoveredGenre(genre)}
                                    onMouseLeave={() => setHoveredGenre(null)}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
