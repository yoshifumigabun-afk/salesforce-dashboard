"use client";

import React, { useState, useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Transaction } from '@/lib/data';
import { Users, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    data: Transaction[];
}

export default function StaffTab({ data }: Props) {
    const [roleFilter, setRoleFilter] = useState<'all' | 'shooting' | 'select'>('all');

    const staffStats = useMemo(() => {
        // We track sales and unique shoot IDs per staff member.
        // Unit price = total actual sales / number of unique shoots handled.
        const map = new Map<string, { sales: number; shootIds: Set<string>; role: string; store: string }>();

        data.forEach(d => {
            // Skip budget records using the isBudget flag (not targetSales, which can be 0 for real records too)
            if (d.isBudget) return;
            // Skip records with no actual sales
            if (d.sales <= 0) return;

            const shootKey = d.shootId || d.id;

            // Shooting staff
            if ((roleFilter === 'all' || roleFilter === 'shooting') && d.shootingStaff && !d.shootingStaff.includes('不明')) {
                const sKey = `撮:${d.shootingStaff}`;
                const current = map.get(sKey) || { sales: 0, shootIds: new Set<string>(), role: '撮影', store: d.store };
                current.shootIds.add(shootKey);
                map.set(sKey, {
                    ...current,
                    sales: current.sales + d.sales,
                });
            }

            // Select staff
            if ((roleFilter === 'all' || roleFilter === 'select') && d.selectStaff && !d.selectStaff.includes('不明')) {
                const sKey = `セ:${d.selectStaff}`;
                const current = map.get(sKey) || { sales: 0, shootIds: new Set<string>(), role: 'セレクト', store: d.store };
                current.shootIds.add(shootKey);
                map.set(sKey, {
                    ...current,
                    sales: current.sales + d.sales,
                });
            }
        });

        return Array.from(map.entries()).map(([k, v]) => {
            const count = v.shootIds.size;
            return {
                id: k,
                name: k.substring(2),
                role: v.role,
                store: v.store,
                sales: v.sales,
                count: count,
                // Unit price = actual sales ÷ unique shoot count (per shoot basis)
                avgPrice: count > 0 ? Math.floor(v.sales / count) : 0,
            };
        }).sort((a, b) => b.sales - a.sales);
    }, [data, roleFilter]);


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-xl font-bold text-slate-100">担当者分析 (単価・件数)</h2>
                </div>

                {/* Role Filter Toggles */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setRoleFilter('all')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", roleFilter === 'all' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-slate-200")}
                    >
                        全員
                    </button>
                    <button
                        onClick={() => setRoleFilter('shooting')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", roleFilter === 'shooting' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-slate-200")}
                    >
                        撮影担当
                    </button>
                    <button
                        onClick={() => setRoleFilter('select')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", roleFilter === 'select' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-slate-200")}
                    >
                        セレクト担当
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scatter Plot */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-slate-400 mb-6">担当者 パフォーマンス分布 (X: 件数, Y: 平均単価)</h3>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    type="number"
                                    dataKey="count"
                                    name="件数"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="avgPrice"
                                    name="平均単価"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(val) => `¥${(val / 10000).toLocaleString()}万`}
                                />
                                <ZAxis type="number" dataKey="sales" range={[60, 400]} name="売上規模" />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                                    <p className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-1">
                                                        <UserCircle className={cn("w-4 h-4", data.role === '撮影' ? 'text-blue-400' : 'text-pink-400')} />
                                                        {data.name} ({data.role})
                                                    </p>
                                                    <p className="text-xs text-slate-400 mb-2">{data.store}</p>
                                                    <div className="space-y-1 border-t border-slate-800 pt-2">
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Performance</p>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-xs text-slate-400">平均単価:</span>
                                                            <span className="text-xs font-bold text-emerald-400">¥{data.avgPrice.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-xs text-slate-400">受注件数:</span>
                                                            <span className="text-xs font-bold text-slate-200">{data.count}件</span>
                                                        </div>
                                                        <div className="flex justify-between gap-8 border-t border-slate-800 pt-1 mt-1">
                                                            <span className="text-xs text-slate-400">累計評価売上:</span>
                                                            <span className="text-xs font-bold text-blue-400">¥{Math.floor(data.sales).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="担当者" data={staffStats} fill="#10b981">
                                    {staffStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.role === '撮影' ? '#3b82f6' : '#ec4899'} fillOpacity={0.7} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs font-medium justify-center">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-3 h-3 rounded-full bg-blue-500 opacity-70 block" /> 撮影担当
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-3 h-3 rounded-full bg-pink-500 opacity-70 block" /> セレクト担当
                        </div>
                        <div className="text-slate-500 ml-4">※ バブルサイズは売上規模</div>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-400 mb-4">担当者 ランキング</h3>
                    <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-800/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-300 rounded-tl-lg">担当者</th>
                                    <th className="p-3 font-semibold text-slate-300 text-right">件数</th>
                                    <th className="p-3 font-semibold text-slate-300 text-right">平均単価</th>
                                    <th className="p-3 font-semibold text-slate-300 text-right rounded-tr-lg">評価売上</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffStats.slice(0, 30).map((stat) => (
                                    <tr key={stat.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <UserCircle className={cn("w-5 h-5", stat.role === '撮影' ? 'text-blue-400' : 'text-pink-400')} />
                                                <div>
                                                    <div className="font-medium text-slate-200">{stat.name}</div>
                                                    <div className="text-[10px] text-slate-500">{stat.store}・{stat.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-slate-300">{stat.count}件</td>
                                        <td className="p-3 text-right font-medium text-emerald-400">
                                            ¥{stat.avgPrice.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right font-semibold text-slate-200">
                                            ¥{stat.sales.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
