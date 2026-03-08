"use client";

import React, { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Transaction } from '@/lib/data';
import { BarChart3 } from 'lucide-react';

interface Props {
    data: Transaction[]; // Fully filtered
    allData: Transaction[]; // Filtered by geography/genre, but NOT year
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function TrendsTab({ data, allData }: Props) {
    const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

    // Create trend by Year
    // Y-Axis = Year
    // Bars = Stacked by Genre
    const { trendData, years, genres } = useMemo(() => {
        const yearMap = new Map<number, Record<string, any>>();
        const genreSet = new Set<string>();

        allData.forEach(d => {
            if (d.targetSales > 0 && d.sales === 0) return; // omit budget rows
            genreSet.add(d.genre);

            if (!yearMap.has(d.year)) {
                yearMap.set(d.year, { year: `${d.year}年`, sortKey: d.year });
            }
            const rec = yearMap.get(d.year)!;
            rec[d.genre] = (rec[d.genre] || 0) + d.sales;
        });

        const sortedGenres = Array.from(genreSet).sort();
        const td = Array.from(yearMap.values()).sort((a, b) => a.sortKey - b.sortKey);

        return { trendData: td, years: Array.from(yearMap.keys()).sort(), genres: sortedGenres };
    }, [allData]);

    const genreColors = useMemo(() => {
        const map: Record<string, string> = {};
        genres.forEach((g, i) => {
            map[g] = COLORS[i % COLORS.length];
        });
        return map;
    }, [genres]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-6 h-6 text-pink-400" />
                <h2 className="text-xl font-bold text-slate-100">長期売上推移</h2>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-md">
                <h3 className="text-sm font-semibold text-slate-400 mb-6 flex items-center gap-2">
                    年別売上推移 (大ジャンル別スタック)
                </h3>
                <div className="h-[500px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `¥${(val / 10000).toLocaleString()}万`}
                            />
                            <YAxis
                                type="category"
                                dataKey="year"
                                stroke="#94a3b8"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={60}
                            />
                            <Tooltip
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
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
                                content={() => (
                                    <div className="flex flex-wrap justify-center gap-4 text-xs mt-10">
                                        {genres.map(g => (
                                            <div key={g} className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: genreColors[g] }} />
                                                <span className="text-slate-300">{g}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                            {genres.map(genre => (
                                <Bar
                                    key={genre}
                                    dataKey={genre}
                                    stackId="1"
                                    fill={genreColors[genre]}
                                    barSize={40}
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
